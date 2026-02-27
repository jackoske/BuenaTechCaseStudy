#!/usr/bin/env python3
"""
Generate fake Teilungserklärung test PDFs for Buena demo.
Produces both text-based (extractable) and scanned (image-only) variants.

Usage: python3 generate_test_pdfs.py
Output: test_pdfs/ directory
"""

import os
import struct
import zlib
from pathlib import Path

# ── Fake property data ─────────────────────────────────────────────────────

PROPERTIES = [
    {
        "name": "Sonnenhof München",
        "number": "48.123SMH",
        "manager": "Bayerische Hausverwaltung GmbH",
        "accountant": "Steuerberatung Fischer & Partner",
        "buildings": [
            {
                "name": "Haus 1 - Gartenflügel",
                "street": "Sonnenallee",
                "houseNumber": "14",
                "zipCode": "80331",
                "city": "München",
                "year": 2019,
                "floors": 4,
            },
        ],
        "units": [
            ("01", "Apartment", "EG", "A", 82.0, "95/1000", 2019, 2),
            ("02", "Apartment", "EG", "A", 79.5, "92/1000", 2019, 2),
            ("03", "Apartment", "1. OG", "A", 105.0, "121/1000", 2019, 3),
            ("04", "Apartment", "2. OG", "A", 105.0, "121/1000", 2019, 3),
            ("05", "Apartment", "3. OG", "A", 88.0, "102/1000", 2019, 3),
            ("06", "Apartment", "3. OG", "A", 72.0, "83/1000", 2019, 2),
            ("07", "Parking", "UG", "", 13.0, "2/1000", 2019, None),
            ("08", "Parking", "UG", "", 13.0, "2/1000", 2019, None),
            ("09", "Garden", "EG", "", 55.0, "8/1000", 2019, None),
        ],
    },
    {
        "name": "Hafenquartier Hamburg",
        "number": "20.459HQH",
        "manager": "Nordsee Immobilien Verwaltung AG",
        "accountant": "Revisions GmbH Hanseatic",
        "buildings": [
            {
                "name": "Block Nord",
                "street": "Hafenstraße",
                "houseNumber": "7",
                "zipCode": "20457",
                "city": "Hamburg",
                "year": 2021,
                "floors": 6,
            },
            {
                "name": "Block Süd",
                "street": "Kaispeicher Weg",
                "houseNumber": "3",
                "zipCode": "20457",
                "city": "Hamburg",
                "year": 2021,
                "floors": 5,
            },
        ],
        "units": [
            ("01", "Apartment", "1. OG", "Nord", 95.0, "88/1000", 2021, 3),
            ("02", "Apartment", "1. OG", "Nord", 62.0, "57/1000", 2021, 2),
            ("03", "Office", "EG", "Nord", 140.0, "130/1000", 2021, None),
            ("04", "Apartment", "2. OG", "Nord", 110.0, "102/1000", 2021, 4),
            ("05", "Apartment", "2. OG", "Nord", 110.0, "102/1000", 2021, 4),
            ("06", "Apartment", "3. OG", "Süd", 78.0, "72/1000", 2021, 2),
            ("07", "Apartment", "4. OG", "Süd", 120.0, "111/1000", 2021, 4),
            ("08", "Apartment", "5. OG", "Süd", 155.0, "143/1000", 2021, 5),
            ("09", "Parking", "UG", "", 14.5, "2/1000", 2021, None),
            ("10", "Parking", "UG", "", 14.5, "2/1000", 2021, None),
            ("11", "Parking", "UG", "", 14.5, "2/1000", 2021, None),
        ],
    },
    {
        "name": "Stadtgarten Köln",
        "number": "50.667SGK",
        "manager": "Kölner Wohnraum Verwaltung KG",
        "accountant": "Treuhand Rheinland GmbH",
        "buildings": [
            {
                "name": "Hauptgebäude",
                "street": "Ringsstraße",
                "houseNumber": "22",
                "zipCode": "50667",
                "city": "Köln",
                "year": 2017,
                "floors": 3,
            },
        ],
        "units": [
            ("01", "Apartment", "EG", "A", 68.0, "105/1000", 2017, 2),
            ("02", "Apartment", "EG", "B", 71.0, "109/1000", 2017, 2),
            ("03", "Apartment", "1. OG", "A", 85.0, "131/1000", 2017, 3),
            ("04", "Apartment", "1. OG", "B", 85.0, "131/1000", 2017, 3),
            ("05", "Apartment", "2. OG", "A", 92.0, "141/1000", 2017, 3),
            ("06", "Apartment", "2. OG", "B", 89.0, "137/1000", 2017, 3),
            ("07", "Garden", "EG", "A", 48.0, "12/1000", 2017, None),
            ("08", "Garden", "EG", "B", 44.0, "11/1000", 2017, None),
            ("09", "Parking", "UG", "", 12.5, "7/1000", 2017, None),
        ],
    },
]


