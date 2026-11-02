"""Privacyfilter (AVG): haalt persoonsgegevens uit tekst voordat die naar een AI-model gaat.

Dit is de tweede verdedigingslinie. De eerste zit in de frontend: daar worden
de namen uit de lokale koppeltabel vervangen door [NAAM], want alleen de docent
kent die namen. Namen zijn met een regel niet betrouwbaar te herkennen; e-mail,
telefoon, postcode en adres wel.
"""

import re

_PATRONEN: list[tuple[str, re.Pattern[str]]] = [
    ("[E-MAIL]", re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+", re.IGNORECASE)),
    (
        "[TELEFOON]",
        re.compile(r"(?<!\d)(\+31[\s-]?|0031[\s-]?|0)(6[\s-]?\d{8}|[1-9]\d{1,2}[\s-]?\d{6,7})(?!\d)"),
    ),
    ("[POSTCODE]", re.compile(r"\b[1-9]\d{3}\s?(?!SA|SD|SS)[A-Z]{2}\b")),
    (
        "[ADRES]",
        re.compile(
            r"\b[A-Z][a-zà-ü]+(?:straat|laan|weg|plein|gracht|kade|dijk|singel|steeg|hof|dreef|pad)"
            r"\s+\d{1,4}\s?[a-zA-Z]?\b"
        ),
    ),
]


def filter_persoonsgegevens(tekst: str) -> tuple[str, dict[str, int]]:
    """Vervangt persoonsgegevens door labels. Geeft de gefilterde tekst en tellingen terug."""
    tellingen: dict[str, int] = {}
    for label, patroon in _PATRONEN:
        tekst, aantal = patroon.subn(label, tekst)
        if aantal:
            tellingen[label] = aantal
    return tekst, tellingen
