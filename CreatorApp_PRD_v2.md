# CreatorApp – Full‑Build PRD (v2.1)

*Supersedes v2.0 — adds Multi‑Format Export, AI Enhancement, Publishing/Scheduling, and full Analytics stack*  
*Prepared: May 30 2025*

---

## 1  Purpose & Scope
Evolve **CreatorApp** MVP into a **complete AI‑powered content‑repurposing platform** that:

* **Automates** clip discovery, editing, formatting, and distribution.  
* **Optimises** posts via analytics, A/B tests, and AI recommendations.  
* **Scales** to agency workflows with white‑label branding and bulk processing.

---

## 2  Delta Analysis (v1.0 → v2.1)

| Feature Group | Present in MVP? | Status Now | v2.1 Action |
|---------------|-----------------|------------|-------------|
| Video upload & storage | ✔️ | Stable | Keep |
| Manual clip creation | ✔️ | Stable | Keep |
| **Auto‑clip generation** | ✖️ missing | **Add** |
| **Multi‑format export** (TikTok, Reels, Shorts, X, LinkedIn) | ✖️ | **Add** |
| **Smart cropping** (face/action/thirds/motion) | ✖️ | **Add** |
| **Captions, titles, hashtags, thumbnails** | ✖️ | **Add** |
| **Style templates** (brand colours, intro/outro, lower thirds, CTA) | ✖️ | **Add** |
| **Direct publishing APIs** (YT, TikTok, IG, X, LinkedIn) | ✖️ | **Add** |
| **Smart scheduler** (best time, calendar, batch, cross‑post) | ✖️ | **Add** |
| Basic dashboard stats | ✔️ minimal | Enhance to full analytics |
| **Performance tracking (views, engagement, A/B)** | ✖️ | **Add** |
| **AI recommendations** (length, style, trending) | ✖️ | **Add** |
| AI Script Writer | ✖️ | **Add** |
| Voice Cloning | ✖️ | **Add** |
| Trend Predictor | ✖️ | **Add** |
| Bulk processing (100+) | ✖️ partial | Extend |
| White‑label branding | ✖️ | Add |

---

## 3  Feature Details

### 3.1  Auto‑Clip Generation Engine
* FFmpeg slicing + AI scene & audio‑peak detection.  
* Outputs clips + JSON metadata.

### 3.2  **Multi‑Format Export**
* **Aspect presets**:  
  * TikTok / IG Reels / YT Shorts — 9:16  
  * Twitter/X — 16:9 or 1:1  
  * LinkedIn — 1:1 or 16:9  
* **Encoding pipeline:** FFmpeg filter graphs per preset.  
* **Smart Cropping:**  
  * Face detection (TensorFlow BlazeFace)  
  * Action tracking (Optical flow)  
  * Rule‑of‑Thirds heuristic  
  * Motion‑based framing (saliency map)  
* Generates ready‑to‑post MP4 + thumbnail per variant.

### 3.3  **AI Enhancement**
* Whisper transcription → SRT captions.  
* GPT‑4o → titles, descriptions, hashtag set (JSON).  
* Thumbnail generation via Cloudinary transformations + OpenAI vision to pick best frame.  
* **Style Templates:**  
  * Brand colours/fonts (Tailwind CSS classes)  
  * Intro/outro stingers (MP4 overlays)  
  * Lower thirds / CTA overlays (Lottie/json + FFmpeg burn‑in)

### 3.4  **Publishing & Scheduling**
* OAuth & API integrations: YouTube, TikTok, Instagram, Twitter/X, LinkedIn.  
* Unified **Content Calendar** with drag‑drop reschedule.  
* Best‑time analysis (per‑platform engagement heatmaps).  
* Batch & cross‑post logic.  
* Background worker posts media, tracks status, updates `ScheduledPost` table.

### 3.5  **Analytics & Optimisation**
* Ingest view, engagement, audience metrics via platform APIs.  
* **AnalyticsSnapshot** table for time‑series.  
* **A/B Testing:**  
  * Variants on title/thumbnail.  
  * Significance calc (Chi‑square, 95 % CI).  
* Dashboard widgets & charts (Recharts).