# ── Minimal raw-PDF writer ─────────────────────────────────────────────────

def _pdf_str(s: str) -> bytes:
    """Encode a string for PDF stream — keep ASCII, replace special chars."""
    return s.encode("latin-1", errors="replace")


FLOOR_NAMES = {
    "EG": "Erdgeschoss",
    "UG": "Untergeschoss",
    "1. OG": "1 Obergeschoss",
    "2. OG": "2 Obergeschoss",
    "3. OG": "3 Obergeschoss",
    "4. OG": "4 Obergeschoss",
    "5. OG": "5 Obergeschoss",
}

UNIT_TYPE_DE = {
    "Apartment": "Wohnung",
    "Office": "Büro",
    "Garden": "Gartenanteil",
    "Parking": "Stellplatz",
}


def build_text_pdf(prop: dict) -> bytes:
    """Build a text-extractable PDF in German legal document format.
    Text exactly matches the patterns the regex parser expects."""

    lines = []

    def ln(text=""):
        lines.append(text)

    oq = "\u201e"  # „  (low-9 quotation mark — opens German quotes)

    # ── Preamble ──────────────────────────────────────────────────────────────
    ln("TEILUNGSERKLÄRUNG")
    ln("Gemäß § 8 WEG")
    ln()
    ln("Vor dem unterzeichneten Notar erschien der Eigentümer und erklärte,")
    ln(f"das Grundstück unter dem Namen {oq}{prop['name']}")
    ln("zu teilen.")
    ln()
    ln(f"Objektnummer {prop['number']}")
    ln("Verwaltungsart: WEG")
    ln()

    # Manager (matches: /ward bestellt „CompanyName/ or /Hausverwaltung: „CompanyName/)
    ln(f"Als Hausverwalter ward bestellt {oq}{prop['manager']} Verwaltungsstraße 1,")
    ln(f"Hausverwaltung: {oq}{prop['manager']}")
    ln()

    # Accountant (matches: /Steuerberatung: .+/)
    ln(f"Steuerberatung: {prop['accountant']}")
    ln()

    # ── Buildings ─────────────────────────────────────────────────────────────
    ln("§ 1 GEBÄUDE")
    ln()

    for i, b in enumerate(prop["buildings"], 1):
        max_floor = b["floors"] - 1  # floors=4 → "Erdgeschoss bis 3 Obergeschoss"
        floors_str = (
            f"Erdgeschoss bis {max_floor} Obergeschoss"
            if max_floor > 0
            else "Erdgeschoss"
        )
        ln(f"({i}) Gebäude {i} ({b['name']})")
        ln(f"Das Gebäude liegt an der Adresse {b['street']} {b['houseNumber']}, {b['zipCode']} {b['city']}.")
        ln(f"Baujahr {b['year']}. Das Gebäude umfasst {floors_str}.")
        ln()

    # ── Units ─────────────────────────────────────────────────────────────────
    ln("§ 2 SONDEREIGENTUMSEINHEITEN")
    ln()

    for idx, u in enumerate(prop["units"], 1):
        nr, typ, floor, entrance, sqm, mea, year, rooms = u
        type_de = UNIT_TYPE_DE.get(typ, "Wohnung")
        floor_de = FLOOR_NAMES.get(floor, floor)

        # MEA formatted as "110,0/1.000"
        mea_formatted = mea.replace("/", "/").replace(".", ",", 1) if "/" in mea else mea
        # e.g. "95/1000" → "95,0/1.000"
        parts = mea.split("/")
        if len(parts) == 2:
            num = parts[0].replace(",", ".")
            mea_formatted = f"{float(num):,.1f}/1.000".replace(",", "X").replace(".", ",").replace("X", ".")

        entrance_str = f", Eingang {entrance}" if entrance else ""
        rooms_str = f"\nZimmer: {rooms} Zimmer" if rooms is not None else ""

        sqm_de = f"{sqm:.2f}".replace(".", ",")

        ln(f"{idx}. Einheit Nr. {nr} ({type_de})")
        ln(f"Lage: {floor_de}{entrance_str}")
        ln(f"Größe: ca {sqm_de} m²")
        ln(f"Miteigentumsanteil von {mea_formatted} am Grundstück.{rooms_str}")
        ln(f"Baujahr der Einheit: {year}")
        ln()

    # ── Footer ────────────────────────────────────────────────────────────────
    ln("Diese Teilungserklärung wurde notariell beurkundet.")
    ln(f"Ort und Datum: {prop['buildings'][0]['city']}, den 15.03.{prop['buildings'][0]['year']}")
    ln()
    ln("gez. Notar Dr. Hans-Jürgen Weber")
    ln("Notarielle Beglaubigung Nr. 2024-1192-TK")

    full_text = "\n".join(lines)
    return _write_pdf_pages(full_text)


