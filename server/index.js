import { config } from "dotenv";
config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectionToDB from "./dbConnection.js";
import { router, loadCachedFAQs } from "./routes/user.route.js";
import passport from "./config/passport.js";
import session from "express-session";

const app = express();

/* -----------------------------------------
   ✔ FIX 1 — CORRECT CORS CONFIG
   (Render + Vercel cookies require this)
----------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://askit-backup.vercel.app",
  "https://askit-backup-rubin-s-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      // Allow all vercel.app subdomains (preview deployments)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* -----------------------------------------
   ✔ FIX 2 — Required for secure cookies
----------------------------------------- */
app.set("trust proxy", 1);

/* -----------------------------------------
   ✔ FIX 3 — SESSION SETTINGS
   (Render requires secure cookies)
----------------------------------------- */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      // must be true on https (Render)
      httpOnly: true,    // should remain true for security
      sameSite: "none",  // required for cross-site cookies
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* -----------------------------------------
   ✔ ROUTES
----------------------------------------- */
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/debug-cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    signedCookies: req.signedCookies,
    session: req.session,
    sessionID: req.sessionID,
  });
});

/* Must come AFTER session + passport */
app.use("/", router);

/* -----------------------------------------
   ✔ START SERVER
----------------------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectionToDB();
  console.log(`Server running on port ${PORT}`);
});

export default app;
