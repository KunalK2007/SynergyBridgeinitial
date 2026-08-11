# SynergyBridge Route Map

The following represents the complete, functional Next.js routing architecture for the SynergyBridge application as of Phase 5C.

## Public Routes
No authentication required.

- `/` - Landing Page
- `/about` - About SynergyBridge
- `/showcase` - Innovation Showcase (Coming Soon)
- `/verify` - Verify Certificate Search
- `/verify/[certificateId]` - Certificate Validation Result
- `/explore/problems` - Public Problem Repository
- `/explore/problems/[id]` - Public Problem Detail
- `/explore/problems/[id]/apply` - Application Flow
- `/explore/leaderboard` - Public Leaderboard

## Authentication Routes
- `/login` - User Login
- `/signup` - User Registration
- `/forgot-password` - Password Reset
- `/pending-approval` - Account Pending State
- `/verify-email` - Email Verification Required

## Dashboard Base Routes
Requires Authentication. Base layout provides Sidebar (`DashboardShell`).

- `/dashboard` - Redirects to role-specific dashboard
- `/dashboard/profile` - User Profile Management
- `/dashboard/settings` - Account Settings
- `/dashboard/problems` - Problems Repository
- `/dashboard/problems/create` - Submit New Problem
- `/dashboard/projects` - Active Projects Listing
- `/dashboard/projects/[id]` - Project Collaborative Workspace
- `/dashboard/projects/[id]/assign-mentor` - Admin/Faculty Mentor Assignment
- `/dashboard/applications` - Application Management
- `/dashboard/applications/[id]` - Application Detail

## Role-Specific Dashboards
Requires Authentication & specific Role claim.

### Student
- `/dashboard/student` - Main Student Hub
- `/dashboard/student/onboarding` - First-time Setup
- `/dashboard/student/teams` - My Teams
- `/dashboard/student/teams/create` - Create Team
- `/dashboard/student/teams/[id]` - Team Detail
- `/dashboard/student/applications` - My Applications
- `/dashboard/student/certificates` - My Certificates
- `/dashboard/student/gamification` - Points & Achievements
- `/dashboard/student/mentor` - AI Mentor Chat

### Mentor
- `/dashboard/mentor` - Assigned Projects & Capacity

### Industry
- `/dashboard/industry` - Posted Problems & ROI

### Faculty / Institution
- `/dashboard/faculty` - Coordinator Dashboard
- `/dashboard/institution/analytics` - Institutional Metrics
- `/dashboard/institution/ai-insights` - AI Institutional Reports

### Government / Incubation
- `/dashboard/government` - Macro Ecosystem Dashboard
- `/dashboard/incubation` - Incubation Pipeline Dashboard

### Admin
- `/dashboard/admin` - Global Admin Console
- `/dashboard/admin/analytics` - Global Platform Analytics
- `/dashboard/admin/problems` - Problem Moderation Queue