def _write_pdf_pages(text: str) -> bytes:
    """Write a minimal valid PDF with the given text across pages."""
    # Split into ~50-line pages
    all_lines = text.split("\n")
    page_size = 45
    pages = [all_lines[i:i+page_size] for i in range(0, len(all_lines), page_size)]

    objects = []  # list of (obj_id, bytes_content)
    page_ids = []

    font_id = 1
    objects.append((font_id,
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"))

    pages_dict_id = 2

    content_ids_start = 3
    page_obj_ids_start = content_ids_start + len(pages)

    # Content streams
    for i, page_lines in enumerate(pages):
        stream_lines = []
        stream_lines.append("BT")
        stream_lines.append("/F1 9 Tf")
        stream_lines.append("1 0 0 1 40 800 Tm")
        stream_lines.append("14 TL")
        for line in page_lines:
            # Escape special PDF chars
            safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\r", "")
            stream_lines.append(f"({safe}) Tj T*")
        stream_lines.append("ET")
        stream_text = "\n".join(stream_lines)
        stream_bytes = stream_text.encode("cp1252", errors="replace")
        content_obj = (
            f"<< /Length {len(stream_bytes)} >>\nstream\n".encode() +
            stream_bytes +
            b"\nendstream"
        )
        obj_id = content_ids_start + i
        objects.append((obj_id, content_obj))

    # Page objects
    for i, page_lines in enumerate(pages):
        content_id = content_ids_start + i
        page_obj_id = page_obj_ids_start + i
        page_ids.append(page_obj_id)
        page_obj = (
            f"<< /Type /Page /Parent {pages_dict_id} 0 R "
            f"/MediaBox [0 0 595 842] "
            f"/Contents {content_id} 0 R "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> >>"
        ).encode()
        objects.append((page_obj_id, page_obj))

    # Pages dictionary
    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    pages_obj = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode()
    objects.insert(1, (pages_dict_id, pages_obj))

    # Catalog
    catalog_id = max(obj_id for obj_id, _ in objects) + 1
    catalog_obj = f"<< /Type /Catalog /Pages {pages_dict_id} 0 R >>".encode()
    objects.append((catalog_id, catalog_obj))

    # Sort by obj id
    objects.sort(key=lambda x: x[0])

    # Build PDF body
    buf = b"%PDF-1.4\n"
    offsets = {}

    for obj_id, content in objects:
        offsets[obj_id] = len(buf)
        buf += f"{obj_id} 0 obj\n".encode()
        buf += content
        buf += b"\nendobj\n"

    # xref
    xref_offset = len(buf)
    max_id = max(obj_id for obj_id, _ in objects)
    buf += b"xref\n"
    buf += f"0 {max_id + 1}\n".encode()
    buf += b"0000000000 65535 f \n"
    for i in range(1, max_id + 1):
        if i in offsets:
            buf += f"{offsets[i]:010d} 00000 n \n".encode()
        else:
            buf += b"0000000000 65535 f \n"

    buf += b"trailer\n"
    buf += f"<< /Size {max_id + 1} /Root {catalog_id} 0 R >>\n".encode()
    buf += b"startxref\n"
    buf += f"{xref_offset}\n".encode()
    buf += b"%%EOF\n"

    return buf


# ── Scanned PDF (image-only, via Pillow) ──────────────────────────────────

def build_scanned_pdf(prop: dict) -> bytes:
    """Render property text onto a white image — simulates a scanned PDF.
    Text is NOT extractable by PDF parsers."""
    from PIL import Image, ImageDraw, ImageFont
    import io

    pages_data = []

    def make_page(lines):
        img = Image.new("RGB", (1654, 2339), color=(255, 255, 255))  # A4 @ 200dpi
        draw = ImageDraw.Draw(img)

        # Try to use a monospace font, fall back to default
        try:
            font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono.ttf", 24)
            font_bold = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf", 28)
        except Exception:
            font = ImageFont.load_default()
            font_bold = font

        # Add slight noise/rotation to look more "scanned"
        x, y = 80, 80
        line_height = 34
        for line in lines:
            f = font_bold if line.startswith("TEIL") or line.startswith("──") else font
            draw.text((x, y), line, fill=(20, 20, 20), font=f)
            y += line_height

        # Convert to bytes via in-memory TIFF then save as single PDF
        buf = io.BytesIO()
        img.save(buf, format="PDF", resolution=200)
        return buf.getvalue()

    # Build text lines (same content, but will be image)
    all_lines = []
    all_lines += [
        "TEILUNGSERKLARUNG",
        "Gemass SS 8 WEG",
        "",
        f"Verwaltungsobjekt: {prop['name']}",
        f"Objektnummer: {prop['number']}",
        f"Verwaltungsart: WEG",
        f"Hausverwalter: {prop['manager']}",
        f"Buchhalter: {prop['accountant']}",
        "",
        "─" * 55,
        "GEBAUDE",
        "─" * 55,
    ]
    for i, b in enumerate(prop["buildings"], 1):
        all_lines += [
            "",
            f"Gebaeude {i}: {b['name']}",
            f"  Strasse: {b['street']} {b['houseNumber']}",
            f"  PLZ/Ort: {b['zipCode']} {b['city']}",
            f"  Baujahr: {b['year']}  Stockwerke: {b['floors']}",
        ]
    all_lines += [
        "",
        "─" * 55,
        "EINHEITEN",
        "─" * 55,
        "",
        f"{'Nr':<6} {'Typ':<12} {'Etage':<10} {'Flaeche':>9}  {'MEA':<14} {'Zimmer'}",
        "─" * 70,
    ]
    for u in prop["units"]:
        nr, typ, floor, entrance, sqm, mea, year, rooms = u
        rooms_str = str(rooms) if rooms is not None else "-"
        all_lines.append(f"{nr:<6} {typ:<12} {floor:<10} {sqm:>8.1f}m2  {mea:<14} {rooms_str}")

    all_lines += ["", "Notariell beurkundet.", f"Ort: {prop['buildings'][0]['city']}"]

    # Fit lines per page (A4 @ 34px line height = ~62 lines)
    page_size = 55
    pages = [all_lines[i:i+page_size] for i in range(0, len(all_lines), page_size)]

    if len(pages) == 1:
        return make_page(pages[0])

    # Multi-page: generate each page as PDF bytes then merge via raw append
    # (Pillow can only do single-page PDF; for demo multi-page scanned just use page 1+2)
    from PIL import Image
    import io

    imgs = []
    for page_lines in pages:
        img = Image.new("RGB", (1654, 2339), color=(255, 255, 255))
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono.ttf", 24)
        except Exception:
            font = ImageFont.load_default()
        y = 80
        for line in page_lines:
            draw.text((80, y), line, fill=(20, 20, 20), font=font)
            y += 34
        imgs.append(img)

    buf = io.BytesIO()
    imgs[0].save(buf, format="PDF", resolution=200, save_all=True, append_images=imgs[1:])
    return buf.getvalue()


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    out = Path("test_pdfs")
    out.mkdir(exist_ok=True)

    for prop in PROPERTIES:
        slug = prop["name"].lower().replace(" ", "_")

        # Text PDF
        text_pdf = build_text_pdf(prop)
        text_path = out / f"{slug}_text.pdf"
        text_path.write_bytes(text_pdf)
        print(f"✓ {text_path}  ({len(text_pdf)//1024}KB, text)")

        # Scanned PDF
        scanned_pdf = build_scanned_pdf(prop)
        scanned_path = out / f"{slug}_scanned.pdf"
        scanned_path.write_bytes(scanned_pdf)
        print(f"✓ {scanned_path}  ({len(scanned_pdf)//1024}KB, scanned/image)")

    print(f"\nGenerated {len(PROPERTIES)*2} PDFs in {out}/")


if __name__ == "__main__":
    main()
