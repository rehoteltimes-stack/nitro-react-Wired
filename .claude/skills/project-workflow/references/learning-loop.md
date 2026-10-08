# Learning loop: pipeline notes, knowledge routing, skill gaps

TASK → INSPECT → IMPLEMENT → VERIFY → LEARN → PIPELINE NOTE → ROUTE KNOWLEDGE → CHECK SKILL GAP → future tasks reuse it.

## Before a task
Grep the notes for the area/keywords (`grep -n "| <area>" docs/PIPELINE_NOTES.md`, `grep -n -i "<keyword>"`) and read
only the matching entries. Ask: "have we learned this (or failed at it) before?"

## After a meaningful task: one pipeline note
Meaningful = new architecture/integration, important bug or fix, failed approach, new source behaviour, catalog/asset/
renderer/Cloudflare/deploy/campaign/retro discovery, a reusable procedure, a decision, a new failure mode. Not for
trivial edits. Append to `docs/PIPELINE_NOTES.md` (newest at the end):
```
### YYYY-MM-DD | AREA | task in a few words
- Discovery / what changed: …
- Worked: …            - Failed: … (attempt → symptom → correct approach → when it applies)
- Reusable: … (CONFIDENCE)         - Routed to: <skill/reference> | none
- Evidence: <command, file, URL, row>   - Next: …
```
AREA = one of: workflow, retro, campaign, catalog, assets, cloudflare, cdn, deploy, emulator, plugins, hcms, nitro, economy, staff.
Confidence: VERIFIED · OBSERVED · INFERRED · PROPOSED · FAILED · UNKNOWN. Only VERIFIED is established behaviour; never
upgrade an assumption, never overwrite VERIFIED with something weaker.

## Route the reusable part (once, to the smallest place)
| Knowledge | Goes to |
|---|---|
| how to work, routing, approvals, deploy/CDN/Cloudflare/assets/catalog procedures | `project-workflow` references |
| external sources, campaigns, retro findings, suggestion outcomes | `retro-source` (`knowledge-log.md` for facts) |
| Arcturus core behaviour | `arcturus-emulator` |
| our plugins and protocols | `custom-plugins` |
| website / admin / scheduler | `hcms` |
| client | `nitro-ui` |
| stable rule or current focus | `CLAUDE.md` (one line) |
| full write-up of a change | `docs/PROJECT_STATE.md` (client) or `hCMS/docs/PROJECT_STATE.md` |
The note says where it was routed; the knowledge itself lives only there. No copies across files.

## Skill-gap check
Does it fit an existing skill/reference? Yes → update it. Partly → extend it. No → add a **SKILL GAP** entry to the
notes (proposed skill/reference, why, repeated work it covers, why the seven skills don't fit, which skills it would
coordinate with, location, example requests; status SUGGESTED). Prefer a new reference over a new skill. **Never
create an eighth top-level skill on your own**: ask the user ("Skill gap detected: X. It doesn't fit the seven skills
because … Create it?").
