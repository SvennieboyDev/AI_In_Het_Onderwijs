"""Controle van AI-voorstellen, ongeacht welk model ze maakte.

- Elk citaat moet LETTERLIJK in het leerlingwerk staan. Verzonnen citaten vallen af.
- Een voorstel zonder geldig citaat wordt "Docent moet beoordelen" (PvE-eis 2 en 7).
- Het gekozen niveau moet bij het criterium horen; de punten volgen uit dat niveau.
"""

import re
import unicodedata

from .schemas import BeoordeelVerzoek, CriteriumVoorstel

_AANHALINGSTEKENS = str.maketrans({"‘": "'", "’": "'", "‚": "'", "“": '"', "”": '"', "„": '"', "–": "-", "—": "-"})


def normaliseer(tekst: str) -> str:
    tekst = unicodedata.normalize("NFC", tekst).translate(_AANHALINGSTEKENS)
    tekst = re.sub(r"\s+", " ", tekst)
    return tekst.strip().lower()


def citaat_komt_voor(citaat: str, tekst: str) -> bool:
    c = normaliseer(citaat).strip(" .,;:!?\"'…")
    return len(c) >= 3 and c in normaliseer(tekst)


def controleer_voorstellen(
    voorstellen: list[CriteriumVoorstel], verzoek: BeoordeelVerzoek, tekst: str
) -> tuple[list[CriteriumVoorstel], list[str]]:
    """Maakt de voorstellen van een model veilig en volledig. Geeft ook waarschuwingen terug."""
    waarschuwingen: list[str] = []
    per_id = {v.criteriumId: v for v in voorstellen}
    resultaat: list[CriteriumVoorstel] = []

    for criterium in verzoek.criteria:
        v = per_id.get(criterium.id)
        if v is None:
            resultaat.append(
                CriteriumVoorstel(
                    criteriumId=criterium.id,
                    status="docent-moet-beoordelen",
                    reden="Het model gaf voor dit criterium geen voorstel.",
                )
            )
            continue

        geldig = [c for c in v.citaten if citaat_komt_voor(c, tekst)]
        verworpen = len(v.citaten) - len(geldig)
        if verworpen:
            waarschuwingen.append(
                f"{criterium.naam}: {verworpen} citaat/citaten niet teruggevonden in de tekst en verwijderd."
            )
        v.citaten = geldig

        if v.status == "voorstel":
            niveau = next((n for n in criterium.niveaus if n.id == v.niveauId), None)
            if niveau is None:
                v.status, v.reden = "docent-moet-beoordelen", "Het model koos geen geldig rubricniveau."
            elif not geldig:
                v.status = "docent-moet-beoordelen"
                v.reden = "Het voorstel kon niet met een letterlijk citaat uit het werk worden onderbouwd."
            else:
                v.punten = niveau.punten

        if v.status == "docent-moet-beoordelen":
            v.niveauId, v.punten = None, None
            v.reden = v.reden or "Het model kon dit criterium niet betrouwbaar beoordelen."

        resultaat.append(v)

    return resultaat, waarschuwingen
