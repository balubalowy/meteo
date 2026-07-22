/**
 * BAZA DANYCH WIEDZY METEOROLOGICZNEJ BARTKA (Meteo) - WERSJA EKSTREMALNA
 * Wyekstrahowana z 19 publikacji naukowych (ESSL 2025, Meteo, Taszarek, Zięba, Pilorz, Derecho 2009/2017)
 */

const METEO_DATA = {
  // 1. DOKŁADNE KLASY ESSL IF-SCALE v1.0e (2025)
  ifScaleClasses: [
    { code: "IF0", centralSpeedKmh: 90, rangeKmh: "70 - 110", centralSpeedMs: 25, rangeMs: "19 - 30", centralSpeedKt: 50, desc: "Słabe uszkodzenia lekkich elementów, ogrodzeń i gałęzi." },
    { code: "IF0.5", centralSpeedKmh: 120, rangeKmh: "95 - 145", centralSpeedMs: 33, rangeMs: "26 - 40", centralSpeedKt: 65, desc: "Małe uszkodzenia poszyć dachowych, łamanie konarów drzew." },
    { code: "IF1", centralSpeedKmh: 150, rangeKmh: "120 - 180", centralSpeedMs: 40, rangeMs: "32 - 48", centralSpeedKt: 80, desc: "Umiarkowane uszkodzenia dachów, przewracanie przyczep, wiatrołomy." },
    { code: "IF1.5", centralSpeedKmh: 180, rangeKmh: "145 - 215", centralSpeedMs: 50, rangeMs: "40 - 60", centralSpeedKt: 100, desc: "Znaczne uszkodzenia dachów domów murowanych, zrywanie wiat, zsuwanie budynków z fundamentu." },
    { code: "IF2", centralSpeedKmh: 220, rangeKmh: "175 - 265", centralSpeedMs: 60, rangeMs: "48 - 72", centralSpeedKt: 120, desc: "Ciężkie zniszczenia: zawalenie ścian wyższych pięter, przewracanie samochodów ciężarowych." },
    { code: "IF2.5", centralSpeedKmh: 250, rangeKmh: "200 - 300", centralSpeedMs: 70, rangeMs: "56 - 84", centralSpeedKt: 140, desc: "Bardzo ciężkie zniszczenia: odkorowywanie drzew, zawalenie ścian nośnych domów." },
    { code: "IF3", centralSpeedKmh: 290, rangeKmh: "230 - 350", centralSpeedMs: 80, rangeMs: "64 - 96", centralSpeedKt: 160, desc: "Niszczycielskie skutki: zrównanie z ziemią domów murowanych, unoszenie pojazdów > 10m." },
    { code: "IF4", centralSpeedKmh: 380, rangeKmh: "300 - 450", centralSpeedMs: 105, rangeMs: "84 - 126", centralSpeedKt: 200, desc: "Katastrofalne zniszczenia: budynki zrównane z ziemią, ciśnięte maszyny rolnicze." },
    { code: "IF5", centralSpeedKmh: 470, rangeKmh: "> 380", centralSpeedMs: 130, rangeMs: "> 104", centralSpeedKt: 250, desc: "Ekstremalna destrukcja: starcie z fundamentów, odklejanie nawierzchni asfaltowych." }
  ],

  // 21 Wskaźników Zniszczeń (Damage Indicators - ESSL v1.0e)
  damageIndicators: [
    {
      id: "BS",
      name: "BS: Ściany i Konstrukcja Budynku (Building Structure)",
      category: "Budynki",
      subclasses: [
        { code: "BSA", label: "Klasa A (Brak fundamentów / szopy / wiaty słabe)" },
        { code: "BSB", label: "Klasa B (Stodoły drewniane / stabilne wiaty)" },
        { code: "BSC", label: "Klasa C (Słabsza murowana / dachy bez nośnych śrub)" },
        { code: "BSD", label: "Klasa D (Domy jednorodzinne murowane 20-40cm)" },
        { code: "BSE", label: "Klasa E (Solidne domy murowane z betonu / cegły > 40cm)" },
        { code: "BSF", label: "Klasa F (Żelbetowe budynki komercyjne / bloki)" }
      ]
    },
    {
      id: "BR",
      name: "BR: Konstrukcja Dachu (Roof Structure)",
      category: "Budynki",
      subclasses: [
        { code: "BRA", label: "Dach lekki / wiatowy" },
        { code: "BRD", label: "Więźba dachowa domów jednorodzinnych" },
        { code: "BRE", label: "Solidny dach ze ścianami szczytowymi" }
      ]
    },
    {
      id: "TR",
      name: "TR: Pojedyncze Drzewa (Single Trees)",
      category: "Roślinność",
      subclasses: [
        { code: "TRW", label: "Gatunek Słaby (Świerk, Topola, Wierzba, Brzoza)" },
        { code: "TRA", label: "Gatunek Średni (Sosna, Jodła, Jesion)" },
        { code: "TRS", label: "Gatunek Silny (Dąb, Buk, Drzewa bez liści w zimie)" }
      ]
    },
    {
      id: "TS",
      name: "TS: Drzewostan / Kompleksy Leśne (Tree Stand)",
      category: "Roślinność",
      subclasses: [
        { code: "TSW", label: "Las iglasty słaby / gęsty świerk (% powalenia)" },
        { code: "TSA", label: "Las mieszany średni (% powalenia)" },
        { code: "TSS", label: "Stary las dębowy/bukowy (% powalenia)" }
      ]
    },
    {
      id: "VH",
      name: "VH: Pojazdy Drogowe (Road Vehicles)",
      category: "Pojazdy",
      subclasses: [
        { code: "VHT", label: "Przyczepy / Kempingi" },
        { code: "VHE", label: "Puste ciężarówki / Dostawcze" },
        { code: "VHL", label: "Autobusy / Załadowane TIR-y" },
        { code: "VHC", label: "Samochody osobowe / SUV" }
      ]
    },
    {
      id: "PT",
      name: "PT: Słupy i Linia Energetyczna (Poles & Towers)",
      category: "Infrastruktura",
      subclasses: [
        { code: "PTW", label: "Słupy drewniane / Oświetleniowe słabe" },
        { code: "PTS", label: "Słupy betonowe / Sygnalizacyjne silne" },
        { code: "PTT", label: "Kratownicowe wieże wysokiego napięcia" }
      ]
    },
    {
      id: "SC",
      name: "SC: Kontenery Przemysłowe (Shipping Containers)",
      category: "Infrastruktura",
      subclasses: [
        { code: "SCA", label: "Kontener 20ft pusty (< 1.5t)" },
        { code: "SCD", label: "Kontener 40ft częściowo załadowany (5-8t)" },
        { code: "SCF", label: "Kontener załadowany ciężki (> 16t)" }
      ]
    }
  ],

  // 2. KOMPLEKSOWA TERMODYNAMIKA & KINEMATYKA (Zięba, Taszarek, Ostrowski)
  thermoConcepts: [
    {
      name: "SBCAPE / MLCAPE / MUCAPE",
      type: "Profil Cząstki",
      desc: "Zależność energii konwekcyjnej od poziomu startowego cząstki: SB (powierzchniowa), ML (uśredniona 100 hPa - najlepsza w dzień), MU (najbardziej niestabilna - kluczowa dla burz nocnych).",
      formula: "W_max = √(2 * CAPE) [m/s]"
    },
    {
      name: "Derecho Composite Parameter (DCP)",
      type: "Wskaźnik Złożony Nawałnic",
      desc: "Ocenia ryzyko gwałtownych nawałnic wiatrowych (Derecho) na podstawie chwiejności (MUCAPE), energii prądów zstępujących (DCAPE), średniego wiatru i uskoków DLS.",
      formula: "DCP = (DCAPE/980) * (MUCAPE/2000) * (DLS/20kts) * (MeanWind/16kts)"
    },
    {
      name: "Significant Tornado Parameter (STP)",
      type: "Wskaźnik Złożony Tornad",
      desc: "Szacuje prawdopodobieństwo powstania tornada mezocyklonalnego na podstawie SBCAPE, LCL, LLS (0-1km), DLS (0-6km) i CIN.",
      formula: "STP = (SBCAPE/1500) * ((2000-LCL)/1000) * (LLS/10) * (DLS/20) * ((200+CIN)/150)"
    },
    {
      name: "Supercell Composite Parameter (SCP)",
      type: "Wskaźnik Złożony Superkomórek",
      desc: "Ocenia szanse uformowania mezocyklonu i trwałej superkomórki burzowej na podstawie MUCAPE, SRH3 i DLS.",
      formula: "SCP = (MUCAPE/1000) * (SRH3/50) * (DLS/20)"
    },
    {
      name: "Wektor Corfidiego (MCS Propagation Vector)",
      type: "Kinematyka Układów MCS",
      desc: "Wyznacza prędkość i kierunek ruchu mezoskalowych układów konwekcyjnych (MCS/Bow Echo) dla wariantów Downwind (z wiatrem) oraz Upwind (pod wiatr).",
      formula: "V_vector = 2 * V_mean(0-6km) - V_850hPa"
    },
    {
      name: "LCL (Lifting Condensation Level)",
      type: "Poziom Wysokościowy",
      desc: "Wysokość kondensacji z uniesienia (podstawa chmur Cumulus/Cumulonimbus). Wyliczana ze wzoru Espy'ego: 125 * (T - Td). Niskie LCL (< 800m) sprzyja tornadom.",
      formula: "h_LCL = 125 * (T - Td) [m]"
    },
    {
      name: "LFC (Level of Free Convection)",
      type: "Poziom Swobodnej Konwekcji",
      desc: "Punkt, w którym linia stanu cząstki przecina krzywą stratyfikacji otoczenia i cząstka staje się cieplejsza (wyporna).",
      formula: "T_cz > T_ot"
    },
    {
      name: "EL (Equilibrium Level) & Overshooting Top",
      type: "Poziom Równowagi",
      desc: "Wysokość wierzchołka chmury burzowej (kowadła). Rozpędzony prąd wstępujący wybija się ponad EL tworząc kopułę Overshooting Top.",
      formula: "W_max wnika w trofopauzę"
    }
  ],

  // 3. RADAROWE SYGNATURY BURZOWE (Wojciech Pilorz / Meteo)
  radarSignatures: [
    {
      name: "Hook Echo (Haczyk Mezocyklonu)",
      type: "Superkomórka",
      desc: "Zakrzywienie odbiciowości w kształcie haczyka w tylno-prawej części burzy. Świadczy o silnej rotacji prądu wstępującego.",
      risk: "Tornada, bardzo duży grad."
    },
    {
      name: "Bow Echo & Rear Inflow Jet (RIJ)",
      type: "Układ Wielokomórkowy / MCS",
      desc: "Wygięcie linii opadów w wyrazisty łuk pod wpływem silnego prądu zstępującego wciskającego się z tyłu (RIJ).",
      risk: "Niszczycielskie wiatry prostoliniowe (Derecho / Downburst > 130-150 km/h)."
    },
    {
      name: "BWER (Bounded Weak Echo Region)",
      type: "Superkomórka",
      desc: "Strefa obniżonej odbiciowości otoczona ze wszystkich stron silnym echem opadowym. Oznacza ekstremalnie silny prąd wstępujący.",
      risk: "Gwałtowny grad > 5 cm, superkomórka."
    },
    {
      name: "TBSS (Three-Body Scatter Spike)",
      type: "Sygnatura Gradowa",
      desc: "Długi 'kolec' wybiegający od rdzenia burzy wzdłuż promienia widzenia radaru. Powstaje przez wielokrotne rozpraszanie fal od wielkich kul gradowych.",
      risk: "Ekstremalne opady gradu (5-10 cm)."
    }
  ],

  // 4. OFICJALNE PROGI OSTRZEŻEŃ METEO
  alertWarnings: [
    {
      level: "1 Stopień Ostrzeżenia (Meteo)",
      color: "#FBBF24",
      wind: "70 - 90 km/h",
      hail: "1.5 - 3.0 cm",
      rain: "20 - 30 mm/h",
      tornado: "Niska szansa (słaby lej)",
      desc: "Umiarkowane burze lokalne, drobny grad, punktowe zalania."
    },
    {
      level: "2 Stopień Ostrzeżenia (Meteo)",
      color: "#F59E0B",
      wind: "90 - 110 km/h",
      hail: "3.0 - 5.0 cm",
      rain: "30 - 50 mm/h",
      tornado: "Możliwa superkomórka i tornado",
      desc: "Silne burze z niszczycielskimi porywami, duży grad, lokalne podtopienia."
    },
    {
      level: "3 Stopień Ostrzeżenia (Meteo)",
      color: "#EF4444",
      wind: "> 110 km/h (lub > 130 km/h w Derecho)",
      hail: "> 5.0 cm",
      rain: "> 50 mm/h",
      tornado: "Wysokie ryzyko gwałtownego tornada / Derecho",
      desc: "Ekstremalne zagrożenie życia i mienia, powalone lasy, katastrofalne wiatry."
    }
  ],

  // 5. HISTORIA I STUDIA PRZYPADKÓW W POLSCE
  historicalCases: [
    {
      title: "Derecho Pomorskie (11 sierpnia 2017 r.)",
      track: "> 300 km (Dolny Śląsk -> Wielkopolska -> Kujawy -> Pomorze)",
      maxGust: "152 km/h (stacja) / > 180 km/h (estymacja IF2.5)",
      dcp: "DCP > 8 (rekordowe warunki kinematyczno-termodynamiczne)",
      impact: "80 000 ha powalonych lasów (Bory Tucholskie), 6 ofiar śmiertelnych.",
      desc: "Najgwałtowniejsze derecho w historii polskiej meteorologii."
    },
    {
      title: "Derecho Dolnośląskie i Łódzkie (23 lipca 2009 r.)",
      track: "~ 500 km (Niemcy -> Czechy -> Polska od Legnicy po Mazowsze)",
      maxGust: "130 - 155 km/h (Legnica T3/IF1.5)",
      dcp: "DCP = 8.39 (Praga 12Z)",
      impact: "8 ofiar śmiertelnych, 82 rannych, paraliż energetyczny na Dolnym Śląsku.",
      desc: "Układ Bow Echo / Derecho hybrydowe powstałe w gorącej masie zwrotnikowej."
    },
    {
      title: "Kataklizm Puszczy Piskiej (4 lipca 2002 r.)",
      track: "> 100 km (Mazury -> Kraje Bałtyckie)",
      maxGust: "estymowane ~ 180 km/h (IF2 / F2)",
      dcp: "Wysokie Progresywne Derecho",
      impact: "Całkowite wykoszenie tysięcy hektarów Puszczy Piskiej.",
      desc: "Gwałtowne derecho progresywne z formacją Bow Echo."
    },
    {
      title: "Gigantyczny Grad w Bisztynku (30 czerwca 2012 r.)",
      track: "Warmia i Mazury",
      maxGust: "b.d.",
      dcp: "Ekstremalne CAPE > 3000 J/kg",
      impact: "Kule gradowe o średnicy 10-12 cm zniszczyły dachy w 100% budynków w Bisztynku.",
      desc: "Klasyczna superkomórka HP z gigantyczną kolumną gradową (TBSS)."
    },
    {
      title: "Tornado Outbreak w Polsce (15-16 sierpnia 2008 r.)",
      track: "Śląsk, Opolszczyzna, Ziemia Łódzka, Mazowsze",
      maxGust: "> 300 km/h (Tornado EF3/IF3)",
      dcp: "STP > 3.0, SCP > 6.0",
      impact: "Zniszczone wsie (Strzelce Opolskie, Kaniów, Kalina), zrzucone autokary na autostradzie A4.",
      desc: "Seria niszczycielskich tornad mezocyklonalnych związanych z pofalowanym frontem."
    }
  ]
};
