
import * as faceapi from "https://esm.sh/face-api.js@0.22.2?bundle";

var video = document.getElementById("video");
var cameraSection = document.getElementById("cameraSection");
var message = document.getElementById("message");
var verifyFaceBtn = document.getElementById("verifyFaceBtn");

var cameraStream;
var selectedForm;
var selectedButton;

// Load models
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
}

loadModels();

// Start camera
window.scanFace = async function(form, button) {
    selectedForm = form;
    selectedButton = button;

    cameraSection.style.display = "block";

    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true
    });

    video.srcObject = cameraStream;
    await video.play();
};

// Verify face
verifyFaceBtn.addEventListener("click", async function() {
    var face = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!face) {
        message.textContent = "Face not detected. Try again.";
        return;
    }

    var response = await fetch("/admin/verify_face", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            student_id: selectedForm.elements["student_id"].value,
            attendance_date: selectedForm.elements["attendance_date"].value,
            face_descriptor: Array.from(face.descriptor)
        })
    });

  var result = await response.json();

stopCamera();
cameraSection.style.display = "none";

if (result.success) {
    window.location.reload();
} else {
    selectedButton.classList.remove("btn-success");
    selectedButton.classList.add("btn-danger");
}
});

// Stop camera automatically
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }

    video.srcObject = null;
    cameraStream = null;
}
