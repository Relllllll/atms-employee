import { useRef, useEffect, useState } from "react";
import * as faceapi from 'face-api.js'
import {getDownloadURL, getStorage, } from 'firebase/storage'
import {getDatabase, ref, get} from 'firebase/database'

const FaceRecog = () => {
    const videoRef = useRef()
    const canvasRef = useRef()
    const [videoDimensions, setVideoDimensions] = useState({width: 350, height: 400});
    const [capturedImage, setCapturedImage] = useState(null)
    const [showNoFaceMessage, setShowNoFaceMessage] = useState(false)
    const [recognizedName, setRecognizedName] = useState("")
    const [databaseImages, setDatabaseImages] = useState([])
    const [attendanceStatus, setAttendanceStatus] = useState({}) 
    const [employeesData, setEmployeesData] = useState({})

    const storage = getStorage();
    const database =getDatabase()

    useEffect(() => {
        fetchEmployeeImages();
    }, [])

    const fetchEmployeeImages = async () => {
        try {
            const imagesRef = storage.ref('images');
            const images = await imagesRef.listAll();
            const urls = await Promise.all(images.items.map(item => item.getDownloadURL()));
            setDatabaseImages(urls);
        } catch (error) {
            console.error("Error fetching employee images: ", error);
        }
    };

    const fetchEmployeeData = async () => {
        try {
            const employeesRef = ref(database, 'employees');
            const snapshot = await get(employeesRef);
            if (snapshot.exists()) {
                setEmployeesData(snapshot.val());
            } else {
                console.log("No data available");
            }
        } catch (error) {
            console.error("Error fetching employee data: ", error);
        }
    }

    // Function to compare faces
    const compareFaces = async (recognizedFaceDescriptor) => {
        const labeledDescriptors = Object.entries(employeesData).map(([key, employee]) => ({
            label: key,
            descriptor: employee.faceDescriptor // Assuming you have face descriptors stored in the database
        }));

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

        const bestMatch = faceMatcher.findBestMatch(recognizedFaceDescriptor);
        return bestMatch;
    };

    // Function to process recognition
    const processRecognition = async (detections) => {
        try {
            const resizedDetections = faceapi.resizeResults(detections, videoDimensions);

            const canvas = canvasRef.current;
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

            for (const detection of resizedDetections) {
                const bestMatch = await compareFaces(detection.descriptor);
                if (bestMatch.label !== 'unknown') {
                    setRecognizedName(bestMatch.label);
                    if (!attendanceStatus[bestMatch.label]) {
                        setAttendanceStatus(prevStatus => ({
                            ...prevStatus,
                            [bestMatch.label]: "Time In"
                        }));
                    }
                } else {
                    setRecognizedName("Unknown");
                }
            }
        } catch (error) {
            console.error('Error processing recognition:', error);
        }
    };

    
    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if(videoRef.current){
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                console.log('Error accessing camera: ', err)
            })
    }

    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
            ])
            startFaceRecognition();
        } catch (error) {
            console.error('Error loading models:', error)
        }
    }
    
    const startFaceRecognition = async () => {
        const labeledFaceDescriptors = await getLabeledFaceDescriptors();
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    
        await videoRef.current.play();
        const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
        setVideoDimensions(displaySize);
        faceapi.matchDimensions(canvasRef.current, displaySize);
    
        setInterval(async () => {
          try {
            const detections = await faceapi.detectAllFaces(videoRef.current)
              .withFaceLandmarks()
              .withFaceDescriptors();
    
            if (detections.length === 0 && !showNoFaceMessage) {
              setShowNoFaceMessage(true);
              setRecognizedName("");
              setAttendanceStatus({});
              return;
            } else {
              setShowNoFaceMessage(false);
            }
    
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const canvas = canvasRef.current;
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    
            resizedDetections.forEach(async (detection) => {
              const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
              const box = detection.detection.box;
              const drawOptions = {
                boxColor: { r: 255, g: 0, b: 0 },
                label: bestMatch.label,
                lineWidth: 2,
                textColor: 'black'
              };
              const drawBox = new faceapi.draw.DrawBox(box, drawOptions);
              drawBox.draw(canvas);
    
              const landmarks = detection.landmarks;
              const drawLandmarksOptions = {
                lineWidth: 2,
                drawLines: true,
                color: 'green'
              };
              const drawLandmarks = new faceapi.draw.DrawFaceLandmarks(landmarks, drawLandmarksOptions);
              drawLandmarks.draw(canvas);
    
              setRecognizedName(bestMatch.label);
    
              if (!attendanceStatus[bestMatch.label]) {
                setAttendanceStatus(prevStatus => ({
                  ...prevStatus,
                  [bestMatch.label]: "Time In"
                }));
              }
            });
          } catch (error) {
            console.error('Error detecting faces:', error);
          }
        }, 500);
      }

    return (
        <div>
            <h1>Face Recog</h1>
        </div>
    );
};

export default FaceRecog;
