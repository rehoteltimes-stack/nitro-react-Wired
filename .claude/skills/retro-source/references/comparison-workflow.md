# Comparing retros

1. State the feature in one line, and what our project already does (with paths).
2. Pick hotels that have it (grep the texts/furnituredata across `*/`). Prefer 2-4 hotels with the clearest evidence.
3. Per hotel, note factually:
   - how it works, as far as the evidence shows;
   - where the evidence is (file, key, commit);
   - what it depends on (currency, furni, effect, window);
   - the gameplay loop and economy impact;
   - the UI it needs and the server logic it needs (inferred unless an implementation source shows it);
   - limits and differences.
4. Table the hotels side by side. No rankings, just observations.
5. Fit to us. For each mechanism, say whether it is adopted, adapted (how, which of our systems) or rejected, and why:
   architecture, security, economy authority or duplication.
6. Then design and implement through the normal project workflow, and verify.
