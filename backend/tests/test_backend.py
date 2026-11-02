"""Tests voor de backend, inclusief randgevallen uit de testersrol.

Draaien: python -m pytest   (vanuit de map backend)
"""

import base64
import io

import pymupdf
from docx import Document
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.citaten import citaat_komt_voor
from app.main import app
from app.privacy import filter_persoonsgegevens

client = TestClient(app)

TEKST = (
    "Sociale media zijn niet meer weg te denken uit het leven van jongeren. Allereerst zorgen platforms "
    "voor een constante vergelijking met anderen, omdat iedereen alleen de mooiste momenten laat zien. "
    "Daarnaast speelt verslaving een grote rol, want de apps zijn ontworpen om je aandacht vast te houden. "
    "Kortom, sociale media moeten met verstand gebruikt worden."
)
CRITERIA = [
    {
        "id": "opbouw",
        "naam": "Opbouw",
        "niveaus": [
            {"id": "o1", "label": "Onvoldoende", "punten": 1},
            {"id": "o2", "label": "Voldoende", "punten": 3},
            {"id": "o3", "label": "Goed", "punten": 5},
        ],
    },
    {
        "id": "taal",
        "naam": "Taalverzorging",
        "niveaus": [{"id": "t1", "label": "Onvoldoende", "punten": 1}, {"id": "t2", "label": "Goed", "punten": 4}],
    },
]


def _upload(naam: str, data: bytes):
    return client.post("/api/bestanden", files={"bestand": (naam, data)})


def _afbeelding(formaat="JPEG", grootte=(1200, 1600), tekst=True) -> bytes:
    beeld = Image.new("RGB", grootte, "white")
    if tekst:
        teken = ImageDraw.Draw(beeld)
        for regel in range(20):
            teken.text((80, 80 + regel * 70), "Dit is een regel handschrift " * 3, fill="black")
    buffer = io.BytesIO()
    beeld.save(buffer, format=formaat)
    return buffer.getvalue()


# --- Bestanden ---------------------------------------------------------------


def test_txt_wordt_tekstpagina():
    r = _upload("werk.txt", TEKST.encode())
    assert r.status_code == 200
    assert r.json()["paginas"][0]["soort"] == "tekst"


def test_txt_windows_codering():
    r = _upload("werk.txt", "Één café, één leerling. ".encode("cp1252") * 3)
    assert r.status_code == 200 and "café" in r.json()["paginas"][0]["tekst"]


def test_docx():
    doc = Document()
    doc.add_paragraph(TEKST)
    buffer = io.BytesIO()
    doc.save(buffer)
    r = _upload("werk.docx", buffer.getvalue())
    assert r.status_code == 200 and "Sociale media" in r.json()["paginas"][0]["tekst"]


def test_pdf_met_tekst_en_scanpagina():
    pdf = pymupdf.open()
    pdf.new_page().insert_text((72, 72), TEKST[:200])
    pdf.new_page()  # lege pagina zonder tekstlaag = als scan behandeld
    r = _upload("stapel.pdf", pdf.tobytes())
    paginas = r.json()["paginas"]
    assert [p["soort"] for p in paginas] == ["tekst", "afbeelding"]
    assert any("leeg" in w for w in r.json()["waarschuwingen"])


def test_foto_jpg_en_png():
    for naam, formaat in (("foto.jpg", "JPEG"), ("scan.png", "PNG")):
        r = _upload(naam, _afbeelding(formaat))
        assert r.status_code == 200
        assert base64.b64decode(r.json()["paginas"][0]["afbeelding"])[:2] == b"\xff\xd8"  # JPEG


def test_grote_foto_wordt_verkleind():
    r = _upload("groot.jpg", _afbeelding(grootte=(5000, 7000)))
    beeld = Image.open(io.BytesIO(base64.b64decode(r.json()["paginas"][0]["afbeelding"])))
    assert max(beeld.size) <= 2200


def test_leeg_bestand():
    r = _upload("leeg.txt", b"")
    assert r.status_code == 422 and "leeg" in r.json()["detail"]


def test_txt_met_alleen_spaties():
    r = _upload("spaties.txt", b"   \n  ")
    assert r.status_code == 422 and "geen tekst" in r.json()["detail"]


def test_verkeerd_bestandstype():
    r = _upload("presentatie.pptx", b"abc")
    assert r.status_code == 422 and "niet ondersteund" in r.json()["detail"]


def test_beschadigde_foto():
    r = _upload("kapot.jpg", b"dit is geen foto")
    assert r.status_code == 422 and "beschadigd" in r.json()["detail"]


def test_te_groot_bestand_40mb():
    r = _upload("pagina.jpg", b"0" * (40 * 1024 * 1024))
    assert r.status_code == 422 and "te groot" in r.json()["detail"]


def test_lage_resolutie_waarschuwing():
    r = _upload("klein.jpg", _afbeelding(grootte=(200, 300)))
    assert any("resolutie" in w for w in r.json()["waarschuwingen"])


