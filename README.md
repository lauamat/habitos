# Habit Tracker

A comprehensive habit tracking application built with React, TypeScript, Vite, and Supabase.

## Features

- ✅ Create and manage daily habits
- 📊 Track completion with visual progress indicators
- 📈 Analytics dashboard with charts and insights
- 🏆 Achievement system with streak tracking
- 🎨 Dark/light theme support
- 📱 Responsive mobile-first design
- 🌐 Multi-language support (English/Spanish)
- 🔗 Share habits publicly with custom URLs
- 📤 Export analytics data
- 💬 Motivational quotes based on progress

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (Auth, Database, RLS)
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **State Management**: React Context API

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- (Optional) pnpm for faster package management

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/lauamat/habit-tracker.git
cd habit-tracker

# Install dependencies (choose one)
pnpm install  # Recommended
# or
npm install
```

### 2. Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project (or create a new one)
   - Go to Settings > API
   - Copy your Project URL and anon/public key

3. Update your `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

Run these SQL commands in your Supabase SQL Editor to set up the required tables and policies:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (run each table creation script from /supabase/tables/)
-- 1. profiles.sql
-- 2. habits.sql  
-- 3. habit_completions.sql
-- 4. motivational_quotes.sql
-- 5. user_share_settings.sql

-- Enable RLS and create policies (run script from /supabase/migrations/)
-- 1. enable_rls_and_policies.sql
-- 2. fix_share_settings_token_generation.sql
```

### 4. Development

```bash
# Start development server
pnpm dev  # or npm run dev

# Open http://localhost:5173
```

### 5. Build for Production

```bash
# Build the application
pnpm build  # or npm run build

# Preview the build locally
pnpm preview  # or npm run preview
```

## Deployment

### Deploy to Vercel

#### Option 1: Automatic Deployment (Recommended)

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/lauamat/habit-tracker.git
git push -u origin main
```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it as a Vite app

3. **Environment Variables**:
   - In Vercel project settings, go to "Environment Variables"
   - Add your environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

4. **Deploy**: Click "Deploy" and your app will be live!

#### Option 2: Manual Deployment via CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login and Deploy**:
```bash
vercel login
vercel --prod
```

3. **Set Environment Variables** (when prompted):
```
VITE_SUPABASE_URL: your-supabase-url
VITE_SUPABASE_ANON_KEY: your-supabase-anon-key
```

### Custom Domain Setup

1. **In Vercel Dashboard**:
   - Go to your project settings
   - Navigate to "Domains"
   - Add your custom domain: `habitos.lauraamat.com`

2. **DNS Configuration**:
   - Add a CNAME record pointing `habitos.lauraamat.com` to `cname.vercel-dns.com`
   - Or add an A record pointing to Vercel's IP addresses

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - Wait for DNS propagation (can take up to 24 hours)

## Project Structure

```
habit-tracker/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── auth/          # Authentication components
│   │   ├── habits/        # Habit management
│   │   ├── settings/      # App settings
│   │   ├── shared/        # Public sharing
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions & Supabase client
│   ├── App.tsx          # Main app component
│   └── main.tsx         # App entry point
├── supabase/            # Database schema and migrations
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
├── vercel.json          # Vercel deployment configuration
└── vite.config.ts       # Vite configuration
```

## Build Configuration

- **Build Command**: `npm run build` or `pnpm build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or higher
- **Package Manager**: npm or pnpm (both supported)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Your Supabase anonymous/public key |

## Database Schema

The application uses the following Supabase tables:

- **profiles**: User profiles and preferences
- **habits**: Habit definitions and settings
- **habit_completions**: Daily habit completion records
- **motivational_quotes**: Inspirational quotes for different scenarios
- **user_share_settings**: Public sharing configuration

## Available Scripts

- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build locally
- `lint`: Run ESLint

## Features Walkthrough

### 🎯 Habit Management
- Create habits with custom names, descriptions, and motivations
- Set frequency: daily, alternate days, or custom schedule
- Edit or delete habits anytime
- Toggle habits active/inactive

### 📊 Progress Tracking
- Visual progress indicators
- Weekly and monthly calendar views
- Completion streaks and statistics
- Quick completion toggle from dashboard

### 📈 Analytics Dashboard
- Success rate trends over time
- Habit-specific performance charts
- Most abandoned habits analysis
- Weekly/monthly progress summaries
- Export data as CSV or JSON

### 🏆 Achievements
- Streak milestones (3, 7, 14, 30 days)
- Success rate achievements (70%, 80%, 90%)
- Total completion badges
- Visual achievement indicators

### 🌐 Public Sharing
- Generate shareable public URLs
- Custom display names for sharing
- Privacy controls (public/private toggle)
- View other users' public habit progress

### 🎨 Customization
- Dark/light theme toggle
- English/Spanish language support
- Responsive design for mobile and desktop
- Customizable user profiles

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure `.env.local` exists and has correct values
   - Restart development server after adding env vars
   - Check that variables start with `VITE_`

2. **Supabase Connection Errors**:
   - Verify Supabase URL and anon key are correct
   - Ensure RLS policies are properly configured
   - Check Supabase project is not paused

3. **Build Failures**:
   - Run `rm -rf node_modules && npm install` to refresh dependencies
   - Ensure TypeScript has no errors: `npm run lint`
   - Check all environment variables are set in your deployment platform

4. **Vercel Deployment Issues**:
   - Verify `vercel.json` exists for SPA routing
   - Check build logs in Vercel dashboard
   - Ensure environment variables are set in Vercel project settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review Supabase documentation for database issues
3. Check Vercel documentation for deployment issues
4. Open an issue on GitHub

---

Built with ❤️ using React, TypeScript, Vite, and Supabase.
