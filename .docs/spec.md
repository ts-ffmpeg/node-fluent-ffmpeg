# Native Async Migration, Node.js Support, and Compatibility Feedback Specification

- Status: Draft for review
- Date: 2026-06-28
- Target package: `@ts-ffmpeg/fluent-ffmpeg`
- Proposed delivery: compatible 2.x migration followed by a 3.0 runtime-policy change

## 1. Summary

The project currently depends on `async@0.2.x` for callback-flow orchestration. The dependency can be removed because the repository already requires Node.js 18 or newer, and all required behavior can be implemented with native promises, `async`/`await`, and `Promise.all`.

Removing `async` does not require raising the minimum Node.js version. The migration should therefore be delivered first as a backward-compatible 2.x change while retaining `node >=18`. A later 3.0 release should raise the minimum supported runtime to Node.js 22 and align CI with supported Node.js release lines.

The project must not collect runtime telemetry implicitly. Compatibility data should come from CI, prerelease testing, public-repository sampling, structured diagnostics, and user-submitted issue reports.

## 2. Goals

1. Remove the `async` runtime dependency without changing the public callback API.
2. Preserve current behavior on all Node.js versions declared by the package during the 2.x migration.
3. Establish an explicit, maintainable Node.js support policy.
4. Add end-to-end compatibility gates that exercise real FFmpeg and ffprobe processes.
5. Make unsupported-runtime and unsupported-feature failures actionable.
6. Collect useful compatibility feedback without automatic or undisclosed telemetry.

## 3. Non-goals

- Replacing the public callback/event API with a promise-only API.
- Rewriting all production modules in one change.
- Supporting Node.js versions older than the current `engines.node` declaration.
- Inferring exact user counts or runtime distribution from npm download counts.
- Uploading user environment, media paths, FFmpeg arguments, or logs automatically.
- Guaranteeing compatibility with every FFmpeg build, codec, operating system, or downstream application.

## 4. Current State

### 4.1 Runtime and CI

The package currently declares:

```json
{
  "engines": {
    "node": ">=18"
  }
}
```

The existing GitHub Actions matrix tests Node.js 18, 20, 22, 24, and 25 on Ubuntu. As of this specification, Node.js 18 and 20 are end-of-life, Node.js 25 is end-of-life, Node.js 22 and 24 are LTS releases, and Node.js 26 is the current release line.

### 4.2 `async` usage

Production code uses only two orchestration behaviors:

| Module | API | Responsibility | Native replacement |
| --- | --- | --- | --- |
| `lib/recipes.js` | `async.waterfall` | Screenshot metadata, timemark, filename, and size processing | Sequential `await` calls and local values |
| `lib/capabilities.js` | `async.waterfall` | Resolve FFmpeg, ffprobe, and flvtool paths | Sequential `await` calls with early return |
| `lib/capabilities.js` | `async.waterfall` | Validate formats and encoders | Sequential `await` calls |
| `lib/processor.js` | `async.waterfall` | Prepare an FFmpeg invocation | Sequential `await` calls |
| `lib/processor.js` | `async.each` | Run flvtool for multiple outputs | `Promise.all` with explicit child-process settlement |

Tests additionally use `async.each`, `async.map`, `async.series`, and `async.waterfall`. These can be replaced with promise-returning Mocha hooks/tests, sequential `await`, and `Promise.all`.

## 5. Node.js Support Decision

### 5.1 2.x policy

The 2.x line must retain:

```json
{
  "engines": {
    "node": ">=18"
  }
}
```

The native-async migration must not use APIs or syntax unavailable in Node.js 18. The migration is an internal implementation change and must not require downstream callers to adopt promises.

Support for Node.js 18 and 20 in 2.x is compatibility support, not an endorsement of using end-of-life runtimes in production. Documentation must state that these runtimes no longer receive security updates from Node.js.

### 5.2 3.0 policy

The next major release should declare:

```json
{
  "engines": {
    "node": ">=22"
  }
}
```

The 3.0 CI matrix should be:

| Node.js line | Role | Required result |
| --- | --- | --- |
| 22 | Minimum supported LTS | Must pass |
| 24 | Latest LTS | Must pass |
| 26 | Current release compatibility | Must pass before stable release; may be temporarily advisory only during initial enablement |

