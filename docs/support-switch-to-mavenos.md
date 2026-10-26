# Support form: switching from cofabri-api/Core to MavenOS

`/api/support` has two backends, chosen by `SUPPORT_BACKEND`:

- `core` (default, also when unset or unrecognised): unchanged. Forwards to cofabri-api `POST /web/forms/support`, which writes to Core and sends the CS-n confirmation email.
- `mavenos`: forwards JSON to `POST {MAVENOS_INTAKE_URL}/api/intake/v1/tickets` with `Authorization: Bearer <key>`. cofabri-api is not called at all, so no CS-n confirmation is sent; MavenOS sends its own acknowledgement once `ack_enabled` is on.

## Environment variables (server only)

| Name | Purpose |
| --- | --- |
| `SUPPORT_BACKEND` | `mavenos` or `core` (default `core`) |
| `MAVENOS_INTAKE_URL` | Base URL of the MavenOS app, no trailing path (for example `https://app.example.com`) |
| `MAVENOS_SUPPORT_INTAKE_KEY` | Intake key, format `most_<8>_<43>` |
| `SUPPORT_APP_SLUGS` | Optional JSON map of cofabri-api app id to MavenOS slug, for example `{"<uuid>":"medoura"}` |

## Field mapping

name = first + last; description -> message; tenantName -> tenant_name; entryPoint -> entry_point; audience, phone as is; subject = `Support/Help: <first 80 chars of message>` (or `Feature Request: ...`); `submissionId` (a UUID made when the form loads, reused on retries) -> submission_id; hidden `website` input -> honeypot. Language, preferred contact method, company and request type have no intake field and are appended to the message under a `Details` heading.

Screenshots: PNG, JPEG, WebP or GIF, up to 5, 2.5 MB combined (the host caps the request near 4.5 MB and base64 adds a third). Patient tickets never send screenshots.

App slug: the site only knows an app's cofabri-api UUID and name, and no id-to-slug data exists, so the table in `src/lib/support/mavenos.ts` (`APP_SLUGS`) starts empty. An unmapped app sends no `app_slug`, so the MavenOS ticket source is `form`, and the app name is put in the Details block instead. Fill `SUPPORT_APP_SLUGS` (or `APP_SLUGS`) to get source `app`.

Errors: 401/415/5xx and network failures show the usual "Failed to save support ticket" message (502); 429 shows a "too many requests" message. Upstream details are never returned or logged beyond the status code. A duplicate submission or honeypot hit answers 202 without an id and is treated as success.

## Cutover steps

1. In MavenOS Support settings, create an intake key (`most_...`).
2. On the host, set `MAVENOS_INTAKE_URL` and `MAVENOS_SUPPORT_INTAKE_KEY` (and optionally `SUPPORT_APP_SLUGS`). Deploy. Nothing changes yet.
3. Confirm the Vercel Firewall has a rate-limit rule on `/api/intake/*` for the MavenOS project.
4. Set `SUPPORT_BACKEND=mavenos` and redeploy.
5. Send a test from /support, with and without a screenshot, as staff and as patient (`?audience=patient`). Check the ticket in MavenOS (source, tenant, name, Details block, attachments).
6. In MavenOS, turn `ack_enabled` on with the support mailbox set. Send another test and confirm exactly one confirmation email, and that no CS-n email arrives.

## Rollback

Set `SUPPORT_BACKEND=core` (or remove it) and redeploy. Tickets already in MavenOS stay there.
