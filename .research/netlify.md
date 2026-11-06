# Netlify Functions research (fetched 2026-11-06 from docs.netlify.com)

Sources: pages below, fetched directly (HTML and .md variants). Page dates: background fns "Last updated Jun 3, 2026"; edge limits "Sep 25, 2026".

## 1. Sync function timeouts and streaming
URL: https://docs.netlify.com/build/functions/configuration/ (defaults table) and https://docs.netlify.com/build/functions/api/ (streaming section)
- Synchronous execution limit: **60 seconds, "Configurable? No"**. There is no max-configurable timeout; the limit is fixed.
- Scheduled execution limit: 30 s. Background: 15 min.
- Streaming: return a `ReadableStream` as the `body` of the `Response`. Docs state: "Streaming functions have a 60-second execution limit and a 20 MB response size limit."
- **No 10-minute streaming limit appears in the current docs.** Nothing in the pages above mentions 10 minutes or plan-specific streaming limits. Streamed response payload is 20 MB, not configurable.
- Doc examples pass an OpenAI/Groq `res.body` straight through as `text/event-stream`.
- Memory: default 1024 MB; configurable 1024-4096 MB via `config.memory` or `config.vcpu`. The usage page says increasing memory is for Credit-based Pro/Enterprise plans.

## 2. Background functions
URL: https://docs.netlify.com/build/functions/background-functions/
- Available on Credit-based plans (Free, Personal, Pro) and Enterprise. Per https://docs.netlify.com/build/functions/usage-and-billing/ they are NOT available on Legacy plans except Enterprise.
- Runs up to **15 minutes**. Client gets an immediate empty **202**; the function cannot return data to the caller. Docs: "pass the result to a destination other than the originating client." No response streaming.
- Retries on error: one retry after 1 minute, another after 2 minutes.
- Naming: **new preferred way is `export const config = { background: true }`** (or `[functions.name] background = true` in netlify.toml). The `-background` filename suffix (e.g. `hello-background.mts`) is the legacy convention, still fully supported.
- Background request/response payload limit: 256 KB.

## 3. Payload limits and binary
URL: https://docs.netlify.com/build/functions/configuration/
- Buffered request/response payload: **6 MB** (not configurable). Streamed response: 20 MB. Background: 256 KB.
- Binary payloads (e.g. image uploads) are Base64-encoded, about 30% overhead, "effectively reducing the binary request payload size limit to 4.5 MB."
- So binary bodies (audio, multipart) work, but cap at about 4.5 MB per request. The docs do not describe a multipart-specific mechanism.

