// js/alpine/tiles.js - Kafelki prognoz zewnętrznych (SOB, Skywarn Polska, IMGW Synop)

(function() {
    function registerTiles() {
        if (!window.Alpine) return;

        Alpine.data('sobTile', () => ({
            sobImg: '',
            sobTitle: 'Ładowanie prognozy...',
            loading: true,
            async fetchSOB() {
                try {
                    const res = await fetch('https://obserwatorzy.info/wp-json/wp/v2/media?search=forecast&per_page=5');
                    const data = await res.json();
                    const target = data.find(item => item.source_url && item.source_url.includes('forecast-'));
                    if (target) {
                        this.sobImg = target.source_url;
                        this.sobTitle = (target.title && target.title.rendered) ? target.title.rendered : 'Prognoza Burzowa SOB';
                    }
                } catch (e) {
                    console.error("Błąd pobierania prognozy SOB:", e);
                } finally {
                    this.loading = false;
                }
            }
        }));

        Alpine.data('lowcyTile', () => ({
            lowcyImg: '',
            lowcyTitle: 'Ładowanie prognozy...',
            loading: true,
            async fetchLowcy() {
                try {
                    const res = await fetch('https://lowcyburz.pl/wp-json/wp/v2/posts?search=Prognoza%20konwekcyjna&per_page=3');
                    const data = await res.json();
                    for (const post of data) {
                        const html = (post.content && post.content.rendered) ? post.content.rendered : '';
                        const match = html.match(/https:\/\/lowcyburz\.pl\/wp-content\/uploads\/[^\s"'<>]+\.png/);
                        if (match) {
                            this.lowcyImg = match[0];
                            this.lowcyTitle = (post.title && post.title.rendered) ? post.title.rendered : 'Prognoza Konwekcyjna PŁB';
                            break;
                        }
                    }
                } catch (e) {
                    console.error("Błąd pobierania prognozy Łowców Burz:", e);
                } finally {
                    this.loading = false;
                }
            }
        }));

        Alpine.data('imgwSynopTile', () => ({
            term: '00',
            get synopUrl() {
                return `https://meteo.imgw.pl/data/archiwum_map_synoptycznych/mapa_current_${this.term}.png?t=` + Math.floor(Date.now() / 600000);
            },
            init() {
                const utcHour = new Date().getUTCHours();
                this.term = (utcHour >= 14 || utcHour < 2) ? '12' : '00';
            }
        }));
    }

    document.addEventListener('alpine:init', registerTiles);
    if (window.Alpine) registerTiles();
})();
