import express from "express";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { ENV } from "../lib/env.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import SpeechToTextV1 from "ibm-watson/speech-to-text/v1.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/recognize", protectRoute, upload.single("audio"), async (req, res) => {
  try {
    if (!ENV.SPEECH_TO_TEXT_APIKEY || !ENV.SPEECH_TO_TEXT_URL) {
      return res.status(500).json({ message: "Speech to Text not configured" });
    }

    const speechToText = new SpeechToTextV1({
      authenticator: new IamAuthenticator({
        apikey: ENV.SPEECH_TO_TEXT_APIKEY,
      }),
      serviceUrl: ENV.SPEECH_TO_TEXT_URL,
    });

    const params = {
      audio: fs.createReadStream(req.file.path),
      contentType: req.file.mimetype,
      model: "en-US_BroadbandModel",
    };

    const response = await speechToText.recognize(params);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const transcript = response.result.results
      .map(result => result.alternatives[0].transcript)
      .join("");

    res.json({ transcript });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
