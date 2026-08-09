// clouds-data.js
// Ustrukturyzowana baza wiedzy o chmurach i zjawiskach burzowych

window.KNOWLEDGE_BASE = [
    {
        id: "cat-chmury-wysokie",
        name: "Chmury Wysokie (Cirrus)",
        icon: "cloud",
        items: [
            {
                name: "Cirrus (Ci)",
                desc: "Pierzaste, delikatne chmury zbudowane z kryształków lodu. Nie dają opadów, ale ich pojawienie się w dużej ilości zwiastuje nadejście frontu ciepłego.",
                image: "assets/img/placeholder_cirrus.png",
                danger: "Brak"
            },
            {
                name: "Cirrocumulus (Cc)",
                desc: "Małe kłębki wysoko na niebie (tzw. 'baranki'). Zbudowane z lodu. Wskazują na niestabilność w górnej troposferze.",
                image: "assets/img/placeholder_cc.png",
                danger: "Brak"
            },
            {
                name: "Cirrostratus (Cs)",
                desc: "Wysoka, cienka warstwa chmur, przez którą prześwituje słońce lub księżyc. Tworzy zjawisko halo.",
                image: "assets/img/placeholder_cs.png",
                danger: "Brak"
            }
        ]
    },
    {
        id: "cat-chmury-srednie",
        name: "Chmury Średnie (Alto)",
        icon: "cloud-fog",
        items: [
            {
                name: "Altocumulus (Ac)",
                desc: "Średnie chmury kłębiaste. Gdy przybierają formę wieżyczek (Ac castellanus) porankiem, zapowiadają burze popołudniowe.",
                image: "assets/img/placeholder_ac.png",
                danger: "Średnie (Castellanus wskazuje niestabilność)"
            },
            {
                name: "Altostratus (As)",
                desc: "Szara lub niebieskawa warstwa chmur zasłaniająca niebo. Często przynosi ciągły, długotrwały opad (deszcz lub śnieg).",
                image: "assets/img/placeholder_as.png",
                danger: "Brak"
            }
        ]
    },
    {
        id: "cat-chmury-niskie",
        name: "Chmury Niskie",
        icon: "cloud-rain",
        items: [
            {
                name: "Stratus (St)",
                desc: "Niska, jednolita warstwa szarych chmur. Przypomina mgłę uniesioną nad ziemią. Daje mżawkę lub prószący śnieg.",
                image: "assets/img/placeholder_st.png",
                danger: "Ograniczona widzialność"
            },
            {
                name: "Stratocumulus (Sc)",
                desc: "Niskie chmury kłębiasto-warstwowe. Rzadko dają znaczący opad, przeważnie pokrywają niebo w chłodnych porach roku.",
                image: "assets/img/placeholder_sc.png",
                danger: "Brak"
            },
            {
                name: "Nimbostratus (Ns)",
                desc: "Gruba, ciemnoszara chmura opadowa. Zasłania słońce. Przynosi długotrwałe, ciągłe opady o umiarkowanym natężeniu.",
                image: "assets/img/placeholder_ns.png",
                danger: "Zalania (przy długotrwałym opadzie)"
            }
        ]
    },
    {
        id: "cat-chmury-pionowe",
        name: "Chmury Pionowe (Burzowe)",
        icon: "cloud-lightning",
        items: [
            {
                name: "Cumulus (Cu)",
                desc: "Chmury kłębiaste o płaskich podstawach i zaokrąglonych wierzchołkach (tzw. chmury pięknej pogody). W dobrych warunkach termodynamicznych ewoluują.",
                image: "assets/img/placeholder_cu.png",
                danger: "Brak"
            },
            {
                name: "Cumulus congestus (TCu)",
                desc: "Silnie wypiętrzona chmura kłębiasta. Daje przelotne, silne opady, ale jeszcze nie wyładowania.",
                image: "assets/img/placeholder_tcu.png",
                danger: "Silny opad przelotny, turbulencje"
            },
            {
                name: "Cumulonimbus (Cb)",
                desc: "Potężna chmura burzowa, sięgająca tropopauzy. Na szczycie tworzy się kowadło (incus) z kryształków lodu. Przynosi burze, ulewy i grad.",
                image: "assets/img/placeholder_cb.png",
                danger: "Burze, grad, silny wiatr, wyładowania"
            }
        ]
    },
    {
        id: "cat-zjawiska",
        name: "Zjawiska Ekstremalne",
        icon: "tornado",
        items: [
            {
                name: "Tornado",
                desc: "Gwałtownie wirująca kolumna powietrza mająca kontakt z powierzchnią ziemi. Powstaje najczęściej z mezocyklonu superkomórki (choć nie tylko).",
                image: "assets/img/placeholder_tornado.png",
                danger: "Wiatr >100 km/h do nawet 400 km/h. Ekstremalne zagrożenie życia."
            },
            {
                name: "Downburst / Microburst",
                desc: "Bardzo silny prąd zstępujący z chmury Cb uderzający w ziemię. Powoduje szkody wiatrowe rozchodzące się promieniście lub wzdłuż linii.",
                image: "assets/img/placeholder_downburst.png",
                danger: "Zniszczenia przypominające tornado, niszczący wiatr prostoliniowy."
            },
            {
                name: "Derecho",
                desc: "Długotrwały i rozległy układ burzowy (np. Bow Echo), charakteryzujący się niszczącymi porywami wiatru na dużym obszarze (setki kilometrów).",
                image: "assets/img/placeholder_derecho.png",
                danger: "Skrajnie silny, długotrwały wiatr na ogromnym obszarze."
            }
        ]
    },
    {
        id: "cat-sygnatury",
        name: "Sygnatury Chmurowe",
        icon: "eye",
        items: [
            {
                name: "Wał Szkwałowy (Shelf Cloud)",
                desc: "Tworzy się na czele prądu zstępującego burzy. Przypomina zawieszony wał i zwiastuje silny wiatr (szkwał).",
                image: "assets/img/arcus_cloud.png", // Mamy to zdjęcie
                danger: "Silne porywy wiatru w momencie przejścia."
            },
            {
                name: "Chmura Stropowa (Wall Cloud)",
                desc: "Wyraźne obniżenie podstawy chmury w rejonie prądu wstępującego superkomórki. Jeśli rotuje, jest to obszar formowania się tornada.",
                image: "assets/img/placeholder_wallcloud.png",
                danger: "Tornado (jeśli rotuje)."
            },
            {
                name: "Mammatus",
                desc: "Chmury w kształcie zwisających 'wymion' na spodzie kowadła burzowego (incus). Same w sobie niegroźne, ale świadczą o silnych prądach zstępujących w Cb.",
                image: "assets/img/placeholder_mammatus.png",
                danger: "Brak bezpośredniego zagrożenia, znak bliskości potężnej burzy."
            },
            {
                name: "Hook Echo (Radar)",
                desc: "Radarowa sygnatura w kształcie haka, zlokalizowana w prawej tylnej części superkomórki, oznaczająca obszar rotacji z potencjalnym tornadem.",
                image: "assets/img/hook_echo.png", // Mamy to zdjęcie
                danger: "Mezocyklon i możliwe tornado."
            }
        ]
    }
];
