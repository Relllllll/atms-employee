// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, push } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDwJYk1WnQk7GCJK_-xB8Bi0xlFPc1tVfY",
    authDomain: "attendance-management-sy-a4367.firebaseapp.com",
    databaseURL:
        "https://attendance-management-sy-a4367-default-rtdb.firebaseio.com",
    projectId: "attendance-management-sy-a4367",
    storageBucket: "attendance-management-sy-a4367.appspot.com",
    messagingSenderId: "1045091431522",
    appId: "1:1045091431522:web:a1bbe758641cfd3db94d3b",
    measurementId: "G-0S7WL2XX1G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const storage = getStorage(app);

const database = getDatabase();

const sendTicketMessage = (name, message) => {
  const messagesRef = ref(database, 'ticketMessages');
  push(messagesRef, {
    name: name,
    message: message,
    timestamp: new Date().toISOString() // or use firebase.database.ServerValue.TIMESTAMP
  });
};

export { database, storage, sendTicketMessage };
