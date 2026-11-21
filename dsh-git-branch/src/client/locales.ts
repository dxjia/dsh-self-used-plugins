/** Copy owned by the composer Git branch indicator. */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    gitBranch: keyof typeof zh
  }
}

export const zh = {
  branch: 'Git 分支',
  tooltip: 'Git 分支：{branch}',
  detached: '分离 HEAD @ {commit}',
  detachedTooltip: 'Git HEAD 位于提交 {commit}',
  openMenu: '打开分支列表，当前为 {branch}',
  loadingBranches: '正在读取分支…',
  loadFailed: '无法读取分支：{reason}',
  noBranches: '当前仓库没有本地分支',
  switched: '已切换到分支 {branch}',
  dirty: '工作区存在未提交的修改，无法切换到 {branch}',
  switchFailed: '切换分支失败：{reason}',
}

export const en = {
  branch: 'Git branch',
  tooltip: 'Git branch: {branch}',
  detached: 'Detached HEAD @ {commit}',
  detachedTooltip: 'Git HEAD is at commit {commit}',
  openMenu: 'Open branches; current branch is {branch}',
  loadingBranches: 'Loading branches…',
  loadFailed: 'Could not load branches: {reason}',
  noBranches: 'This repository has no local branches',
  switched: 'Switched to branch {branch}',
  dirty: 'The worktree has uncommitted changes; cannot switch to {branch}',
  switchFailed: 'Could not switch branches: {reason}',
} satisfies Record<keyof typeof zh, string>

export const ja = {
  branch: 'Git ブランチ',
  tooltip: 'Git ブランチ：{branch}',
  detached: '分離 HEAD @ {commit}',
  detachedTooltip: 'Git HEAD はコミット {commit} にあります',
  openMenu: 'ブランチ一覧を開く。現在は {branch}',
  loadingBranches: 'ブランチを読み込み中…',
  loadFailed: 'ブランチを読み込めません：{reason}',
  noBranches: 'このリポジトリにはローカルブランチがありません',
  switched: 'ブランチ {branch} に切り替えました',
  dirty: '作業ツリーに未コミットの変更があるため、{branch} に切り替えられません',
  switchFailed: 'ブランチを切り替えられません：{reason}',
} satisfies Record<keyof typeof zh, string>

export const es = {
  branch: 'Rama de Git',
  tooltip: 'Rama de Git: {branch}',
  detached: 'HEAD separado @ {commit}',
  detachedTooltip: 'Git HEAD está en el commit {commit}',
  openMenu: 'Abrir ramas; la rama actual es {branch}',
  loadingBranches: 'Cargando ramas…',
  loadFailed: 'No se pudieron cargar las ramas: {reason}',
  noBranches: 'Este repositorio no tiene ramas locales',
  switched: 'Se cambió a la rama {branch}',
  dirty: 'El árbol de trabajo tiene cambios sin confirmar; no se puede cambiar a {branch}',
  switchFailed: 'No se pudo cambiar de rama: {reason}',
} satisfies Record<keyof typeof zh, string>

export const fr = {
  branch: 'Branche Git',
  tooltip: 'Branche Git : {branch}',
  detached: 'HEAD détachée @ {commit}',
  detachedTooltip: 'Git HEAD se trouve au commit {commit}',
  openMenu: 'Ouvrir les branches ; la branche actuelle est {branch}',
  loadingBranches: 'Chargement des branches…',
  loadFailed: 'Impossible de charger les branches : {reason}',
  noBranches: 'Ce dépôt ne contient aucune branche locale',
  switched: 'Passage à la branche {branch}',
  dirty: 'L’arbre de travail contient des modifications non validées ; passage impossible vers {branch}',
  switchFailed: 'Impossible de changer de branche : {reason}',
} satisfies Record<keyof typeof zh, string>

export const de = {
  branch: 'Git-Branch',
  tooltip: 'Git-Branch: {branch}',
  detached: 'Losgelöster HEAD @ {commit}',
  detachedTooltip: 'Git HEAD liegt auf Commit {commit}',
  openMenu: 'Branches öffnen; aktueller Branch ist {branch}',
  loadingBranches: 'Branches werden geladen…',
  loadFailed: 'Branches konnten nicht geladen werden: {reason}',
  noBranches: 'Dieses Repository hat keine lokalen Branches',
  switched: 'Zu Branch {branch} gewechselt',
  dirty: 'Der Arbeitsbaum hat nicht committete Änderungen; Wechsel zu {branch} ist nicht möglich',
  switchFailed: 'Branch-Wechsel fehlgeschlagen: {reason}',
} satisfies Record<keyof typeof zh, string>

export const ru = {
  branch: 'Ветка Git',
  tooltip: 'Ветка Git: {branch}',
  detached: 'Отсоединённый HEAD @ {commit}',
  detachedTooltip: 'Git HEAD указывает на коммит {commit}',
  openMenu: 'Открыть список веток; текущая ветка — {branch}',
  loadingBranches: 'Загрузка веток…',
  loadFailed: 'Не удалось загрузить ветки: {reason}',
  noBranches: 'В этом репозитории нет локальных веток',
  switched: 'Выполнен переход на ветку {branch}',
  dirty: 'В рабочем дереве есть незакоммиченные изменения; переход на {branch} невозможен',
  switchFailed: 'Не удалось сменить ветку: {reason}',
} satisfies Record<keyof typeof zh, string>

export const pt = {
  branch: 'Branch do Git',
  tooltip: 'Branch do Git: {branch}',
  detached: 'HEAD destacado @ {commit}',
  detachedTooltip: 'O Git HEAD está no commit {commit}',
  openMenu: 'Abrir branches; o branch atual é {branch}',
  loadingBranches: 'Carregando branches…',
  loadFailed: 'Não foi possível carregar os branches: {reason}',
  noBranches: 'Este repositório não tem branches locais',
  switched: 'Alterado para o branch {branch}',
  dirty: 'A árvore de trabalho tem alterações não confirmadas; não é possível mudar para {branch}',
  switchFailed: 'Não foi possível trocar de branch: {reason}',
} satisfies Record<keyof typeof zh, string>
