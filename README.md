<div align="center">

# CareFlow
### Medical Operations Suite · نظام إدارة العيادات والمراكز الطبية

**Production-ready clinic & hospital operations platform**
لوحة تحكم متكاملة لإدارة العمليات الطبية اليومية

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 1. Project Overview

**CareFlow** is a full-stack medical operations platform that digitises the day-to-day workflow of clinics, medical centers and small-to-mid-size hospitals. It unifies patients, doctors, appointments, medical records, prescriptions, invoicing and reporting inside a single, role-aware dashboard — with complete bilingual support (Arabic + English) and a polished, clinical-grade UI.

CareFlow هو نظام تشغيل طبي متكامل مبني على Supabase و React، مصمم بعناية لاستبدال أوراق العمل التقليدية في العيادات والمستشفيات بواجهة رقمية موحّدة تدعم العربية أولاً، مع صلاحيات دقيقة لكل دور، وأمان على مستوى قاعدة البيانات.

---

## 2. Business Value

| المحور | القيمة |
|--------|-------|
| **كفاءة تشغيلية** | تقليل وقت الحجز والفوترة بنسبة تزيد عن 60% مقارنة بالأنظمة الورقية |
| **دقة البيانات** | سجل طبي مركزي لكل مريض مع ربط تلقائي بالمواعيد والوصفات |
| **أمان قاعدة البيانات** | Row Level Security (RLS) مفعّلة على كل جدول — كل دور يرى ما يخصّه فقط |
| **سرعة التبنّي** | واجهة عربية/إنجليزية كاملة مع RTL احترافي، بدون منحنى تعلم |
| **تكلفة منخفضة** | بنية تحتية بدون خادم (Supabase + Vercel) — تكلفة تشغيل شبه صفر حتى آلاف المستخدمين |
| **قابلية التوسّع** | بنية جدولية منفصلة تسمح بإضافة فروع/عيادات متعددة لاحقاً |

The platform is tailored for clinical administrators who need a trustworthy, audit-friendly control center, and for medical staff who need a fast, focused daily workspace.

---

## 3. Features

### Admin Workspace (لوحة الأدمن)
- لوحة قيادة تعرض KPIs التشغيلية (مواعيد اليوم، معدل الإنجاز، عدد الأطباء/المرضى، الفواتير)
- إدارة الأطباء والمرضى وفريق الاستقبال والإداريين مع إضافة/تعديل/حذف كامل
- إدارة الأقسام والتخصصات (27 تخصصاً طبياً مدعوماً بالعربية والإنجليزية)
- إدارة المواعيد والفواتير والسجلات الطبية من مكان واحد
- صفحة Activity Log لتتبع العمليات الحساسة
- **Backup & Export** — تصدير كل الجداول إلى JSON / CSV / Excel
- **PDF Reports** — تقارير جاهزة للطباعة لكل كيان (مواعيد، فواتير، سجلات)
- إعدادات النظام العامة

### Doctor Workspace (لوحة الطبيب)
- لوحة مخصّصة بالمرضى المرتبطين والمواعيد القريبة
- إدارة المواعيد (تحديث الحالات: scheduled/completed/cancelled)
- كتابة وإدارة السجلات الطبية والوصفات الدوائية
- عرض تاريخ كل مريض والتشخيصات السابقة

### Patient Workspace (لوحة المريض)
- حجز المواعيد مع أطباء حسب التخصص
- عرض السجلات الطبية والوصفات
- متابعة الفواتير والمدفوعات
- إدارة البروفايل الشخصي

### Receptionist Workspace (لوحة الاستقبال)
- تسجيل مرضى جدد بسرعة
- جدولة المواعيد وتأكيدها
- إدارة Check-in / Check-out اليومي
- إصدار ومتابعة الفواتير

