import express from "express";
import passport from "passport";
import { logout, checkAuth, updateProfile, appIdCallback } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Initiate IBM App ID login — redirects the browser to App ID's hosted login page
router.get("/login", passport.authenticate("appid"));

// IBM App ID redirects back here after user logs in
router.get(
  "/callback",
  passport.authenticate("appid", { failureRedirect: "http://localhost:5173/login" }),
  appIdCallback
);

router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
