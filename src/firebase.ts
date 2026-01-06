import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Acá pegás TU firebaseConfig que copiaste de la consola
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "meditrack-drcucatto.firebaseapp.com",
  projectId: "meditrack-drcucatto",
  storageBucket: "meditrack-drcucatto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore y lo exportamos
export const db = getFirestore(app);