# --- Privacy -----------------------------------------------------------------


def test_privacyfilter():
    tekst, tellingen = filter_persoonsgegevens(
        "Mail mij op jan.de.vries@school.nl of bel 06-12345678. Ik woon op Dorpsstraat 12, 1234 AB Almere."
    )
    for gegeven in ("jan.de.vries", "12345678", "Dorpsstraat 12", "1234 AB"):
        assert gegeven not in tekst
    assert set(tellingen) == {"[E-MAIL]", "[TELEFOON]", "[ADRES]", "[POSTCODE]"}


# --- Citaten -----------------------------------------------------------------


def test_citaat_controle_is_tolerant_voor_witruimte_en_aanhalingstekens():
    assert citaat_komt_voor("zorgen  platforms\nvoor een constante", TEKST)
    assert not citaat_komt_voor("dit staat er helemaal niet", TEKST)


# --- Beoordelen (demomodel) ----------------------------------------------------


def _beoordeel(**extra):
    verzoek = {"model": "demo", "leerlingcode": "L001", "criteria": CRITERIA, "tekst": TEKST} | extra
    return client.post("/api/beoordeel", json=verzoek)


def test_demo_beoordeling_heeft_geldige_citaten_en_punten():
    r = _beoordeel()
    assert r.status_code == 200
    opbouw, taal = r.json()["criteria"]
    assert opbouw["status"] == "voorstel" and opbouw["punten"] in (1, 3, 5)
    assert opbouw["citaten"] and all(citaat_komt_voor(c, TEKST) for c in opbouw["citaten"])
    # Het demomodel kan taal niet beoordelen -> geen score (PvE-eis 7)
    assert taal["status"] == "docent-moet-beoordelen" and taal["punten"] is None


def test_te_korte_tekst_geeft_geen_score():
    r = _beoordeel(tekst="Ik vind sociale media leuk.")
    assert all(c["status"] == "docent-moet-beoordelen" and c["punten"] is None for c in r.json()["criteria"])


def test_rubric_zonder_punten_wordt_geweigerd():
    zonder = [{"id": "x", "naam": "Inhoud", "niveaus": [{"id": "x1", "label": "Goed", "punten": 0}]}]
    r = _beoordeel(criteria=zonder)
    assert r.status_code == 422 and "punten" in r.json()["detail"]


def test_verzonnen_citaat_wordt_docent_moet_beoordelen():
    from app.citaten import controleer_voorstellen
    from app.schemas import BeoordeelVerzoek, CriteriumVoorstel

    verzoek = BeoordeelVerzoek(leerlingcode="L1", criteria=CRITERIA, tekst=TEKST)
    v = CriteriumVoorstel(criteriumId="opbouw", status="voorstel", niveauId="o3", citaten=["verzonnen zin"], zekerheid="hoog")
    resultaat, waarschuwingen = controleer_voorstellen([v], verzoek, TEKST)
    assert resultaat[0].status == "docent-moet-beoordelen" and resultaat[0].punten is None
    assert resultaat[1].status == "docent-moet-beoordelen"  # ontbrekend criterium
    assert waarschuwingen


def test_onbekend_of_onbeschikbaar_model():
    assert _beoordeel(model="bestaat-niet").status_code == 502
    r = _beoordeel(model="gemini")  # geen sleutel in de testomgeving
    assert r.status_code == 502 and "niet beschikbaar" in r.json()["detail"]


def test_demo_transcriptie_meldt_onleesbaar():
    afbeelding = base64.b64encode(_afbeelding()).decode()
    r = client.post("/api/transcribeer", json={"model": "demo", "afbeeldingen": [afbeelding]})
    assert r.status_code == 200 and r.json()["leesbaar"] is False


def test_demo_rubric_omzetten():
    r = client.post("/api/rubric", json={"tekst": "Inhoud (10 punten)\nOpbouw: 8\n- Taalverzorging 4 pt\nPresentatie"})
    data = r.json()
    assert [c["naam"] for c in data["criteria"]] == ["Inhoud", "Opbouw", "Taalverzorging", "Presentatie"]
    assert max(n["punten"] for n in data["criteria"][0]["niveaus"]) == 10
    assert any("Presentatie" in w for w in data["waarschuwingen"])


def test_modellenlijst():
    ids = {m["id"]: m for m in client.get("/api/modellen").json()}
    assert ids["demo"]["beschikbaar"] and not ids["gemini"]["beschikbaar"]


def test_heic_van_iphone():
    from pillow_heif import from_pillow

    beeld = Image.open(io.BytesIO(_afbeelding()))
    buffer = io.BytesIO()
    from_pillow(beeld).save(buffer, quality=80)
    r = _upload("IMG_0001.HEIC", buffer.getvalue())
    assert r.status_code == 200 and r.json()["paginas"][0]["soort"] == "afbeelding"
