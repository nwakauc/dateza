# Engineering Ticket: Session bootstrap and protected route foundation

**Priority:** P0  
**Owner:** DateZA frontend  
**Status:** Done

## Problem and objective

DateZA had no centralized session model. Member routes must not render until
D8N confirms identity via the verified contract.

## Contract used

Verified from `d8n/docs/api/openapi.yaml` and `d8n/test/controllers/api/v1/me_controller_test.rb`:

- `GET /api/v1/me`
- Bearer `Authorization`
- `200` `MeResponse` (`user_id`, `brand`, `session`)
- `401` `{ "error": "unauthorized" }`

`GET /api/v1/me` does not include onboarding. Onboarding remains on profile
responses (`ProfileOnboardingStatus`) and is follow-up.

## Non-goals

Sign-in UI, token persistence, onboarding screens, product member routes.
