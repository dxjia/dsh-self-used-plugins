# DSH 自用插件归档

[English](README.md) | 中文

用于归档本人自用的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件。

本仓库不修改 Harness 源码，每个插件都是独立的 npm 包，拥有自己的依赖、构建配置、测试、README 和 Cordis bundle patch。

## 插件列表

| 插件 | 功能 | DSH 兼容范围 |
|---|---|---|
| [`dsh-terminal-appearance`](./dsh-terminal-appearance) | 为侧边栏终端增加配色方案、ANSI 颜色、字体和字号设置。 | `>=0.2.2-rc.3 <0.3.0` |
| [`dsh-im-chat-mockup`](./dsh-im-chat-mockup) | 把聊天界面装饰成即时通讯样式，支持气泡、纯色背景、背景图、角色名称、当前模型名称和最后更新时间。 | `>=0.2.2-rc.5 <0.3.0` |
| [`dsh-session-quick-switch`](./dsh-session-quick-switch) | 在最近一小时内访问过的至多三个会话之间循环切换。Desktop 默认使用 `Ctrl+Tab`，可在 DSH 快捷键设置中修改。 | `>=0.2.2-rc.5 <0.3.0` |

DSH 插件 API 仍处于预稳定阶段。升级 Harness 后，请查看各插件 README，并重新运行对应测试。

## 安装

在本仓库根目录把插件安装到 Desktop profile：

```sh
dsh plugin --profile desktop add ./dsh-terminal-appearance
dsh plugin --profile desktop add ./dsh-im-chat-mockup
dsh plugin --profile desktop add ./dsh-session-quick-switch
```

Web profile 将 `desktop` 替换为 `web` 即可。

安装插件后重启 DSH。卸载方式如下：

```sh
dsh plugin --profile desktop remove dsh-terminal-appearance
dsh plugin --profile desktop remove dsh-im-chat-mockup
dsh plugin --profile desktop remove dsh-session-quick-switch
```

## 开发

每个目录都是独立项目。进入需要修改的插件后执行：

```sh
cd dsh-terminal-appearance
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

`dsh-im-chat-mockup` 和 `dsh-session-quick-switch` 使用相同命令。

构建产物和已安装依赖不纳入归档：

```text
node_modules/
lib/
```

## 仓库结构

```text
dsh-self-used-plugins/
├── dsh-terminal-appearance/
├── dsh-im-chat-mockup/
└── dsh-session-quick-switch/
```

## 说明

- 本仓库是个人插件归档，不是 DeepSeek Harness 官方发行内容。
- 插件行为和兼容性说明以各子目录中的 README 为准。
- `dsh-im-chat-mockup` 选择的本机背景图保存在浏览器中，不会写入本仓库。
- `dsh-session-quick-switch` 只在浏览器本地存储中保存最近会话 ID 和访问时间。
