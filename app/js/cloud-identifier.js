// cloud-identifier.js
// Logika dla interaktywnego kreatora chmur (WMO Cloud Hierarchy)

const wmoCloudData = {
    "Cirrus (Ci)": {
        "species": ["fibratus", "uncinus", "spissatus", "castellanus", "floccus"],
        "varieties": ["intortus", "radiatus", "vertebratus", "duplicatus"],
        "features": ["mamma", "fluctus"]
    },
    "Cirrocumulus (Cc)": {
        "species": ["stratiformis", "lenticularis", "castellanus", "floccus"],
        "varieties": ["undulatus", "lacunosus"],
        "features": ["virga", "mamma", "cavum", "fluctus"]
    },
    "Cirrostratus (Cs)": {
        "species": ["fibratus", "nebulosus"],
        "varieties": ["duplicatus", "undulatus"],
        "features": []
    },
    "Altocumulus (Ac)": {
        "species": ["stratiformis", "lenticularis", "castellanus", "floccus", "volutus"],
        "varieties": ["translucidus", "perlucidus", "opacus", "duplicatus", "undulatus", "radiatus", "lacunosus"],
        "features": ["virga", "mamma", "cavum", "fluctus", "asperitas"]
    },
    "Altostratus (As)": {
        "species": [],
        "varieties": ["translucidus", "opacus", "duplicatus", "undulatus", "radiatus"],
        "features": ["virga", "praecipitatio", "mamma"]
    },
    "Nimbostratus (Ns)": {
        "species": [],
        "varieties": [],
        "features": ["praecipitatio", "virga", "pannus"]
    },
    "Stratocumulus (Sc)": {
        "species": ["stratiformis", "lenticularis", "castellanus", "floccus", "volutus"],
        "varieties": ["translucidus", "perlucidus", "opacus", "duplicatus", "undulatus", "radiatus", "lacunosus"],
        "features": ["mamma", "virga", "praecipitatio", "asperitas", "cavum", "fluctus"]
    },
    "Stratus (St)": {
        "species": ["nebulosus", "fractus"],
        "varieties": ["opacus", "translucidus", "undulatus"],
        "features": ["praecipitatio", "fluctus"]
    },
    "Cumulus (Cu)": {
        "species": ["humilis", "mediocris", "congestus", "fractus"],
        "varieties": ["radiatus"],
        "features": ["pileus", "velum", "virga", "praecipitatio", "arcus", "pannus", "tuba"]
    },
    "Cumulonimbus (Cb)": {
        "species": ["calvus", "capillatus"],
        "varieties": [],
        "features": ["incus", "mamma", "virga", "praecipitatio", "arcus", "tuba", "murus", "cauda", "flumen", "pannus", "pileus", "velum"]
    }
};

document.addEventListener('alpine:init', () => {
    Alpine.data('cloudIdentifier', () => ({
        wmoData: wmoCloudData,
        selectedGenus: '',
        selectedSpecies: '',
        selectedVariety: '',
        selectedFeature: '',
        
        get availableSpecies() {
            return this.selectedGenus ? this.wmoData[this.selectedGenus].species : [];
        },
        
        get availableVarieties() {
            return this.selectedGenus ? this.wmoData[this.selectedGenus].varieties : [];
        },
        
        get availableFeatures() {
            return this.selectedGenus ? this.wmoData[this.selectedGenus].features : [];
        },
        
        get finalCloudName() {
            if (!this.selectedGenus) return '';
            const genus = this.selectedGenus.split(' (')[0];
            let name = genus;
            if (this.selectedSpecies) name += ' ' + this.selectedSpecies;
            if (this.selectedVariety) name += ' ' + this.selectedVariety;
            if (this.selectedFeature) name += ' ' + this.selectedFeature;
            return name;
        },
        
        get googleSearchLink() {
            if (!this.finalCloudName) return '#';
            return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(this.finalCloudName + ' cloud')}`;
        },
        
        get wmoAtlasLink() {
            if (!this.selectedGenus) return '#';
            // WMO używa prostego formatu, ale dla bezpieczeństwa używamy wyszukiwarki WMO
            return `https://cloudatlas.wmo.int/en/search.html?q=${encodeURIComponent(this.finalCloudName)}`;
        },
        
        resetSelections(level) {
            if (level === 'genus') {
                this.selectedSpecies = '';
                this.selectedVariety = '';
                this.selectedFeature = '';
            }
        }
    }));
});
