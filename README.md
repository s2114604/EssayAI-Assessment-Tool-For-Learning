# EssayAI – AI-Powered Essay Assessment Platform

EssayAI is a full-stack web application designed to help teachers and students with essay writing, grading, and assignment tracking using Artificial Intelligence. It supports AI-based grading, AI-content detection, and multi-role access (Admin, Teacher, Student). This project is built using modern tools like React, Supabase, OpenAI, and Tailwind CSS.

🔗 Live Demo: https://graceful-sprite-a1a653.netlify.app

---

## 🚀 Key Features

- AI-powered grading using OpenAI API
- AI-content detection with Replicate API
- Role-based access for Super Admin, Teacher, and Student
- Submit essays via text or file upload (.pdf, .docx, .txt)
- Create and manage essay assignments
- View detailed grades and feedback per essay
- Essay status tracking: Submitted, Grading, Graded, Returned
- Real-time dashboards and progress reports
- Built-in database structure via Supabase

---

## 👥 User Roles and Demo Logins

You can try out the application using the following demo accounts:

| Role         | Email                 | Password     |
|--------------|-----------------------|--------------|
| Super Admin  | admin@school.edu      | password123  |
| Teacher      | teacher@school.edu    | demo123      |
| Student      | student@school.edu    | demo123      |

---

## 🧱 Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- React Hook Form, Framer Motion, React Router DOM

**Backend / Database**
- Supabase (PostgreSQL, API, RLS, File Storage)

**AI & Integrations**
- OpenAI (for AI essay grading)
- Replicate (for AI-content detection)

**Other Tools**
- ESLint, PostCSS, Lucide Icons, Chart.js

---

## 🛠 Prerequisites

Make sure you have these installed:
- Node.js (v18 or newer)
- npm (comes with Node)
- Git
- A Supabase account (free)
- API keys for OpenAI and Replicate (optional but recommended)

---

## 🧪 Getting Started (Local Setup)

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/essayai.git
cd essayai
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set Up Environment Variables**
```bash
cp .env.example .env
```

Then edit the `.env` file and update the values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_REPLICATE_API_TOKEN=your_replicate_token
VITE_APP_NAME=EssayAI
VITE_APP_VERSION=1.0.0
```

4. **Start the Development Server**
```bash
npm run dev
```

Open your browser at: http://localhost:5173

---

## 🧾 Database Setup (Supabase)

1. Go to https://supabase.com and create a new project
2. Get the API keys: Project URL and Anon Public Key
3. Paste these into your `.env` file
4. In Supabase → SQL Editor, run the SQL from the `DATABASE_SETUP.md`:
   - Create tables: users, essays, essay_grades, assignments, plagiarism_reports
   - Add Row Level Security (RLS) policies
   - Insert demo data (users, assignments)

If you don't have the SQL files, you can copy them from the documentation or ask for help.

---

## 🚀 Deployment Guide (Netlify)

To deploy the project online:

1. **Build the project**
```bash
npm run build
```

2. **Upload to Netlify**
- Go to https://netlify.com and sign in
- Create a new site → "Deploy manually"
- Drag & drop the `dist/` folder
- Or connect your GitHub repo for CI/CD

3. **Set environment variables in Netlify**
Add the same values from your `.env` under Netlify Site → Settings → Environment Variables.

4. You're live! 🎉

---

## 🗂 Project Folder Structure

```
src/
├── components/        # Reusable UI components
├── pages/             # Main pages and routes
├── store/             # Zustand stores (state)
├── lib/               # API utilities (OpenAI, Supabase, Replicate)
├── types/             # TypeScript interfaces and types
└── main.tsx           # Entry point
```

---

## 🧼 Linting

To check for code issues:

```bash
npm run lint
```

---

## ⚠️ Troubleshooting Tips

- Make sure the `.env` file has the correct keys
- Check browser console for Supabase or API errors
- Ensure you ran the SQL scripts in Supabase SQL Editor
- Use the in-app “Run Database Diagnostic” tool if login fails

---

## 🙋 Contributing

We welcome contributions! Here’s how to get started:

1. Fork this repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Push and open a pull request

---

## 📬 Contact & Support

If you encounter issues or have questions:
- Open an issue on this GitHub repository
- Ask the development team for help

---

Thank you for using EssayAI! 🙌
