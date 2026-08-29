# Phase 5A Launch Checklist

### Application
- [x] Production build passes
- [x] TypeScript passes
- [x] ESLint passes
- [x] Tests pass

### Firebase
- [ ] Production project confirmed
- [ ] Auth configured
- [x] Firestore rules deployed
- [x] Storage rules deployed
- [x] Indexes deployed
- [x] No public Firestore access
- [x] No public Storage access

### Security
- [x] No secrets in Git
- [x] No secrets in client bundle
- [x] Admin SDK server-only
- [x] AI API keys server-only
- [x] RBAC verified
- [x] Server-authoritative fields protected

### AI
- [ ] Real provider configured
- [x] Mock provider disabled
- [x] Rate limiting verified
- [x] Usage tracking verified
- [x] PII filtering verified
- [x] Advisory-only behavior verified

### Data
- [x] Demo seed not run in production
- [ ] Production database isolated
- [x] Backups/recovery plan documented

### Deployment
- [ ] Vercel production deployment
- [ ] Production domain
- [ ] HTTPS
- [ ] Authentication redirect verification
- [ ] Smoke tests complete
