# CareFlow Medical Operations

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.0-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase" alt="Supabase" />
</p>

<p align="center">
  <strong>نظام إدارة العمليات الطبية الشامل</strong>
</p>

<p align="center">
  نظام متكامل لإدارة المستشفيات والعيادات الطبية مع دعم متعدد المستخدمين (Admin, Doctor, Patient, Receptionist)
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [User Roles](#-user-roles)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Authentication & Authorization
- نظام مصادقة كامل باستخدام Supabase Auth
- أدوار متعددة: Admin, Doctor, Patient, Receptionist
- حماية المسارات حسب الدور (Protected Routes)

### 👨‍💼 Admin Dashboard
- **مركز القيادة**: إحصائيات وتحليلات شاملة
- **إدارة المرضى**: CRUD كامل مع بحث وتصفية
- **إدارة الأطباء**: إضافة وتعديل وحذف الأطباء
- **إدارة الأقسام**: إدارة التخصصات والأقسام
- **إدارة المواعيد**: حجز وتعديل وإلغاء المواعيد
- **الفواتير**: إدارة الفواتير والمدفوعات
- **سجل النشاط**: تتبع العمليات في النظام
- **الإعدادات**: تخصيص إعدادات النظام

### 👨‍⚕️ Doctor Portal
- **لوحة التحكم**: ملخص المواعيد والمرضى
- **السجلات الطبية**: إضافة وتعديل وحذف السجلات
- **الوصفات الطبية**: كتابة وإدارة الوصفات
- **المرضى المرتبطين**: عرض المرضى الخاصين بالطبيب

### 🧑‍⚕️ Patient Portal
- **لوحة التحكم**: ملخص الحساب والمواعيد
- **حجز مواعيد**: حجز مواعيد مع الأطباء
- **الملف الشخصي**: تعديل البيانات الشخصية
- **السجلات الطبية**: عرض السجلات والتشخيصات

### 🏥 Receptionist Portal
- **إدارة المرضى**: عرض والبحث في المرضى
- **إدارة المواعيد**: عرض وتصفية المواعيد
- **تسجيل الحضور**: تسجيل حضور المرضى
- **الفواتير**: إدارة الفواتير والمدفوعات

### 🎨 UI/UX Features
- **تصميم عصري**: واجهة مستخدم أنيقة باستخدام Tailwind CSS
- **Glassmorphism**: تأثيرات بصرية جذابة
- **Skeleton Loading**: تحميل تدريجي للبيانات
- **Empty States**: رسائل مناسبة للحالات الفارغة
- **Toast Notifications**: إشعارات فورية للعمليات
- **Confirm Dialogs**: تأكيد العمليات الحساسة
- **RTL Support**: دعم كامل للغة العربية

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (Auth + Database + Realtime) |
| **State Management** | React Query (TanStack Query) |
| **Routing** | React Router DOM v6 |
| **Notifications** | Sonner (Toast) |
| **Icons** | Lucide React |
| **Forms** | React Hook Form (optional) |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm أو yarn أو pnpm
- حساب Supabase

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "CareFlow Medical Operations"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   ثم أضف متغيرات Supabase الخاصة بك في ملف `.env`

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To obtain these values:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Go to Project Settings → API
4. Copy the `Project URL` and `anon public` key

---

## 📖 Usage

### Default Login Credentials

After setting up the database, you can create users through the Supabase dashboard or the application's signup feature.

### User Roles

The system automatically assigns roles based on the user's role in the database:

| Role | Permissions |
|------|-------------|
| **admin** | Full system access |
| **doctor** | Access to patient records and prescriptions |
| **patient** | Book appointments and view personal records |
| **receptionist** | Manage check-ins and view schedules |

---

## 👥 User Roles

### Admin
- إدارة كاملة للنظام
- إضافة/تعديل/حذف المستخدمين
- إدارة جميع البيانات

### Doctor
- عرض المرضى المرتبطين
- إدارة السجلات الطبية
- كتابة الوصفات الطبية
- إدارة المواعيد

### Patient
- حجز مواعيد جديدة
- عرض المواعيد السابقة
- تعديل البيانات الشخصية
- عرض السجلات الطبية

### Receptionist
- تسجيل حضور المرضى
- عرض المواعيد
- إدارة الفواتير

---

## 🗄 Database Schema

### Tables

- **users**: المستخدمين والمصادقة
- **patients**: بيانات المرضى
- **doctors**: بيانات الأطباء والتخصصات
- **departments**: الأقسام والتخصصات
- **appointments**: المواعيد
- **medical_records**: السجلات الطبية
- **prescriptions**: الوصفات الطبية
- **invoices**: الفواتير
- **activity_logs**: سجل النشاط
- **system_settings**: إعدادات النظام

---

## 📁 Project Structure

```
CareFlow Medical Operations/
├── src/
│   ├── components/
│   │   ├── auth/           # ProtectedRoute, RoleRoute
│   │   ├── layout/         # AppLayout, Sidebar
│   │   └── ui/             # Reusable UI components
│   │       ├── ConfirmDialog.tsx
│   │       ├── DataTable.tsx
│   │       ├── EmptyState.tsx
│   │       ├── GlassCard.tsx
│   │       ├── SkeletonTable.tsx
│   │       ├── StatCard.tsx
│   │       └── StatusBadge.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state
│   ├── hooks/
│   │   ├── useData.ts      # Data fetching hooks
│   │   └── useMutation.ts  # CRUD mutations with toast
│   ├── lib/
│   │   ├── helpers.ts      # Utility functions
│   │   ├── supabase.ts     # Supabase client
│   │   └── types.ts        # TypeScript types
│   ├── pages/
│   │   ├── admin/          # Admin pages
│   │   ├── doctor/         # Doctor pages
│   │   ├── patient/        # Patient pages
│   │   ├── receptionist/   # Receptionist pages
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide](https://lucide.dev/) for the icons
- [Tailwind CSS](https://tailwindcss.com/) for the styling

---

<p align="center">
  Made with ❤️ for the medical community
</p>

<p align="center">
  <strong>CareFlow</strong> - نظام إدارة العمليات الطبية
</p>
