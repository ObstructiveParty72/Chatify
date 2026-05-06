import { useState, useRef } from "react";
import SpeechToTextV1 from "watson-speech/speech-to-text";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useSTT = () => {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef(null);

  const startRecording = async (onTranscript) => {
    try {
      // 1. Get token from backend
      const res = await axiosInstance.get("/stt/token");
      const { accessToken, url } = res.data;

      if (!accessToken) {
        throw new Error("Failed to get STT access token");
      }

      // 2. Start Watson Speech STT
      const stream = SpeechToTextV1.recognizeMicrophone({
        accessToken,
        url,
        extractResults: true,
        format: false, // Set to false to avoid PCM endianness errors
        objectMode: true,
        model: "en-US_BroadbandModel",
        realtime: true,
      });

      streamRef.current = stream;
      setIsRecording(true);

      stream.on("data", (data) => {
        if (data.results && data.results[0] && data.results[0].alternatives[0]) {
          const transcript = data.results[0].alternatives[0].transcript;
          onTranscript(transcript, data.results[0].final);
        }
      });

      stream.on("error", (err) => {
        console.error("FULL STT ERROR OBJECT:", err);
        const errorMsg = err.message || "Connection failed";
        toast.error(`Speech to Text failed: ${errorMsg}. Check console for details.`);
        stopRecording();
      });

    } catch (error) {
      console.error("Error starting STT:", error);
      toast.error(error.response?.data?.message || "Could not start Speech to Text");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.stop();
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  return { isRecording, startRecording, stopRecording };
};
