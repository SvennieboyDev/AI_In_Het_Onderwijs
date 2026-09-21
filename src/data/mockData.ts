export type RubricCriterion = {
  id: string
  naam: string
  omschrijving: string
  maxPunten: number
}

export const rubric: RubricCriterion[] = [
  {
    id: 'inhoud',
    naam: 'Inhoud & argumentatie',
    omschrijving: 'Onderbouwing, relevantie en diepgang van de argumenten.',
    maxPunten: 10,
  },
  {
    id: 'opbouw',
    naam: 'Structuur & opbouw',
    omschrijving: 'Logische opbouw met heldere inleiding, kern en slot.',
    maxPunten: 8,
  },
  {
    id: 'taalgebruik',
    naam: 'Taalgebruik & stijl',
    omschrijving: 'Woordkeus, zinsbouw en aansluiting bij het publiek.',
    maxPunten: 8,
  },
  {
    id: 'spelling',
    naam: 'Spelling & grammatica',
    omschrijving: 'Correct gebruik van spelling, interpunctie en grammatica.',
    maxPunten: 4,
  },
]

export type AiRisico = 'laag' | 'gemiddeld' | 'hoog'

export type CriteriumSuggestie = {
  punten: number
  toelichting: string
}

export type AiFeedback = {
  beoordeling: string
  samenvatting: string
  criteriumSuggesties: Record<string, CriteriumSuggestie>
}

export type Inlevering = {
  id: string
  leerling: string
  klas: string
  toets: string
  ingeleverdOp: string
  woorden: number
  aiRisico: AiRisico
  status: 'nog na te kijken' | 'nagekeken'
  tekst: string
  aiFeedback: AiFeedback
  cijfer?: number
  scores?: Record<string, number>
}

