# WorkPilot

WorkPilot is a full-stack project workspace for managing teams, projects, tasks, and notifications. It uses a React frontend, an Express API, and MongoDB for data storage.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Auth: JWT
- Deployment: Railway

## Features

- User registration and login
- Project creation and member management
- Task assignment and status tracking
- Dashboard statistics
- Notification system for assignments, removals, completions, and updates

## Project Structure

```text
client/   React app
server/   Express API
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas database

## Local Setup

1. Clone the repository and move into the project folder.

```bash
git clone <your-repo-url>
cd workpilot
```

2. Install dependencies.

```bash
npm run install:all
```

3. Create or update `server/.env`.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
NODE_ENV=development
```

4. Start the backend.

```bash
npm run dev:server
```

5. In a second terminal, start the frontend.

```bash
npm run dev:client
```

## Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Important Local Note

If the backend says `Port 5000 is already in use`, another Node process is already running on that port. Stop the old process or change `PORT` in `server/.env`. If you change the backend port, also update the proxy target in [vite.config.js](/c:/Users/Lovkush/OneDrive/Desktop/Ethara Assignment/client/vite.config.js:8).

## Available Scripts

From the project root:

- `npm run install:all` installs client and server packages
- `npm run dev:server` starts the backend with nodemon
- `npm run dev:client` starts the Vite frontend
- `npm run build` installs dependencies and builds the frontend
- `npm start` starts the backend from the root

## Railway Deployment

This project is meant to be deployed as a single Railway service from the project root.

### 1. Push the code to GitHub

Commit your latest changes and push the repository to GitHub.

### 2. Create a Railway project

1. Open Railway.
2. Create a new project.
3. Choose `Deploy from GitHub repo`.
4. Select this repository.

### 3. Set Railway variables

In the Railway service, add these environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
NODE_ENV=production
```

You usually do not need to set `PORT` on Railway. Railway provides it automatically.

### 4. Build and start commands

Use these values if Railway does not detect them automatically:

- Build command: `npm run build`
- Start command: `npm start`

### 5. MongoDB Atlas access

In MongoDB Atlas:

1. Open `Network Access`
2. Add IP address `0.0.0.0/0`

This allows Railway to connect to your cluster.

### 6. Generate a public domain

After the service is deployed:

1. Open the Railway service
2. Go to `Networking`
3. Generate a public domain

## Deployment Notes

- The Express server serves the built React app from `client/dist` when that build exists.
- The backend checks for required environment variables before startup.
- The API health endpoint is available at `/api/health`.

## Troubleshooting

- `MongoDB connection error`: check `MONGODB_URI` in `server/.env` or Railway Variables.
- `Missing required environment variable(s)`: add the missing keys to `server/.env` or Railway Variables.
- `Port 5000 is already in use`: stop the existing process or change the backend port.
- Frontend cannot reach API locally: confirm the backend is running and the Vite proxy target matches the backend port.

## API Overview

- Auth: `/api/auth`
- Projects: `/api/projects`
- Tasks: `/api/tasks`
- Notifications: `/api/notifications`
