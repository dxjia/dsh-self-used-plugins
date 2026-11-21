# DSH Git Branch

`dsh-git-branch` shows the Git branch of the directory used by the current DeepSeek Harness Session in the composer statistics bar and can switch that checkout to another local branch.

## Behavior

- Resolves the nearest Git repository by walking upward from the Session's current working directory.
- Supports an ordinary `.git` directory, linked worktrees and submodules whose `.git` is a file, unborn branches, and detached HEAD.
- Shows the local branch name; a detached HEAD shows its seven-character commit with a **Detached HEAD** label.
- Clicking the branch opens a menu of every local branch in the current checkout and marks the checked-out branch.
- Selecting another branch asks the Host to verify the complete worktree with `git status`, including staged, unstaged, and untracked files.
- A clean worktree runs `git switch --no-guess`; a dirty worktree does not run Git and shows a warning Toast instead.
- A successful switch confirms the new branch with a success Toast and refreshes the branch reading.
- Reads through the Session-authorized `workspaceFiles` Remote, so the browser performs no local filesystem access.
- Git listing and switching run in the Session's current directory through explicit argv, without browser filesystem access or shell interpolation.
- Refreshes every three seconds while the Session is running, every fifteen seconds while idle, and every thirty seconds while no repository is found.
- Renders nothing for a non-Git directory, an unavailable repository, or an unavailable branch HEAD.

## Compatibility

```text
dsh >=0.2.2-rc.5 <0.3.0
```

## Build

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Install

```sh
dsh plugin --profile desktop add ./dsh-git-branch
```

Remove it with:

```sh
dsh plugin --profile desktop remove dsh-git-branch
```

## Limitations

- Branch display discovery reads repository metadata files directly. It does not evaluate `GIT_CEILING_DIRECTORIES`, `GIT_DIR`, or bare-repository discovery.
- A symbolic-link `.git` entry is not followed because the workspace file service refuses a final symlink.
- The menu lists local branches. Remote-tracking branches are not offered because selecting one would require creating a new local branch.
