<p align="center">
  <a href="https://github.com/KaijinLab/ogma">
    <img src="https://raw.githubusercontent.com/KaijinLab/ogma/master/.github/banner.png" alt="Ogma" width="100%">
  </a>
</p>

<div align="center">

# @kaijinlab/ogma-sdk

### TypeScript type definitions for the Ogma plugin SDK.

<br/>

[![npm](https://img.shields.io/npm/v/@kaijinlab/ogma-sdk?style=for-the-badge&color=e8a44a)](https://www.npmjs.com/package/@kaijinlab/ogma-sdk)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-e8a44a?style=for-the-badge)](LICENSE)
[![Types](https://img.shields.io/badge/types-included-555555?style=for-the-badge)](index.d.ts)

<br/>

<a href="https://discord.gg/KpyamsWU3"><img src="https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
<a href="https://x.com/kaijinlab"><img src="https://img.shields.io/badge/Follow-%40kaijinlab-000000?style=for-the-badge&logo=x&logoColor=white" alt="X / Twitter"></a>

</div>

---

This package provides TypeScript type definitions for the [Ogma](https://github.com/KaijinLab/ogma) plugin SDK. It has no runtime code -- types only.

## Install

```bash
npm install --save-dev @kaijinlab/ogma-sdk
```

## Quick start

```typescript
import type { OgmaBackendSdk, HttpRequest, HttpResponse } from '@kaijinlab/ogma-sdk';

async function init(sdk: OgmaBackendSdk): Promise<void> {
  sdk.console.log('Plugin started');

  sdk.events.onInterceptResponse(function (req: HttpRequest, resp?: HttpResponse): void {
    if (!resp) return;

    const host = req.getHost();
    const status = resp.getCode();
    const ct = resp.getHeader('content-type') ?? '';

    sdk.console.log(`${status} ${host} -- ${ct}`);
  });
}

// Expose init to the Ogma runtime
(globalThis as unknown as Record<string, unknown>).init = init;
```

Build with [esbuild](https://esbuild.github.io/):

```bash
npx esbuild src/backend.ts --bundle --format=iife --platform=neutral \
  --external:@kaijinlab/ogma-sdk --outfile=dist/backend.js
```

The `--external:@kaijinlab/ogma-sdk` flag tells esbuild not to bundle this package. The SDK is types-only -- the actual implementation is provided by the Ogma runtime.

---

## SDK reference

### `sdk.console`

```typescript
sdk.console.log(message: string): void
sdk.console.warn(message: string): void
sdk.console.error(message: string): void
```

Logs appear in **Settings > Plugins > [your plugin] > Logs**.

---

### `sdk.events`

```typescript
sdk.events.onInterceptRequest(callback: (req: HttpRequest) => void | Promise<void>): void
sdk.events.onInterceptResponse(callback: (req: HttpRequest, resp?: HttpResponse) => void): void
sdk.events.onProjectChange(callback: () => void): void
sdk.events.onCurrentRuleChange(callback: () => void): void
sdk.events.onUpstream(callback: (req: RequestSpec) => RequestSpec | void): void
```

---

### `sdk.requests`

```typescript
// Fetch a single history entry
sdk.requests.get(id: string): Promise<{ request: HttpRequest; response?: HttpResponse } | undefined>

// Search HTTP history with HTTPQL
sdk.requests.search(opts?: { q?: string; limit?: number; offset?: number }): Promise<SearchResult[]>

// Send an outbound HTTP request
sdk.requests.send(spec: RequestSpec): Promise<{ response: HttpResponse }>
```

Requires the `send_requests` permission to call `sdk.requests.send()`.

---

### `sdk.findings`

```typescript
sdk.findings.create(spec: CreateFindingSpec): Promise<Finding>
sdk.findings.get(id: string): Promise<Finding | undefined>
sdk.findings.list(opts?: ListFindingsOptions): Promise<{ findings: Finding[]; total: number }>
sdk.findings.update(id: string, patch: Partial<CreateFindingSpec>): Promise<Finding>
sdk.findings.exists(key: string | { dedupeKey: string }): Promise<boolean>
```

Requires the `write_findings` permission. Calls to `sdk.findings.create()` must be made inside an event callback (`onInterceptRequest` or `onInterceptResponse`).

```typescript
interface CreateFindingSpec {
  title: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  dedupe_key?: string; // prevents duplicate findings per host/check
  entry_id?: string;   // links the finding to an HTTP entry
}
```

---

### `sdk.storage`

Persistent key-value store scoped to your plugin. Survives restarts.

```typescript
sdk.storage.get(key: string): Promise<string | null>
sdk.storage.set(key: string, value: string): Promise<void>
sdk.storage.delete(key: string): Promise<void>
sdk.storage.keys(): Promise<string[]>
sdk.storage.clear(): Promise<void>
```

---

### `sdk.api`

Bridge between your backend and frontend.

```typescript
// Register a function callable from the frontend
sdk.api.register(name: string, fn: (...args: unknown[]) => unknown | Promise<unknown>): void

// Send an event to the frontend
sdk.api.send(event: string, ...args: unknown[]): void
```

In the frontend, receive events with `sdk.backend.onEvent()` and call backend functions with `sdk.backend.call(name, ...args)`.

---

### `sdk.env`

Read environment variables defined in **Settings > Environment**.

```typescript
sdk.env.getVar(name: string): string | undefined
```

Requires the `read_env_vars` permission.

---

### `sdk.scope`

```typescript
sdk.scope.getActive(): Promise<ScopePreset | null>
sdk.scope.inScope(url: string): Promise<boolean>
```

---

### `sdk.projects`

```typescript
sdk.projects.getCurrent(): Promise<OgmaProject | null>
```

---

### `HttpRequest` methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getId()` | `string \| null` | History entry ID |
| `getHost()` | `string` | Hostname, e.g. `example.com` |
| `getPort()` | `number` | Port number |
| `getMethod()` | `string` | HTTP method |
| `getPath()` | `string` | URL path |
| `getQuery()` | `string` | Query string (without `?`) |
| `getUrl()` | `string` | Full URL |
| `getHeaders()` | `Record<string, string>` | All request headers |
| `getHeader(name)` | `string \| undefined` | Single header, case-insensitive |
| `getBody()` | `string \| null` | Request body |

### `HttpResponse` methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getId()` | `string \| null` | History entry ID |
| `getCode()` | `number` | HTTP status code |
| `getHeaders()` | `Record<string, string>` | All response headers |
| `getHeader(name)` | `string \| undefined` | Single header, case-insensitive |
| `getBody()` | `string \| null` | Response body |
| `getRoundtripTime()` | `number` | Round-trip time in milliseconds |
| `getCreatedAt()` | `number` | Unix timestamp (ms) |

---

## Plugin constraints

- **No `import` or `require`** in backend plugins. Bundle everything into a single file.
- **No `fetch` or `XMLHttpRequest`**. Use `sdk.requests.send()` for outbound requests.
- **No `localStorage`** in frontend plugins. Use `sdk.storage` for persistence.
- Backend script size limit: **256 KB**.

---

## Plugin permissions

Declare all permissions your plugin uses in `manifest.json`:

| Permission | Required for |
|------------|-------------|
| `write_findings` | `sdk.findings.create()`, `sdk.findings.update()` |
| `read_http_history` | `sdk.requests.search()`, `sdk.requests.get()` |
| `send_requests` | `sdk.requests.send()` |
| `ui_extension` | Any frontend entry point |
| `read_env_vars` | `sdk.env.getVar()` |

---

## Plugin examples

- [Request Counter](https://github.com/KaijinLab/awesome-ogma-plugins/tree/master/plugins/request-counter) -- minimal plain JavaScript plugin
- [Security Headers Checker](https://github.com/KaijinLab/awesome-ogma-plugins/tree/master/plugins/security-headers) -- TypeScript + esbuild

Browse the full registry: [awesome-ogma-plugins](https://github.com/KaijinLab/awesome-ogma-plugins)

---

## Contributing

Type corrections and additions are welcome. Open an issue or a pull request.

Before submitting, verify the types compile:

```bash
npx tsc --noEmit --strict --moduleResolution node index.d.ts
```

---

## License

[AGPL-3.0-only](LICENSE)
