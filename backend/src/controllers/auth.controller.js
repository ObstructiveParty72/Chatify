import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { upsertUser, updateUserProfilePic } from "../models/User.js";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";

// Called after IBM App ID login succeeds — upserts user in Cloudant
export const appIdCallback = async (req, res) => {
  try {
    // req.user is set by Passport after successful App ID authentication
    const user = req.user;

    // Send welcome email on first login (best-effort)
    try {
      await sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    // Explicitly save session before redirecting
    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect(ENV.CLIENT_URL || "/");
    });
  } catch (error) {
    console.error("Error in App ID callback:", error);
    res.redirect((ENV.CLIENT_URL || "") + "/login?error=auth_failed");
  }
};

export const logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy(() => {
      res.cookie("connect.sid", "", { maxAge: 0 });
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
};

export const checkAuth = (req, res) => {
  // req.user is populated by Passport from the session
  res.status(200).json(req.user);
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await updateUserProfilePic(userId, uploadResponse.secure_url);

    // Update session with new profile pic
    req.user.profilePic = updatedUser.profilePic;

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