Odd-numbered and end-of-life Node.js releases should not remain in the required matrix. Users unable to upgrade beyond Node.js 18 or 20 can remain on the latest 2.x release.

### 5.3 Release semantics

- Removing `async` while preserving `node >=18` and the public API can ship in a 2.x minor release.
- Raising `engines.node` to `>=22` is a breaking compatibility-policy change and must ship in 3.0.
- The 2.x line should receive critical compatibility or security fixes for a documented transition period. Proposed period: six months after 3.0 general availability.

## 6. Native Async Migration Design

### 6.1 Compatibility boundary

Public methods that currently accept Node-style callbacks must continue to accept them with the same signature and error-first semantics. Internal promise functions should be wrapped at the module boundary:

```js
function settleWithCallback(promise, callback) {
  promise.then(
    function(value) { callback(null, value); },
    function(error) { callback(error); }
  );
}
```

The implementation must guarantee that a callback or terminal event is emitted no more than once.

### 6.2 Migration order

1. Add focused regression tests for existing success and failure behavior.
2. Convert path resolution in `lib/capabilities.js`.
3. Convert capability validation in `lib/capabilities.js`.
4. Convert preparation and flvtool fan-out in `lib/processor.js`.
5. Convert screenshot processing in `lib/recipes.js`.
6. Convert test helpers and tests.
7. Remove `async` from `dependencies` and regenerate the lockfile.

Each production module should be migrated in a separate reviewable commit or pull request when practical.

### 6.3 Required behavioral invariants

- Preserve error-first callback signatures.
- Preserve early termination after the first relevant error.
- Preserve ordered waterfall semantics where later work depends on earlier results.
- Preserve concurrent flvtool processing unless concurrency is intentionally changed and documented.
- Do not emit both `error` and `end` for the same command.
- Do not invoke callbacks twice when a child process emits both `error` and `exit`.
- Preserve cached executable-path behavior.
- Preserve FFmpeg argument ordering.
- Preserve stream backpressure and event behavior.

For child processes, settlement must use an explicit once-only guard because `error`, `exit`, and `close` may interact differently from a normal promise rejection.

## 7. Test and Release Gates

### 7.1 Test layers

The existing Mocha framework should be retained. Changing test runners is not required to remove `async` and would increase migration risk without adding coverage.

Required layers:

| Layer | Purpose | Execution |
| --- | --- | --- |
| Unit/contract tests | Argument generation, callbacks, error propagation, once-only settlement | Every pull request, full Node matrix |
| Real-process integration tests | FFmpeg/ffprobe discovery, spawn, metadata, streams, events | Every pull request, supported Node matrix |
| Package-consumer smoke test | Verify the packed npm artifact can be installed and required by a clean project | Every pull request on minimum Node and latest LTS |
| Dependency-upgrade E2E | Validate lockfile/dependency changes against representative media workflows | Dependabot/Renovate pull requests and manual upgrade pull requests |

### 7.2 Minimum E2E scenarios

1. Require the package from a clean installed tarball.
2. Locate FFmpeg and ffprobe through `PATH`.
3. Honor valid `FFMPEG_PATH` and `FFPROBE_PATH` values.
4. Fall back correctly when configured executable paths do not exist.
5. Probe a fixture and validate semantic metadata fields.
6. Transcode a short fixture to a deterministic container/codec combination.
7. Process file input to file output.
8. Process stream input to stream or file output.
9. Generate screenshots using fixed and percentage timemarks.
10. Validate `start`, `progress`, `stderr`, `error`, and `end` event behavior.
11. Validate missing executable and unsupported codec/format errors.
12. Validate process cancellation and timeout behavior.

Assertions should validate semantics such as stream presence, codec type, dimensions, duration tolerance, non-empty output, and event invariants. Binary media files should not be compared byte-for-byte because FFmpeg versions can produce different valid outputs.

### 7.3 Dependency upgrade gate

Any pull request changing a runtime dependency or lockfile resolution must pass:

```text
install with frozen lockfile
-> unit/contract tests
-> real FFmpeg integration tests
-> package tarball consumer test
-> supported Node.js matrix
```

For major dependency upgrades, the pull request must include:

