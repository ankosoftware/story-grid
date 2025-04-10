import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  useTheme,
  Button,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const pathname = usePathname();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/dashboard" },
    { text: "Projects", icon: <FolderIcon fontSize="small" />, path: "/projects" },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography component="div" sx={{ flexGrow: 0, mr: 4 }} variant="h6">
          {title}
        </Typography>

        {/* Navigation Menu */}
        <Box sx={{ flexGrow: 1, display: "flex" }}>
          {menuItems.map(item => {
            // Extract tenant ID from pathname to construct proper links
            const pathParts = pathname?.split("/") || [];
            const tenantId = pathParts.length > 1 ? pathParts[1] : "";
            const fullPath = `/${tenantId}${item.path}`;

            return (
              <Link
                key={item.text}
                href={fullPath}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Button
                  color="inherit"
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    borderBottom: pathname?.includes(item.path)
                      ? `2px solid ${theme.palette.common.white}`
                      : "none",
                  }}
                >
                  {item.text}
                </Button>
              </Link>
            );
          })}
        </Box>

        {/* User Menu */}
        <Box>
          <Tooltip title="Account settings">
            <IconButton
              aria-controls={open ? "account-menu" : undefined}
              aria-expanded={open ? "true" : undefined}
              aria-haspopup="true"
              size="small"
              sx={{ ml: 2 }}
              onClick={handleClick}
            >
              <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            id="account-menu"
            open={open}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
