# Instance Bible — Persistence Prototype

An **experimental, opt-in frontend extension** for SillyTavern / TauriTavern and Megumin V11. This is only a **save → reload → inject** test. It does **not** generate mysteries or modify your GM character card.

## Install from Git (phone-friendly)

In TauriTavern or SillyTavern, open the **Extensions** manager and choose **Install Extension**, then paste:

```text
https://github.com/chikausa14/instance-bible-prototype
```

Install as a **frontend extension**. Reload the app if necessary. Look in the Extensions settings for **📖 Instance Bible — Prototype**.

The files `manifest.json`, `index.js`, `core.mjs`, and `style.css` live at the repository root, as expected by Git installation. If the Git installer is missing or reports an error, stop there—do not manually alter Megumin.

## Test only in a throwaway Infinite Flow GM chat

1. Back up important saves. Open a **NEW / duplicated test chat** using your Infinite Flow GM.
2. Under **Instance Bible — Prototype**, tap **Save harmless TEST Bible**. This record only contains the phrase `PAPER CRANE`; it is *not* a real mystery.
3. Tap **Check status**. Switch to another chat and back; check again. Reload the app and confirm the record remains saved.
4. Generate one benign story reply in the test chat. Tap **Check status**. A recent injection timestamp means the extension *attempted* to add the test Bible to the prompt.
5. If possible, inspect an actual outgoing prompt in a debug/prompt preview view. It should contain `<LOCKED_INSTANCE_BIBLE version="1">` and `PAPER CRANE`. This is for the harmless test *only*; viewing future real Bibles would spoil the game.
6. Tap **Delete TEST Bible** to clean up.

If there is no status panel, no saved record after reload, or no injection timestamp, report what happened. **Do not treat an unverified injection as success.**

## Implementation details

- Stores one record in per-chat `chatMetadata.pipette_instance_bible_poc` with a lock flag.
- Uses the SillyTavern frontend event `CHAT_COMPLETION_PROMPT_READY` to prepend the test record to the story model's prompt only for an Infinite Flow GM chat with V11 markers.
- Makes **no separate AI calls** and introduces **no new external data services**.
- Leaves Megumin itself, Chomusuke jobs, Story Director, World State, Notebook and the GM card unchanged.
- `core.test.mjs` contains simple unit tests. Locally, run `node --test core.test.mjs`.

## Limitations

This code has been tested for its pure logic but **not yet verified inside your TauriTavern app**. Event ordering, prompt structure, mobile UI, and persistence must be checked on your device.

The record is locked against ordinary **UI edits**, not cryptographically tamper-proof. The chat owner can inspect chat metadata and debug prompts. Do not store sensitive personal data.

**Not implemented:** autonomous Instance Bible generation, automated validation, a true pre-game gate, or real spoiler-proof storage. Those come only after this prototype passes.
