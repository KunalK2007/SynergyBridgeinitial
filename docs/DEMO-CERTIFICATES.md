# SynergyBridge — Demo Certificate Data & Provenance

## 1. Overview & Demonstration Context
This document explains the end-to-end provenance, eligibility check, issuance chain, and public verification mechanism for synthetic demo certificates in SynergyBridge.

All demonstration credentials are simulated records generated within the SynergyBridge demo tenant to illustrate how student project outcomes are evaluated, cryptographically hashed, and verified.

---

## 2. Demo Student Credential Ownership
- **Primary Demo Student**: Aarav Sharma (`student.demo@synergybridge.local`)
- **Secondary Demo Student**: Ananya Patil (`student2.demo@synergybridge.local`)
- **Issuing Authority**: Prof. Vikram Joshi (`faculty.demo@synergybridge.local`, SynergyBridge Demo Institute)

---

## 3. Demo Certificate Registry

### Certificate 1: WasteWise Project Completion
- **Verification ID**: `SB-DEMO-WW95-2026`
- **Student Recipient**: Aarav Sharma
- **Completed Project**: WasteWise — Waste Classification & Collection Optimization (`demo_proj_7`)
- **Associated Problem**: Autonomous Municipal Waste Sorting & Route Optimization (`demo_prob_1`)
- **Institution**: SynergyBridge Demo Institute
- **Department**: Computer Science & AI
- **Academic Credits**: 4 Credits (Verified)
- **Originality Report**: `cg_orig_7` (Score: 96% Originality, Passed)
- **Eligibility Snapshot**:
  - Task Completion: 100%
  - Milestone Verification: Passed
  - Originality Threshold: ≥ 85% (Achieved 96%)
- **Status**: `ISSUED`
- **Blockchain Proof**: `MOCK / SIMULATED (Polygon PoS)` (`0x9a4f...3c82`)
- **DigiLocker Status**: `MOCK / SIMULATED`
- **Academic Bank of Credits (ABC)**: `MOCK (4 Credits)`
- **SHA-256 Digest**: `0x8e5f2a1b9c3d4e7f6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`
- **Public Verification URL**: `/verify/SB-DEMO-WW95-2026`

---

### Certificate 2: SkillMatch Project Completion
- **Verification ID**: `SB-DEMO-SM92-2026`
- **Student Recipient**: Aarav Sharma
- **Completed Project**: SkillMatch — Multi-Disciplinary Skills-Based Match Platform (`demo_proj_8`)
- **Associated Problem**: Adaptive Multi-Disciplinary Engineering Problem Matching Engine (`demo_prob_3`)
- **Institution**: SynergyBridge Demo Institute
- **Department**: Computer Science & AI
- **Academic Credits**: 4 Credits (Verified)
- **Originality Report**: `cg_orig_8` (Score: 92% Originality, Passed)
- **Eligibility Snapshot**:
  - Task Completion: 100%
  - Milestone Verification: Passed
  - Originality Threshold: ≥ 85% (Achieved 92%)
- **Status**: `ISSUED`
- **Blockchain Proof**: `MOCK / SIMULATED (Polygon PoS)` (`0x7b1e...4d91`)
- **DigiLocker Status**: `MOCK / SIMULATED`
- **Academic Bank of Credits (ABC)**: `MOCK (4 Credits)`
- **SHA-256 Digest**: `0x7a4b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b`
- **Public Verification URL**: `/verify/SB-DEMO-SM92-2026`

---

## 4. Verification & Provenance Chain
When explaining this feature to hackathon judges:

```
Completed Demo Project (100% Tasks + Milestones)
                        ↓
       Originality Assessment (Score ≥ 85%)
                        ↓
         Eligibility Snapshot Validated
                        ↓
      Server Issues Verifiable Certificate
                        ↓
   Unique Verification ID & Cryptographic Hash
                        ↓
  Public Verification Page (/verify/[verificationId])
```

---

## 5. Security & Privacy Guarantees
- **No PII Exposure**: The public verification endpoint (`/api/certificates/[verificationId]`) strips all private user information. Only public recipient name, institution, completed project title, verification ID, and issuance timestamp are presented.
- **Server Authority**: Certificate creation, revocation, and status mutations are protected server-side via `CertificateService` and cannot be forged by client callers.
- **Transparent Simulation**: Every demo certificate carries `isDemo: true` and renders explicit `SIMULATED DEMO CREDENTIAL` badges on the verification screen.

---

## 6. How to Recreate / Reset Demo Data
Run the canonical demo seed script:
```bash
npx tsx scripts/seed-production-demo.ts
```
The seed script is idempotent and updates existing synthetic records with `{ merge: true }` without generating duplicate entries.
