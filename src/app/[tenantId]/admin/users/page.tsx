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
} from "@mui/material";
import { UserProfile, UserRole } from "@/lib/firebase/models/types";
import { useUsers } from "@/lib/hooks/useUsers";
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

export default function UsersPage() {
  const { users, loading, error, updateRole } = useUsers();
  const { userProfile } = useAuth();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Handle role change
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

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Workspace Users</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading users: {error.message}
        </Alert>
      )}

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
    </Paper>
  );
}
