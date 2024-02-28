// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDwJYk1WnQk7GCJK_-xB8Bi0xlFPc1tVfY",
  authDomain: "attendance-management-sy-a4367.firebaseapp.com",
  databaseURL: "https://attendance-management-sy-a4367-default-rtdb.firebaseio.com",
  projectId: "attendance-management-sy-a4367",
  storageBucket: "attendance-management-sy-a4367.appspot.com",
  messagingSenderId: "1045091431522",
  appId: "1:1045091431522:web:3620ace02e02ee4db94d3b",
  measurementId: "G-428RXE7SQ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);