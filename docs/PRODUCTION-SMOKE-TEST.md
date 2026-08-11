# Production Smoke Test Plan

Execute these manual tests sequentially upon live production deployment to verify the integrity of the platform without running automated scripts against live data.

## 1. Student Journey
- [ ] **Login**: Authenticate as a student. Ensure dashboard loads properly.
- [ ] **Explore**: Navigate to "Explore Problems". Verify the list populates without leaking other institutions' private data.
- [ ] **SynergyBridge Fit**: Click on a problem and view the SynergyBridge Fit score.
- [ ] **Apply**: Submit an application. Verify idempotency by attempting to submit again.
- [ ] **Project Workspace**: Once accepted, enter the project. Create a Task and move it to "Completed".
- [ ] **Learning Path / AI**: Send a chat message to the AI Mentor. Verify the response is received and rate limit works.

## 2. Mentor Journey
- [ ] **Login**: Authenticate as a Mentor.
- [ ] **Dashboard**: Ensure only assigned projects are visible.
- [ ] **Workspace**: View tasks and milestones. Leave feedback on a task.
- [ ] **Communication**: Post a message in the project chat. Verify real-time updates.

## 3. Reviewer Journey
- [ ] **Login**: Authenticate as an Industry/Government Reviewer.
- [ ] **Applications**: View pending applications.
- [ ] **Review**: Accept a proposal. Verify the project is successfully spun up and participants are notified.

## 4. Admin / Institution Journey
- [ ] **Analytics**: Navigate to the Institution Analytics dashboard. Verify that charts load using aggregated snapshots.
- [ ] **AI Insights**: Query the Institutional AI. Ensure it grounds its response in actual data.
- [ ] **Funding**: Approve a pending micro-funding request. Verify the milestone is correctly updated.
- [ ] **Certificates**: View a successfully generated certificate. Verify the hash matches.

## 5. Public Verification
- [ ] **Certificate URL**: Copy a certificate verification link.
- [ ] **Incognito Mode**: Open the link in an incognito window.
- [ ] **Sanitization**: Verify that only the hash, student name, and project title are visible. Ensure no private files or raw chat logs are exposed.
