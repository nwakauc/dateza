# ADR-0004: Prepare photos in the browser before upload

**Status:** Accepted
**Date:** 2026-09-23
**Owners:** DateZA frontend

## Context

DateZA's publication floor (`d8n/domains/profiles/dateza_profile_catalog.rb`)
lists `collections: %w[photos location]`. A photo is therefore a hard
requirement before a profile can go live — unlike sibling brands whose floor
is identity and matching direction only. Anything that stops a photo reaching
storage stops the member being seen at all.

The upload path did not reflect that weight:

- The picked file was hashed and sent untouched. A current phone camera
  produces 4–15 MB images, which is slow on a South African mobile connection.
- Above it sat a hardcoded `file.size > 10 * 1024 * 1024` rejection —
  "That photo is too large. Choose one under 10 MB." — refusing the member's
  photo before anything had tried to make it smaller. On this brand that is a
  wall with nothing behind it: no photo, no publication, no recourse inside
  the product.
- That 10 MB was a copy of a server rule (`ProfilePhoto::MAX_FILE_SIZE`),
  which the agent guide forbids. The upload intent already returns
  `byte_size_limit`; the client parsed it and never read it.
- The whole-file `md5Base64` was used on up to 10 MB on the main thread, while
  the chunked `md5Base64File` — written for exactly this and used by chat
  media — sat unused by both photo paths.
- `fetch` cannot report request-body progress, so the slowest thing DateZA
  asks anyone to do showed only "Uploading…".
- A failed upload's "Try again" reopened the file picker, making the member
  find the photo a second time.

## Decision

Prepare photos in the browser before hashing, and let the server own limits.

- `lib/api/imagePrep.ts` resizes to a 1600px long edge and re-encodes as JPEG
  at 0.82, honouring EXIF orientation via
  `createImageBitmap(..., { imageOrientation: "from-image" })`. It fails soft:
  any browser that cannot decode or re-encode uploads the original bytes.
- Preparation runs **before** the checksum and the intent. The intent declares
  the byte size and MD5 that storage verifies against the PUT body, so
  preparing afterwards would describe a file we never send and the upload
  would be rejected. `photoActions.test.ts` pins this ordering.
- The client-side size rule is gone. The server decides, and when it refuses
  with `invalid_byte_size` the member is told the server's own
  `byte_size_limit` — surfaced by folding selected top-level error fields into
  `ApiError.details`.
- One upload path (`uploadAndAttachPhoto`) now serves onboarding and the
  profile editor, using the chunked hasher and reporting phase and progress.
- `putPhotoBytes` uses `XMLHttpRequest` for real progress, keeping the 120s
  timeout. `src/test/setup.ts` routes XHR through the stubbed `fetch` so
  existing request mocking is unchanged.
- Retry resends the file already chosen.

Publication is also attempted automatically once nothing is left to ask,
falling back to the existing manual button if it fails, so a member who
answers everything and closes the tab is not left as a draft.

## What this does not change

The photo gate itself stays. Continue still requires a photo that is ready,
because the server genuinely requires one — removing the gate would only move
the failure to the publish step. The fix is making the upload succeed.

## Consequences

- Virtually every phone photo now lands well under the server limit, so the
  unrecoverable "too large" dead end is gone in practice as well as in policy.
- Members see real progress and can retry without re-picking.
- HEIC is still unsupported (`contentTypeFor` returns undefined for `.heic`).
  iOS Safari usually transcodes on `<input type=file>`, so this rarely bites,
  but it remains a known gap.
- None of this has been exercised on a real device or a real slow connection.
