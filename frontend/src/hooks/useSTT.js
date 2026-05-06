import { useState, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useSTT = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async (onTranscript) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());

        // Send to backend for IBM transcription
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const loadingToast = toast.loading("Transcribing...");
        try {
          const res = await axiosInstance.post("/stt/recognize", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          onTranscript(res.data.transcript, true);
          toast.success("Transcribed!", { id: loadingToast });
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Transcription failed. Please try again.", { id: loadingToast });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return { isRecording, startRecording, stopRecording };
};
