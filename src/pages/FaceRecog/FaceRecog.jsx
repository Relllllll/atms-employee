import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { getDatabase, ref, onValue } from "firebase/database";
import { database, storage } from "../../firebase";
import "./FaceRecog.css";

const FaceRecog = () => {
    const videoRef = useRef();
    const [showNoFaceMessage, setShowNoFaceMessage] = useState(false);
    const [recognizedName, setRecognizedName] = useState("");
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const navigate = useNavigate();
    let recognitionInterval;

    useEffect(() => {
        startVideo();
        loadModels();

        return () => {
            stopRecognition();
        };
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
        // Ensure the recognitionInterval is not already running
        if (!recognitionInterval) {
            recognitionInterval = setInterval(async () => {
                try {
                    // Check if videoRef.current is defined and if it has a video property
                    if (videoRef.current && videoRef.current.video) {
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

                            console.log(
                                "Number of faces detected:",
                                detections.length
                            );

                            if (detections.length === 1) {
                                const recognizedUserId =
                                    await getRecognizedUserId(
                                        detections[0].descriptor
                                    );
                                if (recognizedUserId) {
                                    console.log(
                                        `Recognized user: ${recognizedUserId}`
                                    );
                                    navigate(`/profile/${recognizedUserId}`, {
                                        state: { userId: recognizedUserId },
                                    });

                                    stopRecognition();
                                }
                            } else {
                                console.log("No face detected");
                                setShowNoFaceMessage(true);
                                setRecognizedName("");
                                setAttendanceStatus({});
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error detecting face: ", error);
                }
            }, 500);
        }
    };

    const stopRecognition = () => {
        clearInterval(recognitionInterval);

        const stream = videoRef.current && videoRef.current.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
        }
    };

    const getRecognizedUserId = async (descriptor) => {
        try {
            const database = getDatabase();
            const employeesRef = ref(database, "employees");

            return new Promise((resolve) => {
                onValue(employeesRef, (snapshot) => {
                    const employees = snapshot.val();

                    if (!employees) {
                        console.log("No employees in the database");
                        resolve(null);
                        return;
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
                                console.log(
                                    `Recognized user: ${bestMatch.userId}`
                                );
                                resolve(bestMatch.userId);
                            } else {
                                console.log("No matching user found");
                                resolve(null);
                            }
                        })
                        .catch((error) => {
                            console.error("Error processing matches:", error);
                            resolve(null);
                        });
                });
            });
        } catch (error) {
            console.error("Error fetching users from Firebase:", error);
            return null;
        }
    };


    return (
        <div className="faceRecog">
            <Webcam className="faceRecog-video" ref={videoRef} />
            {showNoFaceMessage && (
                <p className="faceRecog-prompt">No user detected</p>
            )}
            <button className="ticket-button" onClick={() => navigate('/ticket-creation')}>Create Ticket</button>
        </div>
    );
};

export default FaceRecog;
