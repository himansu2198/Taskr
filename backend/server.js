const express  = require("express");
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const cors     = require("cors");
require("dotenv").config();

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// MongoDB Connection
// ─────────────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => { console.error("MongoDB error:", err); process.exit(1); });

// ─────────────────────────────────────────────────────────────────────────────
// User Schema & Model
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String, required: [true, "Email is required"],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Task Schema & Model
// ─────────────────────────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, "Title is required"],
      trim:     true,
    },
    description: {
      type:    String,
      trim:    true,
      default: "",
    },
    status: {
      type:    String,
      enum:    ["pending", "in-progress", "done"],
      default: "pending",
    },
    // Every task belongs to the user who created it
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Helper — generate JWT
// ─────────────────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ─────────────────────────────────────────────────────────────────────────────
// Middleware — protect routes (verify JWT)
// ─────────────────────────────────────────────────────────────────────────────
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorised. Token missing." });
  }
  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: "Not authorised. Invalid token." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Middleware — admin only
// ─────────────────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed });

    return res.status(201).json({
      message: "Account created successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "User already exists" });
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tasks
// Admin  → returns ALL tasks (with owner name + email populated)
// User   → returns only their own tasks
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/v1/tasks", protect, async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "admin") {
      // Admins see every task; populate owner details
      tasks = await Task.find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 });
    } else {
      // Regular users see only tasks they created
      tasks = await Task.find({ user: req.user.id })
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/tasks  — create a task
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/v1/tasks", protect, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      title:       title.trim(),
      description: description?.trim() || "",
      status:      status || "pending",
      user:        req.user.id,
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/tasks/:id  — update a task
// Admin  → can edit any task
// User   → can only edit their own tasks
// ─────────────────────────────────────────────────────────────────────────────
app.put("/api/v1/tasks/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Ownership check — admins bypass
    if (req.user.role !== "admin" && task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorised to edit this task" });
    }

    const { title, description, status } = req.body;

    if (title !== undefined) task.title       = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status     = status;

    await task.save();

    return res.status(200).json(task);
  } catch (err) {
    console.error("Update task error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/tasks/:id  — delete a task
// Admin  → can delete any task
// User   → can only delete their own tasks
// ─────────────────────────────────────────────────────────────────────────────
app.delete("/api/v1/tasks/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Ownership check — admins bypass
    if (req.user.role !== "admin" && task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorised to delete this task" });
    }

    await task.deleteOne();

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// [Admin only] GET /api/v1/admin/users — list all users
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/v1/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Admin users error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 fallback
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));