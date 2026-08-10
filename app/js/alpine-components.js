// alpine-components.js
// Komponenty i logika dla Alpine.js

document.addEventListener('alpine:init', () => {

    // 1. SOB Tile (Prognoza)
    Alpine.data('sobTile', () => ({
        sobImg: '',
        loading: true,
        async fetchSOB() {
            try {
                const res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://obserwatorzy.info/prognoza-burz/'));
                const htmlText = await res.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const imgs = Array.from(doc.querySelectorAll('img'));
                const targetImg = imgs.find(img => img.src && (img.src.includes('forecast') || img.src.includes('sob') || img.src.includes('prognoza')));
                if (targetImg) {
                    this.sobImg = targetImg.src.replace('https://corsproxy.io/?', ''); 
                    // Sometimes corsproxy might prepend its URL if relative paths are used incorrectly, just in case
                } else {
                    this.sobImg = 'https://obserwatorzy.info/wp-content/uploads/2026/08/forecast-20260807.png';
                }
            } catch(e) {
                console.error("Błąd obserwatorzy:", e);
                this.sobImg = 'https://obserwatorzy.info/wp-content/uploads/2026/08/forecast-20260807.png';
            }
            this.loading = false;
        }
    }));

    // 2. Skala IF
    Alpine.data('ifEvaluator', () => ({
        diId: '',
        subCode: '',
        dodVal: 1,
        get currentDi() {
            return this.meteo.damageIndicators.find(d => d.id === this.diId) || this.meteo.damageIndicators[0];
        },
        init() {
            if (this.meteo.damageIndicators && this.meteo.damageIndicators.length > 0) {
                this.diId = this.meteo.damageIndicators[0].id;
                this.subCode = this.meteo.damageIndicators[0].subclasses[0].code;
            }
            this.$watch('diId', () => {
                if (this.currentDi && this.currentDi.subclasses.length > 0) {
                    this.subCode = this.currentDi.subclasses[0].code;
                }
            });
        },
        get resultObj() {
            if (!this.subCode || !this.meteo.ifScaleClasses) return null;
            let rating = 'IF1';
            let sub = this.subCode;
            let dod = parseInt(this.dodVal) || 1;
            
            const map = {
                'BSA': {1: 'IF0.5', 2: 'IF1',   3: 'IF2'},
                'BSB': {1: 'IF1',   2: 'IF1.5', 3: 'IF2.5'},
                'BSC': {1: 'IF1.5', 2: 'IF2',   3: 'IF3'},
                'BSD': {1: 'IF1.5', 2: 'IF2.5', 3: 'IF4'},
                'BSE': {1: 'IF2',   2: 'IF3',   3: 'IF5'}, // Zawalenie solidnych domów
                'BSF': {1: 'IF2.5', 2: 'IF4',   3: 'IF5'}, // Zawalenie budynków żelbetowych
                
                'BRA': {1: 'IF0.5', 2: 'IF1',   3: 'IF1.5'},
                'BRD': {1: 'IF1',   2: 'IF2',   3: 'IF2.5'},
                'BRE': {1: 'IF1.5', 2: 'IF2.5', 3: 'IF3'},
                
                'TRW': {1: 'IF0.5', 2: 'IF1',   3: 'IF1.5'},
                'TRA': {1: 'IF1',   2: 'IF1.5', 3: 'IF2'},
                'TRS': {1: 'IF1.5', 2: 'IF2',   3: 'IF2.5'},
                
                'TSW': {1: 'IF1',   2: 'IF1.5', 3: 'IF2'},
                'TSA': {1: 'IF1.5', 2: 'IF2',   3: 'IF2.5'},
                'TSS': {1: 'IF2',   2: 'IF2.5', 3: 'IF3'},
                
                'VHT': {1: 'IF0.5', 2: 'IF1',   3: 'IF1.5'},
                'VHE': {1: 'IF1',   2: 'IF2',   3: 'IF2.5'},
                'VHC': {1: 'IF1.5', 2: 'IF2.5', 3: 'IF3'},
                'VHL': {1: 'IF2',   2: 'IF3',   3: 'IF4'},
                
                'PTW': {1: 'IF0.5', 2: 'IF1',   3: 'IF1.5'},
                'PTS': {1: 'IF1.5', 2: 'IF2.5', 3: 'IF3'},
                'PTT': {1: 'IF2',   2: 'IF3',   3: 'IF4'},
                
                'SCA': {1: 'IF1',   2: 'IF1.5', 3: 'IF2'},
                'SCD': {1: 'IF1.5', 2: 'IF2',   3: 'IF2.5'},
                'SCF': {1: 'IF2',   2: 'IF3',   3: 'IF4'},
            };
            
            if (map[sub] && map[sub][dod]) {
                rating = map[sub][dod];
            } else {
                rating = (dod === 1) ? 'IF1' : (dod === 2) ? 'IF2' : 'IF3';
            }
            
            return this.meteo.ifScaleClasses.find(c => c.code === rating) || this.meteo.ifScaleClasses[2];
        },
        getBadgeColor(code) {
            const colors = {
                'IF0': 'linear-gradient(135deg, #10B981, #059669)', 
                'IF0.5': 'linear-gradient(135deg, #34D399, #10B981)', 
                'IF1': 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                'IF1.5': 'linear-gradient(135deg, #F59E0B, #D97706)', 
                'IF2': 'linear-gradient(135deg, #F87171, #EF4444)', 
                'IF2.5': 'linear-gradient(135deg, #EF4444, #DC2626)',
                'IF3': 'linear-gradient(135deg, #DC2626, #991B1B)', 
                'IF4': 'linear-gradient(135deg, #8B5CF6, #6D28D9)', 
                'IF5': 'linear-gradient(135deg, #4C1D95, #312E81)'
            };
            return colors[code] || 'linear-gradient(135deg, #3B82F6, #2563EB)';
        },
        getExampleImage(code) {
            const examples = {
                'IF0': 'assets/img/wiedza/if_scale_0.png',
                'IF0.5': 'assets/img/wiedza/if_scale_1.png',
                'IF1': 'assets/img/wiedza/if_scale_2.png',
                'IF1.5': 'assets/img/wiedza/if_scale_6.png',
                'IF2': 'assets/img/wiedza/if_scale_9.png',
                'IF2.5': 'assets/img/wiedza/if_scale_10.png',
                'IF3': 'assets/img/wiedza/if_scale_12.png',
                'IF4': 'assets/img/wiedza/if_scale_13.png',
                'IF5': 'assets/img/wiedza/if_scale_14.png'
            };
            return examples[code] || 'assets/img/wiedza/if_scale_0.png';
        }
    }));

    // 3. Kalkulatory
    Alpine.data('calcWind', () => ({
        val: 100, 
        unit: 'kmh', 
        get kmh() { 
            return this.unit === 'kmh' ? this.val : this.unit === 'ms' ? this.val * 3.6 : this.val * 1.852; 
        }
    }));

    Alpine.data('calcDcp', () => ({
        dcape: 1000, 
        mucape: 2500, 
        dls: 22, 
        mw: 18, 
        get dcp() { 
            return ((this.dcape/980)*(this.mucape/2000)*(this.dls/(20*0.5144))*(this.mw/(16*0.5144))).toFixed(2); 
        }
    }));

    Alpine.data('calcWmax', () => ({
        cape: 2000, 
        get wmax() { return Math.sqrt(2 * this.cape); }
    }));

    Alpine.data('calcLcl', () => ({
        t: 25.0, 
        td: 18.0, 
        get lcl() { return Math.max(0, 125 * (this.t - this.td)).toFixed(0); }
    }));

    Alpine.data('calcMagnus', () => ({
        t: 20.0,
        rh: 50,
        td: 9.3,
        lastCalc: 'Wpisz dane aby przeliczyć...',
        calcTd() {
            let a = 17.27, b = 237.7;
            let alpha = ((a * this.t) / (b + this.t)) + Math.log(this.rh / 100);
            this.td = parseFloat(((b * alpha) / (a - alpha)).toFixed(1));
            this.lastCalc = 'Punkt rosy (Td): ' + this.td + ' °C';
        },
        calcRh() {
            let a = 17.27, b = 237.7;
            let e = 6.112 * Math.exp((a * this.td) / (b + this.td));
            let es = 6.112 * Math.exp((a * this.t) / (b + this.t));
            this.rh = Math.min(100, Math.max(0, (e / es) * 100)).toFixed(1);
            this.lastCalc = 'Wilgotność (RH): ' + this.rh + ' %';
        }
    }));

    Alpine.data('calcWindChill', () => ({
        t: -5.0,
        v: 20.0,
        get windChill() {
            if (this.t > 10.0 || this.v < 4.8) return this.t.toFixed(1);
            const vPow = Math.pow(this.v, 0.16);
            const twc = 13.12 + 0.6215 * this.t - 11.37 * vPow + 0.3965 * this.t * vPow;
            return twc.toFixed(1);
        }
    }));

    // 4. Alert Rules (Ostrzeżenia SOB)
    Alpine.data('alertRules', () => ({
        state: { wind: 0, torn: 0, hail: 0, rain: 0 },
        levelDetails: {
            1: { code: 'MRG', color: '#22c55e', name: 'MRG (Marginalne - 1/5)', desc: 'Niskie ryzyko zjawisk burzowych.' },
            2: { code: 'NWL', color: '#eab308', name: 'NWL (Niewielkie - 2/5)', desc: 'Umiarkowanie groźne burze.' },
            3: { code: 'SRD', color: '#f97316', name: 'SRD (Średnie - 3/5)', desc: 'Niebezpieczne, silne burze.' },
            4: { code: 'DZ',  color: '#ef4444', name: 'DZ (Duże - 4/5)', desc: 'Bardzo groźne burze / Nawałnice.' },
            5: { code: 'EXT', color: '#b91c1c', name: 'EXT (Ekstremalne - 5/5)', desc: 'Katastrofalne zjawiska, np. Derecho.' }
        },
        selectCell(cat, val) {
            this.state[cat] = val;
        },
        get maxVal() {
            return Math.max(this.state.wind, this.state.torn, this.state.hail, this.state.rain);
        },
        get result() {
            if (this.maxVal === 0) return null;
            return this.levelDetails[this.maxVal];
        }
    }));

    // 5. Baza Wiedzy (Wielki System)
    Alpine.data('knowledgeBase', () => ({
        categories: [],
        activeCategory: null,
        searchQuery: '',
        
        init() {
            if (window.KNOWLEDGE_BASE) {
                this.categories = window.KNOWLEDGE_BASE;
                if (this.categories.length > 0) {
                    this.activeCategory = this.categories[0];
                }
            }
        },
        
        selectCategory(cat) {
            this.activeCategory = cat;
            this.searchQuery = '';
        },
        
        get filteredItems() {
            if (!this.activeCategory) return [];
            
            let items = this.activeCategory.items;
            if (this.searchQuery.trim() !== '') {
                const q = this.searchQuery.toLowerCase();
                items = items.filter(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
            }
            return items;
        }
    }));

    // 6. Klasyfikator Chmur
    Alpine.data('cloudClassifier', () => ({
        matrix: {
            "Cirrus": {
                gatunki: ["Brak", "fibratus", "uncinus", "spissatus", "castellanus", "floccus"],
                odmiany: ["Brak", "intortus", "radiatus", "vertebratus", "duplicatus"],
                formy: ["Brak", "mamma", "fluctus"]
            },
            "Cirrocumulus": {
                gatunki: ["Brak", "stratiformis", "lenticularis", "castellanus", "floccus"],
                odmiany: ["Brak", "undulatus", "lacunosus"],
                formy: ["Brak", "virga", "mamma", "cavum"]
            },
            "Cirrostratus": {
                gatunki: ["Brak", "fibratus", "nebulosus"],
                odmiany: ["Brak", "duplicatus", "undulatus"],
                formy: ["Brak"]
            },
            "Altocumulus": {
                gatunki: ["Brak", "stratiformis", "lenticularis", "castellanus", "floccus", "volutus"],
                odmiany: ["Brak", "translucidus", "perlucidus", "opacus", "duplicatus", "undulatus", "radiatus", "lacunosus"],
                formy: ["Brak", "virga", "mamma", "cavum", "fluctus", "asperitas"]
            },
            "Altostratus": {
                gatunki: ["Brak"],
                odmiany: ["Brak", "translucidus", "opacus", "duplicatus", "undulatus", "radiatus"],
                formy: ["Brak", "virga", "praecipitatio", "pannus", "mamma"]
            },
            "Stratocumulus": {
                gatunki: ["Brak", "stratiformis", "lenticularis", "castellanus", "floccus", "volutus"],
                odmiany: ["Brak", "translucidus", "perlucidus", "opacus", "duplicatus", "undulatus", "radiatus", "lacunosus"],
                formy: ["Brak", "virga", "mamma", "praecipitatio", "fluctus", "asperitas", "cavum"]
            },
            "Stratus": {
                gatunki: ["Brak", "nebulosus", "fractus"],
                odmiany: ["Brak", "opacus", "translucidus", "undulatus"],
                formy: ["Brak", "praecipitatio", "fluctus"]
            },
            "Cumulus": {
                gatunki: ["Brak", "humilis", "mediocris", "congestus", "fractus"],
                odmiany: ["Brak", "radiatus"],
                formy: ["Brak", "virga", "praecipitatio", "pileus", "velum", "arcus", "pannus", "fluctus", "tuba"]
            },
            "Nimbostratus": {
                gatunki: ["Brak"],
                odmiany: ["Brak"],
                formy: ["Brak", "praecipitatio", "virga", "pannus"]
            },
            "Cumulonimbus": {
                gatunki: ["Brak", "calvus", "capillatus"],
                odmiany: ["Brak"],
                formy: ["Brak", "praecipitatio", "virga", "pannus", "incus", "mamma", "pileus", "velum", "arcus", "murus", "cauda", "flumen", "tuba"]
            }
        },
        rodzaj: "Brak",
        gatunek: "Brak",
        odmiana: "Brak",
        forma: "Brak",

        get dostepneGatunki() {
            return this.rodzaj !== "Brak" ? this.matrix[this.rodzaj].gatunki : ["Brak"];
        },
        get dostepneOdmiany() {
            return this.rodzaj !== "Brak" ? this.matrix[this.rodzaj].odmiany : ["Brak"];
        },
        get dostepneFormy() {
            return this.rodzaj !== "Brak" ? this.matrix[this.rodzaj].formy : ["Brak"];
        },

        zmianaRodzaju() {
            this.gatunek = "Brak";
            this.odmiana = "Brak";
            this.forma = "Brak";
        },

        szukajWGoogle() {
            if (this.rodzaj === "Brak") {
                alert("Wybierz przynajmniej Rodzaj chmury!");
                return;
            }
            let query = this.rodzaj;
            if (this.gatunek !== "Brak") query += " " + this.gatunek;
            if (this.odmiana !== "Brak") query += " " + this.odmiana;
            if (this.forma !== "Brak") query += " " + this.forma;
            
            query += " cloud"; // dodajemy "cloud" dla lepszych wynikow
            const url = "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(query);
            window.open(url, "_blank");
        }
    }));
});
