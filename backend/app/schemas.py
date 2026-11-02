"""Gegevensvormen die tussen frontend en backend worden uitgewisseld.

Velden zijn in camelCase zodat de TypeScript-frontend ze direct kan gebruiken.
Er staan bewust GEEN namen van leerlingen in deze modellen: alleen een leerlingcode.
"""

from typing import Literal

from pydantic import BaseModel, Field

Zekerheid = Literal["hoog", "middel", "laag"]
VoorstelStatus = Literal["voorstel", "docent-moet-beoordelen"]


class Niveau(BaseModel):
    id: str
    label: str
    omschrijving: str = ""
    punten: float


class Criterium(BaseModel):
    id: str
    naam: str
    omschrijving: str = ""
    niveaus: list[Niveau]


# --- Bestanden ---------------------------------------------------------------


class Pagina(BaseModel):
    nummer: int
    soort: Literal["tekst", "afbeelding"]
    tekst: str | None = None
    # JPEG als base64 (zonder data:-voorvoegsel)
    afbeelding: str | None = None


class BestandResultaat(BaseModel):
    bestandsnaam: str
    paginas: list[Pagina]
    waarschuwingen: list[str] = []


# --- Modellen ----------------------------------------------------------------


class ModelInfo(BaseModel):
    id: str
    naam: str
    omschrijving: str
    kanLezen: bool
    kanBeoordelen: bool
    beschikbaar: bool
    reden: str | None = None


# --- Transcriptie (stap 1) ---------------------------------------------------


class TranscribeerVerzoek(BaseModel):
    model: str = "demo"
    vak: str = "Nederlands"
    afbeeldingen: list[str] = Field(..., description="JPEG's als base64")


class TranscribeerAntwoord(BaseModel):
    model: str
    leesbaar: bool
    # Onzekere woorden staan tussen [[ en ]], onleesbare stukken als [[?]]
    tekst: str
    opmerking: str | None = None


# --- Rubric omzetten ---------------------------------------------------------


class RubricVerzoek(BaseModel):
    model: str = "demo"
    vak: str = "Nederlands"
    tekst: str


class RubricAntwoord(BaseModel):
    model: str
    criteria: list[Criterium]
    waarschuwingen: list[str] = []


# --- Beoordeling (stap 2) ----------------------------------------------------


class BeoordeelVerzoek(BaseModel):
    model: str = "demo"
    leerlingcode: str
    vak: str = "Nederlands"
    opdracht: str = ""
    criteria: list[Criterium]
    tekst: str


class CriteriumVoorstel(BaseModel):
    criteriumId: str
    status: VoorstelStatus
    niveauId: str | None = None
    punten: float | None = None
    citaten: list[str] = []
    argumentatie: str = ""
    zekerheid: Zekerheid = "laag"
    # Waarom de docent dit criterium zelf moet beoordelen
    reden: str | None = None


class BeoordeelAntwoord(BaseModel):
    model: str
    criteria: list[CriteriumVoorstel]
    feedback: str
    waarschuwingen: list[str] = []
