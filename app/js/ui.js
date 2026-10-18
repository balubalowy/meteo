// ui.js - Obsługa zakładek, lazy-loadingu modułów i optymalizacji

function loadStyle(href) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) return resolve();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = () => { console.warn('Nie udało się załadować CSS:', href); resolve(); };
        document.head.appendChild(link);
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = (err) => { console.warn('Nie udało się załadować JS:', src); resolve(); };
        document.body.appendChild(script);
    });
}


async function ensureCloudsDependencies() {
    if (window._cloudsDepsLoaded) return;
    await Promise.all([
        loadScript('js/cloud-identifier.js'),
        loadScript('js/clouds-data.js')
    ]);
    window._cloudsDepsLoaded = true;
}

document.addEventListener('DOMContentLoaded', function() {
    // 0. Render Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 1. Direct Image Fallbacks
    const setSrc = (id, url) => {
        const el = document.getElementById(id);
        if (el && url && !el.src) el.src = url;
    };
    
    setSrc('dash-sigwx-pl', 'https://aviation-api.imgw.pl/image/significant/pl');
    setSrc('dash-sigwx-cz', 'https://aviation-api.imgw.pl/image/significant/cz');
    setSrc('img-meteo-wroclaw', 'https://www.meteo.pl/um/metco/mgram_pict.php?ntype=0u&row=436&col=181&lang=pl');

    // 2. Obsługa przełączania zakładek
    document.addEventListener('click', async function(e) {
        const btn = e.target.closest('.tab-btn, .nav-link, [data-tab]');
        if (!btn) return;
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;
        
        e.preventDefault();
        document.querySelectorAll('.tab-btn, .nav-link').forEach(b => {
            if (b.getAttribute('data-tab')) b.classList.remove('active');
        });
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
        
        btn.classList.add('active');
        const activeView = document.getElementById(targetTab);
        if (activeView) {
            activeView.classList.add('active');
            
            // Dynamiczne doładowywanie zależności pod konkretne zakładki
            if (targetTab === 'tab-cloud-identifier') {
                await ensureCloudsDependencies();
            }
            
            // Dynamic loading dla partials
            const src = activeView.getAttribute('data-src');
            if (src && !activeView.hasAttribute('data-loaded')) {
                activeView.setAttribute('data-loaded', 'true');
                try {
                    const fetchUrl = src + (src.includes('?') ? '&' : '?') + 'v=22';
                    const res = await fetch(fetchUrl);
                    if (!res.ok) throw new Error('Błąd HTTP: ' + res.status);
                    const html = await res.text();
                    activeView.innerHTML = html;
                    
                    if (window.Alpine && typeof window.Alpine.initTree === 'function') {
                        window.Alpine.initTree(activeView);
                    }
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                } catch (err) {
                    activeView.innerHTML = `<div style="padding: 2rem; color: var(--accent-danger); text-align: center;">Nie udało się załadować widoku: ${err.message}</div>`;
                    activeView.removeAttribute('data-loaded');
                }
            } else {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            window.dispatchEvent(new Event('resize'));
        }
    });
});
