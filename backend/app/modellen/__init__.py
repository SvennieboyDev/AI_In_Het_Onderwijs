"""Register van alle beschikbare AI-modellen. Nieuw model? Voeg het hier toe."""

from ..schemas import ModelInfo
from .basis import AIModel, ModelFout
from .claude import ClaudeModel
from .demo import DemoModel
from .gemini import GeminiModel

ALLE_MODELLEN: dict[str, AIModel] = {m.id: m for m in (DemoModel(), GeminiModel(), ClaudeModel())}


def kies_model(model_id: str, taak: str) -> AIModel:
    """taak is 'lezen' of 'beoordelen'."""
    model = ALLE_MODELLEN.get(model_id)
    if model is None:
        raise ModelFout(f"Onbekend model '{model_id}'. Kies een model bij Instellingen.")
    if taak == "lezen" and not model.kan_lezen or taak == "beoordelen" and not model.kan_beoordelen:
        raise ModelFout(f"{model.naam} kan niet {taak}.")
    beschikbaar, reden = model.beschikbaar()
    if not beschikbaar:
        raise ModelFout(f"{model.naam} is niet beschikbaar: {reden}")
    return model


def model_overzicht() -> list[ModelInfo]:
    overzicht = []
    for model in ALLE_MODELLEN.values():
        beschikbaar, reden = model.beschikbaar()
        overzicht.append(
            ModelInfo(
                id=model.id,
                naam=model.naam,
                omschrijving=model.omschrijving,
                kanLezen=model.kan_lezen,
                kanBeoordelen=model.kan_beoordelen,
                beschikbaar=beschikbaar,
                reden=reden,
            )
        )
    return overzicht


__all__ = ["ALLE_MODELLEN", "AIModel", "ModelFout", "kies_model", "model_overzicht"]
