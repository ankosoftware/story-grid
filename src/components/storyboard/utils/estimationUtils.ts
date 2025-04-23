import { Issue, Release } from "@/lib/firebase/models/types";

// Interface for estimation results
interface EstimationDetails {
  storyPoints: number;
  hours: number;
  cost: number;
  startDate: Date | null;
  endDate: Date | null;
  daysToComplete: number;
}

// Interface for story estimation
interface StoryEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  issue: Issue; // Store the original issue object for editing
}

// Interface for epic estimation
interface EpicEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  stories: StoryEstimation[];
  issue: Issue; // Store the original issue object for editing
}

// Interface for release estimation
interface ReleaseEstimation {
  id: string;
  name: string;
  storyPoints: number;
  hours: number;
  cost: number;
  startDate: Date | null;
  endDate: Date | null;
  daysToComplete: number;
  epics: EpicEstimation[];
}

interface EstimationResult {
  totalEstimation: EstimationDetails;
  releaseEstimations: ReleaseEstimation[];
}

/**
 * Calculates estimation metrics for releases, epics, and stories
 * @param releases Array of releases
 * @param activities Array of backbone activities
 * @param epics Map of epics by activity ID
 * @param issues Map of stories by epic ID
 * @param storyPointToHours Conversion rate from story points to hours
 * @param overheadPercentage Overhead percentage for QA, PM, etc.
 * @param dailyBurnRate Hours per day for timeline calculation
 * @param blendedHourlyRate Hourly rate for cost calculation
 * @returns Estimation results for the entire project and individual releases
 */
