import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as OpenIDConnectStrategy } from "passport-openidconnect";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import sttRoutes from "./routes/stt.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server, io, setupSocketHandlers } from "./lib/socket.js";
import { upsertUser } from "./models/User.js";
import { createSocketAuthMiddleware } from "./middleware/socket.auth.middleware.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

// ── Session middleware (shared between Express and Socket.IO) ──
const sessionMiddleware = session({
  secret: ENV.SESSION_SECRET || "change-this-in-production",
  resave: true, // Force session to be saved back to the session store
  saveUninitialized: true, // Force a session that is "new" but not modified to be saved
  cookie: {
    httpOnly: true,
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    secure: ENV.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

// ── Passport (IBM App ID via OpenID Connect) ──
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (ENV.APP_ID_CLIENT_ID && ENV.APP_ID_ISSUER) {
  passport.use(
    "appid",
    new OpenIDConnectStrategy(
      {
        issuer: ENV.APP_ID_ISSUER,
        authorizationURL: ENV.APP_ID_AUTHORIZATION_URL,
        tokenURL: ENV.APP_ID_TOKEN_URL,
        userInfoURL: ENV.APP_ID_USERINFO_URL,
        clientID: ENV.APP_ID_CLIENT_ID,
        clientSecret: ENV.APP_ID_CLIENT_SECRET,
        callbackURL: ENV.APP_ID_CALLBACK_URL,
        scope: ["openid", "profile", "email"],
      },
      async (issuer, profile, done) => {
        try {
          // Extract user info from the App ID profile
          const email =
            profile.emails?.[0]?.value ||
            profile._json?.email ||
            "";
          const fullName =
            profile.displayName ||
            profile._json?.name ||
            email ||
            "Chat User";

          // Upsert user document in IBM Cloudant
          const user = await upsertUser({
            id: profile.id || profile.sub,
            email,
            fullName,
            profilePic: profile._json?.picture || "",
          });

          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
} else {
  console.warn("IBM App ID is not configured. Set App ID env vars.");
}

// ── Express middleware ──
app.set("trust proxy", 1); 
app.use(express.json({ limit: "5mb" }));

// Robust CORS setup
const corsOrigin = ENV.CLIENT_URL ? ENV.CLIENT_URL.replace(/\/$/, "") : "*";
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(cookieParser());

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to see sessions in logs (NOW AFTER SESSION LOADS)
app.use((req, res, next) => {
  if (req.url.includes("/api/auth")) {
    console.log(`${req.method} ${req.url} - ID: ${req.sessionID} - Passport: ${req.session?.passport ? "Present" : "Missing"} - Auth: ${req.isAuthenticated()}`);
  }
  next();
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stt", sttRoutes);

// Health check route for Render
app.get("/health", (req, res) => res.status(200).send("OK"));

// ── Socket.IO auth (uses the same session middleware) ──
io.use(createSocketAuthMiddleware(sessionMiddleware));
setupSocketHandlers();

// ── Production: serve frontend build ──
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// ── Start ──
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server running on port: " + PORT);
  });
});
