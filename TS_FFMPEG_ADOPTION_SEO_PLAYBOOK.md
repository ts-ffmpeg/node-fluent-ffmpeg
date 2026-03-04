# ts-ffmpeg Adoption and SEO Playbook

This document summarizes:

1. The most common user needs behind `fluent-ffmpeg`.
2. How to help users switch smoothly to `@ts-ffmpeg/fluent-ffmpeg`.
3. SEO and content strategies (especially blogs) to capture demand from developers and anyone using FFmpeg, including teams building LLM or coding-agent workflows at scale.

---

## 1) Target audience

- Node.js developers using `fluent-ffmpeg`.
- TypeScript teams who want safer FFmpeg integrations.
- Product engineers building video/audio pipelines.
- AI/agent developers who need reliable, programmable FFmpeg execution.
- Technical founders and platform teams scaling many FFmpeg jobs.

---

## 2) Common user needs for fluent-ffmpeg users

These are the recurring "jobs to be done" users care about most.

| User need | Why users care | Opportunity for ts-ffmpeg |
| --- | --- | --- |
| Easy API instead of raw CLI flags | FFmpeg CLI is powerful but hard to memorize | Keep chainable API and provide typed method hints |
| Fast setup | Users want to process media in minutes, not days | Provide quickstart + copy-paste examples |
| Common workflows (transcode, resize, trim, merge, screenshots, metadata) | 80% of use cases repeat the same patterns | Publish recipe-first docs for popular workflows |
| Reliable error and progress handling | Production jobs fail for many reasons (codec, file corruption, path issues) | Provide clear error handling patterns and retry examples |
| Stream + file support | Apps often mix uploads, URLs, local files, and streams | Highlight stream-safe examples and caveats |
| Predictable migration path | Existing codebases cannot rewrite everything at once | Offer "drop-in compatible" migration guidance |
| Type safety and DX | Teams want autocomplete, safer refactors, fewer runtime mistakes | Emphasize bundled TypeScript definitions and IDE help |
| Operational scaling | Teams run hundreds or thousands of jobs | Document queue-based patterns, concurrency controls, and observability |
| LLM/agent-friendly invocation | AI agents need deterministic, guardrailed command generation | Provide structured wrappers and allowlisted operations |
| Maintainability and trust | Users avoid abandoned dependencies | Communicate active maintenance, roadmap, and issue response |

---

## 3) Smooth-switch solutions for migration

### A. Position ts-ffmpeg as "familiar API + better typing"

Core message:

> Keep the fluent-ffmpeg mental model, gain TypeScript-friendly development and a more maintainable path forward.

### B. Publish a migration guide with minimal friction

Recommended migration steps:

1. Replace dependency:
   - from `fluent-ffmpeg`
   - to `@ts-ffmpeg/fluent-ffmpeg`
2. Keep most chainable command code unchanged.
3. Add TypeScript checks (`tsc --noEmit`) to catch edge cases.
4. Run golden-file tests on representative media inputs.
5. Roll out behind a feature flag for production confidence.

### C. Provide side-by-side code examples

```ts
// Before
import ffmpeg from 'fluent-ffmpeg'

// After
import ffmpeg from '@ts-ffmpeg/fluent-ffmpeg'

ffmpeg('input.mp4')
  .videoCodec('libx264')
  .audioCodec('aac')
  .size('1280x720')
  .on('progress', (p) => console.log(p.percent))
  .on('error', (err) => console.error(err))
  .save('output.mp4')
```

### D. Offer "migration confidence assets"

- Compatibility checklist (API calls used by project).
- Troubleshooting page ("why this command fails").
- Test fixture pack (small media files + expected outputs).
- Example repo with CI showing successful conversion tasks.

---

## 4) LLM/coding-agent usage at larger scale

For teams that want agents to call FFmpeg safely and repeatedly, document these patterns:

1. **Intent-to-template mapping**  
   Map high-level intents ("trim to 30s", "extract audio", "thumbnail at 25%") to predefined command templates.

2. **Allowlisted operations**  
   Restrict agents to approved codecs, formats, flags, and input sources.

3. **Validation layer before execution**  
   Validate duration, dimensions, bitrate ranges, and output format before running FFmpeg.

4. **Job queue + worker pool**  
   Use queue systems (for example BullMQ/SQS workers) for retry logic, dead-letter handling, and throughput control.

5. **Observability-first runtime**  
   Track per-job logs, FFmpeg stderr parsing, duration, failure reasons, and output quality metrics.

6. **Idempotency + storage strategy**  
   Use deterministic output naming and content hashes to avoid duplicate processing.

7. **Security boundaries**  
   Sandbox process execution, cap resource usage, and prevent unsafe user-provided flags.

These patterns make ts-ffmpeg attractive not only as a library, but as a stable building block for agentic media infrastructure.