export const estimateReleasesWithEpics = (
  releases: Release[],
  activities: Issue[],
  epics: Record<string, Issue[]>,
  issues: Record<string, Issue[]>,
  storyPointToHours: number = 8,
  overheadPercentage: number = 25,
  dailyBurnRate: number = 16,
  blendedHourlyRate: number = 100
): EstimationResult => {
  if (!activities || !releases) {
    return {
      totalEstimation: {
        storyPoints: 0,
        hours: 0,
        cost: 0,
        startDate: null,
        endDate: null,
        daysToComplete: 0,
      },
      releaseEstimations: [],
    };
  }

  // Sort activities by displayOrder
  const sortedActivities = [...activities].sort((a, b) => a.displayOrder - b.displayOrder);

  // Sort and calculate estimations for each story
  const storyEstimations: Record<string, StoryEstimation> = {};
  Object.entries(issues).forEach(([epicId, epicStories]) => {
    // Sort stories by displayOrder to maintain consistent ordering across the application
    const sortedStories = [...epicStories].sort((a, b) => a.displayOrder - b.displayOrder);

    sortedStories.forEach(story => {
      if (story.storyPoints) {
        const hours = story.storyPoints * storyPointToHours * (1 + overheadPercentage / 100);
        storyEstimations[story.id] = {
          id: story.id,
          name: story.name,
          storyPoints: story.storyPoints,
          hours,
          issue: story,
        };
      } else {
        storyEstimations[story.id] = {
          id: story.id,
          name: story.name,
          storyPoints: 0,
          hours: 0,
          issue: story,
        };
      }
    });
  });

  // Sort and calculate estimations for each epic, respecting activity order
  const epicEstimations: Record<string, EpicEstimation> = {};

  // First, collect all epics and associate them with their parent activity for proper sorting
  const allSortedEpics: { epic: Issue; activityOrder: number }[] = [];

  sortedActivities.forEach((activity, activityIndex) => {
    const activityEpics = epics[activity.id] || [];
    // Sort epics within each activity by their display order
    const sortedEpics = [...activityEpics].sort((a, b) => a.displayOrder - b.displayOrder);

    // Add activity index for global sort
    sortedEpics.forEach(epic => {
      allSortedEpics.push({
        epic,
        activityOrder: activityIndex,
      });
    });
  });

  // Process epics in activity + display order
  allSortedEpics.forEach(({ epic }) => {
    const epicStories = issues[epic.id] || [];
    // Sort stories within each epic by displayOrder
    const sortedEpicStories = [...epicStories].sort((a, b) => a.displayOrder - b.displayOrder);

    const epicStoriesEstimations = sortedEpicStories
      .map(story => storyEstimations[story.id])
      .filter(Boolean);

    const storyPoints = epicStoriesEstimations.reduce(
      (sum, story) => sum + (story?.storyPoints || 0),
      0
    );
    const hours = epicStoriesEstimations.reduce((sum, story) => sum + (story?.hours || 0), 0);

    epicEstimations[epic.id] = {
      id: epic.id,
      name: epic.name,
      storyPoints,
      hours,
      stories: epicStoriesEstimations,
      issue: epic,
    };
  });

  // Sort releases by displayOrder
  const sortedReleases = [...releases].sort((a, b) => a.displayOrder - b.displayOrder);

  // Calculate estimations for each release
  let startDate: Date | null = new Date(); // Start from today for the first release
  const releaseEstimations: ReleaseEstimation[] = [];

  sortedReleases.forEach(release => {
    // Find all stories in this release
    const releaseStories: Issue[] = [];
    Object.values(issues).forEach(epicStories => {
      // Sort stories by displayOrder for consistent presentation
      const sortedEpicStories = [...epicStories].sort((a, b) => a.displayOrder - b.displayOrder);

      sortedEpicStories
        .filter(story => story.releaseId === release.id)
        .forEach(story => releaseStories.push(story));
    });

    // Calculate story points and hours for all stories in the release
    const storyPoints = releaseStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
    const hours = releaseStories.reduce(
      (sum, story) => sum + (storyEstimations[story.id]?.hours || 0),
      0
    );
    const cost = hours * blendedHourlyRate;

    // Calculate days to complete based on daily burn rate
    const daysToComplete = dailyBurnRate ? Math.ceil(hours / dailyBurnRate) : 0;

    // Calculate end date
    const endDate = startDate ? new Date(startDate) : null;
    if (endDate && daysToComplete > 0) {
      // Add working days (skip weekends)
      let daysAdded = 0;
      while (daysAdded < daysToComplete) {
        endDate.setDate(endDate.getDate() + 1);
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
          daysAdded++;
        }
      }
    }

    // Calculate epics in this release
    const releaseEpics: EpicEstimation[] = [];
    Object.values(epicEstimations).forEach(epic => {
      // Check if any stories from this epic are in the current release
      const epicStoriesInRelease = epic.stories.filter(story =>
        releaseStories.some(releaseStory => releaseStory.id === story.id)
      );

      if (epicStoriesInRelease.length > 0) {
        const epicStoryPoints = epicStoriesInRelease.reduce(
          (sum, story) => sum + story.storyPoints,
          0
        );
        const epicHours = epicStoriesInRelease.reduce((sum, story) => sum + story.hours, 0);

        releaseEpics.push({
          id: epic.id,
          name: epic.name,
          storyPoints: epicStoryPoints,
          hours: epicHours,
          stories: epicStoriesInRelease,
          issue: epic.issue,
        });
      }
    });

    // Sort epics by activity order first, then by epic display order within each activity
    releaseEpics.sort((a, b) => {
      // Find the corresponding epics in the allSortedEpics array to get activity orders
      const epicA = allSortedEpics.find(item => item.epic.id === a.issue.id);
      const epicB = allSortedEpics.find(item => item.epic.id === b.issue.id);

      // If both epics have an activity order, compare them
      if (epicA && epicB) {
        // First sort by activity order
        if (epicA.activityOrder !== epicB.activityOrder) {
          return epicA.activityOrder - epicB.activityOrder;
        }
        // If same activity, sort by epic display order
        return a.issue.displayOrder - b.issue.displayOrder;
      } else if (epicA) {
        // A has activity info but B doesn't, prioritize A
        return -1;
      } else if (epicB) {
        // B has activity info but A doesn't, prioritize B
        return 1;
      }

      // Fallback to just epic display order if activity info is missing for both
      return a.issue.displayOrder - b.issue.displayOrder;
    });

    releaseEstimations.push({
      id: release.id,
      name: release.name,
      storyPoints,
      hours,
      cost,
      startDate,
      endDate,
      daysToComplete,
      epics: releaseEpics,
    });

    // Next release starts after this one ends
    startDate = endDate;
  });

  // Calculate total estimation for the project
  const totalStoryPoints = releaseEstimations.reduce(
    (sum, release) => sum + release.storyPoints,
    0
  );
  const totalHours = releaseEstimations.reduce((sum, release) => sum + release.hours, 0);
  const totalCost = releaseEstimations.reduce((sum, release) => sum + release.cost, 0);
  const totalDaysToComplete = releaseEstimations.reduce(
    (sum, release) => sum + release.daysToComplete,
    0
  );

  // Calculate project start and end dates
  const projectStartDate = releaseEstimations.length > 0 ? releaseEstimations[0].startDate : null;
  const projectEndDate =
    releaseEstimations.length > 0
      ? releaseEstimations[releaseEstimations.length - 1].endDate
      : null;

  return {
    totalEstimation: {
      storyPoints: totalStoryPoints,
      hours: totalHours,
      cost: totalCost,
      startDate: projectStartDate,
      endDate: projectEndDate,
      daysToComplete: totalDaysToComplete,
    },
    releaseEstimations,
  };
};
