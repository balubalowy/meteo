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
    return AUTH_CONFIG.allowedEmails.some(allowed => lowerEmail === allowed.toLowerCase().trim());
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
                    window.firebaseUser = user;
                    window.getFirebaseToken = async () => {
                        try {
                            return await user.getIdToken();
                        } catch (err) {
                            console.error("Błąd pobierania tokena Firebase:", err);
                            return null;
                        }
                    };

                    if (lockscreen) lockscreen.style.display = 'none';
                    if (appRoot) appRoot.style.display = 'block';
                    
                    if (headerAuthSection) headerAuthSection.style.display = 'none';
                    if (headerUserInfo) headerUserInfo.style.display = 'block';
                    if (headerUserEmail) {
                        headerUserEmail.textContent = user.email;
                        headerUserEmail.title = user.email;
                    }
                    
                    if (window.updateBandwidthUI) window.updateBandwidthUI();

                    // Rozgłoś zdarzenie autoryzacji dla modułów (np. mapy i stacji)
                    window.dispatchEvent(new CustomEvent('bmeteo-authenticated', { detail: { user } }));
                    
                    setTimeout(() => {
                        if (window.premiumMap) window.premiumMap.invalidateSize();
                    }, 200);
                } else {
                    // Zalogowano kontem spoza białej listy
                    window.firebaseUser = null;
                    window.getFirebaseToken = null;
                    if (appRoot) appRoot.style.display = 'none';
                    if (lockscreen) lockscreen.style.display = 'flex';
                    
                    if (lockError) {
                        lockError.innerHTML = `
                            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 12px; margin-top: 10px; color: #fca5a5;">
                                <div style="font-weight: bold; margin-bottom: 4px;"> Brak uprawnień do portalu</div>
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
                window.firebaseUser = null;
                window.getFirebaseToken = null;
                if (appRoot) appRoot.style.display = 'none';
                if (lockscreen) lockscreen.style.display = 'flex';
                if (headerAuthSection) headerAuthSection.style.display = 'block';
                if (headerUserInfo) headerUserInfo.style.display = 'none';
            }
        });
    });

    // ----------------------------------------------------
    // ŚLEDZENIE ZUŻYCIA LIMITU POBIERANIA (BANDWIDTH TRACKER)
    // ----------------------------------------------------
    window.trackFirebaseDownload = function(bytes) {
        if (!bytes || isNaN(bytes)) return;
        const today = new Date().toISOString().slice(0, 10);
        const month = new Date().toISOString().slice(0, 7);
        
        let totalBytes = parseInt(localStorage.getItem('bmeteo_fb_bytes_' + month) || '0', 10);
        totalBytes += bytes;
        localStorage.setItem('bmeteo_fb_bytes_' + month, totalBytes);
        
        let dayBytes = parseInt(localStorage.getItem('bmeteo_fb_bytes_' + today) || '0', 10);
        dayBytes += bytes;
        localStorage.setItem('bmeteo_fb_bytes_' + today, dayBytes);
        
        if (window.updateBandwidthUI) window.updateBandwidthUI();
    };

    window.updateBandwidthUI = function() {
        const month = new Date().toISOString().slice(0, 7);
        const today = new Date().toISOString().slice(0, 10);
        const totalBytes = parseInt(localStorage.getItem('bmeteo_fb_bytes_' + month) || '0', 10);
        const dayBytes = parseInt(localStorage.getItem('bmeteo_fb_bytes_' + today) || '0', 10);
        
        const mbToday = (dayBytes / (1024 * 1024)).toFixed(2);
        const mbMonth = (totalBytes / (1024 * 1024)).toFixed(2);
        const pctMonth = ((totalBytes / (10 * 1024 * 1024 * 1024)) * 100).toFixed(2);
        
        const el = document.getElementById('firebase-bandwidth-display');
        if (el) {
            el.innerHTML = `
                <a href="https://console.firebase.google.com/project/meteo-bbe28/database/meteo-bbe28-default-rtdb/usage" target="_blank" style="color: inherit; text-decoration: none; display: flex; align-items: center; gap: 4px;" title="Kliknij, aby otworzyć statystyki Firebase">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                    <span>Transfer FB: <b>${mbToday} MB</b> dziś (${mbMonth} MB / 10 GB msc — ${pctMonth}%)</span>
                </a>
            `;
        }
    };
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const lockError = document.getElementById('lockscreen-error');
        if (lockError) {
            lockError.textContent = "Błąd konfiguracji Firebase w assets/js/firebase-config.js";
            lockError.style.display = 'block';
        }
    });
}