- Upstream migration notes or changelog summary.
- APIs used by this repository.
- Known semantic changes relevant to those APIs.
- Test cases covering affected success and error paths.
- Rollback plan, normally reverting the dependency and lockfile changes.

### 7.4 CI changes by release line

During the 2.x native-async migration, CI should test Node.js 18, 20, 22, and 24. Node.js 25 should be removed. Node.js 26 may be added as an advisory job.

For 3.0, CI should test Node.js 22, 24, and 26. The workflow should record `node --version`, `ffmpeg -version`, and `ffprobe -version` in job output before running tests.

## 8. Runtime Compatibility Data

### 8.1 Available data

npm public download data can indicate download volume over time, but it cannot reliably identify unique users, actual executions, runtime versions, operating systems, CI installs, or successful use. It must not be used as evidence of a specific Node.js version distribution.

Useful indirect evidence includes:

- Sampling public dependent repositories and inspecting `engines`, CI matrices, and container images.
- Structured GitHub issue fields.
- GitHub Discussions or release-candidate surveys.
- Feedback from prerelease adopters.
- CI results from supported and candidate Node.js releases.

Any public-repository analysis must be described as a biased sample because it excludes private and unindexed projects.

### 8.2 Prerelease process

Breaking runtime-policy changes should be published under a prerelease tag before general availability:

```bash
npm publish --tag next
```

The prerelease announcement should state the minimum Node.js version, supported FFmpeg versions used in CI, known limitations, how to run diagnostics, and how to report a regression.

## 9. Diagnostics and Feedback

### 9.1 Telemetry policy

The library must not make network requests to collect usage or compatibility information during install, import, or execution. In particular, no `postinstall` telemetry is permitted.

If a future standalone CLI introduces telemetry, it must be separately specified and must be:

- Explicitly opt-in.
- Disabled by default.
- Documented with exact fields, endpoint, retention policy, and deletion process.
- Free of media paths, filenames, URLs, command arguments, environment variables, tokens, and media content.
- Non-blocking and unable to change command success or failure.

No telemetry implementation is included in this specification.

### 9.2 Diagnostic command

Provide a user-invoked diagnostic command or script. Proposed interface:

```bash
npx @ts-ffmpeg/fluent-ffmpeg diagnostics
```

If exposing a command from the library package is undesirable, publish a small dedicated package such as `@ts-ffmpeg/diagnostics` or provide `node ./node_modules/@ts-ffmpeg/fluent-ffmpeg/tools/diagnostics.js`.

Default output should contain:

- Package version.
- Node.js version.
- Operating system and architecture.
- Resolved FFmpeg and ffprobe availability.
- FFmpeg and ffprobe versions when available.
- A feature/capability summary relevant to the failure.
- A diagnostic schema version.

Default output must not contain:

- User media paths or filenames.
- Full environment variables.
- Credentials or URL query parameters.
- Unredacted command arguments.
- Media metadata unrelated to the reported capability.

The command must run locally and print to stdout. It must not upload results.

### 9.3 Structured errors

New errors should retain human-readable messages and expose stable diagnostic properties where possible:

```js
error.code = 'ERR_FFMPEG_NOT_FOUND';
error.runtime = {
  node: process.version,
  platform: process.platform,
  arch: process.arch
};
```

Candidate stable error codes:

- `ERR_UNSUPPORTED_NODE_VERSION`
- `ERR_FFMPEG_NOT_FOUND`
- `ERR_FFPROBE_NOT_FOUND`
- `ERR_FFMPEG_CAPABILITY_UNAVAILABLE`
- `ERR_FFMPEG_PROCESS_FAILED`
- `ERR_FFMPEG_PROCESS_TIMEOUT`

Raw stderr and command arguments may remain available to the application where required for compatibility, but documentation must warn users to review and redact them before publishing an issue.

### 9.4 Feature detection

Runtime capability detection should be preferred over version comparisons when a feature can be tested directly. Version checks remain appropriate for enforcing the package's minimum Node.js runtime.

For FFmpeg behavior, use capability queries such as available encoders, formats, and filters rather than assuming that a particular FFmpeg version includes a codec in every build.

### 9.5 GitHub issue form

Replace or supplement the current free-form issue template with a structured bug-report form requiring:

