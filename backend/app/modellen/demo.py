"""Demomodel: werkt zonder API-sleutel en zonder internet.

Het doet GEEN echte beoordeling. Het kiest met eenvoudige regels zinnen als citaat
en een middelniveau, zodat de hele nakijkstroom (citaten, onzekerheid, docentbesluit)
te testen en te demonstreren is. Alles wat het teruggeeft is als demo gelabeld.
"""

import re

from ..schemas import BeoordeelVerzoek, Criterium, CriteriumVoorstel, Niveau, TranscribeerAntwoord
from .basis import AIModel

# Woorden die per soort criterium op een relevante zin wijzen
_SIGNAALWOORDEN = {
    "opbouw": ["allereerst", "ten eerste", "daarnaast", "bovendien", "verder", "tot slot", "kortom", "concluderend", "toch"],
    "argument": ["omdat", "want", "daardoor", "daarom", "dus", "onderzoek", "bijvoorbeeld", "namelijk"],
    "inhoud": ["bijvoorbeeld", "onderzoek", "namelijk", "omdat", "zoals"],
}
_TAALCRITERIA = ("taal", "spelling", "grammatica", "stijl", "formulering")


def _zinnen(tekst: str) -> list[str]:
    stukken = re.split(r"(?<=[.!?])\s+|\n+", tekst)
    return [z.strip() for z in stukken if len(z.split()) >= 5]


def _kort(zin: str, max_woorden: int = 22) -> str:
    woorden = zin.split()
    return zin if len(woorden) <= max_woorden else " ".join(woorden[:max_woorden])


class DemoModel(AIModel):
    id = "demo"
    naam = "Demomodel (geen echte AI)"
    omschrijving = "Voor testen zonder API-sleutel. Leest geen handschrift en beoordeelt niet echt."
    kan_lezen = True
    kan_beoordelen = True

    async def transcribeer(self, afbeeldingen: list[bytes], vak: str) -> TranscribeerAntwoord:
        return TranscribeerAntwoord(
            model=self.id,
            leesbaar=False,
            tekst="",
            opmerking="Het demomodel kan geen handschrift lezen. Typ de tekst over, of stel bij Instellingen een leesmodel in.",
        )

    async def rubric_omzetten(self, tekst: str, vak: str) -> tuple[list[Criterium], list[str]]:
        """Herkent regels als 'Inhoud (10 punten)', 'Opbouw: 8' of '- Taalverzorging 4 pt'."""
        criteria: list[Criterium] = []
        waarschuwingen: list[str] = []
        for regel in tekst.splitlines():
            regel = regel.strip(" -*•\t")
            if len(regel) < 3:
                continue
            match = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:punten|punt|pnt|pt|p)?\)?\s*$", regel, re.IGNORECASE)
            naam = re.sub(r"[\s:(–-]*\d+(?:[.,]\d+)?\s*(?:punten|punt|pnt|pt|p)?\)?\s*$", "", regel, flags=re.IGNORECASE)
            naam = naam.strip(" :–-") or regel
            maximum = float(match.group(1).replace(",", ".")) if match else 0.0
            if not match:
                waarschuwingen.append(f"Bij '{naam}' staan geen punten. Vul ze zelf in.")
            criteria.append(_criterium_met_niveaus(len(criteria) + 1, naam, maximum))
        if not criteria:
            waarschuwingen.append("Er zijn geen criteria herkend. Zet elk criterium op een eigen regel, bv. 'Inhoud (10 punten)'.")
        return criteria, waarschuwingen

    async def beoordeel(self, verzoek: BeoordeelVerzoek, tekst: str) -> tuple[list[CriteriumVoorstel], str]:
        zinnen = _zinnen(tekst)
        woorden = len(tekst.split())
        voorstellen = []
        for criterium in verzoek.criteria:
            naam = criterium.naam.lower()
            if woorden < 40 or not zinnen:
                voorstellen.append(_moet_docent(criterium.id, "Te weinig tekst om dit criterium te beoordelen."))
                continue
            if any(t in naam for t in _TAALCRITERIA):
                voorstellen.append(
                    _moet_docent(criterium.id, "Het demomodel kan taalverzorging niet beoordelen. Een echt taalmodel kan dat wel.")
                )
                continue

            sleutel = next((k for k in _SIGNAALWOORDEN if k in naam), "inhoud")
            gescoord = sorted(zinnen, key=lambda z: -sum(w in z.lower() for w in _SIGNAALWOORDEN[sleutel]))
            citaten = [_kort(z) for z in gescoord[:2]]
            treffers = sum(w in tekst.lower() for w in _SIGNAALWOORDEN[sleutel])

            niveaus = sorted(criterium.niveaus, key=lambda n: n.punten)
            index = min(len(niveaus) - 1, max(0, len(niveaus) // 2 - 1 + (1 if treffers >= 3 else 0)))
            niveau = niveaus[index]
            hoger = niveaus[index + 1].label if index + 1 < len(niveaus) else None
            lager = niveaus[index - 1].label if index > 0 else None

            argument = (
                f"DEMOVOORSTEL, geen echte beoordeling. Niveau '{niveau.label}' gekozen omdat de tekst "
                f"{treffers} signaalwoord(en) voor '{criterium.naam}' bevat."
            )
            if hoger:
                argument += f" Niet '{hoger}', omdat het demomodel de diepgang niet kan inschatten."
            if lager:
                argument += f" Niet '{lager}', omdat er wel relevante passages zijn gevonden."
            voorstellen.append(
                CriteriumVoorstel(
                    criteriumId=criterium.id,
                    status="voorstel",
                    niveauId=niveau.id,
                    citaten=citaten,
                    argumentatie=argument,
                    zekerheid="laag",
                )
            )

        feedback = (
            "(Demofeedback) Je tekst heeft een herkenbare opbouw. Let erop dat je elk argument onderbouwt "
            "met een concreet voorbeeld of een bron, en sluit af met een duidelijke conclusie."
        )
        return voorstellen, feedback


def _moet_docent(criterium_id: str, reden: str) -> CriteriumVoorstel:
    return CriteriumVoorstel(criteriumId=criterium_id, status="docent-moet-beoordelen", reden=reden)


def _criterium_met_niveaus(volgnummer: int, naam: str, maximum: float) -> Criterium:
    def afgerond(fractie: float) -> float:
        return round(maximum * fractie * 2) / 2

    slug = re.sub(r"[^a-z0-9]+", "-", naam.lower()).strip("-")[:24] or f"criterium-{volgnummer}"
    labels = [("onvoldoende", "Onvoldoende", 0.25), ("voldoende", "Voldoende", 0.55), ("goed", "Goed", 0.8), ("uitstekend", "Uitstekend", 1.0)]
    return Criterium(
        id=f"{slug}-{volgnummer}",
        naam=naam,
        niveaus=[Niveau(id=f"{slug}-{volgnummer}-{i}", label=l, punten=afgerond(f)) for i, (_, l, f) in enumerate(labels)],
    )