### Cross-cutting Features
- **Notifications System** — إشعارات تلقائية عبر DB triggers (موعد جديد، تغيير حالة، فاتورة، سجل طبي) مع polling كل 30 ثانية، Badge للعدد غير المقروء، صفحة إشعارات كاملة
- **Bilingual Specialties** — كل تخصص يظهر بالعربي والإنجليزي في نفس الوقت
- **Global Search & Filters** على كل الجداول
- **Role-Based Access Control** على مستوى الصفحات + على مستوى قاعدة البيانات
- **Responsive Design** — يعمل بسلاسة على Desktop / Tablet / Mobile
- **Dark Theme** بهوية طبية احترافية

---

## 4. Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 + custom design tokens |
| UI Primitives | Radix UI (accessible, unstyled) |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod validation |
| Data fetching | `@tanstack/react-query` + custom Supabase hooks |
| Routing | React Router v6 |
| Charts | Recharts |
| PDF / Export | `html2pdf.js` · `xlsx` · `papaparse` |
| Icons | Lucide |
| Notifications | Sonner |

### Backend
| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL 15 (Supabase-managed) |
| Auth | Supabase Auth (email + password) |
| Authorization | PostgreSQL Row Level Security (RLS) |
| Business rules | PostgreSQL triggers + SECURITY DEFINER functions |
| Email | Resend SMTP (via Supabase Auth) |
| Storage | Supabase Storage (future-ready) |

### DevOps
| Layer | Technology |
|-------|-----------|
| Hosting | Vercel (auto-deploys from `main`) |
| Source Control | GitHub (feature-branch → PR → main) |
| CI | Vercel build previews on every PR |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (SPA)                            │
│  React · TypeScript · Tailwind · Framer Motion              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge                             │
│   Auth · PostgREST · Realtime · Storage · SMTP relay        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL (Supabase-managed)                │
│  ┌──────────┬──────────┬─────────────┬──────────────────┐   │
│  │ users    │ doctors  │ patients    │ appointments     │   │
│  │ invoices │ records  │ prescript.  │ notifications    │   │
│  │ depts    │ settings │ activity    │ ...              │   │
│  └──────────┴──────────┴─────────────┴──────────────────┘   │
│                                                               │
│   Row Level Security on every table                          │
│   Triggers: on_appointment_insert → notifications            │
│             on_invoice_insert     → notifications            │
│             on_record_insert      → notifications            │
└─────────────────────────────────────────────────────────────┘
```

### Key architectural decisions

- **Security lives in the database, not the client.** Every table has explicit RLS policies per role. The UI can be fully inspected without exposing any data the user isn't authorized to see.
- **SQL as source of truth for data contracts.** The `careflow-backend/` folder contains ordered SQL migrations (`02_schema`, `03_trigger`, `04_rls_policies`, `05_seed`, `06_notifications`, `07_admin_fix`) that describe the entire backend from scratch.
- **Role-aware routing.** Each role has its own page tree (`/admin`, `/doctor`, `/patient`, `/receptionist`) wrapped in a guard that redirects if the user's role doesn't match.
- **Admin-safe provisioning.** When an admin creates other users, the app saves and restores the admin's Supabase session around `signUp` to prevent identity switching (`src/lib/adminAuth.ts`).
- **Composable data hooks.** `useSupabaseQuery` is the single primitive; role overviews (`useAdminOverview`, `useDoctorOverview`, `usePatientOverview`) compose it and expose loading, data, and `profileMissing` signals in a unified shape.

---

## 6. UI / UX

CareFlow ships with a carefully crafted dark-mode design language inspired by modern medical SaaS dashboards.

- **Design tokens** — emerald / cyan / violet / amber / rose / indigo palette for clinical differentiation between metrics.
- **Per-tone visual identity** — every KPI card owns a distinct color, icon ring, accent bar, and hover behavior so the eye can parse data at a glance.
- **Medical grid pattern** — reusable `HeaderAuroraPattern` component renders a subtle medical-tech decoration on every page header (perpendicular line grid + dot lattice + corner glow pulse + horizontal scan drift). Opacity and motion are intentionally low-key so text always dominates.
- **Bilingual typography** — first-class Arabic with tuned line-height, proper RTL, and bilingual labels where it adds clarity (specialties, statuses).
- **Skeleton loaders** on every data surface — never a blank page, never a jittery pop-in.
- **Notifications** — a portal-rendered bell dropdown that escapes sidebar clipping, plus a dedicated notifications page.
- **Dialogs & forms** — Escape-to-close, focus trapping, and Zod-backed validation.
- **Empty states** with illustrations and calls-to-action instead of blank tables.
- **Motion** — Framer Motion used sparingly, always easing-in-out, always respecting `prefers-reduced-motion`.

---

## 7. Installation

### Prerequisites
- Node.js **≥ 20**
- npm **≥ 10** (or pnpm / yarn)
- A Supabase project (free tier is enough for development)

### 1) Clone & install

```bash
git clone https://github.com/aymantarek16/careflow-operations-suite.git
cd careflow-operations-suite
npm install
```

### 2) Configure environment
Create a `.env.local` file at the project root — see [Section 8](#8-environment-variables).

### 3) Provision the database
Open Supabase → SQL Editor and run the files inside `careflow-backend/` **in order**:

```
02_schema.sql          -- tables, indexes, FKs
03_trigger.sql         -- updated_at triggers
04_rls_policies.sql    -- helper fns + RLS per table
05_seed.sql            -- departments + default admin (optional)
06_notifications.sql   -- notifications table + triggers
07_admin_fix.sql       -- admin → users insert policy
```

### 4) Run locally

```bash
npm run dev           # Vite dev server on http://localhost:5173
npm run build         # production build to /dist
npm run preview       # preview the production build
npm run test          # run the Vitest suite
npm run lint          # ESLint across the repo
```

### 5) Deploy
Any Node-aware host works. The project is currently deployed on **Vercel** with zero configuration — the default `vercel.json` redirects all unknown routes to `index.html` so client-side routing keeps working after refresh.

---

## 8. Environment Variables

Create `.env.local` (already in `.gitignore`) with the following variables:

```bash
# ─── Supabase ──────────────────────────────────────────────
# Project URL — Dashboard → Project Settings → API → Project URL
VITE_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"

