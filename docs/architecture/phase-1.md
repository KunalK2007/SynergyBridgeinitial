# SynergyBridge Phase 1 Architecture

## Overview
Phase 1 focuses on establishing the foundational architecture for SynergyBridge, a large-scale innovation platform connecting students, academic institutions, industry, mentors, and government.

## Technology Stack
- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Form Validation**: Zod & React Hook Form
- **State Management**: TanStack Query (where applicable), React Context for Auth

## Folder Structure
```text
src/
├── app/
│   ├── (public)/      # Landing page, public exploration
│   ├── (auth)/        # Login, signup, verification
│   ├── (dashboard)/   # Role-based dashboards
│   └── api/           # Serverless functions
├── components/
│   ├── ui/            # Reusable core components (Buttons, Inputs, etc.)
│   ├── layout/        # Shell layout, navigation, sidebars
│   └── common/        # Shared application components
├── features/          # Domain-specific logic
│   ├── auth/          # Authentication state and utilities
│   └── users/         # Profile management
├── lib/
│   ├── firebase/      # Client configuration
│   └── validation/    # Zod schemas
├── services/          # External integrations (Interfaces only for Phase 1)
└── types/             # Shared TypeScript models
```

## Data Model Foundation
Users have a primary `users` collection containing shared identity data and role information.
Role-specific extended data resides in independent profile collections:
- `studentProfiles`
- `mentorProfiles`
- `industryProfiles`
- `governmentProfiles`
- `facultyProfiles`

## Security Philosophy
- **Client-side limits**: The client app manages UX and routing based on role but does not trust the client data for actual security.
- **Firestore Rules**: Strict rules ensure users can only modify permitted fields on their own profiles. Role assignment and approval statuses are locked from client mutations.