- Package version.
- Node.js version.
- FFmpeg and ffprobe versions.
- Operating system and architecture.
- File or stream input type.
- Minimal reproduction.
- Full error stack.
- Redacted diagnostic output.
- Whether the regression followed a dependency or package upgrade.
- Previous and current working versions, when known.
- Confirmation that paths, URLs, tokens, and media-sensitive data were redacted.

Issue forms should not require users to upload private media. A minimal synthetic fixture or reproduction script should be preferred.

## 10. Documentation Requirements

The following documentation changes are required before 3.0 general availability:

1. Supported Node.js versions and lifecycle policy.
2. Upgrade guide from 2.x to 3.x.
3. Diagnostics and bug-reporting guide.
4. FFmpeg build/version compatibility statement.
5. Security and privacy statement for logs and diagnostics.
6. A clear statement that npm download counts do not expose consumer runtime versions.

All repository documentation must follow the repository-level English-language rule in `AGENTS.md`.

## 11. Delivery Plan and Estimated Cost

| Work item | Estimate | Risk |
| --- | ---: | --- |
| Add regression tests for current callback behavior | 0.5-1 day | Medium |
| Migrate `lib/capabilities.js` | 0.5 day | Low |
| Migrate `lib/processor.js` | 0.5-1 day | Medium/High |
| Migrate `lib/recipes.js` | 0.5-1 day | Medium |
| Migrate tests and remove dependency | 0.5 day | Low |
| Add package-consumer and dependency-upgrade E2E gates | 1-2 days | Medium |
| Add diagnostics and stable error metadata | 1-2 days | Medium |
| Add issue form and support documentation | 0.5-1 day | Low |

Expected total: approximately 5-8 engineering days, excluding time needed to investigate pre-existing flaky FFmpeg tests.

## 12. Acceptance Criteria

The native-async migration is complete when:

- `async` is absent from runtime and development dependencies.
- The lockfile contains no direct `async` dependency for this package.
- Existing public callback signatures remain compatible.
- Each callback and terminal event is proven to settle no more than once.
- Unit, integration, E2E, and packed-consumer tests pass on Node.js 18, 20, 22, and 24.
- Tests exercise both success and failure paths affected by each removed `async` call.
- Real FFmpeg outputs are validated semantically.

The Node.js 3.0 policy change is complete when:

- `engines.node` is `>=22`.
- Required CI passes on Node.js 22, 24, and 26.
- Node.js 18 and 20 behavior is documented as remaining on 2.x.
- A prerelease has been available for compatibility feedback.
- Diagnostics and the structured issue form are available.
- Migration and lifecycle documentation is published.

## 13. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Promise conversion changes callback timing | Add ordering tests and avoid unnecessary synchronous settlement |
| Callback or event fires twice | Use once-only settlement guards and explicit regression tests |
| `Promise.all` changes failure handling | Define first-error and child-process cleanup behavior before conversion |
| FFmpeg output differs across versions | Assert semantic properties with tolerances, not binary equality |
| CI fixtures are codec-dependent | Use widely available codecs and print FFmpeg capabilities in CI |
| Raising Node.js minimum surprises users | Major release, prerelease tag, migration guide, and maintained 2.x transition window |
| Diagnostic logs disclose private data | Local-only diagnostics, minimal fields, redaction guidance, no automatic upload |
| Public repository sampling is misleading | Label it as directional evidence and do not infer exact user distribution |

## 14. Review Questions

1. Is Node.js 22 the correct minimum for 3.0, or should 3.0 temporarily retain Node.js 20 despite its end-of-life status?
2. Is a six-month 2.x transition window sufficient for downstream users?
3. Should Node.js 26 be a required or advisory CI job during the first 3.0 prereleases?
4. Should diagnostics live in the main package or a dedicated package?
5. Which FFmpeg versions and operating systems must be part of the release-blocking matrix?
6. Are stable structured error codes in scope for the async migration, or should they ship separately?

## 15. References

- Node.js release schedule: <https://nodejs.org/en/about/previous-releases>
- Node.js end-of-life policy: <https://nodejs.org/en/about/eol>
- npm package `engines` documentation: <https://docs.npmjs.com/cli/configuring-npm/package-json#engines>
- GitHub issue forms: <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates>
