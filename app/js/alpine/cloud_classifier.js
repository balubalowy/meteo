// js/alpine/cloud_classifier.js - Komponent klasyfikatora chmur dla Alpine.js

(function() {
    function registerCloudClassifier() {
        if (!window.Alpine) return;

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

            get fullCloudName() {
                if (this.rodzaj === "Brak") return "";
                let name = this.rodzaj;
                if (this.gatunek !== "Brak") name += " " + this.gatunek;
                if (this.odmiana !== "Brak") name += " " + this.odmiana;
                if (this.forma !== "Brak") name += " " + this.forma;
                return name;
            },

            get forecastInfo() {
                if (this.rodzaj === "Brak" || !window.CLOUD_FORECAST_DATA) return null;
                const data = window.CLOUD_FORECAST_DATA[this.rodzaj];
                if (!data) return null;

                let specificForecast = data.base_forecast;
                if (this.gatunek !== "Brak" && data.species_info?.[this.gatunek]) {
                    specificForecast += " " + data.species_info[this.gatunek];
                }
                if (this.forma !== "Brak" && data.features_info?.[this.forma]) {
                    specificForecast += " " + data.features_info[this.forma];
                }

                return {
                    genus: this.rodzaj,
                    level: data.level,
                    composition: data.composition,
                    forecast: specificForecast,
                    threat: data.threat,
                    threat_color: data.threat_color,
                    wmo_url: data.wmo_url
                };
            },

            szukajWGoogle() {
                if (this.rodzaj === "Brak") {
                    alert("Wybierz przynajmniej Rodzaj chmury!");
                    return;
                }
                const query = this.fullCloudName + " cloud";
                window.open("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(query), "_blank");
            }
        }));
    }

    document.addEventListener('alpine:init', registerCloudClassifier);
    if (window.Alpine) registerCloudClassifier();
})();
