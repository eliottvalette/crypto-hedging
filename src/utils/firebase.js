// src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVZT9bCojsoduA62fvKY0WDPqz7SILcVM",
  authDomain: "hedgemarket-43dba.firebaseapp.com",
  projectId: "hedgemarket-43dba",
  storageBucket: "hedgemarket-43dba.appspot.com",
  messagingSenderId: "862434194275",
  appId: "1:862434194275:web:74d4b3080afdd33cc01956",
  measurementId: "G-SGKSHNPSX3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };