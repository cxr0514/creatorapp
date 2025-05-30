# CreatorApp – Unified PRD v3.0 (Complete)

---

## 1. Purpose & Scope

Transform CreatorApp from a video upload/clip MVP into a full-stack, AI-powered, multi-platform content repurposing platform. **Manual and AI workflows must both be present, fully integrated, and available to all users.**

---

## 2. Core Principles

* **Backward Compatibility:** Manual video and clip features (upload, trim, basic metadata, dashboard) remain usable and visible.
* **Extensible Automation:** All new AI, analytics, export, and workflow features layer on top, not replacing, the MVP foundation.
* **Multi-platform First:** Every feature must support creation, management, and deployment to all major content/social platforms.
* **Monetization Ready:** App is built with subscription/membership models in mind (pricing page, usage tiers, etc.).

---

## 3. Features

### 3.1 Manual Clip Creation – Redefined

* Users can:

  * **Select how many clips** to generate per source video (via UI, slider, or batch input)
  * **Select specific start/end points** for each clip (timeline scrubber)
  * **Choose aspect ratio** (9:16, 1:1, 16:9, etc.) for each clip
  * **Name** each clip and preview before saving
* **Clips saved with chosen names** both in cloud (Cloudinary) and UI state
* **Embedded player** for previewing all videos and clips on the spot

### 3.2 AI-Assisted Enhancement

* Optional AI (OpenAI API) features on any video/clip:

  * **Generate or improve description, title, hashtags** (all SEO-optimized, with manual override)
  * **Whisper/OpenAI** for automated captions/subtitles (SRT, VTT)
  * AI can suggest tags/metadata for discoverability
* All AI-generated metadata can be edited by user before saving

### 3.3 Multi-Format Export & Smart Cropping

* Users (manual or AI-driven):

  * **Export clips to platform-specific aspect ratios:**

    * TikTok, Instagram Reels, YouTube Shorts (9:16)
    * Twitter/X (1:1 or 16:9)
    * LinkedIn (1:1 or 16:9)
  * **Smart Cropping:**

    * Face detection, action tracking, rule of thirds, motion-based framing
    * Defaults to center if AI detection fails

### 3.4 Style Templates

* Brand color/font templates for overlays
* Upload/choose intro/outro animations, lower thirds, and CTA overlays
* Apply template presets to all exported clips

### 3.5 Direct Publishing & Scheduling

* API integration for posting to YouTube, TikTok, Instagram, X, LinkedIn
* **Smart Scheduler:**

  * Schedule deployments from clips (directly from their UI panels)
  * Scheduled posts show up in in-app calendar
  * Best time suggestions and batch/cross-posting
* **Workflow Builder:**

  * Users can create/save workflows (eg, "export + caption + cross-post to all platforms")
  * Saved workflows can be applied to future uploads/batches

### 3.6 Analytics, A/B Testing, and Recommendations

* KPI dashboards (views, engagement, audience, click-through, drop-off)
* **A/B test runner:** for title, thumbnail, and description variants
* Ingests and visualizes platform analytics (via API)
* AI-driven recommendations (optimal length, style, tags, trending topics)

### 3.7 Bulk Processing

* Queue-based processing for 100+ video jobs
* UI for managing, previewing, and error-handling of batch jobs

### 3.8 White-label/Agency Mode

* Workspaces, branding (logo, colors, custom domain), role-based ACL (Owner/Editor/Viewer)
* White-label settings per workspace

### 3.9 User Onboarding & Profile Management

* **Intake Form:** On first login, require full name, verified email
* **Profile:** Edit name, email, profile pic, preferences after account creation

### 3.10 Monetization & Pricing

* Dedicated pricing/subscription page (placeholder until pricing tiers provided)
* Subscription logic ready to enforce usage/feature gating later

---

## 4. Database & Infra (Prisma + More)

* Schema includes: User, Video, Clip, Workspace, UserWorkspace, AnalyticsSnapshot, Template, ScheduledPost, etc.
* All schema extensions are backward-compatible with MVP data
* Cloudinary for all media storage, including variants, templates, and AI outputs
* BullMQ/Redis for all async media jobs (auto-clip, export, AI, posting)

---

## 5. UI & UX

* **Dashboard is universal entry point** (no separate marketing splash page)
* Multi-tab: Uploads, Clips, Calendar, Analytics, Workflows, Profile, Pricing
* Modal interfaces for: Clip creation, AI metadata, scheduling, workflow save/apply
* Inline video player for all videos/clips
* Calendar widget for all scheduled deployments
* All new features (AI, batch, workflows) must be discoverable but do not remove manual/legacy flows

---

## 6. Testing & Quality Assurance

* Regression tests for all MVP workflows after each major feature add
* New feature integration/unit tests
* Platform posting/analytics tested against sandbox accounts
* Stress-test bulk pipeline (100+ jobs)

---

## 7. Acceptance Criteria

* User can create, name, and preview manual clips with full control
* AI metadata available on any video/clip, always editable
* Multi-format exports with smart cropping and manual fallback
* Templates, publishing, and scheduling all available via UI and API
* Workflow automation can be created, saved, and reused by user
* All analytics and recommendations widgets work with new and legacy content
* Pricing page present, profile management, user onboarding intact
* No regression to legacy upload/clip/dashboard features

---

## 8. Migration & Delivery

* Prisma migrations and scripts ensure all MVP data remains accessible
* .env keys for new APIs added without overwriting old keys
* Docs updated to reflect both old and new workflows
* Sprints and endpoints as per last roadmap, with explicit layering on MVP base

---

## 9. Admin Portal & User Management

### 9.1 Admin Dashboard

* **Access:** Only for app owner(s) and designated admin roles.
* **Features:**

  * View, search, filter, and export all users (active, suspended, pending, deleted)
  * View user profile and usage metrics (uploads, clip count, storage, recent activity)
  * Suspend/unsuspend, reset password, or delete user accounts
  * Grant/revoke admin or agency roles
  * Manual adjustment of account credits, subscriptions, or pricing tier
  * Impersonate a user session for support/troubleshooting
  * View audit logs of user actions and platform changes
  * Site-wide settings: email templates, integrations, feature flags
  * Bulk email or notification tool (for maintenance, feature updates, critical comms)

### 9.2 Issue & Support Management

* **Lockouts:** Admins can unlock user accounts and reset passwords
* **Email Tools:** Resend verification, password reset, and onboarding emails; manage user opt-ins
* **Credit Management:** Adjust or top up credits and resolve disputes
* **Activity/Audit Logs:** Track all admin and user actions for compliance and troubleshooting

---

## 10. Customer Support & Feedback

### 10.1 Help/Support Section

* **Accessible from main navigation**
* **Features:**

  * Intake form for users to submit support requests or contact us (name, email, subject, message, file upload option)
  * Assigns ticket ID and sends confirmation email to user
  * All support requests visible in admin dashboard with status (open, in-progress, closed)
  * Users can track the status of their ticket from their profile page
  * Optional knowledge base/FAQ section for self-service help

### 10.2 Review & Feedback Page

* **Public or authenticated access**
* **Features:**

  * Users can leave feedback/review for the app (star rating, comments)
  * Review form captures user, date, rating, comment, optional screenshot/file
  * Display aggregate rating and most recent feedback on a dedicated "Reviews" page
  * Admins can review, reply, or flag/remove inappropriate feedback



