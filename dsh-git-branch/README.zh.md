# DSH Git Branch

`dsh-git-branch` 在 DeepSeek Harness 底部统计栏中显示当前会话工作目录所属 Git 仓库的分支，并可将该工作区切换到其他本地分支。

## 行为

- 从当前会话工作目录向上查找最近的 Git 仓库。
- 支持普通 `.git` 目录、`.git` 为文件的 linked worktree 和 submodule、尚未产生提交的分支以及 detached HEAD。
- 普通分支显示分支名；detached HEAD 显示七位提交号，并标注 **分离 HEAD**。
- 点击分支会打开当前仓库的全部本地分支菜单，并标记当前分支。
- 选择其他分支时，Host 会先用 `git status` 检查完整工作区，包括已暂存、未暂存和未跟踪文件。
- 工作区干净时执行 `git switch --no-guess`；存在修改时不执行 Git，并弹出警告 Toast。
- 切换成功后显示成功 Toast，并刷新底部统计栏中的分支。
- 通过会话授权的 `workspaceFiles` Remote 读取，浏览器不直接访问本地文件系统。
- 分支列表与切换都通过显式 argv 在会话当前目录执行，不经过浏览器文件系统或 shell 字符串拼接。
- 会话运行中每 3 秒刷新，空闲时每 15 秒刷新；未找到仓库时每 30 秒复查。
- 非 Git 目录、不可读仓库或不可读 HEAD 不显示任何条目。

## 兼容范围

```text
dsh >=0.2.2-rc.5 <0.3.0
```

## 构建

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## 安装

```sh
dsh plugin --profile desktop add ./dsh-git-branch
```

卸载：

```sh
dsh plugin --profile desktop remove dsh-git-branch
```

## 限制

- 底部当前分支的发现直接读取 Git 元数据文件，不会处理 `GIT_CEILING_DIRECTORIES`、`GIT_DIR` 或 bare repository 的发现规则；菜单列表和切换则由 Host 执行只读/切换 Git 命令。
- 工作区文件服务拒绝最终路径为符号链接，因此不会跟随以符号链接形式存在的 `.git`。
- 菜单列出本地分支；不会直接列出远程跟踪分支，因为切换远程分支需要新建本地分支。
