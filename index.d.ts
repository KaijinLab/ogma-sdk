// Ogma Plugin SDK -- TypeScript type definitions
// These types describe the sdk object passed to your plugin's init() function.
// The actual implementation is provided by the Ogma runtime at plugin load time.
//
// Usage:
//   import type { OgmaBackendSdk, HttpRequest, HttpResponse } from '@kaijinlab/ogma-sdk';
//
//   async function init(sdk: OgmaBackendSdk): Promise<void> {
//     sdk.events.onInterceptRequest(async (req) => {
//       sdk.console.log(req.getHost());
//     });
//   }
//   (globalThis as any).init = init;

// ---------------------------------------------------------------------------
// HTTP objects
// ---------------------------------------------------------------------------

export interface HttpRequest {
  getId(): string | null;
  getHost(): string;
  getPort(): number;
  getMethod(): string;
  getPath(): string;
  getQuery(): string;
  getUrl(): string;
  getHeaders(): Record<string, string>;
  getHeader(name: string): string | undefined;
  getBody(): string | null;
}

export interface HttpResponse {
  getId(): string | null;
  /** HTTP status code, e.g. 200, 404. */
  getCode(): number;
  getHeaders(): Record<string, string>;
  getHeader(name: string): string | undefined;
  getBody(): string | null;
  getRoundtripTime(): number;
  getCreatedAt(): number;
}

/** A mutable request spec used to construct outbound requests via sdk.requests.send(). */
export interface RequestSpec {
  method: string;
  host: string;
  port: number;
  tls: boolean;
  path: string;
  query?: string;
  headers?: Array<[string, string]>;
  body?: string;
}

// ---------------------------------------------------------------------------
// sdk.console
// ---------------------------------------------------------------------------

export interface SdkConsole {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

// ---------------------------------------------------------------------------
// sdk.events
// ---------------------------------------------------------------------------

export interface SdkEvents {
  /** Called for every proxied HTTP request. */
  onInterceptRequest(callback: (req: HttpRequest) => void | Promise<void>): void;
  /** Called for every proxied HTTP response. resp is undefined on connection errors. */
  onInterceptResponse(callback: (req: HttpRequest, resp?: HttpResponse) => void): void;
  /** Called when the active project changes. */
  onProjectChange(callback: () => void): void;
  /** Called when a Match & Replace rule is updated. */
  onCurrentRuleChange(callback: () => void): void;
  /** Called for each upstream request, allowing modification before sending. */
  onUpstream(callback: (req: RequestSpec) => RequestSpec | void): void;
}

// ---------------------------------------------------------------------------
// sdk.requests
// ---------------------------------------------------------------------------

export interface SearchOptions {
  /** HTTPQL query string, e.g. "host:example.com AND method:POST". */
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  request: HttpRequest;
  response?: HttpResponse;
}

export interface SdkRequests {
  /** Fetch a single HTTP entry by id. Returns undefined if not found. */
  get(id: string): Promise<{ request: HttpRequest; response?: HttpResponse } | undefined>;
  /** Search HTTP history. Returns matching entries. */
  search(opts?: SearchOptions): Promise<SearchResult[]>;
  /** Send an HTTP request and return the response. */
  send(spec: RequestSpec): Promise<{ response: HttpResponse }>;
}

// ---------------------------------------------------------------------------
// sdk.findings
// ---------------------------------------------------------------------------

export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface CreateFindingSpec {
  title: string;
  severity: FindingSeverity;
  description: string;
  /** Prevents duplicate findings. If a finding with this key exists, returns it. */
  dedupe_key?: string;
  /** Links the finding to an HTTP history entry. */
  entry_id?: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  dedupe_key?: string;
  entry_id?: string;
  created_at: number;
}

export interface ListFindingsOptions {
  limit?: number;
  offset?: number;
  severity?: FindingSeverity;
}

export interface SdkFindings {
  create(spec: CreateFindingSpec): Promise<Finding>;
  get(id: string): Promise<Finding | undefined>;
  list(opts?: ListFindingsOptions): Promise<{ findings: Finding[]; total: number }>;
  update(id: string, patch: Partial<CreateFindingSpec>): Promise<Finding>;
  /** Check whether a finding with the given dedupe_key already exists. */
  exists(dedupeKeyOrSpec: string | { dedupeKey: string }): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// sdk.storage
// ---------------------------------------------------------------------------

export interface SdkStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

// ---------------------------------------------------------------------------
// sdk.api  (backend <-> frontend bridge)
// ---------------------------------------------------------------------------

export interface SdkApi {
  /** Register a function callable from the frontend via sdk.backend.call(name, ...args). */
  register(name: string, fn: (...args: unknown[]) => unknown | Promise<unknown>): void;
  /** Send an event to the frontend. Received via sdk.backend.onEvent(). */
  send(event: string, ...args: unknown[]): void;
}

// ---------------------------------------------------------------------------
// sdk.env  (environment variables defined in Ogma Settings > Environment)
// ---------------------------------------------------------------------------

export interface SdkEnv {
  getVar(name: string): string | undefined;
}

// ---------------------------------------------------------------------------
// sdk.scope
// ---------------------------------------------------------------------------

export interface ScopePreset {
  id: string;
  name: string;
}

export interface SdkScope {
  getActive(): Promise<ScopePreset | null>;
  inScope(url: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// sdk.projects
// ---------------------------------------------------------------------------

export interface OgmaProject {
  id: string;
  name: string;
}

export interface SdkProjects {
  getCurrent(): Promise<OgmaProject | null>;
}

// ---------------------------------------------------------------------------
// sdk.replay
// ---------------------------------------------------------------------------

export interface ReplaySession {
  id: string;
  name: string;
}

export interface SdkReplay {
  getSessions(): Promise<ReplaySession[]>;
  getSession(id: string): Promise<ReplaySession | undefined>;
}

// ---------------------------------------------------------------------------
// sdk.meta
// ---------------------------------------------------------------------------

export interface SdkMeta {
  /** Returns the plugin's writable data directory path on disk. */
  path(): string;
}

// ---------------------------------------------------------------------------
// sdk.console (log alias)
// ---------------------------------------------------------------------------

export interface SdkLog {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

// ---------------------------------------------------------------------------
// sdk.settings
// ---------------------------------------------------------------------------

export interface SettingsFieldSpec {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  default?: string | number | boolean;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

export interface SettingsPageSpec {
  title: string;
  fields: SettingsFieldSpec[];
  onSave?: (values: Record<string, unknown>) => void | Promise<void>;
}

export interface SdkSettings {
  register(spec: SettingsPageSpec): void;
  get(key: string): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// OgmaBackendSdk  (the full sdk object passed to init())
// ---------------------------------------------------------------------------

export interface OgmaBackendSdk {
  console: SdkConsole;
  /** Alias for sdk.console. */
  log: SdkLog;
  events: SdkEvents;
  requests: SdkRequests;
  findings: SdkFindings;
  storage: SdkStorage;
  api: SdkApi;
  env: SdkEnv;
  /** Alias for sdk.env. */
  environment: SdkEnv;
  scope: SdkScope;
  projects: SdkProjects;
  replay: SdkReplay;
  meta: SdkMeta;
  settings: SdkSettings;
}