## 4. netlify.toml and env vars
URLs: https://docs.netlify.com/build/configure-builds/file-based-configuration/ ; https://docs.netlify.com/build/environment-variables/get-started/ ; https://docs.netlify.com/build/environment-variables/overview/
- `[build]`: `base`, `publish` (relative to base), `command`.
- `[functions]`: `directory` (default `netlify/functions`), `node_bundler = "esbuild"` (TypeScript always uses esbuild; `zisi` is the JS default), `external_node_modules`, `included_files`. Per-function blocks like `[functions."api_*"]`.
- SPA fallback (doc example): `[[redirects]] from="/*" to="/index.html" status=200`.
- `/api/*` mapping: the page I fetched has no exact `/.netlify/functions/:splat` example; its examples use the generic `from/to/status/force` fields and `:splat` (rewrites page, https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/, shows `/api/*  https://api.example.com/:splat  200`). The doc-preferred alternative is `export const config = { path: "/api/*" }` in the function (https://docs.netlify.com/build/functions/configuration/ Routing; supports URLPattern wildcards, `method`, `excludedPath`). Functions are always reachable at `/.netlify/functions/<name>`.
- Redirects are global, not scoped per deploy context.
- Node version for build: `NODE_VERSION` env var (in `[build.environment]` or `[context.X]`; sample uses `environment = { NODE_VERSION = "..." }`), `.node-version` or `.nvmrc` (these override the UI setting). URL: https://docs.netlify.com/build/configure-builds/manage-dependencies/
- Env var UI path: **Project configuration > Environment variables** (docs wording; the "Site configuration" label was not found in these pages). Set via UI, CLI (`env:set`, `env:import`) or API.
- Runtime availability: variables with scope **Functions** (default is all scopes) are available to Functions, Edge Functions and on-demand builders while they run. Variables declared in netlify.toml are available to builds only (per the comparison table), so secrets for functions must be set via UI/CLI/API. Redeploy after changing.
- Deploy previews: variables can have a different value per deploy context (Production, Deploy Previews, Branch deploys, Local dev, Preview server) and per-branch values. In toml: `[context.deploy-preview.environment]`. Netlify recommends the UI for secrets. toml settings override UI values of the same key.
- Shared (team-level) env vars need Pro or Enterprise.

## 5. Edge Functions limits
URL: https://docs.netlify.com/build/edge-functions/limits/
- CPU time per request: **50 ms** (excludes time waiting on fetches/responses).
- Response header timeout: **40 s**.
- Memory per set of deployed edge functions: 512 MB. Code size: 20 MB compressed.
- Streaming: the Edge API page (https://docs.netlify.com/build/edge-functions/api/) lists Streams API / `ReadableStream` as supported Web APIs. No separate body-streaming duration limit is listed.

## 6. Node.js versions
URL: https://docs.netlify.com/build/functions/configuration/ ("Node.js version for runtime")
- For functions deployed after May 15, 2023 the runtime matches the Node version used for the build, provided it is a valid AWS Lambda runtime not deprecating within two months. Otherwise **fallback default is Node.js 24**.
- Override with env var `AWS_LAMBDA_JS_RUNTIME` (e.g. `nodejs24.x`), set in UI/CLI/API only, not in netlify.toml. Any current AWS Lambda Node runtime is allowed.
- No fixed version list on Netlify's side; it follows the Lambda list: https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html

## 7. EU region / data residency
URL: https://docs.netlify.com/build/functions/configuration/ (Region section)
- Default region for new sites is `cmh` (US East, Ohio). Self-serve EU regions: **`dub` (Ireland), `fra` (Frankfurt), `lhr` (London)**. Support-assisted: `cdg` (Paris), `mxp` (Milan).
- Set site-wide in UI at **Cloud compute > Functions > Region**, then redeploy, or per function with `config.region = "fra"` (or `region = "fra"` in toml). Each function runs in exactly one region.
- The docs cite data-residency compliance as a reason to set a region. They state no price for it, and I found no plan restriction on the self-serve regions. Cost: not stated in the fetched pages.
- This pins function compute only. Edge Functions run at the edge globally, and the CDN is not region-pinned. I did not find a docs claim of full data residency.

## Implications for a Node API that calls an LLM for 5-60 s
- Hard ceiling is 60 s for both sync and streaming functions, not configurable. A 5-60 s call has no safety margin at the top. Use your own timeout (about 50 s) on the upstream call and return a clean error.
- Streaming does not extend the 60 s limit, and I found no 10-minute streaming limit in the docs. It helps perceived latency (SSE/token streaming) but not total duration.
- For work that could exceed about 50 s, use a background function (15 min, 202 response) and write the result to storage (e.g. Netlify Blobs or a DB). The client polls or is notified. Payload in is capped at 256 KB.
- Audio uploads: 6 MB buffered limit, about 4.5 MB for binary after Base64. Larger audio needs a presigned upload to external storage.
- Edge Functions' 50 ms CPU limit is fine for proxying (I/O wait is excluded), but the 40 s response header timeout makes them a poor fit for slow LLM calls.
- Use `fra` (or `dub`) for EU users and EU-hosted LLM endpoints; set it in the UI and redeploy.
- Keep LLM API keys as Functions-scoped env vars via the UI (not netlify.toml). Use a different value per deploy context for deploy previews.
- Set `node_bundler = "esbuild"`, `NODE_VERSION = "24"`, SPA fallback `/* -> /index.html 200`, and `config.path = "/api/*"` in the function.
