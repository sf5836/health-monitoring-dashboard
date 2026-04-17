# Phase 6 Release Notes and Merge Checklist

Release date: 2026-04-17
Release scope: Phase 0 through Phase 6 backend readiness.

## Release Notes

### Summary

This release finalizes backend delivery and collaborator handoff readiness.

### Highlights

- Auth hardening with refresh token rotation and revocation.
- Patient portal completion (profile, vitals, appointments, prescriptions).
- Doctor portal completion (dashboard, patient workflows, prescriptions, blogs).
- Admin portal completion (moderation, analytics, permissions, audits).
- Realtime completion (authenticated sockets, chat/notification sync, reconnect handling).
- Phase-based automated tests now include:
  - Unit tests (`riskEngine`, `authService`)
  - Integration tests for Phase 1 through Phase 5
  - CI-style runner script (`npm run test:ci`)

### New/Updated Test Commands

- `npm run test:unit`
- `npm run test:integration`
- `npm test` (unit + integration)
- `npm run test:ci`

## Merge Checklist

### Code and Contracts

- [ ] All Phase 0-6 checklist items are marked complete in `BACKEND_PHASES.md`.
- [ ] API contracts consumed by frontend services are unchanged or coordinated in the same PR.
- [ ] Realtime event names/payloads are documented in code comments or tests.

### Quality Gates

- [ ] `npm run db:init` succeeds.
- [ ] `npm run test:unit` passes.
- [ ] `npm run test:integration` passes.
- [ ] `npm run test:ci` passes.
- [ ] Frontend `npm run build` passes.

### Operational Readiness

- [ ] `backend/.env.example` matches runtime requirements.
- [ ] Setup guide (`PHASE6_SETUP_AND_ENV.md`) is up to date.
- [ ] Seed credentials and first-run flow are verified.

### PR Hygiene

- [ ] PR description includes scope, risk, and rollback notes.
- [ ] Breaking changes are explicitly called out (if any).
- [ ] No secrets are committed.
- [ ] Reviewer has clear verification commands.

## Rollback Notes

- If realtime regressions appear, rollback socket contract changes first (`chatHandler`, `notificationHandler`, `authenticateSocket`, `useSocket`).
- If test orchestration regresses, run phase scripts individually (`test:phase1-auth` ... `test:phase5-realtime`) to isolate failures.
