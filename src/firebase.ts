import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Tu configuración de Firebase
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

// Exporta Firestore
export const db = getFirestore(app);

// Exporta Auth
export const auth = getAuth(app);

// Función para autenticar anónimamente
export const authenticateFirebase = async (userEmail: string) => {
  try {
    // Primero intenta autenticación anónima
    const result = await signInAnonymously(auth);
    console.log('✅ Autenticado en Firebase:', result.user.uid);
    
    // Guarda el email en el perfil (para las reglas)
    // Nota: en auth anónima no se puede modificar el email directamente,
    // pero las reglas pueden leer custom claims si los configuramos
    
    return result.user;
  } catch (error) {
    console.error('❌ Error al autenticar en Firebase:', error);
    throw error;
  }
};
