# Canonical custom-plugin structure

Based on what Arcturus supports (`core:plugin/PluginManager`: one jar per plugin, `plugin.json` with `main`, own class
loader, `HabboPlugin` subclass, `@EventHandler` methods invoked on the plugin instance, packets/RCON/commands registered
at `EmulatorLoadedEvent`) and on our cleanest existing plugins (`hcms-shop`, `hcms-furnieditor-plugin`).

## Layout (use this for every new plugin, and when touching an old one move toward it only where safe)
```
hcms-<domain>[-plugin]/
  CLAUDE.md                     short pointer (PROJECT_WORKFLOW §16 template)
  pom.xml                       artifactId hcms-<domain>, Habbo-4.0.3-beta.jar as system-scope dep from libs/, JDK 21
  libs/Habbo-4.0.3-beta.jar
  src/main/resources/plugin.json   {"name": "hCMS <Domain>", "author": "Habbo.nz", "main": "com.hcms.<domain>.<Domain>Plugin"}
  src/main/java/com/hcms/<domain>/
    <Domain>Plugin.java         extends HabboPlugin, implements EventListener: onEnable registers events only;
                                onEmulatorLoaded: install schema, register packets, commands, RCON, schedulers;
                                onDisable: unregister its own handlers/callables (two-arg unregisterCallables), stop timers
    <Domain>Config.java         every setting key + default, registered with Emulator.getConfig().register
    <Domain>Service.java        the rules (validation, ranks, balances, results)
    install/<Domain>Installer.java   CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS, schema version setting
    install/<Domain>Seed.java        INSERT IGNORE defaults
    data/                       repositories + small data classes (SQL lives here)
    messages/incoming/          one MessageHandler per incoming opcode
    messages/outgoing/          one MessageComposer per outgoing opcode
    commands/                   Command subclasses
    room/ or other feature subpackages for event-driven behaviour
```
Naming: package `com.hcms.<domain>`, classes prefixed with the domain (`ShopService`, `FurniEditorPlugin`). Opcodes as
settings or constants in one `<Domain>Headers`/`<Domain>Config` class. Log one "registered" line per protocol at boot.
Errors: catch and log per handler, never let one feature break plugin load. No tests exist in any plugin today.

## Current plugins vs canonical (2026-10-01)
| Plugin | Matches | Deviations (fix only when safe and related to a task) |
|---|---|---|
| `hcms-shop/server` (`com.hcms.shop`) | yes (Plugin, Config, Service, install/, data/, messages/, room/) | plugin folder has client/ and hotel-data/ beside server/ (intentional: sellable product) |
| `hcms-furnieditor-plugin` (`com.hcms.furnieditor`) | mostly (Plugin, messages/incoming+outgoing, Headers) | data/service classes flat in the root package |
| `hcms-feedback` (`com.hcms.feedback`) | small, flat (7 classes) | no messages/ (it only intercepts outgoing packets); fine at its size |
| `hcms-buildermode-plugin` | entry + messages/incoming | **package `com.hcms.emulatorplugin.buildermode`** reuses the main plugin's namespace; should be `com.hcms.buildermode` |
| `hcms-emulator-plugin` (`com.hcms.emulatorplugin`, 147 classes) | feature packages | **one large plugin with ~32 unrelated domains** (engagement, staff, security, prison, mentions, profile, bots…); handlers often nested inside `*Protocol` classes; 46 `@EventHandler`s in `HcmsPlugin`. Don't add new unrelated domains here; a genuinely separate domain gets its own plugin. Splitting it is a large migration: plan it and get approval first. |

## Responsibility rules
- One plugin = one domain. Extend the plugin that owns the domain. Don't create a second owner.
- Shared helpers that several domains use (`CommandFeedback`, `Wallet`, `PlayerRefresh`) live in hcms-emulator-plugin today;
  other plugins reach them by reflection (separate class loaders). Keep that rare.
