# Project UI/UX Skills

These skills are project-local Codex resources. They guide design and implementation work but are not application runtime dependencies, so Docker services do not need to be running to use them.

## Installed skills

| Skill | Purpose | Source | Pinned commit |
| --- | --- | --- | --- |
| `ui-ux-pro-max` | Searchable design intelligence for product patterns, palettes, typography, UX, icons, motion, and Next.js guidance | `nextlevelbuilder/ui-ux-pro-max-skill` | `b484e8338c25b9cea3a25981a992d2817188971a` |
| `frontend-ui-engineering` | Production component architecture, responsive UI, state handling, and accessibility | `addyosmani/agent-skills` | `2fbfa004a0192529bc997d103fc12f19a3804aab` |
| `visual-design-foundations` | Design tokens, typography, color, spacing, hierarchy, and iconography | `wshobson/agents` | `c4b82b0ad771190355eb8e204b1329732a18449a` |
| `interaction-design` | Purposeful motion, loading feedback, transitions, and microinteractions | `wshobson/agents` | `c4b82b0ad771190355eb8e204b1329732a18449a` |
| `wcag-audit-patterns` | WCAG 2.2 audits, manual verification, and remediation patterns | `wshobson/agents` | `c4b82b0ad771190355eb8e204b1329732a18449a` |

## Recommended workflow

1. Use `ui-ux-pro-max` to derive candidate directions from the mall brief and visual references.
2. Use `visual-design-foundations` to turn the chosen direction into stable tokens.
3. Use `frontend-ui-engineering` with the existing Next.js project conventions to implement screens and components.
4. Use `interaction-design` only where motion improves feedback or orientation.
5. Use `wcag-audit-patterns` during final responsive and accessibility verification.

The repository also has Codex-provided `frontend-design`, `nextjs-developer`, and browser-control skills available outside this folder. They complement these project-local resources.

## Activation

Codex discovers project skills from `.agents/skills`. Start a new Codex task or reload the workspace after installation so the skill catalog refreshes.
