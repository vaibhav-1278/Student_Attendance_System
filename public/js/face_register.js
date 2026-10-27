
import * as faceapi from "https://esm.sh/face-api.js@0.22.2?bundle";

const video = document.getElementById("video");
const startBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureFaceBtn");
const capturedFace = document.getElementById("capturedFace");
const descriptorInput = document.getElementById("face_descriptor");
const message = document.getElementById("faceResult");

// Load models
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

    startBtn.disabled = false;
}

startBtn.disabled = true;
captureBtn.disabled = true;

loadModels();

// Start camera
startBtn.addEventListener("click", async () => {
    video.srcObject = await navigator.mediaDevices.getUserMedia({
        video: true
    });

    await video.play();

    video.hidden = false;
    capturedFace.hidden = true;
    captureBtn.disabled = false;
});

// Capture face
captureBtn.addEventListener("click", async () => {
    const face = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!face) {
        message.textContent = "Face not detected";
        return;
    }

    capturedFace.width = video.videoWidth;
    capturedFace.height = video.videoHeight;

    capturedFace.getContext("2d").drawImage(video, 0, 0);

    video.hidden = true;
    capturedFace.hidden = false;

    descriptorInput.value = JSON.stringify(Array.from(face.descriptor));

    message.textContent = "Face captured successfully!";
});
