# ⚠ Hidden malicious code in your repositories

Following up on the ShopAI finding: I scanned the three repos for the same payload (obfuscated JavaScript appended after a long run of tabs/whitespace, using `global['!']` and `_0x…` identifiers). I did **not** execute or decode it.

| Repo | Infected files | Runs when |
|---|---|---|
| `agentic-google-meet-assistant` | `backend/api.js`, `frontend/postcss.config.mjs` | `backend/package.json` runs `node api.js &&` before **every** script (`dev`, `build`, `start`); PostCSS config runs on every `next dev/build` |
| `AI-Medical-Research-Assistant` | `client/eslint.config.js` | when ESLint runs (editor integration / `npm run lint`) |
| `Ai-Powered-Personal-Finance-Platform` | none found | n/a |
| `ShopAI` (earlier) | `backend/api.js`, `frontend/tailwind.config.js` | same pattern |

Four of your repos carrying the same implant suggests the source is **common to your machine or account**, not a one-off (e.g. a poisoned template you copied, a malicious dependency/extension, or compromised credentials pushing commits). Treat the development machine as potentially compromised.

## Do this now
1. Stop running `npm run dev/start/build` in these repos on that machine until cleaned.
2. **Rotate every secret that machine could read**: all `.env` values (DB URLs, JWT/API keys, Descope, Google OAuth, Stripe, SMTP), GitHub tokens/SSH keys, cloud/hosting tokens, npm tokens, and saved browser passwords. Revoke GitHub "authorised OAuth apps" and review the security log.
3. Scan the machine (a reputable anti-malware tool), check startup items / cron / unfamiliar processes. For a laptop holding keys or wallets, a clean OS reinstall is the safest path.
4. Clean each repo: replace the infected config files (clean versions of `postcss.config.mjs` and `tailwind.config.js` are in the redesign packages); delete `backend/api.js` and remove `node api.js &&` from `backend/package.json` scripts; for the medical repo, restore `client/eslint.config.js` from a clean template.
5. Search for more copies: `grep -rIl "global\['!'\]" . --exclude-dir=node_modules`, plus any file with a line over ~3,000 characters.
6. Enable 2FA on GitHub, and check where the payload first appears in each repo's history.
7. Redeploy with rotated secrets.

The packages I delivered were built from clean copies: **none of the infected files are included**.
