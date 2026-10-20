# 📖 Instance Architect — QA v0.2

Phone-friendly experimental companion extension for TauriTavern/SillyTavern and Megumin V11.

## What v0.2 does

- Adds a **Generate Instance** button inside Extensions settings.
- On a disposable Infinite Flow GM chat, asks the current story model for a **private structured mystery Bible** using the current GM card, scenario, player persona, and initial greeting.
- Checks required fields, two independently sourced clue routes per required fact, ordinary/optional clears, NPC knowledge, meaningful adult male romance opportunity, pacing, and recovery paths.
- Makes a **second private AI review request** to reject evident design issues.
- Saves a passing draft as a locked **per-chat metadata record**.
- Attempts to supply that fixed record on subsequent eligible V11 story prompts.
- Allows explicit deletion of the QA record.

**The previous PAPER CRANE proof of concept remains a completed test.** This version uses a different metadata key; it does not migrate or remove v0.1's test data.

## Install/update on your phone

Use TauriTavern's extension manager to **Update** the existing Instance Bible installation from:

https://github.com/chikausa14/instance-bible-prototype

Reload TauriTavern. Look for **📖 Instance Architect — QA v0.2** in Extensions settings.

## Test safely

1. Create a brand-new/disposable chat with the Infinite Flow GM v0.3 card; do NOT use the Lucien campaign, QA-003, or anything you want to preserve.
2. In that new chat, open Extensions and tap **Generate Instance**.
3. Confirm that you want to spend the provider usage for multiple generation calls.
4. Wait for the result. **Locked** indicates the structural tests and second AI reviewer passed; **Not locked** gives the rejection reason.
5. Reload the app, revisit the same QA chat, and verify the locked title persists.
6. If desired, generate one short exploratory story turn and check that the injection timestamp appears. Play only in this disposable chat.
7. **Delete QA Bible** removes the test record. Do not use that deleted run for valid mystery-structure QA.

## Important limitations

**UNTESTED IN YOUR APP:** The new background generation is not yet verified in TauriTavern. It may fail due to quiet-request interception, model output formatting, request order, or provider token limits. Please report screenshots or the exact error; do not troubleshoot by changing Megumin.

**Not guaranteed spoiler-proof:** Chat owners can inspect metadata/debug prompts. A model can still leak a hidden secret in prose. The fixed Bible and reviewer reduce risk but **do not guarantee** logically correct riddles or prevent all reveals.

**Not an enforced pre-play gate:** Existing chats and prompts can still run before generating a Bible. Treat the chat as a setup/test run until a lock is visibly confirmed.

**Generation/review is not cryptographic validation:** The schema checks completeness and some clue independence; the second reviewer checks reasoning but may be wrong.

**Not a true story-world state machine:** It does not yet automatically archive one Bible after clear or start another. Story Director/Notebook/World State still run separately.

**Costs:** Generation and audit use the currently configured model/provider. Failed generations may still consume tokens.

**Model limitations:** Very long output can truncate and fail validation. Drafts that fail or audits that reject do not seal and must be regenerated deliberately.

The extension is experimental and must never store private personal data in the Bible. It does not modify Megumin itself.
