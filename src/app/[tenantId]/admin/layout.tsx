"use client";

import React from "react";
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import ProtectedRoute from "@/lib/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/AuthProvider";
import { UserRole } from "@/lib/firebase/models/types";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/auth/AdminGuard";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantId: string };
}) {
  const { tenantId } = params;
  const pathname = usePathname();
  const { userProfile } = useAuth();

  // Navigation items for the admin sidebar
  const navItems = [
    {
      text: "Users",
      icon: <PeopleIcon />,
      href: `/[tenantId]/admin/users`,
      as: `/${tenantId}/admin/users`,
      active: pathname?.includes("/admin/users"),
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      href: `/[tenantId]/admin/settings`,
      as: `/${tenantId}/admin/settings`,
      active: pathname?.includes("/admin/settings"),
    },
  ];

  return (
    <ProtectedRoute>
      <AdminGuard>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: "flex", gap: 3 }}>
            {/* Admin Sidebar */}
            <Paper sx={{ width: 220, p: 2, borderRadius: 2, height: "fit-content" }}>
              <Typography sx={{ mb: 2, fontWeight: "medium", px: 1 }} variant="h6">
                Admin Panel
              </Typography>
              <List>
                {navItems.map(item => (
                  <Link
                    key={item.text}
                    as={item.as}
                    href={item.href}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <ListItem
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        backgroundColor: item.active ? "action.selected" : "transparent",
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItem>
                  </Link>
                ))}
              </List>
            </Paper>

            {/* Main Content */}
            <Box sx={{ flex: 1 }}>{children}</Box>
          </Box>
        </Container>
      </AdminGuard>
    </ProtectedRoute>
  );
}
