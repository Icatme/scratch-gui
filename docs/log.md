# Project URL Debug Log

This file is generated at runtime when project-url debugging is enabled.

1. Ensure `src/settings.json` has `"projectUrlDebugEnabled": true` (default).
2. Exercise either the menu **Load from URL** flow or the URL parameter auto-load.
3. Run `window.downloadProjectUrlDebugLog()` from the browser console to download the latest log as `log.md`.

The generated log separates entries for:
- Menu "Load from URL" chain
- URL parameter auto-load chain
- Other debug entries
