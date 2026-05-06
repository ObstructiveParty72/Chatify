import express from "express";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { ENV } from "../lib/env.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/token", protectRoute, async (req, res) => {
  try {
    if (!ENV.SPEECH_TO_TEXT_APIKEY) {
      return res.status(500).json({ message: "Speech to Text API Key not configured" });
    }

    const authenticator = new IamAuthenticator({
      apikey: ENV.SPEECH_TO_TEXT_APIKEY,
    });

    const tokenResponse = await authenticator.tokenManager.requestToken();
    
    res.json({
      accessToken: tokenResponse.result.access_token,
      url: ENV.SPEECH_TO_TEXT_URL?.replace(/\/$/, ""),
    });
  } catch (error) {
    console.error("Error fetching STT token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
