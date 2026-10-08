# Using the history

The local history runs from 2024-05-27 to the last pull (2026-09-20 on 2026-10-01). Commit messages are
"Update for <hotel>/<file>".

```bash
cd /c/tools/stock_retro
git log --format='%h %ci %s' -- habbo.st/furnituredata | head              # when a hotel's file changed
git log -S'"classname": "cstm_st24' --format='%h %ci %s' -- habbo.st/furnituredata   # when a string appeared/disappeared
git show <hash> --stat ; git show <hash> -- habbo.st/external.ExternalTexts | head -200   # what changed
git diff <old> <new> -- habbocity.fr/renderer-config
```
On GitHub, appending `.patch` to a commit URL shows big diffs.

`git log -S` on a 27 MB file is slow. Limit by path and use `--since`. Diffs of furnituredata are huge, so filter with
`grep '"classname"'`.

Use history to see when a feature or furni line arrived, what was renamed or removed, and how texts and config evolved.
The newest version is not automatically right for us.
