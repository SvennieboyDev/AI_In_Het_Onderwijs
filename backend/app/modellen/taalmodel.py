"""Gemeenschappelijke basis voor multimodale taalmodellen (Gemini, Claude, ...).

Een nieuw taalmodel hoeft alleen `_vraag` te implementeren: één prompt plus
optionele afbeeldingen erin, tekst eruit. Prompts en JSON-verwerking zitten hier.
"""

import json
import re
from abc import abstractmethod

from pydantic import ValidationError

from ..schemas import BeoordeelVerzoek, Criterium, CriteriumVoorstel, TranscribeerAntwoord
from . import prompts
from .basis import AIModel, ModelFout


def json_uit_tekst(tekst: str) -> dict:
    """Haalt een JSON-object uit een modelantwoord (ook als het tussen ```-blokken staat)."""
    tekst = tekst.strip()
    tekst = re.sub(r"^```(?:json)?\s*|\s*```$", "", tekst)
    begin, eind = tekst.find("{"), tekst.rfind("}")
    if begin == -1 or eind == -1:
        raise ModelFout("Het model gaf geen bruikbaar antwoord. Probeer het opnieuw.")
    try:
        return json.loads(tekst[begin : eind + 1])
    except json.JSONDecodeError as fout:
        raise ModelFout("Het model gaf een onvolledig antwoord. Probeer het opnieuw.") from fout


class Taalmodel(AIModel):
    kan_lezen = True
    kan_beoordelen = True

    @abstractmethod
    async def _vraag(self, prompt: str, afbeeldingen: list[bytes] | None = None) -> str:
        """Stuurt prompt (+ JPEG-afbeeldingen) naar het model en geeft de tekst van het antwoord."""

    async def transcribeer(self, afbeeldingen: list[bytes], vak: str) -> TranscribeerAntwoord:
        data = json_uit_tekst(await self._vraag(prompts.TRANSCRIPTIE.format(vak=vak), afbeeldingen))
        return TranscribeerAntwoord(
            model=self.id,
            leesbaar=bool(data.get("leesbaar", True)),
            tekst=str(data.get("tekst") or ""),
            opmerking=data.get("opmerking"),
        )

    async def rubric_omzetten(self, tekst: str, vak: str) -> tuple[list[Criterium], list[str]]:
        data = json_uit_tekst(await self._vraag(prompts.RUBRIC.format(vak=vak, tekst=tekst)))
        criteria = []
        for c in data.get("criteria", []):
            for n in c.get("niveaus", []):
                n["punten"] = n.get("punten") if isinstance(n.get("punten"), (int, float)) else 0
            try:
                criteria.append(Criterium.model_validate(c))
            except ValidationError:
                continue
        return criteria, [str(w) for w in data.get("waarschuwingen", [])]

    async def beoordeel(self, verzoek: BeoordeelVerzoek, tekst: str) -> tuple[list[CriteriumVoorstel], str]:
        prompt = prompts.BEOORDELING.format(
            vak=verzoek.vak,
            leerlingcode=verzoek.leerlingcode,
            opdracht=verzoek.opdracht or "(geen opdrachttekst opgegeven)",
            rubric=prompts.rubric_als_tekst(verzoek.criteria),
            tekst=tekst,
        )
        data = json_uit_tekst(await self._vraag(prompt))
        voorstellen = []
        for v in data.get("criteria", []):
            try:
                voorstellen.append(CriteriumVoorstel.model_validate(v))
            except ValidationError:
                continue  # ontbrekende criteria worden centraal "docent moet beoordelen"
        return voorstellen, str(data.get("feedback") or "")
