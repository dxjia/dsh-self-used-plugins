/** Typert contract shared by the Host Git service and its browser consumer. */
import { z } from 'zod'
import { createTypertRemoteInfo } from '@deepseek-ai/dsh-typert-protocol/remote-info'
import type {
  TypertRemoteCodecSpec,
  TypertRemoteParameterSpec,
} from '@deepseek-ai/dsh-typert-protocol'
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry/types'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Npm identity used by both Typert faces. */
export const REMOTE_PACKAGE = 'dsh-git-branch'

/** Local branches and the checked-out branch, or null for detached HEAD. */
export interface GitBranchList {
  readonly current: string | null
  readonly branches: readonly string[]
}

/** Result of one explicit branch-switch request. */
export type GitBranchSwitchResult =
  | { readonly status: 'switched'; readonly branch: string }
  | { readonly status: 'dirty' }
  | { readonly status: 'failed'; readonly message: string }

/** Generated Client face mounted by this plugin. */
export interface GitBranchRemote {
  /** @param sessionId - Session whose checkout is read. */
  list: (sessionId: SessionId, signal?: AbortSignal) => Promise<import('@deepseek-ai/dsh-typert-protocol').RemoteResult<GitBranchList>>
  /** @param sessionId - Session whose checkout is switched. */
  switch: (
    sessionId: SessionId,
    branch: string,
    signal?: AbortSignal,
  ) => Promise<import('@deepseek-ai/dsh-typert-protocol').RemoteResult<GitBranchSwitchResult>>
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    gitBranch: GitBranchRemote
  }
}

function codec(schema: z.ZodType, typeSymbol: string): TypertRemoteCodecSpec {
  return { mode: 'strict', typeSymbol, create: () => schema }
}

function parameter(
  name: string,
  schema: z.ZodType,
  typeSymbol: string,
  options: Pick<TypertRemoteParameterSpec, 'source' | 'wire' | 'lookup' | 'description'>,
): TypertRemoteParameterSpec {
  const value = codec(schema, typeSymbol)
  return { name, ...options, codec: value, strictCodec: value }
}

const sessionParameter = parameter('session', z.string(), '@deepseek-ai/dsh-session/types#SessionId', {
  wire: 'sessionId',
  source: 'lookup',
  lookup: 'session',
  description: 'Session whose current checkout is read.',
})

const branchListSchema = z.object({
  current: z.string().nullable(),
  branches: z.array(z.string()),
})

const switchResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('switched'), branch: z.string() }),
  z.object({ status: z.literal('dirty') }),
  z.object({ status: z.literal('failed'), message: z.string() }),
])

/** Generated-equivalent Remote definition; the source is hand-maintained with this package. */
export const gitBranchRemote = createTypertRemoteInfo({
  package: REMOTE_PACKAGE,
  methods: {
    'gitBranch/list': {
      service: 'gitBranch',
      description: 'List the current checkout\'s local branches and the checked-out branch.',
      invocation: { kind: 'direct' },
      parameters: [sessionParameter],
      cancellation: { parameter: 'signal' },
      result: codec(branchListSchema, 'dsh-git-branch#GitBranchList'),
    },
    'gitBranch/switch': {
      service: 'gitBranch',
      description: 'Switch to one local branch when the current worktree has no tracked or untracked changes.',
      invocation: { kind: 'direct' },
      parameters: [
        sessionParameter,
        parameter('branch', z.string().min(1), 'dsh-git-branch#GitBranchSwitchResult:branch', {
          wire: 'branch',
          source: 'json',
          description: 'Exact local branch name selected from the list.',
        }),
      ],
      cancellation: { parameter: 'signal' },
      result: codec(switchResultSchema, 'dsh-git-branch#GitBranchSwitchResult'),
    },
  },
}, z)

/** Host registry contribution for the same descriptors the Client mounts. */
export const HOST_TYPERT = {
  package: REMOTE_PACKAGE,
  face: 'host',
  schemas: [],
  model: { services: [], events: [], objects: [] },
  get invocations() { return gitBranchRemote.descriptors },
} satisfies TypertContribution

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** The Session directory is not inside a Git checkout. */
    'git-branch/not-a-checkout': Record<string, never>
    /** Git could not be resolved, started, or completed its read. */
    'git-branch/git-failed': { readonly operation: string }
  }
}
