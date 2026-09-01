// js/cloud-identifier.js - Baza synoptyczna i prognostyczna klasyfikatora chmur WMO

window.CLOUD_FORECAST_DATA = {
    "Cirrus": {
        level: "Piętro wysokie (6 – 12 km)",
        composition: "Kryształki lodu",
        base_forecast: "Zwiastun zmian pogody w wyższej troposferze. Pojedyncze włókna oznaczają stabilność, ale ich gęstnienie zapowiada front.",
        threat: "Niskie",
        threat_color: "#22c55e",
        species_info: {
            "fibratus": "Włókniste pasma bez haczyków. Często towarzyszą prądowi strumieniowemu (jet stream).",
            "uncinus": "Charakterystyczne haczyki/pazury (tzw. 'końskie ogony'). Silny zwiastun zbliżającego się ciepłego frontu (opad za 12–24h).",
            "spissatus": "Gęste płaty Cirrus, często pozostałość po rozpadłym kowadle burzowym (anvil).",
            "castellanus": "Wieżyczki w piętrze wysokim — wskaźnik niestabilności w górnej troposferze.",
            "floccus": "Kępki z opadającymi smugami virga — niestabilność termodynamiczna."
        },
        features_info: {
            "mamma": "Rzadkie wypustki workowate — silne uskoki wiatru na dużych wysokościach.",
            "fluctus": "Fale Kelvina-Helmholtza — silny pionowy uskok wiatru (DLS) w warstwie chmury."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-cirrus.html"
    },
    "Cirrocumulus": {
        level: "Piętro wysokie (6 – 10 km)",
        composition: "Kryształki lodu, silnie przechłodzone kropelki",
        base_forecast: "Drobne 'baranki'. Oznaczają niestabilność i adwekcję chłodu w górnej troposferze. Zwiastują załamanie pogody.",
        threat: "Niskie",
        threat_color: "#22c55e",
        species_info: {
            "stratiformis": "Rozległa ławica drobnych członów — adwekcja wilgoci w górnych warstwach.",
            "lenticularis": "Chmury soczewkowate wywołane falami orograficznymi nad górami.",
            "castellanus": "Wieżyczki w piętrze wysokim — poprzedza rozwój głębokiej konwekcji.",
            "floccus": "Kłębkowate kępki — konwekcja na dużej wysokości."
        },
        features_info: {
            "cavum": "Dziurawiec (fallstreak hole) — lokalne zamarzanie przechłodzonych kropel po przelocie samolotu.",
            "virga": "Pasma lodu parujące przed dotarciem do ziemi."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-cirrocumulus.html"
    },
    "Cirrostratus": {
        level: "Piętro wysokie (6 – 12 km)",
        composition: "Kryształki lodu",
        base_forecast: "Mleczna, cienka zasłona. Wywołuje zjawiska optyczne halo (22°, słońca poboczne). Pewny zwiastun ciepłego frontu (opad ciągły za 8–15h).",
        threat: "Niskie / Zwiastun opadów",
        threat_color: "#38bdf8",
        species_info: {
            "fibratus": "Włóknista zasłona z widoczną strukturą pasm.",
            "nebulosus": "Mleczna, jednolita mgiełka dająca najsilniejsze i najczystsze zjawiska halo."
        },
        features_info: {},
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-cirrostratus.html"
    },
    "Altocumulus": {
        level: "Piętro średnie (2 – 6 km)",
        composition: "Kropelki wody, w niższych temperaturach lód",
        base_forecast: "Chmury piętra średniego w formie płatów lub walców. Castellanus rano = burze po południu.",
        threat: "Umiarkowane (wskaźnik konwekcji)",
        threat_color: "#eab308",
        species_info: {
            "castellanus": "Wieżyczki w piętrze średnim — kluczowy wskaźnik niestabilności termodynamicznej. Zwiastuje gwałtowne burze popołudniowe/wieczorne.",
            "floccus": "Kępki z poszarpanymi podstawami dające virga — niestabilność w warstwie średniej.",
            "stratiformis": "Płaska ławica chmur średnich — pogoda przejściowa.",
            "lenticularis": "Falowe chmury soczewkowate — zwiastun silnego wiatru na wysokościach (wiatr halny/fen).",
            "volutus": "Oderwany wirujący wał chmurowy w piętrze średnim."
        },
        features_info: {
            "asperitas": "Mroczne, silnie pofałdowane dno chmury wywołane falami grawitacyjnymi. Duża dynamika troposfery.",
            "mamma": "Workowate wypukłości — turbulencje i prądy zstępujące.",
            "virga": "Opad niedocierający do gruntu — ryzyko lokalnych suchych szkwałów (microburst)."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-altocumulus.html"
    },
    "Altostratus": {
        level: "Piętro średnie (2 – 5 km)",
        composition: "Kropelki wody i kryształki lodu",
        base_forecast: "Szara lub niebieskawa warstwa zasłaniająca całe niebo. Słońce jak przez matowe szkło. Zwiastuje ciągłe opady w ciągu 2–6h.",
        threat: "Umiarkowane (opad)",
        threat_color: "#38bdf8",
        species_info: {},
        features_info: {
            "praecipitatio": "Opad deszczu lub śniegu docierający do ziemi.",
            "virga": "Smugi opadu parujące pod podstawą.",
            "pannus": "Poszarpane chmury kłębiące się pod podstawą we wznoszącym powietrzu."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-altostratus.html"
    },
    "Nimbostratus": {
        level: "Piętro średnie i niskie (0.5 – 3 km)",
        composition: "Krople wody, przechłodzona woda, śnieg",
        base_forecast: "Gruba, ciemnoszara warstwa chmur zasłaniająca słońce całkowicie. Czego się spodziewać: wielogodzinny, ciągły opad deszczu lub śniegu o umiarkowanym/dużym natężeniu.",
        threat: "Wysokie (ciągły opad, słaba widzialność)",
        threat_color: "#f97316",
        species_info: {},
        features_info: {
            "praecipitatio": "Ciągły opad o zasięgu regionalnym.",
            "pannus": "Niskie, szybko przemieszczające się poszarpane strzępy chmurowe pod podstawą."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-nimbostratus.html"
    },
    "Stratocumulus": {
        level: "Piętro niskie (0.5 – 2 km)",
        composition: "Kropelki wody",
        base_forecast: "Płaty, bryły lub walce o szarej barwie. Oznacza stabilną masę powietrza lub warstwę podinwersyjną. Możliwa słaba mżawka.",
        threat: "Niskie",
        threat_color: "#22c55e",
        species_info: {
            "stratiformis": "Ciągła warstwa chmur podinwersyjnych (tzw. zgniły wyż).",
            "lenticularis": "Soczewki w niskich warstwach.",
            "castellanus": "Niska niestabilność w warstwie granicznej.",
            "volutus": "Chmura rotorowa (roll cloud) w dolnej troposferze."
        },
        features_info: {
            "mamma": "Rzadkie wypustki pod warstwą Stratocumulus.",
            "asperitas": "Fale grawitacyjne pod inwersją osiadania."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-stratocumulus.html"
    },
    "Stratus": {
        level: "Piętro niskie (0 – 0.5 km)",
        composition: "Drobne kropelki wody",
        base_forecast: "Niska, jednolita szara warstwa (podnosząca się mgła). Czego się spodziewać: mżawka, słaba widzialność pozioma, inwersja termiczna.",
        threat: "Umiarkowane (widzialność)",
        threat_color: "#38bdf8",
        species_info: {
            "nebulosus": "Jednolita, bezpostaciowa zasłona.",
            "fractus": "Poszarpane strzępy chmurowe tuż nad ziemią."
        },
        features_info: {
            "praecipitatio": "Opad drobnej mżawki lub słupków lodowych."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-stratus.html"
    },
    "Cumulus": {
        level: "Piętro niskie i pionowe (0.5 – 3+ km)",
        composition: "Kropelki wody, w wyższych partiach lód",
        base_forecast: "Pojedyncze chmury kłębiaste o płaskiej podstawie. Stopień rozwoju pionowego decyduje o możliwości wystąpienia opadu.",
        threat: "Od Niskiego do Wysokiego",
        threat_color: "#eab308",
        species_info: {
            "humilis": "Chmury pięknej pogody o małej grubości pionowej. Zwiastują stabilną atmosferę i brak opadów.",
            "mediocris": "Umiarkowany rozwój pionowy — postępująca konwekcja termiczna.",
            "congestus": "Cumulus wieżowaty ('kalafior'). Silny rozwój pionowy — bezpośredni zwiastun burzy i opadów przelotnych.",
            "fractus": "Poszarpane chmury kłębiaste przy silnym wietrze."
        },
        features_info: {
            "pileus": "Czapeczka ponad wierzchołkiem — dowód bardzo silnego i szybkiego prądu wstępującego.",
            "arcus": "Wał szkwałowy na czele chmury konwekcyjnej — silny szkwał i prąd zstępujący.",
            "tuba": "Lej kondensacyjny (zalążek trąby powietrznej/wodnej)."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-cumulus.html"
    },
    "Cumulonimbus": {
        level: "Rozwój pionowy (0.5 – 12+ km)",
        composition: "Krople wody, przechłodzona woda, śnieg, grad, lód",
        base_forecast: "Potężna chmura burzowa sięgająca tropopauzy. Czego się spodziewać: wyładowania atmosferyczne, ulewy, gradobicia, niszczące porywy wiatru (downburst), ryzyko trąb powietrznych.",
        threat: "BARDZO WYSOKIE / EKSTREMALNE",
        threat_color: "#ef4444",
        species_info: {
            "calvus": "Młody Cumulonimbus — zlodzony wierzchołek bez wykształconego kowadła.",
            "capillatus": "Dojrzały Cumulonimbus z wielkim pierzastym kowadłem (incus) wierzchołka."
        },
        features_info: {
            "incus": "Kowadło burzowe osiągające inwersję tropopauzy.",
            "mamma": "Mammatus pod kowadłem — ekstremalne turbulencje i prądy zstępujące.",
            "arcus": "Wał szkwałowy (shelf cloud) na czole burzy — gwałtowny szkwał i spadek temperatury.",
            "murus": "Chmura stropowa (wall cloud) — strefa rotacji mezocyklonu superkomórki i ryzyka trąby.",
            "tuba": "Lej trąby powietrznej schodzący z podstawy ku ziemi.",
            "praecipitatio": "Ściana nawalnego deszczu i gradu."
        },
        wmo_url: "https://cloudatlas.wmo.int/en/clouds-genus-cumulonimbus.html"
    }
};
