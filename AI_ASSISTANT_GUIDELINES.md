# 🧠 AI Assistant Guidelines

A permanent contract for any AI tool (Cursor, Claude, ChatGPT, Copilot, etc.) working in this repository.

---

## 1. Work With What Exists
- **Never** recreate or overwrite finished files without explicit instruction.
- Respect the established directory structure and naming conventions.

## 2. Maintain Context Awareness
- Read `progress.log` before acting to understand current status.
- Don’t request information already documented there.

## 3. Ask Before Large Changes
- Propose a plan before refactoring multiple files, adding dependencies, or generating new modules.

## 4. Keep Code Clean & Minimal
- Production‑ready, TypeScript‑safe, and consistent with existing patterns.
- Comment sparingly—only where it clarifies complex logic.

## 5. Stick to Tech Stack
- Frontend: Next.js (App Router) + Tailwind + shadcn/ui
- Backend: Next.js API routes with Prisma ORM (PostgreSQL)
- Storage: Cloudinary (`creator_uploads` namespace)
- Auth: NextAuth.js
- AI: OpenAI (titles, descriptions, thumbnails)

## 6. Stay Task‑Oriented
- Focus only on the explicit request or bug described.
- Do not introduce unrelated features on your own.

## 7. Output Style
- Prefer diffs or targeted snippets over full‑file dumps when feasible.
- Use markdown fenced blocks with language identifiers.

## 8. Testing & Validation
- Offer unit/integration tests for new logic where appropriate.
- Ensure new code doesn’t break TypeScript or `npm run build`.

## 9. If Uncertain, Ask
- Clarify ambiguous instructions before proceeding.

---

_This file should rarely change. Update only when project‑wide AI rules evolve._
