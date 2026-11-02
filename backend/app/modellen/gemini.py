"""Google Gemini via de REST-API. NOG NIET GETEST: er is nog geen API-sleutel.

Let op (AVG): bij de gratis versie van de Gemini-API mag Google ingestuurde inhoud
gebruiken om producten te verbeteren. Gebruik voor echt leerlingwerk een betaald account.
"""

import base64

import httpx

from .. import config
from .basis import ModelFout
from .taalmodel import Taalmodel

_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiModel(Taalmodel):
    id = "gemini"
    naam = "Google Gemini"
    omschrijving = "Multimodaal taalmodel; volgens ons vooronderzoek sterk in handschrift."

    def beschikbaar(self):
        if not config.GEMINI_API_KEY:
            return False, "Geen GEMINI_API_KEY ingesteld in backend/.env."
        return True, None

    async def _vraag(self, prompt: str, afbeeldingen: list[bytes] | None = None) -> str:
        delen: list[dict] = [{"text": prompt}]
        for afbeelding in afbeeldingen or []:
            delen.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(afbeelding).decode()}})
        body = {
            "contents": [{"role": "user", "parts": delen}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
        }
        async with httpx.AsyncClient(timeout=120) as client:
            antwoord = await client.post(
                _URL.format(model=config.GEMINI_MODEL),
                headers={"x-goog-api-key": config.GEMINI_API_KEY},
                json=body,
            )
        if antwoord.status_code != 200:
            raise ModelFout(f"Gemini gaf een fout (code {antwoord.status_code}). Controleer de sleutel en modelnaam.")
        try:
            return antwoord.json()["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as fout:
            raise ModelFout("Gemini gaf een leeg antwoord (mogelijk geblokkeerd door een veiligheidsfilter).") from fout
