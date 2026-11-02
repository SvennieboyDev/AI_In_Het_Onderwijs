"""NakijkAssistent-backend.

Taken van de backend:
- bestanden van leerlingen omzetten naar pagina's,
- AI-modellen aanroepen (de API-sleutels blijven hier, nooit in de frontend),
- AI-voorstellen controleren (citaten, niveaus) en persoonsgegevens wegfilteren.

De backend slaat NIETS op: geen leerlingwerk, geen resultaten, geen namen.
Alle gegevens blijven op het apparaat van de docent (in de browser).
Start: uvicorn app.main:app --reload   (vanuit de map backend)
"""

import base64
import binascii
import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .bestanden import BestandsFout, verwerk_bestand
from .citaten import controleer_voorstellen
from .modellen import ModelFout, kies_model, model_overzicht
from .privacy import filter_persoonsgegevens
from .schemas import (
    BeoordeelAntwoord,
    BeoordeelVerzoek,
    BestandResultaat,
    CriteriumVoorstel,
    ModelInfo,
    RubricAntwoord,
    RubricVerzoek,
    TranscribeerAntwoord,
    TranscribeerVerzoek,
)

# Log nooit de inhoud van leerlingwerk; alleen technische meldingen.
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("nakijkassistent")

app = FastAPI(title="NakijkAssistent", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.TOEGESTANE_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

MIN_WOORDEN = 20


def _fout(status: int, melding: str) -> HTTPException:
    return HTTPException(status_code=status, detail=melding)


@app.get("/api/status")
async def status() -> dict:
    return {"ok": True, "versie": app.version}


@app.get("/api/modellen")
async def modellen() -> list[ModelInfo]:
    return model_overzicht()


@app.post("/api/bestanden")
async def bestand_uploaden(bestand: UploadFile = File(...)) -> BestandResultaat:
    limiet = config.MAX_BESTAND_MB * 1024 * 1024
    data = await bestand.read(limiet + 1)
    try:
        return verwerk_bestand(bestand.filename or "bestand", data)
    except BestandsFout as fout:
        raise _fout(422, str(fout)) from fout


@app.post("/api/transcribeer")
async def transcribeer(verzoek: TranscribeerVerzoek) -> TranscribeerAntwoord:
    if not verzoek.afbeeldingen:
        raise _fout(422, "Er zijn geen pagina's meegestuurd om te lezen.")
    try:
        afbeeldingen = [base64.b64decode(a, validate=True) for a in verzoek.afbeeldingen]
    except binascii.Error as fout:
        raise _fout(422, "Een pagina-afbeelding is beschadigd.") from fout
    try:
        model = kies_model(verzoek.model, "lezen")
        return await model.transcribeer(afbeeldingen, verzoek.vak)
    except ModelFout as fout:
        raise _fout(502, str(fout)) from fout


@app.post("/api/rubric")
async def rubric_omzetten(verzoek: RubricVerzoek) -> RubricAntwoord:
    if not verzoek.tekst.strip():
        raise _fout(422, "Plak eerst de tekst van de rubric of het antwoordmodel.")
    try:
        model = kies_model(verzoek.model, "beoordelen")
        criteria, waarschuwingen = await model.rubric_omzetten(verzoek.tekst, verzoek.vak)
    except ModelFout as fout:
        raise _fout(502, str(fout)) from fout
    return RubricAntwoord(model=model.id, criteria=criteria, waarschuwingen=waarschuwingen)


@app.post("/api/beoordeel")
async def beoordeel(verzoek: BeoordeelVerzoek) -> BeoordeelAntwoord:
    if not verzoek.criteria:
        raise _fout(422, "Deze toets heeft nog geen criteria.")
    if any(max((n.punten for n in c.niveaus), default=0) <= 0 for c in verzoek.criteria):
        raise _fout(422, "Elk criterium moet punten hebben. Vul de puntenverdeling aan.")

    tekst, gefilterd = filter_persoonsgegevens(verzoek.tekst)
    waarschuwingen = [f"{aantal}× {label} weggelaten uit de tekst (privacy)." for label, aantal in gefilterd.items()]
    if "[[" in tekst:
        waarschuwingen.append("De tekst bevat nog onzekere woorden ([[...]]). Controleer eerst de transcriptie.")

    if len(tekst.split()) < MIN_WOORDEN:
        # Onzekerheid melden in plaats van een score geven (PvE-eis 7)
        reden = f"De tekst is te kort om te beoordelen (minder dan {MIN_WOORDEN} woorden)."
        voorstellen = [
            CriteriumVoorstel(criteriumId=c.id, status="docent-moet-beoordelen", reden=reden) for c in verzoek.criteria
        ]
        feedback = ""
        model_id = verzoek.model
    else:
        try:
            model = kies_model(verzoek.model, "beoordelen")
            voorstellen, feedback = await model.beoordeel(verzoek, tekst)
        except ModelFout as fout:
            raise _fout(502, str(fout)) from fout
        model_id = model.id

    voorstellen, extra = controleer_voorstellen(voorstellen, verzoek, tekst)
    log.info("Beoordeling %s: %d criteria, model %s", verzoek.leerlingcode, len(voorstellen), model_id)
    return BeoordeelAntwoord(model=model_id, criteria=voorstellen, feedback=feedback, waarschuwingen=waarschuwingen + extra)
