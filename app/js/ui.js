// ui.js
// Obsługa zakładek i ikon oraz image fallbacks

document.addEventListener('DOMContentLoaded', function() {
    // 0. Render Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 1. Direct Image Fallbacks
    const setSrc = (id, url) => {
        const el = document.getElementById(id);
        if (el && url) el.src = url;
    };
    
    setSrc('dash-sigwx-pl', 'https://aviation-api.imgw.pl/image/significant/pl');
    setSrc('dash-sigwx-cz', 'https://aviation-api.imgw.pl/image/significant/cz');
    setSrc('img-meteo-wroclaw', 'https://www.meteo.pl/um/metco/mgram_pict.php?ntype=0u&row=436&col=181&lang=pl');

    // 2. Global Event Listener for Tab Buttons & Navigation Links
    document.addEventListener('click', function(e) {
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
            
            // Dynamic loading for partials
            const src = activeView.getAttribute('data-src');
            if (src && !activeView.hasAttribute('data-loaded')) {
                activeView.setAttribute('data-loaded', 'true');
                fetch(src)
                    .then(res => {
                        if(!res.ok) throw new Error('Błąd ładowania: ' + res.status);
                        return res.text();
                    })
                    .then(html => {
                        activeView.innerHTML = html;
                        // Jeśli wewnątrz były jakieś skrypty z inicjalizacją (np. mapy), trzeba by je wywołać,
                        // ale większość jest ujęta globalnie. Jeśli Alpine.js jest załadowany, sam przechwyci zmiany (MutationObserver).
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                        
                        // Wyjątek: Kreator map musi zostać zainicjowany jeśli właśnie został załadowany
                        if (targetTab === 'tab-kreator' && typeof window.initKreator === 'function') {
                            setTimeout(() => {
                                window.initKreator();
                                if(window.kMap) window.kMap.invalidateSize();
                            }, 100);
                        }
                        if (targetTab === 'tab-mapa' && typeof window.initMapa === 'function') {
                            setTimeout(() => {
                                window.initMapa();
                                if(window.premiumMap) window.premiumMap.invalidateSize();
                            }, 100);
                        }
                    })
                    .catch(err => {
                        activeView.innerHTML = `<div style="padding: 2rem; color: var(--accent-danger); text-align: center;">Nie udało się załadować widoku: ${err.message}</div>`;
                        activeView.removeAttribute('data-loaded');
                    });
            } else {
                if (typeof lucide !== 'undefined') lucide.createIcons();
                // Specjalne dla kreatora: jeśli mapa już była, trzeba jej wymusić przerysowanie po zmianie rozmiaru okna/widoku
                if (targetTab === 'tab-kreator' && typeof window.initKreator === 'function') {
                     setTimeout(() => {
                         window.initKreator();
                         if(window.kMap) window.kMap.invalidateSize();
                     }, 100);
                }
                if (targetTab === 'tab-mapa' && typeof window.initMapa === 'function') {
                     setTimeout(() => {
                         window.initMapa();
                         if(window.premiumMap) window.premiumMap.invalidateSize();
                     }, 100);
                }
            }

            window.dispatchEvent(new Event('resize'));
        }
    });
});
