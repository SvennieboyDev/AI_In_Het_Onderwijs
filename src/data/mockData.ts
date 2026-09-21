export type RubricCriterion = {
  id: string
  naam: string
  omschrijving: string
  weging: number
}

export const rubric: RubricCriterion[] = [
  {
    id: 'inhoud',
    naam: 'Inhoud & argumentatie',
    omschrijving: 'Onderbouwing, relevantie en diepgang van de argumenten.',
    weging: 0.35,
  },
  {
    id: 'opbouw',
    naam: 'Structuur & opbouw',
    omschrijving: 'Logische opbouw met heldere inleiding, kern en slot.',
    weging: 0.25,
  },
  {
    id: 'taalgebruik',
    naam: 'Taalgebruik & stijl',
    omschrijving: 'Woordkeus, zinsbouw en aansluiting bij het publiek.',
    weging: 0.25,
  },
  {
    id: 'spelling',
    naam: 'Spelling & grammatica',
    omschrijving: 'Correct gebruik van spelling, interpunctie en grammatica.',
    weging: 0.15,
  },
]

export type AiRisico = 'laag' | 'gemiddeld' | 'hoog'

export type CriteriumSuggestie = {
  score: number
  toelichting: string
}

export type AiFeedback = {
  sterkePunten: string[]
  verbeterpunten: string[]
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
  feedback?: string
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
      sterkePunten: [
        'Heldere opbouw met een duidelijke inleiding, twee sterke argumenten en een afgeronde conclusie.',
        'Onderbouwt het argument over zelfbeeld met een verwijzing naar onderzoek.',
        'Erkent ook de voordelen van sociale media, wat het betoog genuanceerd maakt.',
      ],
      verbeterpunten: [
        'Het onderzoek waarnaar verwezen wordt, is niet concreet genoemd of gebroken (welke bron, wanneer?).',
        'Een enkele zin is erg lang en kan de leesbaarheid verminderen (bijv. de eerste zin van alinea 2).',
        'Het tegenargument over verbondenheid mag steviger uitgewerkt worden voor meer balans.',
      ],
      criteriumSuggesties: {
        inhoud: { score: 7.5, toelichting: 'Goed onderbouwd, maar bronnen worden niet concreet benoemd.' },
        opbouw: { score: 8, toelichting: "Heldere inleiding-kern-slot structuur met duidelijke alinea's." },
        taalgebruik: { score: 7, toelichting: 'Prettig leesbaar, met af en toe een lange zin die de vaart eruit haalt.' },
        spelling: { score: 8, toelichting: 'Nauwelijks spel- of grammaticafouten gevonden.' },
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
      sterkePunten: [
        'Grammaticaal foutloos en gebruikt correcte signaalwoorden zoals "ten eerste" en "desalniettemin".',
        'Noemt zowel voordelen als nadelen, met een afsluitende conclusie die een aanbeveling doet.',
        'Verwijst naar onderzoek om de risico\'s te onderbouwen.',
      ],
      verbeterpunten: [
        'Weinig persoonlijke stem of concrete voorbeelden; het betoog blijft vrij algemeen en abstract.',
        'De opbouw volgt een erg voorspelbaar sjabloon (ten eerste / desalniettemin / concluderend).',
        'Geen eigen ervaring of specifiek voorbeeld dat het betoog herkenbaar maakt voor de lezer.',
      ],
      criteriumSuggesties: {
        inhoud: { score: 6, toelichting: 'Argumenten zijn correct maar generiek; mist concrete voorbeelden of eigen onderbouwing.' },
        opbouw: { score: 7.5, toelichting: 'Duidelijke signaalwoorden, maar de opbouw voelt sjabloonmatig aan.' },
        taalgebruik: { score: 6.5, toelichting: 'Grammaticaal correct, maar weinig eigen stijl of stem merkbaar.' },
        spelling: { score: 8.5, toelichting: 'Geen spelfouten gevonden.' },
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
      sterkePunten: [
        'Authentieke, persoonlijke toon met herkenbare observaties uit het eigen leven.',
        'Legt overtuigend uit waarom apps verslavend zijn ontworpen.',
        'Sluit genuanceerd af: niet alles is slecht, het gaat om controle houden.',
      ],
      verbeterpunten: [
        'Geen expliciete stelling in de inleiding — de lezer moet zelf afleiden wat het standpunt is.',
        'De argumentatie leunt op persoonlijke observaties, maar mist onderbouwing met feiten of bronnen.',
        'De conclusie mag scherper: wat moet er nu concreet gebeuren?',
      ],
      criteriumSuggesties: {
        inhoud: { score: 6.5, toelichting: 'Persoonlijke observaties, maar mist onderbouwing met feiten of bronnen.' },
        opbouw: { score: 6, toelichting: 'Geen expliciete stelling in de inleiding, waardoor het betoog losser aanvoelt.' },
        taalgebruik: { score: 8, toelichting: 'Authentieke, prettig leesbare stijl met een duidelijke eigen stem.' },
        spelling: { score: 7.5, toelichting: 'Enkele kleine typefouten, verder correct.' },
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
      sterkePunten: [
        'Sterke, evenwichtige argumentatie met concrete voorbeelden (bijv. jongeren die online een gemeenschap vinden).',
        'Trekt een heldere, onderbouwde conclusie die het probleem herkadert (regulering i.p.v. het medium zelf).',
        'Prettige, volwassen schrijfstijl met een duidelijke eigen stem.',
      ],
      verbeterpunten: [
        'De conclusie herhaalt gedeeltelijk argumenten uit de kern zonder veel nieuws toe te voegen.',
        'Een concreet handelingsperspectief (wat moet een school precies doen?) zou het slot sterker maken.',
      ],
      criteriumSuggesties: {
        inhoud: { score: 8, toelichting: 'Sterk onderbouwd met concrete voorbeelden.' },
        opbouw: { score: 8, toelichting: 'Logische opbouw, conclusie mag iets minder herhalen.' },
        taalgebruik: { score: 7, toelichting: 'Volwassen, prettig leesbare stijl.' },
        spelling: { score: 8, toelichting: 'Nagenoeg foutloos.' },
      },
    },
    cijfer: 7.8,
    scores: { inhoud: 8, opbouw: 8, taalgebruik: 7, spelling: 8 },
    feedback:
      'Sterk betoog met een duidelijke opbouw en persoonlijke stem. Let bij de conclusie nog op herhaling van eerdere argumenten.',
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
      sterkePunten: [
        'Persoonlijke, oprechte toon die de lezer meeneemt in het eigen gebruik.',
        'Concreet voorbeeld (schermtijd-instelling) maakt het betoog geloofwaardig.',
        'Realistisch, haalbaar slotadvies in plaats van een verbod te bepleiten.',
      ],
      verbeterpunten: [
        'De argumentatie steunt vrijwel volledig op eigen ervaring; een bron of cijfer zou het overtuigender maken.',
        'Het advies aan scholen in de slotalinea wordt niet verder uitgewerkt.',
      ],
      criteriumSuggesties: {
        inhoud: { score: 7, toelichting: 'Overtuigend door persoonlijke ervaring, maar mist externe onderbouwing.' },
        opbouw: { score: 7, toelichting: 'Duidelijke lijn van probleem naar oplossing.' },
        taalgebruik: { score: 7, toelichting: 'Toegankelijk en persoonlijk geschreven.' },
        spelling: { score: 7, toelichting: 'Enkele kleine slordigheden.' },
      },
    },
    cijfer: 6.9,
    scores: { inhoud: 7, opbouw: 7, taalgebruik: 7, spelling: 7 },
    feedback:
      'Prettig leesbaar en persoonlijk, maar de argumentatie mag steviger onderbouwd worden met bronnen of voorbeelden.',
  },
]

export const klassen = [
  { naam: '4H1', leerlingen: 27, opengezet: 27, nagekeken: 12 },
  { naam: '4H2', leerlingen: 25, opengezet: 25, nagekeken: 9 },
  { naam: '5V1', leerlingen: 22, opengezet: 0, nagekeken: 0 },
  { naam: '5V2', leerlingen: 24, opengezet: 0, nagekeken: 0 },
]
