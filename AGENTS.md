# Repository Instructions

This repository contains Figma-generated application code.

- Treat local preview/bootstrap files as workspace-only helpers unless the user explicitly asks to version them.
- When creating files only to install, run, preview, debug, or enable local tooling, add matching `.gitignore` entries in the same change.
- Keep local helper entry files such as `index.html` and `src/main.tsx` untracked unless the user explicitly asks to commit them.
- Commit durable project configuration changes, but avoid committing generated build output, logs, dependency folders, or temporary tooling artifacts.
