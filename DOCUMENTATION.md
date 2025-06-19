# EssayAI - Comprehensive Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [User Roles & Features](#user-roles--features)
10. [API Integrations](#api-integrations)
11. [Database Schema](#database-schema)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Development Guidelines](#development-guidelines)

## 📖 Overview

EssayAI is a comprehensive automated essay assessment platform that leverages artificial intelligence to provide detailed feedback and grading for student essays. The platform supports multiple user roles (Super Admin, Teacher, Student) and offers features like AI-powered grading, plagiarism detection, AI content detection, and comprehensive analytics.

### Key Features
- **AI-Powered Essay Grading**: Automated evaluation using advanced AI models
- **Plagiarism Detection**: Integration with external APIs for similarity checking
- **AI Content Detection**: Identify potentially AI-generated content
- **Multi-Role Support**: Super Admin, Teacher, and Student roles with different permissions
- **File Upload Support**: Support for .docx, .pdf, .txt files up to 10MB
- **Real-time Analytics**: Comprehensive dashboards and reporting
- **Assignment Management**: Teachers can create and manage assignments
- **Grade Analytics**: Detailed breakdown by criteria with improvement suggestions

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Framer Motion** - Animation library for smooth transitions
- **React Router DOM** - Client-side routing
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling and validation
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library
- **Chart.js & Recharts** - Data visualization

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication (custom implementation)
  - File storage
  - Edge functions support

### AI & External Services
- **OpenAI API** - Essay grading and analysis (optional)
- **Replicate API** - AI content detection
- **Turnitin API** - Plagiarism detection (optional)

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🏗 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │  External APIs  │
│   (React/Vite)  │◄──►│   (Database)    │    │                 │
│                 │    │                 │    │  - OpenAI       │
│  - Dashboard    │    │  - PostgreSQL   │    │  - Replicate    │
│  - Essays       │    │  - Auth         │    │  - Turnitin     │
│  - Assignments  │    │  - Storage      │    │                 │
│  - Reports      │    │  - RLS          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Optional (for full functionality)
- **Supabase account** (free tier available)
- **OpenAI API key** (for AI grading)
- **Replicate API token** (for AI detection)
- **Turnitin API access** (for plagiarism detection)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd automated-essay-assessment
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Supabase Configuration (Required for database)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional - for AI grading)
VITE_OPENAI_API_KEY=your_openai_api_key

# Replicate Configuration (Optional - for AI detection)
VITE_REPLICATE_API_TOKEN=your_replicate_api_token

# Turnitin Configuration (Optional - for plagiarism detection)
VITE_TURNITIN_API_KEY=your_turnitin_api_key
VITE_TURNITIN_API_URL=your_turnitin_api_url

# Application Configuration
VITE_APP_NAME=EssayAI
VITE_APP_VERSION=1.0.0
```

## 🗄 Database Setup

### Option 1: Using Supabase (Recommended)

#### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in project details:
   - **Name**: EssayAI Database
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
5. Wait for project creation (2-3 minutes)

#### Step 2: Get Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### Step 3: Update Environment Variables
Update your `.env` file with the actual Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

#### Step 4: Run Database Migrations
1. In your Supabase dashboard, go to **SQL Editor**
2. Run the migration files in order (copy and paste each file):
   - `supabase/migrations/20250615112442_fierce_spire.sql` (Users table)
   - `supabase/migrations/20250615112456_misty_snowflake.sql` (Essays table)
   - `supabase/migrations/20250615112509_wild_mouse.sql` (Essay grades table)
   - `supabase/migrations/20250615112520_bronze_waterfall.sql` (Plagiarism reports table)
   - `supabase/migrations/20250615200445_fancy_night.sql` (Assignments table)
   - `supabase/migrations/20250617124602_nameless_band.sql` (Demo data)

### Option 2: Local PostgreSQL Setup

If you prefer to run PostgreSQL locally:

#### Step 1: Install PostgreSQL
```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

#### Step 2: Create Database
```bash
# Create database
createdb essayai_db

# Create user (optional)
psql -d essayai_db -c "CREATE USER essayai_user WITH PASSWORD 'your_password';"
psql -d essayai_db -c "GRANT ALL PRIVILEGES ON DATABASE essayai_db TO essayai_user;"
```

#### Step 3: Run Migrations
```bash
# Run each migration file in order
psql -d essayai_db -f supabase/migrations/20250615112442_fierce_spire.sql
psql -d essayai_db -f supabase/migrations/20250615112456_misty_snowflake.sql
# ... continue with all migration files
```

#### Step 4: Update Environment Variables
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

## 🔧 Environment Configuration

### Required Environment Variables

#### Supabase (Database)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Optional Environment Variables

#### OpenAI (AI Grading)
```env
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

#### Replicate (AI Detection)
```env
VITE_REPLICATE_API_TOKEN=r8_your-replicate-token
```

#### Turnitin (Plagiarism Detection)
```env
VITE_TURNITIN_API_KEY=your_turnitin_key
VITE_TURNITIN_API_URL=https://api.turnitin.com
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:5173
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting
```bash
# Run ESLint
npm run lint
```

## 👥 User Roles & Features

### Super Administrator
**Default Login**: admin@school.edu / password123

**Capabilities**:
- Complete user management (create, edit, delete users)
- System-wide analytics and monitoring
- Teacher and student assignment management
- Access to all essays and assignments
- System configuration and settings

### Teacher
**Default Login**: teacher@school.edu / demo123

**Capabilities**:
- View and grade student essays (AI or manual grading)
- Manage assigned students
- Create and manage assignments
- Generate progress reports
- Run plagiarism and AI content checks
- Access student analytics

### Student
**Default Login**: student@school.edu / demo123

**Capabilities**:
- Submit essays via file upload or text editor
- View grades and detailed AI feedback
- Track assignment progress
- Access personal analytics
- View assignment instructions and deadlines

## 🔌 API Integrations

### OpenAI Integration (Optional)
Used for AI-powered essay grading with detailed feedback.

**Setup**:
1. Create an OpenAI account at [platform.openai.com](https://platform.openai.com)
2. Generate an API key
3. Add to `.env` file as `VITE_OPENAI_API_KEY`

**Features**:
- Comprehensive essay analysis
- Criterion-based scoring (Grammar, Cohesion, Structure, Tone, Organization)
- Detailed feedback and improvement suggestions

### Replicate Integration (AI Detection)
Used for detecting AI-generated content in essays.

**Setup**:
1. Create a Replicate account at [replicate.com](https://replicate.com)
2. Generate an API token
3. Add to `.env` file as `VITE_REPLICATE_API_TOKEN`

**Features**:
- AI probability detection
- Confidence scoring
- Detailed analysis reports

### Turnitin Integration (Optional)
Used for plagiarism detection and similarity checking.

**Setup**:
1. Contact Turnitin for API access
2. Obtain API credentials
3. Add to `.env` file

**Features**:
- Similarity percentage calculation
- Source identification
- Detailed plagiarism reports

## 🗃 Database Schema

### Core Tables

#### Users
```sql
- id (uuid, primary key)
- email (text, unique)
- password (text)
- full_name (text)
- role (super_admin | teacher | student)
- phone (text, optional)
- address (text, optional)
- avatar_url (text, optional)
- teacher_id (uuid, optional) - For students, references users(id)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Essays
```sql
- id (uuid, primary key)
- title (text)
- content (text, optional)
- file_url (text, optional)
- file_name (text, optional)
- file_size (integer, optional)
- student_id (uuid) - References users(id)
- assignment_id (uuid, optional) - References assignments(id)
- submitted_at (timestamp)
- status (submitted | grading | graded | returned)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Essay Grades
```sql
- id (uuid, primary key)
- essay_id (uuid) - References essays(id)
- total_score (integer)
- max_score (integer)
- criteria_scores (jsonb) - Breakdown by criteria
- feedback (text)
- detailed_feedback (jsonb) - Detailed feedback by criteria
- graded_by (ai | teacher)
- teacher_id (uuid, optional) - References users(id)
- graded_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Assignments
```sql
- id (uuid, primary key)
- title (text)
- description (text)
- instructions (text, optional)
- due_date (timestamp)
- max_score (integer)
- teacher_id (uuid) - References users(id)
- file_url (text, optional)
- file_name (text, optional)
- file_size (integer, optional)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Plagiarism Reports
```sql
- id (uuid, primary key)
- essay_id (uuid) - References essays(id)
- similarity_percentage (integer)
- sources (jsonb) - Array of matched sources
- status (checking | completed | failed)
- checked_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist/` folder to Netlify:
   - Drag and drop the `dist/` folder to Netlify
   - Or connect your GitHub repository for CI/CD

3. Set environment variables in Netlify dashboard:
   - Add all the variables from your `.env` file

### Backend Deployment (Supabase)

Supabase is already hosted, so no additional deployment is needed for the backend.

## 🔧 Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check your Supabase credentials in `.env` file
2. Ensure your Supabase project is active
3. Run the database diagnostic tool:
   - Log in to the application
   - If connection issues are detected, click "Run Database Diagnostic"
   - Review the diagnostic results

### Authentication Issues

If you have trouble logging in:

1. Ensure the demo users were inserted into the database
2. Verify the password matches what you set
3. Check browser console for error messages
4. Try the default credentials:
   - Admin: admin@school.edu / password123
   - Teacher: teacher@school.edu / demo123
   - Student: student@school.edu / demo123

### API Integration Issues

If AI grading or detection isn't working:

1. Check your API keys in the `.env` file
2. Verify API service status (OpenAI, Replicate, Turnitin)
3. Check browser console for specific error messages
4. The system will fall back to simulated AI grading if API keys are missing

## 💻 Development Guidelines

### Project Structure
```
src/
├── components/      # Reusable UI components
│   ├── admin/       # Admin-specific components
│   ├── assignment/  # Assignment-related components
│   ├── auth/        # Authentication components
│   ├── essay/       # Essay-related components
│   ├── grading/     # Grading-related components
│   ├── layout/      # Layout components (Navbar, Sidebar)
│   └── ui/          # Basic UI components (Button, Card, etc.)
├── lib/             # Utility functions and API integrations
│   ├── openai.ts    # OpenAI integration for grading
│   ├── replicate.ts # Replicate integration for AI detection
│   └── supabase.ts  # Supabase client and utilities
├── pages/           # Page components
│   └── dashboards/  # Dashboard variants by role
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
└── main.tsx         # Application entry point
```

### State Management
The application uses Zustand for state management with the following stores:
- `authStore` - Authentication state and user information
- `userStore` - User management (admin functions)
- `essayStore` - Essay submission, grading, and analysis
- `assignmentStore` - Assignment creation and management

### Adding New Features
When adding new features:
1. Create necessary components in the appropriate folders
2. Update state management if needed
3. Add routes in `App.tsx` if creating new pages
4. Update types in `types/index.ts` if adding new data structures
5. Follow the existing patterns for API calls and error handling

### Styling Guidelines
- Use Tailwind CSS utility classes for styling
- Follow the color scheme defined in `tailwind.config.js`
- Use Framer Motion for animations
- Use Lucide React for icons


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team