const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize").default;  // <-- v7+ import
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import Sequelize instance and models
const sequelize = require("./config/database");
require("./models");

// Create Sequelize session store instance (v7+)
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "Session",
  checkExpirationInterval: 15 * 60 * 1000, // Clean expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000,        // Session expiration: 1 day
});

// Initialize express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: "lax",
    },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Your routes imports and uses here...

// Sync session store and sequelize before starting server
sessionStore
  .sync()
  .then(() => sequelize.sync({ force: false }))
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error syncing database/session store:", err);
  });
