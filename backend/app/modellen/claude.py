"""Anthropic Claude via de Messages-API. NOG NIET GETEST: er is nog geen API-sleutel."""

import base64

import httpx

from .. import config
from .basis import ModelFout
from .taalmodel import Taalmodel

_URL = "https://api.anthropic.com/v1/messages"


class ClaudeModel(Taalmodel):
    id = "claude"
    naam = "Anthropic Claude"
    omschrijving = "Multimodaal taalmodel; sterk in onderbouwd beoordelen."

    def beschikbaar(self):
        if not config.ANTHROPIC_API_KEY:
            return False, "Geen ANTHROPIC_API_KEY ingesteld in backend/.env."
        return True, None

    async def _vraag(self, prompt: str, afbeeldingen: list[bytes] | None = None) -> str:
        inhoud: list[dict] = [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(a).decode()},
            }
            for a in afbeeldingen or []
        ]
        inhoud.append({"type": "text", "text": prompt})
        body = {
            "model": config.CLAUDE_MODEL,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": inhoud}],
        }
        headers = {"x-api-key": config.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"}
        async with httpx.AsyncClient(timeout=120) as client:
            antwoord = await client.post(_URL, headers=headers, json=body)
        if antwoord.status_code != 200:
            raise ModelFout(f"Claude gaf een fout (code {antwoord.status_code}). Controleer de sleutel en modelnaam.")
        blokken = antwoord.json().get("content", [])
        tekst = "".join(b.get("text", "") for b in blokken if b.get("type") == "text")
        if not tekst:
            raise ModelFout("Claude gaf een leeg antwoord.")
        return tekst
