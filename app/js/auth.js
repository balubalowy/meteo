// auth.js
// Obsługa Firebase Auth

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from '../assets/js/firebase-config.js';

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "TWOJ_API_KEY";

if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    const provider = new GoogleAuthProvider();
    
    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('login-google-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authSection = document.getElementById('auth-section');
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                signInWithPopup(auth, provider).catch(error => {
                    console.error("Login failed", error);
                    alert("Błąd logowania: " + error.message);
                });
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth);
            });
        }
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                authSection.style.display = 'none';
                userInfo.style.display = 'block';
                userEmail.textContent = user.email;
                userEmail.title = user.email;
                const privateHub = document.getElementById('private-hub');
                if(privateHub) privateHub.style.display = 'grid';
            } else {
                authSection.style.display = 'block';
                userInfo.style.display = 'none';
                const privateHub = document.getElementById('private-hub');
                if(privateHub) privateHub.style.display = 'none';
            }
        });
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('login-google-btn');
        if (loginBtn) {
            loginBtn.textContent = "Skonfiguruj Firebase w assets/js/firebase-config.js";
            loginBtn.disabled = true;
            loginBtn.style.backgroundColor = "#9CA3AF";
        }
    });
}
