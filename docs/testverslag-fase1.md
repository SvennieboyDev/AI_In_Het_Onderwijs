# Testverslag fase 1 (2 november 2026)

**Getest met:** 23 backendtests (pytest), 12 frontendtests (vitest) en een end-to-end-test in de browser (Playwright) die de hele stroom doorloopt: 21 van 21 controles geslaagd. Er is **geen echt AI-model** getest, omdat er nog geen API-sleutel is. Alle AI-voorstellen kwamen van het demomodel.

## Per eis uit het PvE

| Eis | Status | Hoe voldaan | Hoe getest |
|---|---|---|---|
| 1. Docent beslist | ✅ Voldaan | Een cijfer verschijnt pas als elk criterium een besluit van de docent heeft. Alleen de knop *Cijfer vaststellen* legt het vast; heropenen kan. | E2E: vaststellen geblokkeerd bij een open criterium; Shift+A slaat "Docent moet beoordelen" over |
| 2. Onderbouwing met citaten | ✅ Frame klaar, ⏳ kwaliteit | Per criterium: niveau, citaten (klik = oplichten in de tekst), argumentatie (waarom niet hoger of lager) en zekerheid. Verzonnen citaten worden automatisch geschrapt. | Unit: citaatcontrole; E2E: klik op citaat licht de passage op. De kwaliteit van echte AI-argumentatie is nog niet getest. |
| 3. Handschrift ≤ 5% CER | 🔧 Meetinstrument klaar, ❌ nog niet aangetoond | Bij elke bevestigde transcriptie berekent de tool de CER; *Instellingen → Handschriftmeting* toont het totaal tegen de 5%-norm. | Unit: CER-berekening; E2E: gesimuleerde transcriptie met 1 fout geeft 0,3%. Echte meting vraagt een leesmodel en een eigen set handschriften. |
| 4. Privacy (AVG) | ✅ Grotendeels | Codes in plaats van namen (namen als code worden geweigerd); naamvak zwart vóór opslag; [NAAM]-vervanging; filter op e-mail, telefoon, postcode en adres; sleutels alleen in de backend; geen opslag in de backend. | E2E: "Fenna de Groot" als code geweigerd, afgedekte pixels zijn zwart; unit: filters. Nog open: hosting met HTTPS en afstemming met het AVG-beleid van het ASG. |
| 5. Overzichtelijke interface | ⏳ Testopzet klaar | Maximaal twee lagen diep, secundaire acties onder *Meer*, sneltoetsen, dark mode, vier tekstgroottes. Contrast gemeten: alle tekstkleuren ≥ 5,5:1 (WCAG AA vraagt 4,5). | Zie `testopzet-docenten.md`; de docententest moet nog gebeuren |
| 6. Volledige pagina's | ✅ Upload, ⏳ lezen | Hele foto's (ook HEIC), PDF's met meerdere pagina's en stapels ("elke N pagina's = één leerling") worden verwerkt en getoond. | Unit: JPG, PNG, HEIC, PDF met scanpagina; E2E: upload en koppelen. Lezen hangt af van het leesmodel. |
| 7. Onzekerheid melden | ✅ Voldaan | Onleesbaar → "Docent moet transcriberen". Te korte tekst, verzonnen citaat, ongeldig niveau of een criterium dat de AI niet kan beoordelen → "Docent moet beoordelen", **zonder score**. Onzekere woorden staan oranje gemarkeerd. | Unit en E2E |

## Randgevallen (testersrol)

| Geval | Resultaat |
|---|---|
| Kapotte foto | ✅ "Deze foto kon niet worden geopend. Is het bestand beschadigd?" |
| Bestand van 40 MB | ✅ "Te groot (40 MB). De grens is 25 MB." (al in de browser, zonder upload) |
| Verkeerd bestandstype (.pptx) | ✅ Duidelijke melding met de toegestane typen |
| Leeg bestand / alleen spaties | ✅ "Dit bestand is leeg." / "Er staat geen tekst in dit bestand." |
| Rubric zonder punten | ✅ Kan niet worden opgeslagen; de backend weigert hem ook |
| Foto met lage resolutie / lege pagina | ✅ Waarschuwing, geen fout |
| Onleesbare scan | ✅ Geen score, maar "Docent moet transcriberen" |
| Tekst van minder dan 20 woorden | ✅ Alle criteria "Docent moet beoordelen" |
| Backend staat uit | ✅ "De backend is niet bereikbaar. Start de backend (zie README)." |
| Herladen direct na een wijziging | ✅ Opgelost tijdens het testen (instellingen gingen verloren) |

## Wat nog niet werkt of nog niet getest is
- **Gemini en Claude zijn ingebouwd maar niet getest** (geen sleutel). De modelnamen in `.env` moeten worden gecontroleerd.
- **Pagina's achteraf verschuiven** tussen leerlingen kan nog niet: alleen bij het uploaden. Een stapel met wisselend aantal pagina's per leerling vraagt nu meerdere uploads.
- **Leerlingcode achteraf wijzigen** kan nog niet (wel het werk verwijderen en opnieuw toevoegen).
- **Back-up:** alle gegevens staan in één browser. Als de docent de browsergegevens wist, is alles weg. Een export/import van alle gegevens is nodig vóór echt gebruik.
- Gegevens in de browser zijn niet extra versleuteld; de beveiliging hangt af van de laptop van de docent.
- Niet getest: schermlezer, telefoon/tablet, een stapel van 30 leerlingen (snelheid).
- Feedback exporteren kan als tekstbestand; nog geen PDF per leerling.
