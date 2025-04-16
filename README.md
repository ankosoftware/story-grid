# StoryGrid - Multi-Tenant Storyboard Mapping Application

[![Build Status](https://img.shields.io/github/workflow/status/story-grid/storygrid/CI)](https://github.com/story-grid/storygrid/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/story-grid/storygrid/blob/main/CONTRIBUTING.md)

[StoryGrid](https://storygrid.app) is an open-source multi-tenant storyboard mapping application designed for Agile and Lean teams. Visualize user journeys, manage releases, and collaborate in real-time.

![StoryGrid Demo](https://storygrid.app/demo.png)

## Features

- **Multi-Tenancy**: Isolated environments for each organization with configurable branding and settings
- **Projects & Releases**: Manage multiple projects and organize stories into prioritized releases
- **Visual Story Mapping**: Create intuitive visual representations of user journeys with drag-and-drop functionality
- **Real-Time Collaboration**: Work together with your team in real-time with live updates
- **Role-Based Access Control**: Admin, Project Owner, Contributor, and Viewer roles with appropriate permissions
- **Integration Options**: Connect with issue tracking tools like Jira and Azure DevOps

## Tech Stack

- **Frontend**: Next.js with TypeScript and Material UI
- **Database**: Firestore (Firebase) for real-time data and multi-tenant isolation
- **Authentication**: Firebase Auth (or NextAuth.js)
- **Deployment**: Optimized for serverless deployment on Vercel

## Getting Started

First, clone the repository:

```bash
git clone https://github.com/story-grid/storygrid.git
cd storygrid
```

Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Set up your environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase/authentication credentials
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

For detailed documentation on setup, usage, and contribution guidelines, visit:

- [User Guide](https://docs.storygrid.app/user-guide)
- [Developer Documentation](https://docs.storygrid.app/developers)
- [API Reference](https://docs.storygrid.app/api)

## Contributing

StoryGrid is an open-source project, and contributions are welcome! See our [Contributing Guide](https://github.com/story-grid/storygrid/blob/main/CONTRIBUTING.md) for more information.

## License

StoryGrid is [MIT licensed](https://github.com/story-grid/storygrid/blob/main/LICENSE).

## Code Quality and Style

This project uses ESLint and Prettier to ensure consistent code style and quality:

### ESLint

ESLint is configured to check for:

- TypeScript best practices
- React hooks rules
- Accessibility issues
- Common JavaScript errors

To run the linter:

```bash
# Check for issues
npm run lint

# Fix automatically fixable issues
npm run lint:fix
```

### Prettier

Prettier is configured to ensure consistent formatting across the codebase:

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check
```

### Combined Commands

```bash
# Check both linting and formatting
npm run check

# Fix linting and formatting issues
npm run fix
```
