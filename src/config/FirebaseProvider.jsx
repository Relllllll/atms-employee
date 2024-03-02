import React, { createContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

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