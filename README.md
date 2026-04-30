# 🚀 WorkPilot — Collaborative Project Workspace

A full-stack collaborative **Collaborative Project Management** web application where users can create/join projects, assign tasks, and track progress. Built as a simplified version of tools like Trello or Asana.

## 📸 Features

- **User Authentication** — Signup & Login with JWT-based secure auth
- **Project Management** — Create projects, manage teams (Admin/Member roles)
- **Task Management** — Create, assign, and track tasks with Kanban board
- **Dashboard** — Overview with stats: total tasks, by status, by priority, per user, overdue tasks
- **Role-Based Access** — Admins manage everything; Members update their assigned tasks

## 🛠️ Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Frontend   | React 18 + Vite        |
| Styling    | Vanilla CSS (Dark UI)  |
| Backend    | Node.js + Express      |
| Database   | MongoDB + Mongoose     |
| Auth       | JWT + bcrypt           |
| Deployment | Railway                |

## 📁 Project Structure

```
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Layout, reusable components
│   │   ├── pages/          # Dashboard, Projects, ProjectDetail, Login, Register
│   │   ├── context/        # AuthContext (JWT token management)
│   │   └── services/       # Axios API service layer
│   └── index.html
├── server/                 # Express Backend
│   ├── models/             # User, Project, Task (Mongoose schemas)
│   ├── routes/             # Auth, Project, Task routes
│   ├── controllers/        # Business logic
│   ├── middleware/          # JWT auth middleware
│   └── server.js           # Entry point
├── package.json            # Root scripts
└── README.md
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd workpilot
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Configure Environment Variables
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/workpilot?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 4. Run in Development Mode
In two terminal windows:
```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | Search users |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/project/:projectId` | Get project tasks |
| GET | `/api/tasks/:id` | Get single task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |
| GET | `/api/tasks/dashboard/stats` | Dashboard statistics |

## 👥 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| Create/Delete projects | ✅ | ❌ |
| Add/Remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Assign tasks | ✅ | ❌ |
| Edit all task fields | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| Delete tasks | ✅ | ❌ |
| View dashboard | ✅ | ✅ |

## 🔗 Live Application

- **Live URL**: [Deployed on Railway](<your-railway-url>)
