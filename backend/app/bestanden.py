"""Bestanden van leerlingen omzetten naar pagina's (tekst of afbeelding).

Ondersteund: PDF (getypt of gescand, meerdere pagina's), DOCX, TXT,
JPG/PNG/WEBP en HEIC/HEIF (iPhone-foto's).
Elke fout krijgt een melding in gewone taal voor de docent.
"""

import base64
import io
from pathlib import Path

import pymupdf
from docx import Document
from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError
from pillow_heif import register_heif_opener

from . import config
from .schemas import BestandResultaat, Pagina

register_heif_opener()

AFBEELDING_EXTENSIES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
ONDERSTEUND = {".pdf", ".docx", ".txt"} | AFBEELDING_EXTENSIES
# Een PDF-pagina met minder tekens dan dit is waarschijnlijk een scan
MIN_TEKENS_TEKSTLAAG = 40


class BestandsFout(Exception):
    """Fout met een melding die direct aan de docent getoond kan worden."""


def verwerk_bestand(naam: str, data: bytes) -> BestandResultaat:
    extensie = Path(naam).suffix.lower()
    if extensie not in ONDERSTEUND:
        soorten = "PDF, Word (.docx), tekst (.txt) en foto's (JPG, PNG, HEIC)"
        raise BestandsFout(f"Dit bestandstype ({extensie or 'onbekend'}) wordt niet ondersteund. Gebruik {soorten}.")
    if len(data) == 0:
        raise BestandsFout("Dit bestand is leeg.")
    if len(data) > config.MAX_BESTAND_MB * 1024 * 1024:
        raise BestandsFout(
            f"Dit bestand is te groot ({len(data) / 1024 / 1024:.0f} MB). "
            f"De grens is {config.MAX_BESTAND_MB} MB. Maak de scan kleiner of splits hem op."
        )

    waarschuwingen: list[str] = []
    if extensie == ".txt":
        paginas = [_tekstpagina(1, _lees_txt(data))]
    elif extensie == ".docx":
        paginas = [_tekstpagina(1, _lees_docx(data))]
    elif extensie == ".pdf":
        paginas = _lees_pdf(data, waarschuwingen)
    else:
        paginas = [_afbeeldingpagina(1, _open_afbeelding(data), waarschuwingen)]

    return BestandResultaat(bestandsnaam=naam, paginas=paginas, waarschuwingen=waarschuwingen)


# --- Tekstbestanden ----------------------------------------------------------


def _tekstpagina(nummer: int, tekst: str) -> Pagina:
    tekst = tekst.replace("\r\n", "\n").strip()
    if not tekst:
        raise BestandsFout("Er staat geen tekst in dit bestand.")
    return Pagina(nummer=nummer, soort="tekst", tekst=tekst)


def _lees_txt(data: bytes) -> str:
    for codering in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(codering)
        except UnicodeDecodeError:
            continue
    raise BestandsFout("De tekens in dit tekstbestand konden niet worden gelezen.")


def _lees_docx(data: bytes) -> str:
    try:
        document = Document(io.BytesIO(data))
    except Exception as fout:  # python-docx gooit uiteenlopende fouten
        raise BestandsFout("Dit Word-bestand kon niet worden geopend. Is het beschadigd of een oud .doc-bestand?") from fout
    alineas = [p.text for p in document.paragraphs]
    for tabel in document.tables:
        for rij in tabel.rows:
            alineas.append(" | ".join(cel.text for cel in rij.cells))
    return "\n".join(alineas)


# --- PDF -----------------------------------------------------------------------


def _lees_pdf(data: bytes, waarschuwingen: list[str]) -> list[Pagina]:
    try:
        document = pymupdf.open(stream=data, filetype="pdf")
    except Exception as fout:
        raise BestandsFout("Deze PDF kon niet worden geopend. Is hij beschadigd?") from fout
    if document.needs_pass:
        raise BestandsFout("Deze PDF is beveiligd met een wachtwoord. Verwijder de beveiliging en probeer opnieuw.")
    if document.page_count == 0:
        raise BestandsFout("Deze PDF bevat geen pagina's.")
    if document.page_count > config.MAX_PAGINAS:
        raise BestandsFout(
            f"Deze PDF heeft {document.page_count} pagina's; de grens is {config.MAX_PAGINAS}. "
            "Splits de stapel op in kleinere delen."
        )

    paginas: list[Pagina] = []
    for index, pagina in enumerate(document, start=1):
        tekst = pagina.get_text().strip()
        if len(tekst) >= MIN_TEKENS_TEKSTLAAG:
            paginas.append(Pagina(nummer=index, soort="tekst", tekst=tekst))
        else:
            pixmap = pagina.get_pixmap(dpi=200)
            afbeelding = Image.open(io.BytesIO(pixmap.tobytes("png")))
            paginas.append(_afbeeldingpagina(index, afbeelding, waarschuwingen))
    return paginas


# --- Afbeeldingen --------------------------------------------------------------


def _open_afbeelding(data: bytes) -> Image.Image:
    try:
        afbeelding = Image.open(io.BytesIO(data))
        afbeelding.load()
    except (UnidentifiedImageError, OSError, ValueError) as fout:
        raise BestandsFout("Deze foto kon niet worden geopend. Is het bestand beschadigd?") from fout
    return ImageOps.exif_transpose(afbeelding)  # telefoonfoto's rechtop zetten


def _afbeeldingpagina(nummer: int, afbeelding: Image.Image, waarschuwingen: list[str]) -> Pagina:
    afbeelding = afbeelding.convert("RGB")
    breedte, hoogte = afbeelding.size
    if min(breedte, hoogte) < 400:
        waarschuwingen.append(f"Pagina {nummer} heeft een lage resolutie ({breedte}×{hoogte}); handschrift is mogelijk onleesbaar.")
    if ImageStat.Stat(afbeelding.convert("L")).stddev[0] < 6:
        waarschuwingen.append(f"Pagina {nummer} lijkt leeg te zijn.")

    afbeelding.thumbnail((config.MAX_AFBEELDING_ZIJDE, config.MAX_AFBEELDING_ZIJDE))
    buffer = io.BytesIO()
    afbeelding.save(buffer, format="JPEG", quality=85, optimize=True)
    return Pagina(nummer=nummer, soort="afbeelding", afbeelding=base64.b64encode(buffer.getvalue()).decode("ascii"))
