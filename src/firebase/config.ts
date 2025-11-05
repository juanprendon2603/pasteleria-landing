// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCoKmYtoTLJooWDGxRoAHECkH_7obFwcl0',
  authDomain: 'pasteleria-landing.firebaseapp.com',
  projectId: 'pasteleria-landing',
  storageBucket: 'pasteleria-landing.firebasestorage.app',
  messagingSenderId: '880216670695',
  appId: '1:880216670695:web:d41b7c4305cd27b972bd42',
  measurementId: 'G-WMM1JB5T6T',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
