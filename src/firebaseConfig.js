// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCU-RjwXuAnyISvigtPYrtdgHppgnYVEB0",
  authDomain: "monterosvanesa-5069b.firebaseapp.com",
  projectId: "monterosvanesa-5069b",
  storageBucket: "monterosvanesa-5069b.firebasestorage.app",
  messagingSenderId: "207645687930",
  appId: "1:207645687930:web:dafc45c1d00c7cd1063bc3",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };