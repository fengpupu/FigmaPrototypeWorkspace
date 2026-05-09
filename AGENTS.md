# Repository Instructions

This repository contains Figma-generated application code.

- Treat local preview/bootstrap files as workspace-only helpers unless the user explicitly asks to version them.
- When creating files only to install, run, preview, debug, or enable local tooling, add matching `.gitignore` entries in the same change.
- Keep local helper entry files such as `index.html` and `src/main.tsx` untracked unless the user explicitly asks to commit them.
- Commit durable project configuration changes, but avoid committing generated build output, logs, dependency folders, or temporary tooling artifacts.
- In project detail UI, "采纳版本" means the child-node version accepted by the parent node's previous commit. It must stay stable for that parent-child relationship and must not change when the user switches the currently viewed branch.
- In project detail and workspace flows, comments/messages belong to branches, not nodes. Show comment counts and comment threads only in branch-level UI keyed by `branchId`.
- Workspace entry belongs to branches, not nodes. Node cards may show preview/view actions, but must not show an edit workspace entry.
- Node "view" still opens the workspace preview for an appropriate branch. The distinction is inside the workspace commit/version records: node records should be styled like version records and can show adopted/latest markers, while branch cards and workspace entry remain branch perspectives.
- Node descriptions in project detail and workspace should stay node-level only: use thumbnails and show node type, branch count, new commit count, and adopted version. Keep latest/current version, assignee, comments, and workspace entry as branch-level information.
- In workspace node version switching, the node-level new commit count must be derived from the actual node commit list shown in the dialog, so the count and highlighted "新提交" rows stay aligned.
- If a workspace node has never submitted commits, show its adopted version as `--` instead of inventing a branch/version value.
- In workspace node version switching, the adopted version must be marked from explicit data such as `adoptedCommitId`, not inferred from list position. It should be older than new commits when present, and the same commit must not be marked as both "新提交" and "采纳版本".
- Workspace commit history has no merge concept, but branches can start from an existing commit. Render fork/start connections from a single parent to a new branch lane, but do not render merge-back curves or multi-parent merge relationships.
- Mock workspace commit data should use varied branch start parents so not every branch visually starts from the same root commit; each start parent must be an earlier commit so graph dots never render as isolated nodes.