---

## 5) SEO strategy: how to capture migration demand

### A. High-intent keyword clusters

Focus on "switch" and "alternative" intent first.

| Cluster | Example keywords | Search intent | Best page type |
| --- | --- | --- | --- |
| Migration/alternative | `fluent-ffmpeg alternative`, `fluent-ffmpeg deprecated`, `replace fluent-ffmpeg` | Users need a new package | Migration guide + comparison page |
| TypeScript | `ffmpeg typescript`, `typed fluent-ffmpeg`, `node ffmpeg types` | Better DX and safety | Feature page + tutorial |
| Node workflows | `nodejs transcode video`, `ffmpeg node resize`, `ffmpeg screenshot node` | Implementation help | Recipe/tutorial posts |
| Scaling/media infra | `scale ffmpeg jobs`, `ffmpeg queue nodejs`, `video processing pipeline node` | Production architecture | Architecture blog + reference docs |
| AI/agents | `llm ffmpeg`, `agentic media pipeline`, `tool calling ffmpeg` | Agent workflow design | Thought leadership + technical blueprint |

### B. Content pillars

1. **Migration confidence** (from fluent-ffmpeg to ts-ffmpeg)
2. **Practical recipes** (copy-paste, task-focused)
3. **Scale and operations** (queues, retries, metrics)
4. **AI/agent execution** (safe tool-calling patterns)

### C. On-page SEO basics for each article

- Put the main keyword in:
  - title
  - first 100 words
  - H2 section
  - meta description
  - URL slug
- Add internal links to:
  - install page
  - migration guide
  - API reference
  - related recipe posts
- Add schema markup where useful (`Article`, `HowTo`, `FAQ`).
- Include runnable code snippets with expected output.
- End with one clear CTA ("Migrate now", "Try the example repo", etc.).

---

## 6) Blog strategy (practical topics)

### Priority blog post ideas (high conversion potential)

1. **"fluent-ffmpeg is deprecated: how to migrate safely to ts-ffmpeg"**
2. **"fluent-ffmpeg alternative for TypeScript teams"**
3. **"Drop-in migration guide: fluent-ffmpeg -> @ts-ffmpeg/fluent-ffmpeg"**
4. **"10 common FFmpeg tasks in Node.js (typed examples)"**
5. **"How to run FFmpeg jobs at scale with queues and workers"**
6. **"Building an LLM-safe FFmpeg tool: guardrails, templates, validation"**
7. **"Reliable video processing in Node.js: retries, timeouts, and observability"**
8. **"From one-off scripts to production media pipelines with ts-ffmpeg"**

### Supporting long-tail posts

- "How to generate thumbnails in Node.js with FFmpeg"
- "How to extract audio from video in TypeScript"
- "How to merge videos with fluent-style FFmpeg API"
- "How to track FFmpeg progress in Node.js"
- "How to probe media metadata with ffprobe in Node"
- "How to safely expose FFmpeg to coding agents"

---

## 7) Suggested 8-week content plan

Week 1-2:
- Publish migration page + one comparison post.
- Create one "start here" page for developers.

Week 3-4:
- Publish 3 recipe posts (transcode, screenshots, metadata).
- Add internal linking between recipes and migration guide.

Week 5-6:
- Publish scale/operations post (queue architecture).
- Publish AI-agent safety post (tool-calling + allowlist).

Week 7-8:
- Refresh top pages with FAQs from issues/discussions.
- Publish case study (before/after migration metrics).

---

## 8) Conversion and distribution tactics

### Conversion assets

- "Migration checklist" downloadable markdown.
- "Copy-paste starter repo" for Node + TypeScript.
- "Production hardening checklist" for FFmpeg workers.

### Distribution

- Share each post in:
  - GitHub Discussions
  - Dev.to / Hashnode / Medium cross-posts
  - relevant Reddit communities
  - X/LinkedIn threads with code snippets
- Turn one blog post into a short video demo.
- Repurpose troubleshooting Q&A into FAQ sections.

---

## 9) KPIs to track

Track outcomes, not only traffic:

- Organic clicks for migration keywords.
- Install growth of `@ts-ffmpeg/fluent-ffmpeg`.
- Click-through rate from blog -> migration guide.
- Migration-guide completion actions (copy command, starter repo clicks).
- Time-to-first-success for new users.
- Number of production/scaling users (queue/infra docs traffic).

---

## 10) Recommended next docs to add in this repo

1. `MIGRATION_GUIDE.md` (step-by-step, fluent-ffmpeg to ts-ffmpeg)
2. `RECIPES.md` (top 10 FFmpeg tasks)
3. `AGENT_SAFE_FFMPEG_PATTERNS.md` (LLM/coding-agent guardrails)
4. `SCALING_FFMPEG_JOBS.md` (queue, retry, observability blueprint)

