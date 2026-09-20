# Kiln — Team Collaboration Platform

A real-time team collaboration platform built with React and Node.js. Kiln gives teams projects, kanban boards, and chat in one warm, focused workspace.

## 🎨 Design language

Kiln has its own product identity — the **Kiln design system**: an earth-tone palette (moss, gilt, umber, oat), a distinctive type pairing (Bricolage Grotesque, Instrument Sans, Spline Sans Mono), dark-first theming, and fully token-driven surfaces so the entire UI can be restyled from one file. See [`ui_renovation.md`](./ui_renovation.md) for the plan and [`frontend/DESIGN.md`](./frontend/DESIGN.md) for the token contract. Every component is previewed live at `/design`.

## 🚀 Live Demo

- **Frontend**: [https://team-collab-devbisht.vercel.app](https://team-collab-devbisht.vercel.app)
- **Backend**: [https://team-collab-backend-lcge.onrender.com](https://team-collab-backend-lcge.onrender.com)

## 📋 Features

### Core Features
- **User Authentication**: Secure Firebase Authentication with email/password
- **Team Management**: Create and manage teams with role-based access control
- **Project Management**: Create, edit, and delete projects with user assignment
- **Kanban Board**: Interactive drag-and-drop task management with status tracking
- **Real-time Chat**: Team communication with Socket.io integration
- **Role-based Access**: Admin, Manager, and Member roles with different permissions

### Additional Features
- **Task detail modal**: description, priority, due date, assignee, and attachments in one view
- **Task comments**: threaded discussion with notifications for the team
- **Subtasks and activity feed**: break work down and audit every change
- **Attachments**: image and file uploads backed by Cloudinary
- **Real-time notifications**: bell with unread count for assignments, comments, and task changes
- **Live board sync**: tasks move for everyone at once over Socket.io
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **User Assignment**: Assign multiple team members to projects and tasks
- **Team Setup**: Guided team creation and member invitation process
- **Protected Routes**: Secure navigation with authentication guards

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **React Router DOM 7.7.1** - Client-side routing
- **Redux Toolkit + React Redux** - Client state and realtime slices
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Firebase 12.0.0** - Authentication and user management
- **Socket.io Client 4.8.1** - Real-time communication
- **Axios 1.11.0** - HTTP client for API requests
- **@dnd-kit** - Modern drag-and-drop functionality
- **lucide-react** - Icon library
- **Fontsource variable fonts** - Bricolage Grotesque, Instrument Sans, Spline Sans Mono
- **Sonner** - Toast notifications

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 5.1.0** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Firebase Admin 13.4.0** - Server-side Firebase integration
- **Socket.io 4.8.1** - Real-time bidirectional communication
- **Multer + Cloudinary** - File uploads and storage
- **Joi 17.13.3** - Data validation
- **CORS 2.8.5** - Cross-origin resource sharing

### Database
- **MongoDB Atlas** - Cloud-hosted MongoDB database
- **Mongoose 8.17.0** - Object Document Mapper (ODM)

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- MongoDB database (local or Atlas)
- Firebase project for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd team-collab
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json
   FRONTEND_URL=http://localhost:5173
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

   Create a `.env.local` file in the frontend directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Email/Password

2. **Get Firebase Configuration**
   - Go to Project Settings → General → Your apps
   - Copy the configuration values to your `.env.local` file

3. **Generate Service Account Key**
   - Go to Project Settings → Service Accounts
   - Generate a new private key
   - Copy the entire JSON content as a single line for `FIREBASE_SERVICE_ACCOUNT`

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
team-collab/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── validators/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/sync` - Sync Firebase user with backend

### Teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/me` - Get current user's team
- `POST /api/teams/:teamId/add-user` - Add user to team
- `GET /api/users/team` - Get team members

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks/:projectId` - Get tasks for a project
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Messages
- `GET /api/messages/:teamId` - Get team chat messages
- `POST /api/messages` - Send a message

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project_id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender_id
VITE_FIREBASE_APP_ID=app_id
VITE_FIREBASE_MEASUREMENT_ID=measurement_id
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Created with ❤️ by [Dev Bishht](https://github.com/devbisht)

## 🐛 Known Issues

- WebSocket connection optimization needed for production
- Email notifications and digests are not implemented yet

## 🔮 Future Enhancements

- Email notifications
- Advanced reporting and analytics
- Mobile app development
- Integration with third-party tools (Slack, GitHub, etc.)

---

For any questions or support, please open an issue in the repository.
