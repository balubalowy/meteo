// js/alpine/knowledge.js - Skala IF, zasady ostrzeżeń i baza wiedzy dla Alpine.js

(function() {
    const IF_RATING_MAP = {
        'BSA': {1: 'IF0.5', 2: 'IF1',   3: 'IF2'},
        'BSB': {1: 'IF1',   2: 'IF1.5', 3: 'IF2.5'},
        'BSC': {1: 'IF1.5', 2: 'IF2',   3: 'IF3'},
        'BSD': {1: 'IF1.5', 2: 'IF2.5', 3: 'IF4'},
        'BSE': {1: 'IF2',   2: 'IF3',   3: 'IF5'},
        'BSF': {1: 'IF2.5', 2: 'IF4',   3: 'IF5'},
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
        'PTS': {1: 'IF1.5', 2: 'IF2',   3: 'IF3'},
        'PTT': {1: 'IF2',   2: 'IF3',   3: 'IF4'},
        'SCA': {1: 'IF1',   2: 'IF1.5', 3: 'IF2'},
        'SCD': {1: 'IF1.5', 2: 'IF2',   3: 'IF2.5'},
        'SCF': {1: 'IF2',   2: 'IF3',   3: 'IF4'}
    };

    const IF_BADGE_COLORS = {
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

    const IF_EXAMPLE_IMAGES = {
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

    function registerKnowledge() {
        if (!window.Alpine) return;

        Alpine.data('ifEvaluator', () => ({
            diId: '',
            subCode: '',
            dodVal: 1,

            get currentDi() {
                return this.meteo.damageIndicators.find(d => d.id === this.diId) || this.meteo.damageIndicators[0];
            },

            init() {
                if (this.meteo.damageIndicators?.length > 0) {
                    this.diId = this.meteo.damageIndicators[0].id;
                    this.subCode = this.meteo.damageIndicators[0].subclasses[0].code;
                }
                this.$watch('diId', () => {
                    if (this.currentDi?.subclasses?.length > 0) {
                        this.subCode = this.currentDi.subclasses[0].code;
                    }
                });
            },

            get resultObj() {
                if (!this.subCode || !this.meteo.ifScaleClasses) return null;
                const dod = parseInt(this.dodVal, 10) || 1;
                const rating = IF_RATING_MAP[this.subCode]?.[dod] || (dod === 1 ? 'IF1' : dod === 2 ? 'IF2' : 'IF3');
                return this.meteo.ifScaleClasses.find(c => c.code === rating) || this.meteo.ifScaleClasses[2];
            },

            getBadgeColor(code) {
                return IF_BADGE_COLORS[code] || 'linear-gradient(135deg, #3B82F6, #2563EB)';
            },

            getExampleImage(code) {
                return IF_EXAMPLE_IMAGES[code] || 'assets/img/wiedza/if_scale_0.png';
            }
        }));

        Alpine.data('alertRules', () => ({
            state: { wind: 0, torn: 0, hail: 0, rain: 0 },
            levelDetails: {
                1: { code: 'MRG', color: '#22c55e', name: 'MRG (Marginalne - 1/5)', desc: 'Niskie ryzyko zjawisk burzowych.' },
                2: { code: 'NWL', color: '#eab308', name: 'NWL (Niewielkie - 2/5)', desc: 'Umiarkowanie groźne burze.' },
                3: { code: 'SRD', color: '#f97316', name: 'SRD (Średnie - 3/5)', desc: 'Niebezpieczne, silne burze.' },
                4: { code: 'DZ',  color: '#ef4444', name: 'DZ (Duże - 4/5)', desc: 'Bardzo groźne burze / Nawałnice.' },
                5: { code: 'EXT', color: '#b91c1c', name: 'EXT (Ekstremalne - 5/5)', desc: 'Katastrofalne zjawiska, np. Derecho.' }
            },
            selectCell(cat, val) { this.state[cat] = val; },
            get maxVal() {
                return Math.max(this.state.wind, this.state.torn, this.state.hail, this.state.rain);
            },
            get result() {
                return this.maxVal === 0 ? null : this.levelDetails[this.maxVal];
            }
        }));

        Alpine.data('knowledgeBase', () => ({
            categories: [],
            activeCategory: null,
            searchQuery: '',

            init() {
                if (window.KNOWLEDGE_BASE?.length > 0) {
                    this.categories = window.KNOWLEDGE_BASE;
                    this.activeCategory = this.categories[0];
                }
            },

            selectCategory(cat) {
                this.activeCategory = cat;
                this.searchQuery = '';
            },

            get filteredItems() {
                if (!this.activeCategory) return [];
                const items = this.activeCategory.items;
                const q = this.searchQuery.trim().toLowerCase();
                return q ? items.filter(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)) : items;
            }
        }));
    }

    document.addEventListener('alpine:init', registerKnowledge);
    if (window.Alpine) registerKnowledge();
})();
