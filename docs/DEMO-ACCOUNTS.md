# Demo Accounts

> [!CAUTION]
> **DEMO CREDENTIALS — DO NOT USE FOR PRODUCTION.**
> These accounts are synthetic and intended strictly for testing, QA, and demonstration purposes. Change or remove them before any public deployment.

| Name | Email | Password | Role | Purpose |
|------|-------|----------|------|---------|
| Aarav Sharma | student.demo@synergybridge.local | SBStudent@2026! | STUDENT | Primary student |
| Ananya Patil | student2.demo@synergybridge.local | SBStudent2@2026! | STUDENT | Second student |
| Dr. Rahul Mehta | mentor.demo@synergybridge.local | SBMentor@2026! | MENTOR | Mentor |
| Neha Deshmukh | reviewer.demo@synergybridge.local | SBReviewer@2026! | REVIEWER (INDUSTRY) | Reviewer |
| Prof. Vikram Joshi | institution.demo@synergybridge.local | SBInstitution@2026! | INSTITUTION_ADMIN (FACULTY) | Institution admin |
| Priya Kulkarni | faculty.demo@synergybridge.local | SBFaculty@2026! | FACULTY | Faculty |
| System Demo Admin | admin.demo@synergybridge.local | SBAdmin@2026! | ADMIN | System demo admin |

These accounts will have their passwords stored securely in Firebase Auth, and they are flagged with `isDemo: true` in their Firestore user documents to distinguish them from real accounts.
