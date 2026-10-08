# Recording discoveries

For every important finding, record:
- **Path**: `stock_retro/<hotel>/<file>` (or plugin jar / cosas / bundle path)
- **Hotel**: only when the folder or file makes it clear
- **Key / classname / line**: the exact evidence
- **Commit**: hash + date if history was used
- **Type**: SOURCE-DERIVED FACT (seen in the file) · INFERENCE (concluded from texts/config) · GENERAL KNOWLEDGE (not from this source)
- **Applicable to us**: yes / adapt (how) / no (why)

- **Confidence**: VERIFIED · OBSERVED · INFERRED · PROPOSED · FAILED · UNKNOWN (definitions and the ledger:
  `knowledge-log.md`)

Rules:
- Never invent attribution. If the evidence isn't there, say "not enough evidence in stock_retro".
- Server mechanics (odds, prices, cooldowns) never come from stock_retro. Mark any such statement as inference or name the real source.
- Reusable, durable findings go in a short note in the reference that fits (this skill's references for retro facts, or
  the owning project skill when they change our design). Feature-specific results go in `docs/PROJECT_STATE.md` with the
  task. No source dumps.
- Licence: stock_retro's own `LICENSE` covers the repository. The gamedata belongs to the hotels and Sulake. Use it as
  reference (names and facts), not as bulk assets to republish, unless the user decides otherwise.
