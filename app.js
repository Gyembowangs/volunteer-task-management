const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize").default; // v7+ requires `.default`
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import Sequelize instance and models
const sequelize = require("./config/database");
require("./models"); // Load all models and associations

// Create Sequelize session store
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "Session",
  checkExpirationInterval: 15 * 60 * 1000, // Clean expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000, // Session expiration: 1 day
});

// Initialize express app
const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with Sequelize store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set secure cookie in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax",
    },
  })
);

// View engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const adminRoutes = require("./routes/adminRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Define routes
app.use("/", authRoutes); // /login, /signup, /logout
app.use("/admin", adminRoutes); // /admin/*
app.use("/", dashboardRoutes); // /dashboard
app.use("/", volunteerRoutes); // /apply/:id

// Protected task routes middleware
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

// Admin dashboard redirect shortcut
app.get("/admin-dashboard", (req, res) => {
  res.redirect("/admin/dashboard");
});

// Log session for debugging
app.use((req, res, next) => {
  console.log("Session:", req.session);
  next();
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// Sync session table and database, then start server
(async () => {
  try {
    await sessionStore.sync();
    await sequelize.sync({ force: false });
    console.log("✅ Database and session store synchronized!");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error syncing the database or session store:", error);
  }
})();
