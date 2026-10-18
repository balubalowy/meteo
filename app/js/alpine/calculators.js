// js/alpine/calculators.js - Kalkulatory meteorologiczne i fizyczne dla Alpine.js

(function() {
    function registerCalculators() {
        if (!window.Alpine) return;

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
                return ((this.dcape / 980) * (this.mucape / 2000) * (this.dls / (20 * 0.5144)) * (this.mw / (16 * 0.5144))).toFixed(2);
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
                const a = 17.27, b = 237.7;
                const alpha = ((a * this.t) / (b + this.t)) + Math.log(this.rh / 100);
                this.td = parseFloat(((b * alpha) / (a - alpha)).toFixed(1));
                this.lastCalc = 'Punkt rosy (Td): ' + this.td + ' °C';
            },
            calcRh() {
                const a = 17.27, b = 237.7;
                const e = 6.112 * Math.exp((a * this.td) / (b + this.td));
                const es = 6.112 * Math.exp((a * this.t) / (b + this.t));
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

        Alpine.data('calcElevation', () => ({
            dist: 30,
            distUnit: 'km',
            height: 1525,
            heightUnit: 'ft',
            obsHeight: 1.8,

            get distMeters() {
                if (this.distUnit === 'km') return (this.dist || 0) * 1000;
                if (this.distUnit === 'mi') return (this.dist || 0) * 1609.344;
                return this.dist || 0;
            },
            get heightMeters() {
                if (this.heightUnit === 'ft') return (this.height || 0) * 0.3048;
                if (this.heightUnit === 'km') return (this.height || 0) * 1000;
                return this.height || 0;
            },
            get deltaH() {
                return Math.max(0, this.heightMeters - (this.obsHeight || 0));
            },
            get alphaDeg() {
                if (this.distMeters <= 0) return 90;
                const rad = Math.atan2(this.deltaH, this.distMeters);
                return (rad * 180 / Math.PI);
            },
            get alphaFormatted() { return this.alphaDeg.toFixed(2); },
            get alphaArcMin() { return (this.alphaDeg * 60).toFixed(1); },
            get slantRange() {
                const d = Math.sqrt(this.distMeters * this.distMeters + this.deltaH * this.deltaH);
                return d >= 1000 ? (d / 1000).toFixed(2) + ' km' : d.toFixed(0) + ' m';
            },
            get earthCurvDrop() {
                return (Math.pow(this.distMeters, 2) / (2 * 6371000)).toFixed(1);
            },
            get alphaWithCurv() {
                const effH = this.deltaH - (Math.pow(this.distMeters, 2) / (2 * 6371000));
                const rad = Math.atan2(effH, this.distMeters);
                return (rad * 180 / Math.PI).toFixed(2);
            },
            get svgPoints() {
                const angleForVis = Math.min(38, Math.max(8, this.alphaDeg * 4));
                const rad = angleForVis * Math.PI / 180;
                const baseW = 240;
                const targetX = 290;
                const targetY = 145 - Math.tan(rad) * baseW;
                return { obsX: 50, obsY: 145, targetX, targetY: Math.max(25, targetY), baseX: targetX, baseY: 145 };
            }
        }));
    }

    document.addEventListener('alpine:init', registerCalculators);
    if (window.Alpine) registerCalculators();
})();
