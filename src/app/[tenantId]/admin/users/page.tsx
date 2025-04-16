"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Grid,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { UserProfile, UserRole, Invitation } from "@/lib/firebase/models/types";
import { useUsers } from "@/lib/hooks/useUsers";
import { useInvitations } from "@/lib/hooks/useInvitations";
import { useAuth } from "@/lib/auth/AuthProvider";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

// Role descriptions for tooltips
const RoleDescriptions = {
  [UserRole.ADMIN]: "Complete control over workspace settings, projects, and user management",
  [UserRole.MANAGER]:
    "Can create and manage projects and releases, but cannot change workspace settings",
  [UserRole.CONTRIBUTOR]: "Can create and update stories, but cannot create projects or releases",
  [UserRole.VIEWER]: "Read-only access to all projects and stories",
};

// Role color mapping
const RoleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: "error",
  [UserRole.MANAGER]: "warning",
  [UserRole.CONTRIBUTOR]: "info",
  [UserRole.VIEWER]: "default",
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      aria-labelledby={`user-tab-${index}`}
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      role="tabpanel"
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function UsersPage() {
  const { users, loading: usersLoading, error: usersError, updateRole } = useUsers();
  const {
    invitations,
    loading: invitationsLoading,
    error: invitationsError,
    inviteUser,
    cancelUserInvitation,
  } = useInvitations();
  const { userProfile, currentTenant } = useAuth();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.CONTRIBUTOR);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [cancellingInvitation, setCancellingInvitation] = useState<string | null>(null);

  // Get the app base URL from environment variables
  const baseUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle role change for existing users
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (updatingUserId) {
      return;
    } // Prevent multiple simultaneous updates

    try {
      setUpdatingUserId(userId);
      await updateRole(userId, newRole);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle invite dialog open
  const handleOpenInviteDialog = () => {
    setInviteDialogOpen(true);
    setInviteEmail("");
    setInviteRole(UserRole.CONTRIBUTOR);
    setInviteError(null);
  };

  // Handle invite dialog close
  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
  };

  // Handle sending invitation
  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      setInviteError("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError("Please enter a valid email address");
      return;
    }

    setInviteLoading(true);
    setInviteError(null);

    try {
      await inviteUser(inviteEmail, inviteRole);
      handleCloseInviteDialog();
    } catch (error) {
      setInviteError((error as Error).message);
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle cancelling an invitation
  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingInvitation(invitationId);
    try {
      await cancelUserInvitation(invitationId);
    } finally {
      setCancellingInvitation(null);
    }
  };

  // Generate invitation link
  const getInvitationLink = (token: string) => {
    return `${baseUrl}/invite/${token}`;
  };

  // Format expiration date
  const formatExpiryDate = (expiryDate: any) => {
    if (!expiryDate || !expiryDate.toDate) {
      return "Unknown";
    }

    const date = expiryDate.toDate();
    return new Date(date).toLocaleString();
  };

  const loading = usersLoading || invitationsLoading;
  const error = usersError || invitationsError;

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Workspace Users</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleOpenInviteDialog}>
          Invite User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error: {error.message}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab aria-controls="users-tabpanel" id="users-tab" label="Users" />
          <Tab
            aria-controls="invitations-tabpanel"
            id="invitations-tab"
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                Pending Invitations
                {invitations.length > 0 && (
                  <Chip
                    color="primary"
                    label={invitations.length}
                    size="small"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      <TabPanel index={0} value={tabValue}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    Role
                    <Tooltip title="User roles determine what actions they can perform in this workspace">
                      <IconButton size="small">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => {
                // Find the tenant-specific role
                const tenantAccess = user.tenants.find(t => t.tenantId === userProfile?.tenantId);
                const userRole = tenantAccess?.role || user.role;
                const joinedDate = tenantAccess?.joinedAt?.toDate();

                // Cannot change your own role
                const isCurrentUser = user.id === userProfile?.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          alt={user.displayName || user.email}
                          src={user.photoURL || undefined}
                          sx={{ mr: 2, width: 32, height: 32 }}
                        >
                          {(user.displayName || user.email)[0].toUpperCase()}
                        </Avatar>
                        <Typography>
                          {user.displayName || "Unnamed User"}
                          {isCurrentUser && (
                            <Typography
                              component="span"
                              sx={{ ml: 1, fontSize: "0.75rem", color: "text.secondary" }}
                            >
                              (You)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        <Tooltip title={RoleDescriptions[userRole]}>
                          <Chip
                            color={RoleColors[userRole] as any}
                            label={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                            size="small"
                          />
                        </Tooltip>
                      ) : (
                        <FormControl
                          disabled={updatingUserId === user.id}
                          size="small"
                          sx={{ minWidth: 120 }}
                        >
                          <Select
                            renderValue={selected => (
                              <Tooltip title={RoleDescriptions[selected as UserRole]}>
                                <Chip
                                  color={RoleColors[selected as UserRole] as any}
                                  label={selected.charAt(0).toUpperCase() + selected.slice(1)}
                                  size="small"
                                  sx={{ height: 24 }}
                                />
                              </Tooltip>
                            )}
                            sx={{ height: 32 }}
                            value={userRole}
                            onChange={(e: SelectChangeEvent) =>
                              handleRoleChange(user.id, e.target.value as UserRole)
                            }
                          >
                            {Object.values(UserRole).map(role => (
                              <MenuItem key={role} value={role}>
                                <Tooltip title={RoleDescriptions[role]}>
                                  <Box>{role.charAt(0).toUpperCase() + role.slice(1)}</Box>
                                </Tooltip>
                              </MenuItem>
                            ))}
                          </Select>
                          {updatingUserId === user.id && (
                            <CircularProgress
                              size={16}
                              sx={{ position: "absolute", right: 24, top: 8 }}
                            />
                          )}
                        </FormControl>
                      )}
                    </TableCell>
                    <TableCell>
                      {joinedDate
                        ? new Date(joinedDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Unknown"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={4} sx={{ py: 3 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TabPanel>

      <TabPanel index={1} value={tabValue}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {invitations.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography color="text.secondary">No pending invitations</Typography>
                <Button
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  variant="outlined"
                  onClick={handleOpenInviteDialog}
                >
                  Invite User
                </Button>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Invitation Link</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map(invitation => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Chip
                          color={RoleColors[invitation.role] as any}
                          label={invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Grid container alignItems="center" spacing={1}>
                          <Grid xs={true}>
                            <Box
                              sx={{
                                maxWidth: 250,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "0.75rem",
                                bgcolor: "grey.100",
                                p: 0.5,
                                borderRadius: 1,
                                color: "text.secondary",
                              }}
                            >
                              {getInvitationLink(invitation.token)}
                            </Box>
                          </Grid>
                          <Grid>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                navigator.clipboard.writeText(getInvitationLink(invitation.token));
                              }}
                            >
                              Copy
                            </Button>
                          </Grid>
                        </Grid>
                      </TableCell>
                      <TableCell>{formatExpiryDate(invitation.expiresAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          disabled={cancellingInvitation === invitation.id}
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          {cancellingInvitation === invitation.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </TabPanel>

      {/* Invite User Dialog */}
      <Dialog fullWidth maxWidth="sm" open={inviteDialogOpen} onClose={handleCloseInviteDialog}>
        <DialogTitle>Invite User to Workspace</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {inviteError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {inviteError}
              </Alert>
            )}

            <TextField
              autoFocus
              fullWidth
              id="email"
              label="Email Address"
              margin="dense"
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />

            <FormControl fullWidth margin="dense">
              <Typography gutterBottom color="text.secondary" variant="body2">
                User Role
              </Typography>
              <Select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}>
                {Object.values(UserRole).map(role => (
                  <MenuItem key={role} value={role}>
                    <Box>
                      <Typography variant="body1">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {RoleDescriptions[role]}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
              An email with an invitation link will be sent to this address. The link will expire
              after 72 hours.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={inviteLoading} onClick={handleCloseInviteDialog}>
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={inviteLoading}
            startIcon={inviteLoading ? <CircularProgress size={20} /> : null}
            variant="contained"
            onClick={handleSendInvitation}
          >
            {inviteLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
