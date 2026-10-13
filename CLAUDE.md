# book-site — rules for Claude Code sessions

This is the book's website and, during 2026-10 … 2027-01, the author's MOT course project
(山口大学「創造的問題解決特論 2026」). It will become a **public** repository under the
personal GitHub account `beanocle`. Astro-specific conventions are in [AGENTS.md](AGENTS.md).

## Public repository: treat every byte as already published

- Content from the author's private repositories (the manuscript, the case-study code)
  enters this repo only through `scripts/` (allow-listed files, scanned). Never copy by hand.
- No credentials, API keys, internal host names, company names, real account IDs,
  personal names of third parties. `tools/check_secrets.py` runs in the pre-commit hook.
- The Gemini API key is the author's personal free-tier key. It lives only in `.dev.vars`
  (ignored) locally and in `wrangler secret` remotely. If it ever lands in a commit, do not
  try to scrub it: tell the author immediately so the key can be revoked in Google AI Studio.
- The free quota is tiny. Run real Gemini calls only when a change needs it, one call at a time.
- Figures from the book: only fig-01/02/04/06/07/10/11/12 may be imported; the others
  contain un-redacted internal data.

## No university accounts or addresses

- This project must not be linked to any university email address or account (author's
  decision, 2026-10-13). GitHub, Cloudflare, Gemini and any other service use the author's
  personal accounts only. The course deployment is not restricted by university login;
  it relies on `noindex` and the AI call quotas instead.

## Git identity (mandatory)

- Author and committer must be exactly
  `beanocle <311232893+beanocle@users.noreply.github.com>`, set per repository
  (`git config user.email …`, never `--global`). The hook rejects anything else.
- Never bypass hooks with `--no-verify`.
- Do not rewrite history or force-push without the author's explicit confirmation.

## Local environment

- Node 22+ is required (Astro 7). Load the environment with `. .\dev.ps1` (PowerShell) or
  `. ./dev.sh`; machine-specific settings live in the git-ignored `dev.local.*` files.
- Machine-specific notes for Claude Code sessions live in the git-ignored `CLAUDE.local.md`.
  Nothing in it may be copied into committed files.

## Course constraints that shape the code

- The TRIZ procedure, parameter table, principle mapping and judgment criteria in
  `src/triz/` are the author's design. Claude may draft, the author approves, and every
  design decision is recorded in `docs/triz-design.md` so it can be explained at the final
  presentation (2027-01-16, 20 min, no PowerPoint, the app itself is the presentation).
- The AI is a component that follows that design: solution withholding, graded hints,
  confidence before feedback, a verifier pass on every answer. Never ship a plain chat.
- Learning logs are events only (see `docs/event-schema.md`), pseudonymous session IDs,
  no free text by default, 90-day retention.

## Languages

- Three parallel locales: `ja` (primary), `en`, `zh`. Terminology follows the book's
  glossary kept in the manuscript repository; do not invent translations.
- Replies to the author are in Simplified Chinese; code comments may be Chinese or English.
