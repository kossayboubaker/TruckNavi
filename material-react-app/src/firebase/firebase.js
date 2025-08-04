// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "my-project-web-456914.firebaseapp.com",
  projectId: "my-project-web-456914",
  storageBucket: "my-project-web-456914.appspot.com",
  messagingSenderId: "1096606384772",
  appId: "1:1096606384772:web:exampleappid12345",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