export const inleveringen: Inlevering[] = [
  {
    id: 'inl-1',
    leerling: 'Fenna de Groot',
    klas: '4H2',
    toets: 'Betogend essay — Sociale media',
    ingeleverdOp: '18 sep 2026',
    woorden: 512,
    aiRisico: 'laag',
    status: 'nog na te kijken',
    tekst: `Sociale media zijn niet meer weg te denken uit het leven van jongeren. Toch groeit de discussie of dit wel zo positief is als het lijkt. In dit essay betoog ik dat sociale media weliswaar kansen bieden, maar dat de risico's voor de mentale gezondheid van jongeren te vaak worden onderschat.

Allereerst zorgen platforms als Instagram en TikTok voor een constante vergelijking met anderen. Onderzoek laat zien dat veelvuldig gebruik samenhangt met een lager zelfbeeld, vooral bij meisjes tussen de twaalf en achttien jaar. Dit komt doordat de gepresenteerde levens vaak een vertekend beeld geven van de werkelijkheid.

Daarnaast speelt verslaving een grote rol. De apps zijn ontworpen om zo lang mogelijk aandacht vast te houden, met eindeloze feeds en meldingen. Hierdoor krijgen jongeren minder tijd voor huiswerk, sport en slaap, wat weer gevolgen heeft voor hun schoolprestaties.

Toch zijn er ook voordelen: sociale media verbinden mensen over grote afstanden en bieden een podium voor creativiteit. Deze voordelen wegen echter niet op tegen de structurele risico's wanneer er geen duidelijke grenzen worden gesteld.

Kortom, sociale media zijn een krachtig middel dat met verstand gebruikt moet worden. Scholen en ouders dragen daarin een gezamenlijke verantwoordelijkheid.`,
    aiFeedback: {
      beoordeling: `Fenna's betoog is overtuigend opgebouwd: de inleiding introduceert direct een heldere stelling, en de twee kernargumenten (zelfbeeld en verslaving) worden logisch na elkaar uitgewerkt met duidelijke signaalwoorden. Vooral sterk is dat ze het argument over zelfbeeld onderbouwt met een verwijzing naar onderzoek, wat het betoog geloofwaardigheid geeft. Ook waardevol is dat ze aan het einde de tegenkant erkent — verbondenheid en creativiteit — voordat ze die weer weerlegt, waardoor het betoog genuanceerd overkomt in plaats van eenzijdig.

Twee punten zijn voor verbetering vatbaar. De verwijzing naar "onderzoek" blijft vaag: er wordt geen bron of jaartal genoemd, waardoor lastig te beoordelen is of de claim klopt. Daarnaast is de eerste zin van de tweede alinea behoorlijk lang en bevat ze eigenlijk twee ideeën, wat de leesbaarheid iets vermindert.`,
      samenvatting:
        'Sterke, genuanceerde opbouw met goede onderbouwing; wordt beter met concretere bronvermelding en kortere zinnen.',
      criteriumSuggesties: {
        inhoud: { punten: 8.5, toelichting: 'Goed onderbouwd, maar de bron van het aangehaalde onderzoek wordt niet concreet benoemd.' },
        opbouw: { punten: 7, toelichting: "Heldere inleiding-kern-slot structuur met duidelijke alinea's en een erkend tegenargument." },
        taalgebruik: { punten: 6.5, toelichting: 'Prettig leesbaar, met één lange zin die de vaart er even uit haalt.' },
        spelling: { punten: 3.5, toelichting: 'Nauwelijks spel- of grammaticafouten gevonden.' },
      },
    },
  },
  {
    id: 'inl-2',
    leerling: 'Daan van Rijn',
    klas: '4H2',
    toets: 'Betogend essay — Sociale media',
    ingeleverdOp: '18 sep 2026',
    woorden: 498,
    aiRisico: 'hoog',
    status: 'nog na te kijken',
    tekst: `In de hedendaagse samenleving spelen sociale media een steeds prominentere rol in het dagelijks leven van jongeren. Het is daarom van essentieel belang om de voor- en nadelen zorgvuldig tegen elkaar af te wegen.

Ten eerste bieden sociale mediaplatforms talloze mogelijkheden voor connectie en zelfexpressie. Gebruikers kunnen moeiteloos in contact blijven met vrienden en familie, ongeacht geografische afstand. Bovendien fungeren deze platforms als een waardevol podium voor creatieve zelfontplooiing.

Desalniettemin brengt overmatig gebruik aanzienlijke risico's met zich mee. Diverse studies tonen aan dat excessief scrollgedrag correleert met verhoogde niveaus van angst en depressie onder adolescenten. Daarnaast kan de constante blootstelling aan geïdealiseerde beelden leiden tot een vertekend zelfbeeld.

Concluderend kan gesteld worden dat een gebalanceerde benadering essentieel is. Educatieve instellingen zouden een actieve rol moeten spelen in het bevorderen van verantwoord mediagebruik onder leerlingen.`,
    aiFeedback: {
      beoordeling: `Daans tekst is grammaticaal foutloos en gebruikt nette signaalwoorden als "ten eerste" en "desalniettemin", en hij noemt zowel voor- als nadelen met een afsluitende aanbeveling. Dat maakt de tekst op het eerste gezicht net en compleet.

Inhoudelijk blijft het betoog echter aan de oppervlakte: de argumenten zijn correct maar generiek, en er ontbreekt een concreet voorbeeld, een eigen ervaring of een specifieke bron die het betoog geloofwaardig of herkenbaar maakt. De opbouw volgt bovendien een vrij voorspelbaar sjabloon (ten eerste / desalniettemin / concluderend), zonder dat er echt een eigen redenering doorheen loopt. Dat generieke karakter is ook de reden voor de hogere AI-risico-inschatting hierboven — dat zegt overigens niets definitiefs, maar kan reden zijn om er bij het gesprek met de leerling naar te vragen.`,
      samenvatting: 'Netjes en foutloos, maar inhoudelijk generiek en zonder eigen voorbeelden of stem.',
      criteriumSuggesties: {
        inhoud: { punten: 5.5, toelichting: 'Argumenten zijn correct maar generiek; mist concrete voorbeelden of eigen onderbouwing.' },
        opbouw: { punten: 6, toelichting: 'Duidelijke signaalwoorden, maar de opbouw voelt sjabloonmatig aan.' },
        taalgebruik: { punten: 5, toelichting: 'Grammaticaal correct, maar weinig eigen stijl of stem merkbaar.' },
        spelling: { punten: 4, toelichting: 'Geen spelfouten gevonden.' },
      },
    },
  },
  {
    id: 'inl-3',
    leerling: 'Sara el Amrani',
    klas: '4H1',
    toets: 'Betogend essay — Sociale media',
    ingeleverdOp: '17 sep 2026',
    woorden: 470,
    aiRisico: 'gemiddeld',
    status: 'nog na te kijken',
    tekst: `Je zou denken dat iedereen tegenwoordig weet hoe hij met sociale media om moet gaan, maar niks is minder waar. Zelf merk ik bij vrienden en klasgenoten hoe makkelijk je erin gezogen wordt.

Het grootste probleem is volgens mij niet sociale media zelf, maar hoe we ermee omgaan. Een app als TikTok is niet slecht ontworpen, integendeel: hij is juist heel slim gemaakt om je aandacht vast te houden. Dat is precies waarom het zo lastig is om ermee te stoppen.

Verder speelt vergelijking een grote rol. Op je feed zie je alleen de mooiste momenten van andere mensen, nooit de saaie of moeilijke momenten. Daardoor lijkt het net of iedereen een perfect leven heeft, behalve jij.

Toch wil ik niet zeggen dat sociale media alleen maar slecht zijn. Ik heb er zelf ook leuke dingen door ontdekt, zoals nieuwe muziek en interessante mensen. Het gaat er vooral om dat je zelf de controle houdt, in plaats van dat de app die van jou overneemt.`,
    aiFeedback: {
      beoordeling: `Sara schrijft in een authentieke, persoonlijke toon en onderbouwt haar punt over verslavend ontwerp overtuigend met een herkenbare uitleg. Ook de afsluiting is genuanceerd: ze stelt niet dat sociale media slecht zijn, maar dat het om controle houden gaat.

De opbouw is wel losser dan bij een klassiek betoog: er staat geen expliciete stelling in de inleiding, waardoor de lezer zelf moet afleiden wat het standpunt precies is. De argumentatie leunt daarnaast vrijwel volledig op persoonlijke observaties; een concreet feit, cijfer of bron zou het betoog een stuk steviger maken. Tot slot mag de conclusie iets scherper: wat zou er nu concreet moeten gebeuren?`,
      samenvatting: 'Persoonlijk en overtuigend van toon, maar mist een expliciete stelling en onderbouwing met feiten.',
      criteriumSuggesties: {
        inhoud: { punten: 5.5, toelichting: 'Persoonlijke observaties, maar mist onderbouwing met feiten of bronnen.' },
        opbouw: { punten: 4.5, toelichting: 'Geen expliciete stelling in de inleiding, waardoor het betoog losser aanvoelt.' },
        taalgebruik: { punten: 7, toelichting: 'Authentieke, prettig leesbare stijl met een duidelijke eigen stem.' },
        spelling: { punten: 3, toelichting: 'Enkele kleine typefouten, verder correct.' },
      },
    },
  },
  {
    id: 'inl-4',
    leerling: 'Milan Bakker',
    klas: '4H1',
    toets: 'Betogend essay — Sociale media',
    ingeleverdOp: '17 sep 2026',
    woorden: 533,
    aiRisico: 'laag',
    status: 'nagekeken',
    tekst: `Sociale media hebben de manier waarop jongeren communiceren compleet veranderd. Waar vroeger een telefoontje of brief nodig was, is nu één berichtje genoeg. Deze verandering brengt zowel kansen als gevaren met zich mee.

Een belangrijk voordeel is de laagdrempelige toegang tot informatie en gelijkgestemden. Jongeren met een specifieke hobby of identiteit vinden online sneller een gemeenschap dan in hun directe omgeving. Voor sommigen is dit zelfs van levensbelang, bijvoorbeeld voor jongeren die zich anders geïsoleerd zouden voelen.

Tegelijkertijd is de keerzijde niet te negeren. Cyberpesten, onrealistische schoonheidsidealen en verslavende ontwerpprincipes zorgen voor reële schade. Het is dan ook geen toeval dat grote techbedrijven onder toenemende druk staan om hun platforms veiliger te maken voor minderjarigen.

Mijn conclusie is dat het probleem niet bij sociale media als concept ligt, maar bij het gebrek aan regulering en mediawijsheid. Met betere voorlichting op scholen kunnen jongeren zelf bewuster keuzes maken.`,
    aiFeedback: {
      beoordeling: `Milan levert een sterk, evenwichtig betoog af. De argumentatie is goed onderbouwd met concrete voorbeelden — bijvoorbeeld jongeren die online een gemeenschap vinden — en de conclusie herkadert het probleem knap: niet sociale media zelf zijn het probleem, maar het gebrek aan regulering en mediawijsheid. Ook de schrijfstijl is prettig volwassen en consistent door de hele tekst heen.

Eén verbeterpunt: de conclusie herhaalt gedeeltelijk wat al in de kern is gezegd, zonder er veel nieuws aan toe te voegen. Een concreet handelingsperspectief — wat zou een school precies moeten doen? — zou het slot nog sterker maken.`,
      samenvatting: 'Sterk, goed onderbouwd betoog met een knappe herkadering; de conclusie mag iets minder herhalen.',
      criteriumSuggesties: {
        inhoud: { punten: 9, toelichting: 'Sterk onderbouwd met concrete, relevante voorbeelden.' },
        opbouw: { punten: 7, toelichting: 'Logische opbouw; de conclusie herhaalt de kern iets te veel.' },
        taalgebruik: { punten: 6.5, toelichting: 'Volwassen, prettig leesbare en consistente stijl.' },
        spelling: { punten: 3.5, toelichting: 'Nagenoeg foutloos.' },
      },
    },
    cijfer: 8.8,
    scores: { inhoud: 9, opbouw: 7, taalgebruik: 6.5, spelling: 3.5 },
  },
  {
    id: 'inl-5',
    leerling: 'Yara Visser',
    klas: '4H2',
    toets: 'Betogend essay — Sociale media',
    ingeleverdOp: '16 sep 2026',
    woorden: 505,
    aiRisico: 'laag',
    status: 'nagekeken',
    tekst: `Mijn telefoon is denk ik wel mijn beste vriend en mijn grootste vijand tegelijk. Aan de ene kant kan ik er alles mee: contact houden met vriendinnen, filmpjes maken en nieuwe dingen leren. Aan de andere kant merk ik dat ik soms uren kwijt ben zonder dat ik het doorheb.

Wat mij betreft ligt de kern van het probleem bij hoe deze apps ontworpen zijn. Ze zijn gemaakt om je zo lang mogelijk vast te houden, en dat lukt ze goed. Ik heb zelf weleens de schermtijd-instelling gebruikt, en schrok van hoeveel uur ik eigenlijk scrolde.

Toch denk ik niet dat het antwoord is om sociale media helemaal te verbieden. Dat werkt toch niet, en het heeft ook gewoon leuke kanten. Beter zou het zijn als scholen ons vroeger leren hoe deze apps werken en waarom ze zo verslavend zijn.

Als je begrijpt hoe iets werkt, kun je er bewuster mee omgaan. Dat is volgens mij de beste oplossing.`,
    aiFeedback: {
      beoordeling: `Yara schrijft persoonlijk en oprecht, en het concrete voorbeeld van de schermtijd-instelling maakt het betoog geloofwaardig. Prettig is ook dat ze een realistisch, haalbaar advies geeft in plaats van een verbod te bepleiten.

De argumentatie steunt echter vrijwel volledig op eigen ervaring; een bron, cijfer of ander voorbeeld zou het overtuigender maken voor een lezer die zich niet meteen herkent in haar verhaal. Ook het advies aan scholen in de slotalinea blijft nog vaag en wordt niet verder uitgewerkt.`,
      samenvatting: 'Persoonlijk en geloofwaardig, maar leunt te veel op eigen ervaring zonder verdere onderbouwing.',
      criteriumSuggesties: {
        inhoud: { punten: 6.5, toelichting: 'Overtuigend door persoonlijke ervaring, maar mist externe onderbouwing.' },
        opbouw: { punten: 6, toelichting: 'Duidelijke lijn van probleem naar oplossing.' },
        taalgebruik: { punten: 6, toelichting: 'Toegankelijk en persoonlijk geschreven.' },
        spelling: { punten: 3.5, toelichting: 'Enkele kleine slordigheden.' },
      },
    },
    cijfer: 7.6,
    scores: { inhoud: 6.5, opbouw: 6, taalgebruik: 6, spelling: 3.5 },
  },
]

export const klassen = [
  { naam: '4H1', leerlingen: 27, opengezet: 27, nagekeken: 12 },
  { naam: '4H2', leerlingen: 25, opengezet: 25, nagekeken: 9 },
  { naam: '5V1', leerlingen: 22, opengezet: 0, nagekeken: 0 },
  { naam: '5V2', leerlingen: 24, opengezet: 0, nagekeken: 0 },
]
