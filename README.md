# AccountMap

**See how your accounts recover each other, before you get locked out.**

Most people don't know that one Gmail address can reset half their accounts, or that their bank only recovers by SMS. AccountMap maps every account you have to the email, phone number, or authenticator that gets you back in, then shows you the weak spots: single points of failure, SMS-only recovery, and accounts with no way back at all.

> **Status: planning / pre-alpha.** Nothing to install yet. Follow the [roadmap](#roadmap) or try the [hackathon demo](https://demo.accountmap.org).

## Principles

- **Local-first.** Your map lives on your device. The app works fully offline, with no account required.
- **Zero-knowledge.** Your map is encrypted on your device before it's saved or synced. If we offer sync, our servers only ever store ciphertext.
- **Open source.** Every client is open, so you can check exactly what happens to your data instead of trusting us.
- **No passwords.** AccountMap stores how accounts recover, never their passwords.

## What it will do

- **Map your accounts:** each account connected to the emails, phone numbers, and authenticators that can recover it, shown as an interactive graph or a list.
- **Find weak spots:** single points of failure, SMS-only recovery, accounts with nothing listed, and too many accounts depending on one email.
- **"What if I lose…" simulation:** pick your phone or an email and see every account you'd be locked out of.
- **Import instead of typing:** build your map from a Bitwarden, 1Password, or browser password export. Passwords are discarded while parsing and never stored.
- **Emergency sheet:** a printable summary of how to get back into everything.
- **Browser extension:** notices when you sign up or sign in somewhere and offers to add it to your map.

## Planned architecture

One monorepo for all clients, so the desktop app, web app, and extension share the same encryption and vault code.

```
apps/
  web/          React web app (PWA): try it instantly, no install
  desktop/      Tauri 2 desktop app: the recommended home for your real data
  extension/    Browser extension (WXT, Manifest V3)
packages/
  core/         Graph model and analysis (no I/O)
  crypto/       Argon2id key derivation + XChaCha20-Poly1305 (libsodium)
  vault/        Vault format, versioning, migrations
  storage/      One interface: browser storage | file on disk | encrypted sync
  importers/    Password-manager export parsers
  ui/           Shared React components and graph views
```

**Stack:** TypeScript, React, Vite, Tailwind, Tauri 2, WXT, pnpm workspaces + Turborepo, GitHub Actions.

## Roadmap

Progress is tracked in [milestones](../../milestones).

| Milestone | Goal |
|---|---|
| **M0: Foundation** | Monorepo, tooling, CI, license, contributor docs |
| **M1: Core** | Graph model, analysis, vault format, UI ported from the hackathon demo |
| **M2: Encryption** | Encrypted vault, master password, encrypted backups, threat model |
| **M3: Web beta** | Public web app with importers and emergency sheet |
| **M4: Desktop** | Signed Tauri app for macOS, Windows, Linux |
| **M5: Extension** | Browser extension with sign-in capture |
| **M6: Sync** | Optional paid encrypted sync, emergency access, family sharing |

The core app stays free and fully local. Paid plans will cover services that cost money to run, such as sync, similar to how Obsidian works.

## Origin

AccountMap started as a 24-hour hackathon project in February 2026 and won Riverside Research's "CyberSecurity Stalwarts" award. The original version and its team are at [malakhovtsev/accountmap](https://github.com/malakhovtsev/accountmap). This repo is a ground-up rebuild around local-first storage and encryption.

## Contributing

The project is just getting started. Issues labeled [`good first issue`](../../labels/good%20first%20issue) are a good place to begin. Contribution guidelines are coming in M0.

## License

To be decided in M0 (see the license issue).
