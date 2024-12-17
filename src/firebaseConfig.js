// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDjRZaFR-k8_8B-uCpIx8qMcfHC7oXm6wA",
    authDomain: "peluqueria-fcb86.firebaseapp.com",
    projectId: "peluqueria-fcb86",
    storageBucket: "peluqueria-fcb86.firebasestorage.app",
    messagingSenderId: "418176110672",
    appId: "1:418176110672:web:b763217633865d85784155"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };