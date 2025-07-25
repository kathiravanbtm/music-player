// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {

  apiKey: "AIzaSyBJGACAc-a24MxpC5BKWFlu3uz5w96cKSs",

  authDomain: "music-player-7e069.firebaseapp.com",

  databaseURL: "https://music-player-7e069-default-rtdb.firebaseio.com",

  projectId: "music-player-7e069",

  storageBucket: "music-player-7e069.firebasestorage.app",

  messagingSenderId: "82264546346",

  appId: "1:82264546346:web:7105b4968c5884ab477753",

  measurementId: "G-GHF6WDQH9N"

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;



// // Import the functions you need from the SDKs you need

// import { initializeApp } from "firebase/app";

// import { getAnalytics } from "firebase/analytics";

// // TODO: Add SDKs for Firebase products that you want to use

// // https://firebase.google.com/docs/web/setup#available-libraries


// // Your web app's Firebase configuration

// // For Firebase JS SDK v7.20.0 and later, measurementId is optional




// // Initialize Firebase

// const app = initializeApp(firebaseConfig);

// const analytics = getAnalytics(app);