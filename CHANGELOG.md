# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `/auth` route for user authentication (login, signup, MFA challenge).
- `ProtectedRoute` middleware gating `/admin`, `/security`, `/security/audit-log`, and `/api-keys` routes.
- `CHANGELOG.md` following Keep a Changelog format.
- Local profile system (`useLocalProfile` hook) for managing user preferences in `localStorage`.
- `OnboardingContext` with guided tour for new users.
- Demo data fallback patterns for analytics, deployment metrics, and leaderboard.
- Cookie consent banner with granular preference management.
- Session timeout provider with idle-detection and warning dialog.
- API documentation page (`/api-docs`) with endpoint reference, auth guide, and code examples.
- `/reset-password` route for password recovery after clicking the email reset link.
- Email verification banner (`EmailVerificationBanner`) shown to authenticated users whose email is not yet confirmed, with resend and dismiss functionality.

### Changed
- `/reset-password` page now displays a clear "Invalid or Expired Link" error card with an auto-redirect countdown and manual "Go to Sign In" button when accessed without a valid token.
- API Docs Base URL now uses `<YOUR_PROJECT_URL>` placeholder instead of exposing the live project URL.
- Architecture documentation (`docs/ARCHITECTURE.md`) updated to reflect current auth-free routing and local state management.

### Security
- Removed hardcoded Supabase project URLs from API documentation code snippets.
- Edge functions hardened with HMAC signature verification and input sanitization.
- Error messages sanitized before client exposure to prevent information leakage.

### Fixed
- Resolved missing `/auth` route that caused 404 when navigating to sign-up/sign-in.