# Anon public key — Dashboard → Project Settings → API → anon/public
# Safe to expose; RLS does the real authorization.
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

Both variables are read at build time by Vite and injected into the client bundle. Never commit a Supabase **service role** key — it bypasses RLS.

For email deliverability (recommended in production), configure a custom SMTP provider such as [Resend](https://resend.com) inside Supabase → Authentication → SMTP Settings.

---

## 9. Future Improvements

- [ ] **Multi-tenant** support (branches / multiple clinics per account)
- [ ] **Realtime** updates via Supabase channels (replace the 30s polling on notifications)
- [ ] **Lab results & imaging** module with file attachments (Supabase Storage)
- [ ] **SMS / WhatsApp** appointment reminders
- [ ] **Payment integration** (Stripe / Fawry / Paymob)
- [ ] **Telemedicine** — embedded video consultation with session logs
- [ ] **Advanced analytics** — doctor performance, revenue breakdown, patient retention cohorts
- [ ] **Mobile app** — React Native client sharing the same Supabase backend
- [ ] **Audit log UI** — visualise `activity_logs` with filters and exports
- [ ] **Role cloning / custom roles** beyond the four built-in ones
- [ ] **2FA** for admin accounts
- [ ] **Automated database backups** to external storage (S3)

---

## 10. License / Usage

© 2026 CareFlow. All rights reserved.

This project is licensed for **commercial use** by the rightful owner. Deployment, modification, and redistribution for production purposes require explicit written permission from the author.

هذا المشروع **مرخّص للاستخدام التجاري** من قِبَل صاحبه. يُسمح بنشره وتعديله واستخدامه في بيئات الإنتاج بعد الحصول على إذن كتابي من المطوّر.

For licensing, commercial deployment, or white-labeling inquiries:

**Ayman Tarek** — [aymantarek16@gmail.com](mailto:aymantarek16@gmail.com)
GitHub · [@aymantarek16](https://github.com/aymantarek16)

---

<div align="center">

Built with care for the healthcare community.
صُنع بعناية لخدمة القطاع الطبي.

</div>