### 3.6  **AI Recommendations**
* Suggest clip length, style template, hashtags, post time.  
* Trending topics from Twitter trends & TikTok sounds.

### 3.7  **Content Generation Tools**
* **Script Writer** (GPT‑4o).  
* **Voice Clone** (ElevenLabs).  
* **Trend Predictor** (Python microservice).

### 3.8  **Scalability Features**
* **Bulk Pipeline:** Queue batches 100+ videos.  
* **White‑Label:** Workspace branding + custom domain.  
* **Role ACL:** Owner / Editor / Viewer.

---

## 4  Tech Stack Additions

| Layer | New Libs / Services |
|-------|---------------------|
| Media processing | `fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`, `opencv4nodejs`, `@tensorflow-models/blazeface` |
| AI | Whisper API, OpenAI GPT‑4o, ElevenLabs |
| Job queue | `bullmq`, `ioredis` |
| Publishing APIs | `googleapis` (YouTube), TikTok SDK, Meta Graph (IG), `twitter-api-v2`, LinkedIn REST |
| Scheduler | Node‑Cron tasks persisted in DB |
| Analytics | Platform API clients + CRON ingestion |
| Charts | `recharts` (already via Shadcn/ui) |
| Storage | Existing Cloudinary buckets plus `captions/`, `templates/`, `voice_clones/` |

---

## 5  Schema Additions

```prisma
model Template {
  id         Int      @id @default(autoincrement())
  workspaceId String
  name       String
  type       TemplateType
  data       Json
  createdAt  DateTime @default(now())
  workspace  Workspace @relation(fields:[workspaceId], references:[id])
}

enum TemplateType {
  INTRO
  OUTRO
  LOWER_THIRD
  CTA
}

model ScheduledPost {
  id           String   @id @default(cuid())
  clipId       Int
  platform     Platform
  scheduledFor DateTime
  status       PostStatus
  response     Json?
  createdAt    DateTime @default(now())
  clip         Clip     @relation(fields:[clipId], references:[id])
}

enum PostStatus {
  QUEUED
  POSTED
  FAILED
}
```

Run:

```bash
npx prisma migrate dev --name add_templates_and_scheduler
```

---

## 6  Key Services / Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/export/variants` | Generate multi‑format exports & smart crop |
| `POST /api/captions` | Whisper transcription & SRT upload |
| `POST /api/publish` | Schedule post to platform |
| `GET  /api/analytics/snapshots` | Time‑series data for charts |
| `POST /api/abtest/start` | Launch A/B test |
| `GET  /api/abtest/:id` | Retrieve results |

---

## 7  Milestones (Updated)

| Sprint | Deliverable | Duration |
|--------|-------------|----------|
| 0 | Queue infra & FFmpeg worker | 1 wk |
| 1 | Auto‑clip + AI analysis | 2 wks |
| 2 | **Multi‑format export + smart crop** | 2 wks |
| 3 | **Captions + AI metadata + style templates** | 2 wks |
| 4 | **Publishing APIs + Scheduler + Calendar UI** | 3 wks |
| 5 | **Analytics ingestion + A/B testing** | 2 wks |
| 6 | AI Recommendations + Script Writer + Voice Clone | 2 wks |
| 7 | Trend Predictor + Bulk & White‑Label + QA | 2 wks |

_Total ≈ 14 weeks._

---

## 8  Acceptance Criteria (Key)

* User can select a video → receive 9:16, 1:1, 16:9 variants with smart crop.  
* Captions, titles, hashtags auto‑generate and attach to clip records.  
* User schedules a post; worker publishes to platform and updates status.  
* Calendar shows scheduled & posted items with colour coding.  
* Dashboard charts display views/engagement; A/B results visible.  
* AI recommendations panel returns actionable suggestions.  
* Workspace branding updates propagate site‑wide.

---

## 9  Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Social‑API rate limits | Token caching, incremental backoff |
| Face detection performance | Cache embeddings, GPU worker nodes |
| Video processing cost | Batch, down‑scale intros, lifecycle rules |
| Platform policy changes | Versioned API adapters |

---

**End of PRD (v2.1)**  
*Project: **CreatorApp***