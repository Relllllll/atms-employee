import React, { createContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

//us-central
// const firebaseConfig = {
//     apiKey: "AIzaSyDwJYk1WnQk7GCJK_-xB8Bi0xlFPc1tVfY",
//     authDomain: "attendance-management-sy-a4367.firebaseapp.com",
//     databaseURL: "https://attendance-management-sy-a4367-default-rtdb.firebaseio.com",
//     projectId: "attendance-management-sy-a4367",
//     storageBucket: "attendance-management-sy-a4367.appspot.com",
//     messagingSenderId: "1045091431522",
//     appId: "1:1045091431522:web:3620ace02e02ee4db94d3b",
//     measurementId: "G-428RXE7SQ9"
//   };
const firebaseConfig ={
apiKey: "AIzaSyCj3fmuMRcOr0QHUsU5taLyLU2_wn5AHGQ",
  authDomain: "atms-capstone.firebaseapp.com",
  databaseURL: "https://atms-capstone-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "atms-capstone",
  storageBucket: "atms-capstone.appspot.com",
  messagingSenderId: "63113783163",
  appId: "1:63113783163:web:1bd909f81ff09420f5ffde",
  measurementId: "G-DM73FQC28K"
};
  
  const FirebaseContext = createContext();
  
  export const FirebaseProvider = ({ children }) => {
    const [firebaseApp, setFirebaseApp] = useState(null);
  
    useEffect(() => {
      const app = initializeApp(firebaseConfig);
      const analytics = getAnalytics(app);
      setFirebaseApp(app);
      return () => {
        // Cleanup if needed
      };
    }, []);
  
    return (
      <FirebaseContext.Provider value={firebaseApp}>
        {children}
      </FirebaseContext.Provider>
    );
  };
  
  export const useFirebase = () => {
    return React.useContext(FirebaseContext);
  };
