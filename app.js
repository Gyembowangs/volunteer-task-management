const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const adminRoutes = require("./routes/adminRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //   secure: false, // true only in production with HTTPS
    //   maxAge: 1000 * 60 * 60 * 24 // 1 day
    // }
    // Changed --------------
    cookie: {
      secure: process.env.NODE_ENV === "production", // only true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax", // recommended for CSRF protection
    },
  })
);

// View Engine and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", authRoutes); // /login, /signup, /logout
app.use("/admin", adminRoutes); // /admin/*
app.use("/", dashboardRoutes); // /dashboard
app.use("/", volunteerRoutes); // /apply/:id

// Task routes (protected)
app.use(
  "/tasks",
  (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
  },
  taskRoutes
);

// Home route
app.get("/", (req, res) => {
  res.render("index");
});

// Redirect shortcut
app.get("/admin-dashboard", (req, res) => {
  res.redirect("/admin/dashboard");
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// ✅ Sequelize DB Sync
const sequelize = require("./config/database");

// ✅ Load all models and their associations BEFORE sync
require("./models"); // this will auto-load User, Task, Volunteer, and define relations

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✅ Database synchronized!");
    // Start server inside .then to ensure DB is ready
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("❌ Error syncing the database:", error);
  });
