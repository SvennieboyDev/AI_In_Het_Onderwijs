# NakijkAssistent: AI-nakijktool voor docenten Nederlands

Meesterproef O&O "AI in het onderwijs" (Helen Parkhurst), Sven Deijkers & Aarif Bah Traoure.
Opdrachtgever: Marc Vinke.

De docent uploadt de toets, de rubric en het werk van leerlingen (getypt of handgeschreven).
De AI doet per criterium een onderbouwd voorstel met letterlijke citaten. **De docent beslist** en stelt zelf het cijfer vast.

> **Status: fase 1 (eerste versie).** Het complete frame werkt, met een *demomodel* in plaats van echte AI.
> Gemini en Claude zijn al ingebouwd, maar werken pas als er een API-sleutel is (zie onder).

## Starten (eigen laptop, Windows)

Je hebt eenmalig nodig: [Python 3.11 of nieuwer](https://www.python.org/downloads/) (vink bij installeren *Add python.exe to PATH* aan) en [Node.js 20 of nieuwer](https://nodejs.org/).

**Eenmalig installeren.** Open een terminal (Opdrachtprompt) in deze map:

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..\frontend
npm install
```

**Starten.** Dit doe je met twee terminals:

```bat
:: Terminal 1: backend
cd backend
.venv\Scripts\activate.bat
uvicorn app.main:app --port 8000
```

```bat
:: Terminal 2: frontend
cd frontend
npm run dev
```

Open daarna **http://localhost:5173**. Klik op *Voorbeeldtoets laden* om alles te verkennen.

Op macOS/Linux gebruik je `source .venv/bin/activate` in plaats van `.venv\Scripts\activate.bat`.
Werkt het op een schoollaptop niet ("geblokkeerd door een beleid voor toepassingsbeheer")? Gebruik dan je eigen laptop.

## Een echt AI-model aanzetten

1. Kopieer `backend/.env.voorbeeld` naar `backend/.env`.
2. Vul `GEMINI_API_KEY` en/of `ANTHROPIC_API_KEY` in. Controleer ook de modelnaam.
3. Herstart de backend en kies het model bij **Instellingen → AI-modellen**.

De sleutels staan alleen in de backend en komen nooit in de browser of op GitHub (`.env` staat in `.gitignore`).
**Let op (AVG):** bij de gratis versie van de Gemini-API mag Google ingestuurde inhoud gebruiken om producten te verbeteren. Gebruik voor echt leerlingwerk een betaald account.

## Testen

Backend (23 tests, onder andere randgevallen bij bestanden), met de virtuele omgeving actief:

```bat
cd backend
python -m pytest
```

Frontend (12 tests: cijfer, CER, citaten, privacy):

```bat
cd frontend
npm test
```

## Hoe het in elkaar zit

```
frontend/  React + TypeScript + Vite   alle schermen; gegevens lokaal in de browser (IndexedDB)
backend/   Python + FastAPI            bestanden verwerken, AI aanroepen, voorstellen controleren
           app/modellen/               de uitwisselbare AI-modellen
docs/      beslissingenlog, testopzet voor docenten, testverslagen
```

**Nakijkstroom:** toets opzetten → werk uploaden → (handschrift) transcriptie controleren → AI-voorstel → docent controleert per criterium → docent stelt cijfer vast → feedback exporteren.

**Privacy:** de backend slaat niets op. Namen staan alleen in de koppeltabel in de browser van de docent. Naar de AI gaan alleen leerlingcodes. Namen die toch in de tekst staan worden `[NAAM]`; e-mail, telefoon, postcode en adres worden er in de backend uitgefilterd. Het naamvak op scans wordt zwart gemaakt voordat de scan wordt opgeslagen.

### Een nieuw model inpluggen (bijv. TrOCR of een beter model)

Elk model is één klasse in `backend/app/modellen/`. Voor een multimodaal taalmodel volstaat `_vraag()`:

```python
class NieuwModel(Taalmodel):
    id = "nieuw"; naam = "Nieuw model"; omschrijving = "..."
    def beschikbaar(self): return True, None
    async def _vraag(self, prompt, afbeeldingen=None) -> str: ...  # roep het model aan
```

Een model dat alleen kan lezen (zoals TrOCR) breidt `AIModel` uit, zet `kan_lezen = True` en implementeert `transcribeer()`.
Voeg het daarna toe aan `ALLE_MODELLEN` in `modellen/__init__.py`. Verder hoeft er niets te veranderen: het model verschijnt vanzelf bij Instellingen.
