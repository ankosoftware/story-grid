# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Combined check (lint + format check)
npm run check

# Combined fix (lint fix + format)
npm run fix
```

## Architecture Overview

This is a **Next.js 15** application using the App Router with **Material UI v7**, **Firebase/Firestore**, and **TypeScript**. It implements a multi-tenant story mapping board for agile project management.

### Directory Structure

- `src/app/` - Next.js App Router pages with tenant-based routing (`[tenantId]/`)
- `src/components/` - React components organized by feature
  - `storyboard/` - Main story board feature (cards, dialogs, containers, utils)
  - `common/` - Shared components like RichTextEditor
  - `layout/` - Layout components (Header, Footer, MainLayout)
  - `auth/` - Authentication components
- `src/lib/` - Core application logic
  - `firebase/` - Firestore configuration, data operations, and type definitions
  - `hooks/` - Custom React hooks (`useStoryBoard`, `useProjects`, etc.)
  - `auth/` - Authentication provider and protected routes
  - `context/` - React contexts (TenantContext)
  - `theme/` - MUI theme configuration

### Data Model Hierarchy

The application uses a unified `Issue` type for all work items stored in Firestore:

```
Tenant
  └── Project
        ├── Issue (type: BACKBONE) - Activities/User Goals
        │     └── Issue (type: EPIC) - User Tasks
        │           └── Issue (type: STORY) - User Stories
        └── Release - Groups stories into releases
```

Key types are defined in `src/lib/firebase/models/types.ts`:
- `Issue` - Unified type for backbones, epics, and stories (differentiated by `IssueType`)
- `Project` - Contains estimation settings (story points to hours, overhead, burn rate)
- `Release` - Sprint/release groupings with display order
- `Tenant`, `UserProfile`, `Invitation` - Multi-tenancy support

### Key Patterns

1. **Firestore Operations**: All database operations are in `src/lib/firebase/firestore.ts`. Functions use batch writes for cascade operations.

2. **Real-time Updates**: The `useStoryBoard` hook sets up Firestore `onSnapshot` listeners for live updates.

3. **Multi-tenancy**: Every data query is scoped by `tenantId`. Routes use `[tenantId]` dynamic segments.

4. **Drag and Drop**: Uses `react-dnd` with HTML5 backend for story/epic reordering.

5. **Path Alias**: Use `@/*` to import from `src/*` (configured in tsconfig.json).

## Coding Conventions

- Use TypeScript strict mode - define interfaces for all props and data models
- Follow TDD: Red, Green, Refactor
- Component files use PascalCase, utilities use camelCase
- Firestore data must include `tenantId` for multi-tenant isolation
- MUI theming is centralized in `src/lib/theme/theme.ts`
- Rich text content uses TipTap editor with Markdown support

## Environment

- Windows development environment (use PowerShell commands)
- Firebase credentials stored in `.env.local` (never commit)
- Prefix client-side env vars with `NEXT_PUBLIC_`
