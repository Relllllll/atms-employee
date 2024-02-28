import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { getDatabase, ref, onValue } from "firebase/database";
import { database, storage } from "../../firebase";

const FaceRecog = () => {
    const videoRef = useRef();
    const [showNoFaceMessage, setShowNoFaceMessage] = useState(false);
    const [recognizedName, setRecognizedName] = useState("");
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        startVideo();
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((error) => {
                console.log("Error accessing camera: ", error);
            });
    };

    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
                faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
            ]);
            startFaceRecognition();
        } catch (error) {
            console.error("Error loading models:", error);
        }
    };

    const startFaceRecognition = async () => {
        setInterval(async () => {
            try {
                const video = videoRef.current.video;

                // Check if the video stream is loaded
                if (video.readyState === 4) {
                    console.log("Video stream is loaded");
                    const canvas = faceapi.createCanvasFromMedia(video);
                    const displaySize = {
                        width: video.width,
                        height: video.height,
                    };
                    faceapi.matchDimensions(canvas, displaySize);

                    const detections = await faceapi
                        .detectAllFaces(video)
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    console.log("Number of faces detected:", detections.length);

                    if (detections.length === 1) {
                        const recognizedUserId = await getRecognizedUserId(
                            detections[0].descriptor
                        );
                        if (recognizedUserId) {
                            console.log(`Recognized user: ${recognizedUserId}`);
                            navigate(`/profile/${recognizedUserId}`, {
                                state: { userId: recognizedUserId },
                            });
                        }
                    } else {
                        console.log("Video stream is not loaded");
                        setShowNoFaceMessage(true);
                        setRecognizedName("");
                        setAttendanceStatus({});
                    }
                }
            } catch (error) {
                console.error("Error detecting face: ", error);
            }
        }, 500);
    };

    const getRecognizedUserId = async (descriptor) => {
        try {
            const database = getDatabase();
            const employeesRef = ref(database, "employees");

            const snapshotCallback = (snapshot) => {
                const employees = snapshot.val();

                if (!employees) {
                    console.log("No employees in the database");
                    return null;
                }

                console.log("Fetched employees from Firebase:", employees);

                // Use Promise.all to map employees to an array of { userId, distance } objects
                Promise.all(
                    Object.keys(employees).map(async (userId) => {
                        const employee = employees[userId];

                        // Fetch the image URL from the employee data
                        const imageUrl = employee.image;

                        // Download the image from Firebase Storage
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();

                        // Convert the blob to an HTMLImageElement
                        const img = await faceapi.bufferToImage(blob);

                        // Detect face and generate descriptors from the downloaded image
                        const detectedDescriptors = await faceapi
                            .detectSingleFace(img)
                            .withFaceLandmarks()
                            .withFaceDescriptor();

                        // Compare descriptors
                        const distance = faceapi.euclideanDistance(
                            descriptor,
                            detectedDescriptors?.descriptor || []
                        );

                        return {
                            userId,
                            distance,
                        };
                    })
                )
                    .then((results) => {
                        // Find the employee with the smallest distance (best match)
                        const bestMatch = results.reduce(
                            (minDistance, match) =>
                                match.distance < minDistance.distance
                                    ? match
                                    : minDistance,
                            results[0]
                        );

                        // Adjust your threshold based on your use case
                        if (bestMatch.distance < 0.6) {
                            console.log(`Recognized user: ${bestMatch.userId}`);
                            navigate(`/profile/${bestMatch.userId}`, {
                                state: { userId: bestMatch.userId },
                            });
                        } else {
                            console.log("No matching user found");
                        }
                    })
                    .catch((error) => {
                        console.error("Error processing matches:", error);
                    });
            };

            onValue(employeesRef, snapshotCallback);

            return null; // Modify this part based on your use case
        } catch (error) {
            console.error("Error fetching users from Firebase:", error);
            return null;
        }
    };

    return (
        <div>
            <Webcam ref={videoRef} />
            {showNoFaceMessage && <p>No user detected</p>}
        </div>
    );
};

export default FaceRecog;
