"""Instellingen van de backend.

API-sleutels staan ALLEEN hier (in omgevingsvariabelen of in backend/.env),
nooit in de frontend. Kopieer .env.voorbeeld naar .env en vul de sleutels in.
"""

import os
from pathlib import Path

_ENV_BESTAND = Path(__file__).resolve().parent.parent / ".env"


def _laad_env_bestand() -> None:
    """Leest backend/.env (simpel KEY=waarde-formaat) zonder extra pakketten."""
    if not _ENV_BESTAND.exists():
        return
    for regel in _ENV_BESTAND.read_text(encoding="utf-8").splitlines():
        regel = regel.strip()
        if not regel or regel.startswith("#") or "=" not in regel:
            continue
        sleutel, waarde = regel.split("=", 1)
        os.environ.setdefault(sleutel.strip(), waarde.strip().strip('"').strip("'"))


_laad_env_bestand()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
# Controleer de actuele modelnaam in Google AI Studio; dit is een instelling, geen code.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")

# Grenzen voor uploads (in gewone taal teruggemeld aan de docent)
MAX_BESTAND_MB = int(os.environ.get("MAX_BESTAND_MB", "25"))
MAX_PAGINAS = int(os.environ.get("MAX_PAGINAS", "40"))
# Langste zijde van een pagina-afbeelding na verkleinen (pixels)
MAX_AFBEELDING_ZIJDE = int(os.environ.get("MAX_AFBEELDING_ZIJDE", "2200"))

# Frontend-adressen die de backend mogen aanroepen
TOEGESTANE_ORIGINS = os.environ.get(
    "TOEGESTANE_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
