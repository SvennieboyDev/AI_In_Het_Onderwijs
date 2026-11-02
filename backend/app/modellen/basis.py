"""De uitwisselbare model-interface.

Elk AI-model (Gemini, Claude, later TrOCR of een beter model) is één klasse die
deze interface implementeert. De rest van de tool weet niet welk model er draait:
het model is een instelling. Een nieuw model inpluggen =
1. een klasse schrijven die AIModel uitbreidt,
2. hem toevoegen aan ALLE_MODELLEN in modellen/__init__.py.
"""

from abc import ABC

from ..schemas import BeoordeelVerzoek, Criterium, CriteriumVoorstel, TranscribeerAntwoord


class ModelFout(Exception):
    """Fout bij het aanroepen van een model, met een melding voor de docent."""


class AIModel(ABC):
    id: str
    naam: str
    omschrijving: str
    kan_lezen: bool = False  # handschrift transcriberen (stap 1)
    kan_beoordelen: bool = False  # rubric omzetten en werk beoordelen (stap 2)

    def beschikbaar(self) -> tuple[bool, str | None]:
        """(beschikbaar, reden als dat niet zo is), bv. een ontbrekende API-sleutel."""
        return True, None

    async def transcribeer(self, afbeeldingen: list[bytes], vak: str) -> TranscribeerAntwoord:
        raise ModelFout(f"{self.naam} kan geen handschrift lezen.")

    async def rubric_omzetten(self, tekst: str, vak: str) -> tuple[list[Criterium], list[str]]:
        raise ModelFout(f"{self.naam} kan geen rubric omzetten.")

    async def beoordeel(self, verzoek: BeoordeelVerzoek, tekst: str) -> tuple[list[CriteriumVoorstel], str]:
        """Geeft (voorstellen per criterium, feedback voor de leerling).

        `tekst` is het leerlingwerk NA het privacyfilter. De controle op citaten
        gebeurt daarna centraal (citaten.py), dus een model hoeft dat niet zelf te doen.
        """
        raise ModelFout(f"{self.naam} kan geen werk beoordelen.")
