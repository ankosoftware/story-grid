import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  Divider,
} from "@mui/material";
import { Release } from "@/lib/firebase/models/types";

interface ExportEstimationDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (selectedReleaseIds: string[]) => void;
  releases: Release[];
}

const ExportEstimationDialog: React.FC<ExportEstimationDialogProps> = ({
  open,
  onClose,
  onExport,
  releases,
}) => {
  // State for tracking selected releases
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);

  // Handle selection of all releases
  const handleSelectAll = () => {
    if (selectedReleaseIds.length === releases.length) {
      // If all releases are currently selected, deselect all
      setSelectedReleaseIds([]);
    } else {
      // Otherwise, select all releases
      setSelectedReleaseIds(releases.map(release => release.id));
    }
  };

  // Handle individual release selection
  const handleToggleRelease = (releaseId: string) => {
    setSelectedReleaseIds(prevSelected => {
      if (prevSelected.includes(releaseId)) {
        // Remove from selected list if already selected
        return prevSelected.filter(id => id !== releaseId);
      } else {
        // Add to selected list if not selected
        return [...prevSelected, releaseId];
      }
    });
  };

  // Handle export button click
  const handleExport = () => {
    onExport(selectedReleaseIds);
    onClose();
  };

  // Handle dialog close (reset state)
  const handleClose = () => {
    setSelectedReleaseIds([]);
    onClose();
  };

  // Sort releases by displayOrder
  const sortedReleases = [...releases].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Export Estimation</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Select the releases to include in the exported estimation:
        </Typography>

        {releases.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No releases available. Please create releases to export estimations.
          </Alert>
        ) : (
          <>
            <Box sx={{ my: 2 }}>
              <Button variant="outlined" size="small" onClick={handleSelectAll}>
                {selectedReleaseIds.length === releases.length ? "Deselect All" : "Select All"}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <FormGroup>
              {sortedReleases.map(release => (
                <FormControlLabel
                  key={release.id}
                  control={
                    <Checkbox
                      checked={selectedReleaseIds.includes(release.id)}
                      onChange={() => handleToggleRelease(release.id)}
                    />
                  }
                  label={release.name}
                />
              ))}
            </FormGroup>

            {selectedReleaseIds.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please select at least one release to export.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          color="primary"
          disabled={selectedReleaseIds.length === 0 || releases.length === 0}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportEstimationDialog;
