# 🚀 TASKR – Scalable Task Management System

A full-stack task management application with authentication, role-based access control, and CRUD operations.

---

## 📌 Features

### 🔐 Authentication & Security
- User Registration & Login
- Password hashing using bcrypt
- JWT-based authentication
- Protected routes
- Role-based access (Admin & User)

---

### 📦 Backend (Node.js + Express + MongoDB)
- RESTful API design
- MVC structure (Controllers, Models, Routes)
- CRUD operations for tasks
- Error handling & validation
- MongoDB (Mongoose) schema design

---

### 🎯 Role-Based Access
- **User**
  - Can manage only their own tasks
- **Admin**
  - Can view and manage all users' tasks

---

### 🧩 Task Management
- Create, Read, Update, Delete tasks
- Task status:
  - Pending
  - In Progress
  - Done
- Dynamic dashboard with task counts

---

### 💻 Frontend (React.js)
- Modern UI with dark theme
- Authentication pages (Login/Register)
- Protected dashboard
- Task modal for CRUD operations
- Toast notifications
- Responsive design

---

### ✨ UI/UX Enhancements
- Glassmorphism design
- Smooth animations (Framer Motion)
- Interactive dashboard
- Status-based color indicators

---

## 📸 Screenshots

> Add your screenshots here

### 🔹 Dashboard
![Dashboard](./screenshots/dashboard.png)

### 🔹 Login Page
![Login](./screenshots/login.png)

### 🔹 Register Page
![Register](./screenshots/register.png)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- Framer Motion
- CSS / Tailwind (if used)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/taskr-app.git
cd taskr-app
