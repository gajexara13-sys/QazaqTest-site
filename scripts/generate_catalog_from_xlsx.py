"""
Собирает src/data/catalog.generated.json из Excel каталога QazaqTest.

Использование:
  python scripts/generate_catalog_from_xlsx.py
  python scripts/generate_catalog_from_xlsx.py "C:\\path\\to\\QazaqTest_catalog.xlsx"

По умолчанию ищет файл в data/QazaqTest_catalog.xlsx в корне репозитория,
затем в типичном пути Downloads.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = REPO_ROOT / "src" / "data" / "catalog.generated.json"

CRM_TO_CATEGORY_ID = {
    "Асфальтобетоны": "asphalt",
    "Битумные вяжущие": "bitumen",
    "Каменные заполнители": "aggregates",
    "Минеральные порошки": "min-powder",
    "Бетоны и растворы": "concrete",
    "Цементные вяжущие": "cement",
    "Укрепленные грунты": "stabilized-soil",
    "Грунты и почвы": "soil",
    "Общелабораторное оборудование": "general-lab",
    "Битумные эмульсии": "bitumen-emulsions",
    "Полевые испытания": "field-testing",
    "Неразрушающий контроль": "ndt",
}


def _find_input_path() -> Path | None:
    if len(sys.argv) > 1:
        p = Path(sys.argv[1])
        if p.is_file():
            return p
        print(f"Файл не найден: {p}", file=sys.stderr)
        return None
    candidates = [
        REPO_ROOT / "data" / "QazaqTest_catalog.xlsx",
        Path.home() / "Downloads" / "QazaqTest_catalog.xlsx",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


def _clean_description(text: str | None) -> str:
    if not text:
        return ""
    t = str(text).strip()
    t = re.sub(r"^Главная особенность\s*\n+", "", t, flags=re.IGNORECASE)
    return t


def _clean_title(title: str, model: str | None) -> str:
    """Убирает упоминание модели из названия товара."""
    t = title.strip()
    # Убираем паттерн " Модель: MODEL" / " Модель:MODEL" / ". Модель: MODEL"
    t = re.sub(r'[\s.,]+[Мм]одел[ьь][:\s]+\S+\s*$', '', t).strip()
    # Если модель явно присутствует в конце названия — убираем
    if model:
        m = re.escape(model.strip())
        t = re.sub(rf'[\s\-]+{m}\s*$', '', t).strip()
    return t


def _summary_from_description(desc: str, max_len: int = 240) -> str:
    if not desc:
        return ""
    one_line = re.sub(r"\s+", " ", desc).strip()
    if len(one_line) <= max_len:
        return one_line
    cut = one_line[: max_len - 1]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut + "…"


def _paragraphs(text: str) -> list[str]:
    if not text:
        return []
    parts = re.split(r"\n\s*\n", text.strip())
    out: list[str] = []
    for p in parts:
        s = re.sub(r"\s+", " ", p).strip()
        if len(s) >= 24:
            out.append(s[:280] + ("…" if len(s) > 280 else ""))
        if len(out) >= 5:
            break
    return out


def _parse_specs(text: str | None) -> list[str]:
    if not text:
        return []
    lines: list[str] = []
    for raw in str(text).replace("\r", "").split("\n"):
        s = raw.strip()
        if not s:
            continue
        low = s.lower()
        if "характеристик" in low and len(s) < 40:
            continue
        s = re.sub(r"^\d+\.\s*", "", s).strip()
        if len(s) > 3:
            lines.append(s)
    return lines[:16]


def _tags(orig: str | None, model: str | None, brand: str | None, crm: str) -> list[str]:
    tags: list[str] = []
    if orig:
        o = str(orig).strip()
        if ">" in o:
            o = o.split(">")[-1].strip()
        if len(o) > 42:
            o = o[:39] + "…"
        tags.append(o)
    if model and str(model).strip():
        tags.append(str(model).strip())
    if brand and str(brand).strip() and str(brand).strip() != "Не указан":
        tags.append(str(brand).strip())
    if crm and crm not in tags and len(tags) < 5:
        tags.append(crm)
    if not tags:
        tags = ["Каталог"]
    return tags[:5]


def main() -> None:
    src = _find_input_path()
    if src is None:
        print(
            "Укажите путь к QazaqTest_catalog.xlsx аргументом или положите файл в data/QazaqTest_catalog.xlsx",
            file=sys.stderr,
        )
        sys.exit(1)

    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    ws = wb["Каталог"]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    header = [str(c).strip() if c is not None else None for c in rows[0]]
    col = {name: header.index(name) for name in header if name}

    required = ["ID", "Название", "Категория (CRM)", "Оригинальная категория", "Описание"]
    for k in required:
        if k not in col:
            print(f"В листе «Каталог» нет колонки «{k}»", file=sys.stderr)
            sys.exit(1)

    items: list[dict] = []
    errors: list[str] = []

    for r in rows[1:]:
        if not r or r[col["ID"]] is None:
            continue
        row_id = r[col["ID"]]
        title = (r[col["Название"]] or "").strip() if r[col["Название"]] else ""
        if not title:
            errors.append(f"Строка ID={row_id}: пустое название")
            continue

        crm = (r[col["Категория (CRM)"]] or "").strip() if r[col["Категория (CRM)"]] else ""
        category_id = CRM_TO_CATEGORY_ID.get(crm)
        if not category_id:
            errors.append(f"ID={row_id}: неизвестная категория CRM «{crm}»")
            continue

        desc_raw = r[col["Описание"]] if col.get("Описание") is not None else ""
        desc = _clean_description(desc_raw)
        tech = r[col["Технические характеристики"]] if col.get("Технические характеристики") is not None else ""

        model = r[col["Модель"]] if col.get("Модель") is not None else None
        # Очищаем название от модели после того как model считан
        title = _clean_title(title, str(model).strip() if model else None)
        sku = r[col["Артикул"]] if col.get("Артикул") is not None else None
        brand = r[col["Бренд"]] if col.get("Бренд") is not None else None
        price = r[col["Цена"]] if col.get("Цена") is not None else None
        photo = r[col["Фото (URL)"]] if col.get("Фото (URL)") is not None else None
        link = r[col["Ссылка на товар"]] if col.get("Ссылка на товар") is not None else None
        wp = r[col["WP ID"]] if col.get("WP ID") is not None else None

        orig = r[col["Оригинальная категория"]] if "Оригинальная категория" in col else None

        specs = _parse_specs(str(tech) if tech else "")
        features = _paragraphs(desc)
        if not features and desc:
            features = [desc[:300] + ("…" if len(desc) > 300 else "")]
        if not specs and features:
            specs = features[:6]

        price_label = str(price).strip() if price is not None and str(price).strip() else None
        image_url = str(photo).strip() if photo and str(photo).strip().startswith("http") else None
        product_url = str(link).strip() if link and str(link).strip().startswith("http") else None

        wp_id = None
        if wp is not None:
            try:
                wp_id = int(float(wp))
            except (TypeError, ValueError):
                wp_id = None

        item = {
            "id": f"qzt-{int(row_id)}",
            "categoryId": category_id,
            "title": title,
            "summary": _summary_from_description(desc) or title[:200],
            "tags": _tags(str(orig) if orig else None, str(model) if model else None, str(brand) if brand else None, crm),
            "imageLabel": (str(model).strip() if model and str(model).strip() else title)[:80],
            "description": desc or title,
            "features": features[:5] if features else [title],
            "specs": specs if specs else (features[:8] if features else [crm]),
            "model": str(model).strip() if model and str(model).strip() else None,
            "sku": str(sku).strip() if sku and str(sku).strip() else None,
            "brand": str(brand).strip() if brand and str(brand).strip() and str(brand).strip() != "Не указан" else None,
            "priceLabel": price_label,
            "imageUrl": image_url,
            "productUrl": product_url,
            "originalCategory": str(orig).strip() if orig else None,
            "wpId": wp_id,
        }
        items.append(item)

    if errors:
        for e in errors[:25]:
            print(e, file=sys.stderr)
        if len(errors) > 25:
            print(f"... и ещё {len(errors) - 25} ошибок", file=sys.stderr)
        sys.exit(1)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(items)} items -> {OUT_PATH} (source: {src})")


if __name__ == "__main__":
    main()
