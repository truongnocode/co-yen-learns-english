/**
 * Browser audio recording wrapper using MediaRecorder API.
 */

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

export const isRecordingSupported = (): boolean =>
  !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export const startRecording = async (): Promise<void> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  mediaRecorder.start();
};

export const stopRecording = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) { reject(new Error("Not recording")); return; }
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      // Stop all tracks
      mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
      mediaRecorder = null;
      chunks = [];
      resolve(blob);
    };
    mediaRecorder.stop();
  });
};

export const isRecording = (): boolean =>
  mediaRecorder?.state === "recording";

export const getAudioUrl = (blob: Blob): string =>
  URL.createObjectURL(blob);
