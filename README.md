# 🎓 MLS Framework - Modular Learning System

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-purple?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

> **A powerful, modern learning management system built for the future of education.**

## ✨ Features

### 🎯 **Core Learning Features**

- **📚 Course Management** - Complete course structure with stages and lessons
- **🧠 Interactive Quizzes** - Multiple choice and single choice questions
- **📊 Progress Tracking** - Real-time learning progress and analytics
- **🏆 Achievement System** - Track completion rates and scores
- **👤 User Profiles** - Personalized learning dashboards

### 🔐 **Authentication & Security**

- **🔑 Secure Authentication** - Email/password with Supabase Auth
- **🛡️ Row Level Security** - Database-level security policies
- **🔄 Session Management** - Persistent login across devices
- **📧 Email Verification** - Secure account activation

### 📱 **Mobile-First Design**

- **📲 Native Mobile Apps** - iOS & Android via Capacitor
- **🌙 Dark Mode** - Beautiful dark theme by default
- **📏 Safe Area Support** - Native safe area handling
- **⚡ Fullscreen Experience** - Immersive mobile interface
- **📐 Responsive Design** - Perfect on all screen sizes

### 🚀 **Performance & Tech**

- **⚡ Next.js 15** - Latest React framework with Turbopack
- **🎯 Client-Side Architecture** - Optimized for mobile deployment
- **📦 Production Ready** - Webpack optimizations and code splitting
- **🔧 TypeScript** - Full type safety throughout
- **🎨 Modern UI** - TailwindCSS with custom components

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Browser   │    │  Next.js Server │
│   (Capacitor)   │◄──►│   (React SPA)   │◄──►│  (Production)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Supabase Backend      │
                    │  ┌─────────────────┐    │
                    │  │   PostgreSQL    │    │
                    │  │   Database      │    │
                    │  └─────────────────┘    │
                    │  ┌─────────────────┐    │
                    │  │ Authentication  │    │
                    │  │   & Security    │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **Supabase account**
- **Android Studio** (for mobile builds)
- **Xcode** (for iOS builds)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/mls-framework.git
cd mls-framework
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup

```bash
# Run the SQL setup file in your Supabase dashboard
# File: supabase-setup.sql
```

### 4. Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Production Build

```bash
npm run build
npm start
# Production server at http://localhost:3000
```

## 📱 Mobile Development

### Android Setup

```bash
# Add Android platform
npx cap add android

# Copy web assets
npx cap copy android

# Open in Android Studio
npx cap open android
```

### iOS Setup

```bash
# Add iOS platform
npx cap add ios

# Copy web assets
npx cap copy ios

# Open in Xcode
npx cap open ios
```

### Build APK

```bash
cd android
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease  # Production APK
```

## 🗄️ Database Schema

### Core Tables

- **`users`** - User profiles and authentication
- **`courses`** - Course information and metadata
- **`learning_stages`** - Individual lessons within courses
- **`quizzes`** - Quiz questions and answers
- **`user_quiz_progress`** - Quiz completion and scores
- **`user_learning_stage_progress`** - Stage completion tracking

### Key Features

- **Row Level Security (RLS)** on all tables
- **Automatic timestamps** for created_at/updated_at
- **Foreign key relationships** for data integrity
- **Optimized indexes** for performance

## 🎨 UI Components

### Custom Components

- **`Button`** - Consistent button styling
- **`Card`** - Content containers
- **`Input`** - Form inputs with validation
- **`CourseHeader`** - Course navigation
- **`QuizHeader`** - Quiz progress display
- **`ThemeToggle`** - Dark/light mode switcher

### Layout Components

- **`Header`** - Navigation and user menu
- **`Footer`** - Site information
- **`ConditionalHeader/Footer`** - Route-based visibility

## 📊 Progress Tracking

### Quiz Progress

```typescript
interface QuizProgress {
  score: number; // Percentage score
  is_completed: boolean; // Completion status
  attempts_count: number; // Number of attempts
  best_score: number; // Highest score achieved
  time_taken: number; // Time in minutes
  completed_at: string; // ISO timestamp
}
```

### Course Progress

- **Stages Completed** / Total Stages
- **Quizzes Completed** / Total Quizzes
- **Overall Progress** = (Completed Items) / (Total Items) × 100

## 🔧 Configuration

### Capacitor Config

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: "com.mls.app",
  appName: "mls-framework",
  webDir: "public",
  server: {
    url: "https://yourdomain.com", // Production URL
    cleartext: false,
  },
  plugins: {
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
      overlaysWebView: true, // Android fullscreen
    },
  },
};
```

### Next.js Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
};
```

### Web Deployment

1. **Build the app**: `npm run build`
2. **Deploy to hosting**:
   - **Vercel**: `vercel deploy`
   - **Netlify**: Connect GitHub repo
   - **Custom Server**: Upload `/.next` folder

### Mobile Deployment

1. **Update Capacitor config** with production URL
2. **Copy assets**: `npx cap copy android`
3. **Build APK**: `./gradlew assembleRelease`
4. **Sign APK** for Play Store
5. **Upload to stores**

## 📁 Project Structure

```
mls-framework/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── auth/           # Authentication routes
│   │   ├── course/         # Course pages
│   │   ├── courses/        # Course listing
│   │   ├── login/          # Login page
│   │   ├── profile/        # User profile
│   │   └── register/       # Registration
│   ├── components/         # React components
│   │   ├── auth/          # Auth components
│   │   ├── layout/        # Layout components
│   │   ├── quiz/          # Quiz components
│   │   └── ui/            # UI components
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── android/               # Android Capacitor project
├── ios/                   # iOS Capacitor project
├── public/               # Static assets
├── plans/                # Development documentation
└── supabase-setup.sql    # Database setup
```

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Supabase** - Backend as a Service
- **Capacitor** - Cross-platform mobile development
- **TailwindCSS** - Utility-first CSS framework
- **Vercel** - Deployment platform

## 📞 Support

- **Documentation**: [View Docs](https://github.com/yourusername/mls-framework/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/mls-framework/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mls-framework/discussions)

---

<div align="center">

[Demo](https://your-demo-url.com) • [Documentation](https://your-docs-url.com) • [Report Bug](https://github.com/yourusername/mls-framework/issues)

</div>
