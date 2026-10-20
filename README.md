# 📖 Instance Architect — QA v0.2.4

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

## v0.2.1 JSON-generation fix

The first mobile generation returned malformed JSON around character 18,997. This release asks for a compact, fixed-size blueprint (three map nodes, two rule mechanisms, two mandatory facts with two independent clues each, three named adults, four walkthrough steps), removes reasoning tags when parsing, and reports output length and closing-brace status **without showing private mystery text**. The result is still audited separately and saved only if all checks pass. This is a hypothesis-driven fix, not a confirmed solution; please retest on a throwaway chat.

## v0.2.2: Isolated generation and safer parsing

The second phone test returned 7,751 characters, with a JSON parser error about extra non-whitespace after a valid object. The phone switching between apps is **not established** as the root cause.

Changes:
- Uses SillyTavern's documented `getContext().generateRaw({ systemPrompt, prompt })` API for generation and review. This avoids chat history and our previous quiet-request event interception; it may also improve speed, but this is not yet measured.
- Parses the **first balanced JSON object**, permitting limited trailing prose while rejecting multiple conflicting objects. Malformed/incomplete JSON still fails safely; no object is locked until validation and review pass.
- Reports whether **generation** or **review** failed.
- Updates the visible settings-panel version (it was hard-coded to v0.2 even when v0.2.1 was installed).
- If `generateRaw` is not available on your TauriTavern fork, the panel explains that rather than sending an unsafe fallback request.

**QA:** Install/update on a disposable Infinite Flow GM chat. Keep TauriTavern in the foreground during the next test, and wait for the panel to show either `Generated, reviewed, and sealed` or a stage-labeled error. This change is published but **not yet verified on your phone**.

## v0.2.3: Fix the NPC validator (QA regression)

The v0.2.2 phone test completed isolated generation and JSON parsing, but flagged the NPC section. Our own validator incorrectly demanded six-character text for `gender`, causing the normal value `"male"` to fail. It also treated `"female"` as containing `"male"` when detecting a male romance prospect.

This release validates gender as a nonempty label, checks names and adult ages separately, and identifies which NPC field is missing, without displaying hidden mystery content. The adult-only constraint and requirement for an accessible adult male romantic opportunity remain.

**No Bible was saved by the failed v0.2.2 test.** If you choose to retry, it is a new paid GLM generation. Update the extension, reload, confirm QA v0.2.3, then generate only in a disposable chat.

## QA v0.2.4: Preserve an unsealed draft after audit rejection

The v0.2.3 phone test passed parsing and structural validation, but the independent reviewer rejected the candidate. The previous code discarded the entire candidate, forcing a paid full regeneration.

**New test-only behavior:**

- As soon as a generated Bible passes structural checks, cache it in **per-chat UNSEALED draft metadata** (`pipette_instance_bible_unsealed_draft_v024`). It is **never injected** into the story.
- Run the independent review. On rejection, keep the unsealed draft, record private audit issues, and show only generic spoiler-safe categories and an issue count.
- Tap **🛠️ Repair & Re-review** to revise the existing draft based on those private audit issues, and run a fresh second-pass review. This costs model tokens, but does not repeat the entire initial generation from scratch.
- If the review failed due to malformed output, tap **🔍 Retry Review** instead. It rechecks the same draft without repairing it.
- Tap **Discard UNSEALED Draft** to abandon the candidate. **Delete QA Bible** remains for sealed test runs.
- A malformed repair keeps the earlier validated draft. Failure to get audit approval always means **no Bible lock**. There is no infinite or automatic retry loop.

**Existing failed v0.2.3 generation cannot be resumed:** that version did not save its rejected candidate. After updating and reloading, the first v0.2.4 run must start with **Generate Instance** and costs a full generation again. Future successful structural drafts should survive reviewer rejection.

**Limits:** The second model reviewer may reject a perfectly fair mystery or approve an unfair one. The tool is experimental; tests on your TauriTavern build are still necessary. The unsealed draft is private GM material stored in local chat metadata—not cryptographically hidden from anyone who inspects storage. Keep working only in disposable chats.

## Important limitations

**UNTESTED IN YOUR APP:** The new background generation is not yet verified in TauriTavern. It may fail due to quiet-request interception, model output formatting, request order, or provider token limits. Please report screenshots or the exact error; do not troubleshoot by changing Megumin.

**Not guaranteed spoiler-proof:** Chat owners can inspect metadata/debug prompts. A model can still leak a hidden secret in prose. The fixed Bible and reviewer reduce risk but **do not guarantee** logically correct riddles or prevent all reveals.

**Not an enforced pre-play gate:** Existing chats and prompts can still run before generating a Bible. Treat the chat as a setup/test run until a lock is visibly confirmed.

**Generation/review is not cryptographic validation:** The schema checks completeness and some clue independence; the second reviewer checks reasoning but may be wrong.

**Not a true story-world state machine:** It does not yet automatically archive one Bible after clear or start another. Story Director/Notebook/World State still run separately.

**Costs:** Generation and audit use the currently configured model/provider. Failed generations may still consume tokens.

**Model limitations:** Very long output can truncate and fail validation. Drafts that fail or audits that reject do not seal and must be regenerated deliberately.

The extension is experimental and must never store private personal data in the Bible. It does not modify Megumin itself.
