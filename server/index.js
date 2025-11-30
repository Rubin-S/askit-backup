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

// ✅ Proper CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://askit-backup.vercel.app",
      "https://askit-backup-rubin-s-projects.vercel.app",
      /\.vercel\.app$/,
    ];

    if (!origin) return callback(null, true); // mobile apps, curl, etc.

    if (allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    )) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1); // Required for secure cookies on Render

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // required on Render
      httpOnly: false, // allow frontend to read cookie
      sameSite: "none", // required for cross-site cookies
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectionToDB();
  console.log(`Server running on port ${PORT}`);
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/debug-cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    signedCookies: req.signedCookies,
    headers: req.headers.cookie,
    secure: req.secure,
    protocol: req.protocol,
    trustProxy: app.get("trust proxy"),
  });
});

app.use("/", router);

export default app;
