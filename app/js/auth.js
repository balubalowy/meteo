// auth.js
// Obsługa Firebase Auth z bramką dostępu (Lock Screen) i Białą Listą kont

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { AUTH_CONFIG } from '../assets/js/auth-config.js';

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "TWOJ_API_KEY";

function isUserAuthorized(email) {
    if (!AUTH_CONFIG.requireWhitelist) return true;
    if (!email) return false;
    const lowerEmail = email.toLowerCase().trim();
    return AUTH_CONFIG.allowedEmails.some(allowed => lowerEmail.includes(allowed.toLowerCase().trim()));
}

if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    
    // Zapobiegaj automatycznemu wybieraniu starego konta w popupie
    provider.setCustomParameters({ prompt: 'select_account' });

    document.addEventListener('DOMContentLoaded', () => {
        const lockscreen = document.getElementById('auth-lockscreen');
        const appRoot = document.getElementById('app-root');
        const lockLoginBtn = document.getElementById('lockscreen-login-btn');
        const lockError = document.getElementById('lockscreen-error');
        const lockSpinner = document.getElementById('lockscreen-spinner');
        
        const headerLoginBtn = document.getElementById('login-google-btn');
        const headerLogoutBtn = document.getElementById('logout-btn');
        const headerAuthSection = document.getElementById('auth-section');
        const headerUserInfo = document.getElementById('user-info');
        const headerUserEmail = document.getElementById('user-email');

        const performLogin = () => {
            if (lockError) lockError.style.display = 'none';
            if (lockSpinner) lockSpinner.style.display = 'block';
            
            signInWithPopup(auth, provider)
                .catch(error => {
                    console.error("Login error:", error);
                    if (lockSpinner) lockSpinner.style.display = 'none';
                    if (lockError) {
                        lockError.textContent = "Błąd logowania: " + (error.message || error.code);
                        lockError.style.display = 'block';
                    }
                });
        };

        if (lockLoginBtn) lockLoginBtn.addEventListener('click', performLogin);
        if (headerLoginBtn) headerLoginBtn.addEventListener('click', performLogin);

        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.reload();
                });
            });
        }

        onAuthStateChanged(auth, (user) => {
            if (lockSpinner) lockSpinner.style.display = 'none';

            if (user) {
                const authorized = isUserAuthorized(user.email);
                
                if (authorized) {
                    // Użytkownik poprawny i na białej liście
                    if (lockscreen) lockscreen.style.display = 'none';
                    if (appRoot) appRoot.style.display = 'block';
                    
                    if (headerAuthSection) headerAuthSection.style.display = 'none';
                    if (headerUserInfo) headerUserInfo.style.display = 'block';
                    if (headerUserEmail) {
                        headerUserEmail.textContent = user.email;
                        headerUserEmail.title = user.email;
                    }
                    
                    // Rozgłoś zdarzenie autoryzacji dla modułów (np. mapy i stacji)
                    window.dispatchEvent(new CustomEvent('bmeteo-authenticated', { detail: { user } }));
                    
                    setTimeout(() => {
                        if (window.premiumMap) window.premiumMap.invalidateSize();
                    }, 200);
                } else {
                    // Zalogowano kontem spoza białej listy
                    if (appRoot) appRoot.style.display = 'none';
                    if (lockscreen) lockscreen.style.display = 'flex';
                    
                    if (lockError) {
                        lockError.innerHTML = `
                            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 12px; margin-top: 10px; color: #fca5a5;">
                                <div style="font-weight: bold; margin-bottom: 4px;">⛔ Brak uprawnień do portalu</div>
                                <div style="font-size: 0.8rem; line-height: 1.4;">Konto <b>${user.email}</b> nie znajduje się na liście uprawnionych użytkowników.</div>
                                <button id="lockscreen-switch-btn" class="btn btn-ghost" style="margin-top: 10px; border: 1px solid #f87171; color: #f87171; width: 100%; font-size: 0.8rem; padding: 6px;">Zmień konto / Wyloguj</button>
                            </div>
                        `;
                        lockError.style.display = 'block';
                        
                        const switchBtn = document.getElementById('lockscreen-switch-btn');
                        if (switchBtn) {
                            switchBtn.addEventListener('click', () => {
                                signOut(auth).then(() => {
                                    if (lockError) lockError.style.display = 'none';
                                    performLogin();
                                });
                            });
                        }
                    }
                }
            } else {
                // Niezalogowany
                if (appRoot) appRoot.style.display = 'none';
                if (lockscreen) lockscreen.style.display = 'flex';
                if (headerAuthSection) headerAuthSection.style.display = 'block';
                if (headerUserInfo) headerUserInfo.style.display = 'none';
            }
        });
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const lockError = document.getElementById('lockscreen-error');
        if (lockError) {
            lockError.textContent = "Błąd konfiguracji Firebase w assets/js/firebase-config.js";
            lockError.style.display = 'block';
        }
    });
}

