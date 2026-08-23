# Engineering Ticket: DateZA onboarding foundation and schema-driven profile flow

**Priority:** P0  
**Owner:** DateZA frontend  
**Status:** Done (photos split to F2-002)

## Problem and objective

After authentication, DateZA sent members to a dummy `/signed-in` page.
Onboarding now follows D8N `onboarding.next_step` and brand configuration
instead of a hardcoded DateZA field list.

## Contract used

Verified from `d8n/docs/api/openapi.yaml`, `Profiles::OnboardingStatus`,
`DatezaProfileCatalog`, and `test/integration/dateza_profile_onboarding_test.rb`:

- Authoritative status: `GET /api/v1/profile` and `GET /api/v1/profile/configuration`
  (not `GET /api/v1/me`)
- Writes: `PATCH /api/v1/profile`, `PATCH /api/v1/profile/preferences`,
  `PATCH /api/v1/profile/options`, `POST /api/v1/profile/publication`
- `next_step`: `profile` → `preferences` → `photos` → `options` → `publication`

## Non-goals

Photo upload (F2-002). Discovery. Precise geolocation. Auth persistence.
Optional profile extras as a full editor. Prompts.

## Photo / media decision

Photos are required for DateZA completion. Photo upload lives in F2-002.
