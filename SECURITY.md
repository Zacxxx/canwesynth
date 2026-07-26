# Security policy

CanWeSynth is pre-alpha. Security fixes are accepted for the latest `main`
branch.

## Report privately

Do not open a public issue for a vulnerability. Use GitHub's private
vulnerability reporting for this repository. If that is unavailable, contact
the repository owner through the email associated with the GitHub profile.

Include affected versions, reproduction steps, impact, and any proposed fix.
Please avoid accessing data that is not yours.

## Trust boundaries

- Instrument files are untrusted input and must be validated before use.
- Agent writes are confined to an explicitly selected project root.
- OAuth tokens belong to the local Codex app server and are never returned to
  CanWeSynth.
- App-server approval requests must be shown to the user; the bridge never
  silently approves shell commands or file changes.
- Audio callbacks must not perform filesystem or network access.
- Preset and wavetable parsers require size and complexity limits.
