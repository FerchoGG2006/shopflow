import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

// ─── Email / Password ─────────────────────────────────────────────────────────

export async function register(email: string, password: string, displayName: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred.user;
}

export async function login(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── Google ───────────────────────────────────────────────────────────────────

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

// ─── Observer ────────────────────────────────────────────────────────────────

export function onAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Error messages ───────────────────────────────────────────────────────────

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use':    'Ya existe una cuenta con este correo.',
    'auth/invalid-email':           'El correo electrónico no es válido.',
    'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found':          'No encontramos una cuenta con ese correo.',
    'auth/wrong-password':          'Contraseña incorrecta.',
    'auth/invalid-credential':      'Correo o contraseña incorrectos.',
    'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed':  'Error de conexión. Revisa tu internet.',
    'auth/popup-closed-by-user':    'Cerraste la ventana de Google. Intenta de nuevo.',
  };
  return messages[code] || 'Ocurrió un error inesperado. Intenta de nuevo.';
}
