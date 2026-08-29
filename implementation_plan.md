# Rename PRISM to SynergyBridge

The user has requested to rename the project from "PRISM" to "SynergyBridge" across the codebase.

## User Review Required

> [!WARNING]
> Renaming the project globally will affect variable names (e.g. `prismFitScore` -> `synergyBridgeFitScore`), database string IDs (e.g. `prism-contributor` -> `synergybridge-contributor`), and all UI text. 
> Since Firestore relies on string keys, any existing database records using `prismFitScore` or `prism-contributor` will need to be re-seeded or migrated. Because we are in a pre-production local testing state, this is perfectly fine, but please confirm you are okay with wiping/re-seeding your local mock data if necessary.

## Proposed Changes

I will write a Node.js script to execute a global find-and-replace across all `src/`, `scripts/`, and `docs/` directories for the following patterns:

### UI and Branding Replacements
- `PRISM` -> `SynergyBridge`
- `Prism` -> `SynergyBridge`

### Variable and ID Replacements
- `prismFitScore` -> `synergyBridgeFitScore`
- `prism-contributor` -> `synergybridge-contributor`
- `prism-demo.edu` -> `synergybridge-demo.edu`
- `prism-demo.com` -> `synergybridge-demo.com`
- `PRISM-ORIGINALITY` -> `SYNERGYBRIDGE-ORIGINALITY`

This will affect files like:
- `src/lib/ai/prompts.ts`
- `src/features/matching/components/ProblemFitPanel.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/lib/constants/gamification.ts`
- `scripts/seed-production-demo.ts`
- Various documentation and test files.

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npx tsc --noEmit` to ensure no variables were broken by the rename.
- Run `npx vitest run` to verify that test suites mapping to the old string IDs (like the achievements test checking for `prism-contributor`) are correctly updated and passing.

### Manual Verification
- Start the server `npm run dev` and ensure the dashboard header says "SynergyBridge" instead of "PRISM".
