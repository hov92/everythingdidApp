// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUvSqvrCbnuW1v7gSdDXXhFgr0IEWDpQY",
  authDomain: "everythingdid-5fab0.firebaseapp.com",
  projectId: "everythingdid-5fab0",
  storageBucket: "everythingdid-5fab0.firebasestorage.app",
  messagingSenderId: "237480427206",
  appId: "1:237480427206:web:a84192eba530d39a07a1c7",
  measurementId: "G-49SZN0PG06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);