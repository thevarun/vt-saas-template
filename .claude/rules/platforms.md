---
paths:
  - "src/libs/platforms/**"
  - "src/app/api/auth/**"
---

# Third-party OAuth & token security

Forward-looking guidance for any fork that adds OAuth against an external platform (storing access/refresh tokens). The template ships no such integration yet — treat these as invariants to hold when you build one, not a description of existing code.

- **Encrypt OAuth tokens before storage.** Use AES-256-GCM with a random IV per call before writing access/refresh tokens to the table that stores third-party credentials. Never persist tokens in plaintext. The key comes from a `TOKEN_ENCRYPTION_KEY` env var (64-char hex = 32-byte key); add it alongside the encryption utility when you ship that feature.
- **Never return tokens in API responses.** They must be excluded from every query and serializer that can reach a response body. Treat any code path that selects token columns into a response as a bug.
- **OAuth flow shape:** connect route sets state / PKCE cookies → external OAuth → callback encrypts the returned tokens → upsert into the credentials table. Keep token handling server-side only; the client never sees raw tokens.
