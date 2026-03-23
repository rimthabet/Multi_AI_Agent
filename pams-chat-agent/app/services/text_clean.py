# app/services/text_clean.py
import re
import unicodedata
from typing import List

# ─────────────────────────────────────────────────────────────────────────────
# Normalisations / ligatures
# ─────────────────────────────────────────────────────────────────────────────

LIGATURES = {
    "\ufb01": "fi",
    "\ufb02": "fl",
    "\ufb00": "ff",
    "\ufb03": "ffi",
    "\ufb04": "ffl",
}

SUSPICIOUS_CHARS = set(
    [
        "\uFFFD",  # replacement char
        "\u00A9",  # © (souvent bruit OCR)
        "\u00AE",  # ®
        "\u2122",  # ™
        "\u2022",  # •
    ]
)

# Caractères de bruit fréquents 
NOISE_CHARS = set("|/\\=&®©°•™")  

# ─────────────────────────────────────────────────────────────────────────────
# Nettoyage artefacts PDF/OCR (Ï ÿ Ÿ etc.) 
# ─────────────────────────────────────────────────────────────────────────────

_TRANSLATE_BASIC = str.maketrans(
    {
        "“": '"',
        "”": '"',
        "’": "'",
        "‘": "'",
        "–": "-",
        "—": "-",
        "\u00A0": " ", 
        "\u200b": "", 
        "ﬁ": "fi",
        "ﬂ": "fl",
    }
)

_SINGLETON_GARBAGE = set("ÏÿŸþÞðÐ¤¦¨´¸•·")

_ALLOWED_SINGLE_LETTERS = {"a", "à", "y", "d", "l", "s", "n", "j", "t", "m", "c", "u"}


def _maybe_fix_mojibake(s: str) -> str:
    if not s:
        return s
    if any(x in s for x in ("Ã", "Â", "â€™", "â€œ", "â€", "â€“", "â€”")):
        try:
            repaired = s.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
            if repaired and repaired.count("�") <= s.count("�"):
                return repaired
        except Exception:
            return s
    return s


def _drop_single_letter_noise(s: str) -> str:
    if not s:
        return s

    def repl(m: re.Match) -> str:
        ch = m.group(0)
        return ch if ch.lower() in _ALLOWED_SINGLE_LETTERS else " "

    return re.sub(r"(?:(?<=\s)|^)[A-Za-zÀ-ÿ](?=\s)", repl, s)


def clean_weird_chars(text: str) -> str:
    """
    Nettoyage léger post-extraction:
    - normalisation NFKC + translation (guillemets/tirets/espaces invisibles)
    - suppression contrôles/private-use
    - suppression de caractères parasites isolés (Ï/ÿ/Ÿ...) s'ils sont seuls
    - suppression de lettres isolées 1 char non plausibles (conservateur)
    """
    if not text:
        return ""

    s = _maybe_fix_mojibake(text)
    s = unicodedata.normalize("NFKC", s).translate(_TRANSLATE_BASIC)

    s = "".join(
        ch
        for ch in s
        if (ch in "\n\t\r") or (unicodedata.category(ch) not in ("Cc", "Cf", "Co"))
    )

    if _SINGLETON_GARBAGE:
        s = re.sub(
            rf"(?:(?<=\s)|^)[{re.escape(''.join(_SINGLETON_GARBAGE))}](?=\s|$)",
            " ",
            s,
        )

    # Supprimer lettres isolées 1 caractère non plausibles
    s = _drop_single_letter_noise(s)

    # Normaliser espaces
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    return s.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Détection bruit OCR très fort (gibberish)
# ─────────────────────────────────────────────────────────────────────────────

_VOWELS = set("aeiouyàâäéèêëïîôùûüÿæœAEIOUYÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒ")


def _longest_repeat_run(s: str) -> int:
    if not s:
        return 0
    best = 1
    cur = 1
    prev = s[0]
    for ch in s[1:]:
        if ch == prev:
            cur += 1
            if cur > best:
                best = cur
        else:
            prev = ch
            cur = 1
    return best


def is_very_garbled_line(line: str) -> bool:
    """
    Détecte les lignes OCR franchement illisibles:
    - mélange crochets/symboles élevé
    - mots sans voyelles
    - répétitions longues
    - ponctuation ultra-dense / tokens trop courts (cas KPMG que tu as montré)
    """
    if not line:
        return False
    s = line.strip()
    if len(s) < 35:
        return False

    compact_len = len(s.replace(" ", ""))
    if compact_len <= 0:
        return False

    special = sum(not (c.isalnum() or c.isspace()) for c in s)
    special_ratio = special / compact_len
    brackets = sum(c in "[]{}()<>|" for c in s)
    repeat_run = _longest_repeat_run(s)

    alpha = sum(c.isalpha() for c in s)
    alpha_ratio = alpha / compact_len

    words = [w.strip("|[](){}<>:;,._#\\/-") for w in s.split()]
    words = [w for w in words if w]

    no_vowel = 0
    mixed_alnum = 0
    for w in words:
        if len(w) >= 4 and w.isalpha() and not any(ch in _VOWELS for ch in w):
            no_vowel += 1
        if any(ch.isalpha() for ch in w) and any(ch.isdigit() for ch in w):
            mixed_alnum += 1

    # 1) Beaucoup de mots sans voyelles
    if len(words) >= 6 and (no_vowel / len(words)) > 0.30:
        return True

    # 2) Crochets + symboles élevés
    if brackets >= 6 and special_ratio > 0.25:
        return True

    # 3) Peu de lettres + beaucoup de spéciaux
    if alpha_ratio < 0.35 and special_ratio > 0.30:
        return True

    # 4) Répétitions longues + symboles
    if repeat_run >= 5 and special_ratio > 0.18:
        return True

    # 5) Beaucoup de tokens lettre+chiffre dans une ligne déjà bruitée
    if mixed_alnum >= 3 and special_ratio > 0.18:
        return True

    # 6) Ponctuation ultra-dense (ton 1er chunk)
    punct = sum(c in ".,;:+-_=*'\"`~^|\\/[]{}()<>!?" for c in s)
    punct_ratio = punct / compact_len
    if punct_ratio > 0.22 and alpha_ratio < 0.55:
        return True

    # 7) Trop de tokens 1-2 chars (hors stop words) sur une ligne longue
    short_tokens = 0
    stop2 = {"a", "à", "de", "du", "le", "la", "et", "en", "au", "d", "l", "y"}
    for w in words:
        if len(w) <= 2 and w.lower() not in stop2:
            short_tokens += 1
    if len(words) >= 12 and (short_tokens / len(words)) > 0.35:
        return True

    return False


# ─────────────────────────────────────────────────────────────────────────────
# Heuristiques bruit / lignes "garbled"
# ─────────────────────────────────────────────────────────────────────────────

def _ratio(n: int, d: int) -> float:
    return (n / d) if d else 0.0


def is_noisy_line(line: str) -> bool:
    """
    Lignes très bruitées (symboles), typiques OCR raté.
    On évite de supprimer les petites lignes utiles.
    """
    if not line:
        return False
    s = line.strip()
    if not s:
        return False

    # petites lignes : très prudents
    if len(s) < 12:
        # garder si présence de lettres ou de chiffres significatifs
        if any(c.isalpha() for c in s) or sum(c.isdigit() for c in s) >= 2:
            return False
        # sinon si surtout symboles -> bruit
        noise = sum(c in NOISE_CHARS for c in s)
        special = sum(not (c.isalnum() or c.isspace()) for c in s)
        return noise >= 3 or _ratio(special, len(s)) > 0.6

    alpha = sum(c.isalpha() for c in s)
    digit = sum(c.isdigit() for c in s)
    noise = sum(c in NOISE_CHARS for c in s)
    special = sum(not (c.isalnum() or c.isspace()) for c in s)

    total = len(s)
    alpha_ratio = _ratio(alpha, total)
    special_ratio = _ratio(special, total)

    # motifs répétitifs type SNSNSN, HNHN...
    has_repeating_pattern = bool(re.search(r"(.{1,4})\1{3,}", s))

    return (
        (special_ratio > 0.35 and alpha_ratio < 0.35 and digit < 8)
        or (has_repeating_pattern and alpha_ratio < 0.5)
        or (noise > total * 0.25)
    )


def is_garbled_text_line(line: str) -> bool:
    """
    Lignes de texte "concaténé" / brouillé (souvent extraction texte depuis zones tableau).
    On évite de marquer comme garbled des titres normaux en majuscules.
    """
    if not line:
        return False
    s = line.strip()
    if len(s) < 20:
        return False

    words = s.split()
    if len(words) < 3:
        return False

    total_words = len(words)
    signals = 0

    pipe_count = s.count("|")
    if pipe_count >= 3:
        signals += pipe_count // 2

    for w in words:
        w_clean = w.strip("|[](){}:;,._# ")
        if not w_clean:
            continue

        if len(w_clean) >= 4 and re.search(r"[A-ZÀ-Ÿ]\d{2,}", w_clean) and re.search(r"\d[A-ZÀ-Ÿ]", w_clean):
            signals += 1

        if len(w_clean) <= 3 and any(c.isdigit() for c in w_clean) and any(c.isalpha() for c in w_clean):
            signals += 0.5

        if len(w_clean) >= 10 and w_clean.isupper() and re.match(r"^[A-ZÀ-Ÿ]+$", w_clean):
            continue
        elif len(w_clean) >= 10 and w_clean.isupper():
            signals += 1

    short_caps = 0
    for w in words:
        w_clean = w.strip("|[](){}:;,._# ")
        if w_clean and 1 <= len(w_clean) <= 3 and w_clean.isalpha() and w_clean.isupper():
            short_caps += 1
    if total_words >= 5 and (short_caps / total_words) > 0.35:
        signals += 2

    fragments = sum(1 for w in words if len(w.strip("(){}[]|,;:.-_!?*#@")) <= 2)
    if total_words >= 6 and fragments / total_words > 0.50:
        signals += 2

    return (signals / max(1, total_words)) > 0.12


def is_corrupted_line(line: str) -> bool:
    """
    Ligne corrompue = beaucoup de caractères non imprimables / suspects.
    On évite de considérer les accents FR comme corrompus.
    """
    if not line:
        return False
    s = line.strip()
    if len(s) < 10:
        return False

    suspicious = 0
    for c in s:
        if c in SUSPICIOUS_CHARS:
            suspicious += 1
        elif unicodedata.category(c).startswith("C") and c not in ("\t", "\n", "\r"):
            suspicious += 1

    return _ratio(suspicious, len(s)) > 0.12


def clean_corrupted_text(text: str) -> str:
    """
    Nettoyage "soft":
    - supprime les lignes vraiment corrompues / très bruitées / garbled
    - + supprime les lignes OCR très illisibles (very_garbled)
    - garde les accents FR
    """
    if not text:
        return ""

    lines = text.split("\n")
    out = []
    for line in lines:
        if is_corrupted_line(line) or is_noisy_line(line) or is_garbled_text_line(line) or is_very_garbled_line(line):
            continue
        cleaned = "".join(c for c in line if c not in SUSPICIOUS_CHARS)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if cleaned:
            out.append(cleaned)
    return "\n".join(out)


# ─────────────────────────────────────────────────────────────────────────────
# Nettoyage principal PDF -> texte
# ─────────────────────────────────────────────────────────────────────────────

def clean_pdf_text(text: str) -> str:
    if not text:
        return ""

    # enlever artefacts PDF/OCR (Ï ÿ Ÿ) avant tes heuristiques
    text = clean_weird_chars(text)

    # 1) nettoyer corruption/bruit (avant normalisation)
    text = clean_corrupted_text(text)

    # 2) normalisation unicode
    text = unicodedata.normalize("NFKC", text)

    # 3) ligatures
    for k, v in LIGATURES.items():
        text = text.replace(k, v)

    # 4) normaliser retours ligne
    text = text.replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 5) réparer césures fin de ligne: "acquisi-\n tion" => "acquisition"
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)

    # 6) remplacer sauts de ligne simples par espace, garder paragraphes
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)

    # 7) espaces
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+\n", "\n", text)
    text = text.strip()

    # 8) apostrophes
    text = text.replace("’", "'").replace("‘", "'").replace("`", "'")

    # 9) corrections OCR très safe
    text = re.sub(r"(?<=\s)4(?=\s)", "à", text)
    text = re.sub(r"(?<=\s)4(?=[.,;:!?])", "à", text)
    text = re.sub(r"(?<=[(«\"'])4(?=\s)", "à", text)

    text = re.sub(r"\betat\b", "état", text, flags=re.IGNORECASE)
    text = re.sub(r"\bannee\b", "année", text, flags=re.IGNORECASE)

    text = re.sub(r"—{2,}", " ", text)
    text = re.sub(r"-{3,}", " ", text)
    text = re.sub(r"['']{2,}", "'", text)

    # pipes isolés au milieu d'une phrase
    text = re.sub(r"(?<=[a-zà-ÿ0-9.,;:!?])\s*\|\s*(?=[A-ZÀ-Ÿa-zà-ÿ0-9])", " ", text)

    text = re.sub(r"[ \t]{2,}", " ", text).strip()
    return text


# ─────────────────────────────────────────────────────────────────────────────
# Détection/suppression des tableaux dans le texte OCR
# ─────────────────────────────────────────────────────────────────────────────

_FIN_AMOUNT_RE = re.compile(
    r"""
    (?:
        [\(\-]?\s*
        \d{1,3}(?:[ \u00A0]\d{3})*(?:[.,]\d+)?   # 1 234 567,89
        \s*[\)\-]?
        \s*(?:DT|D T|DH|TND|%|€|\$)?            # unités possibles
    )
    """,
    re.VERBOSE | re.IGNORECASE
)

_DATE_COL_RE = re.compile(r"\b(31[./-]12[./-]\d{2,4}|01[./-]01[./-]\d{2,4})\b")
_COLSEP_RE = re.compile(r"\s{3,}|\t+")  # colonnes: 3+ espaces ou tab

_SECTION_CODE_RE = re.compile(r"\b(?:AC|PA|CP|CH|PR|PC)\s*\d+\b", re.IGNORECASE)


def is_table_line(line: str) -> bool:
    """
    Détecte une ligne qui ressemble à une ligne de tableau.
    Objectif: retirer les tableaux OCR "en texte" sans retirer les paragraphes.
    """
    if not line:
        return False
    s = line.strip()
    if len(s) < 6:
        return False

    # présence de codes (AC1/PA2/CP1/...) + montants
    codes = _SECTION_CODE_RE.findall(s)
    if codes:
        amounts = _FIN_AMOUNT_RE.findall(s)
        if len(amounts) >= 2:
            return True
        if len(codes) >= 2:
            return True

    # TOTAL ACTIF/PASSIF
    if re.search(r"\bTOTAL\s*ACT", s, flags=re.IGNORECASE) or re.search(r"\bTOTAL\s*PASS", s, flags=re.IGNORECASE):
        if len(_FIN_AMOUNT_RE.findall(s)) >= 1:
            return True

    words = s.split()
    if len(words) >= 10:
        digit_words = sum(1 for w in words if any(c.isdigit() for c in w))
        if _ratio(digit_words, len(words)) < 0.25:
            return False

    parts = _COLSEP_RE.split(s)
    if len(parts) >= 3:
        numeric_parts = sum(1 for p in parts if _FIN_AMOUNT_RE.search(p) or _DATE_COL_RE.search(p))
        if _ratio(numeric_parts, len(parts)) >= 0.4:
            return True

    amounts = _FIN_AMOUNT_RE.findall(s)
    if len(amounts) >= 2:
        if re.search(r"\bEXERCICE\b|\bCLOS\b|\bARR[ÊE]T[ÉE]\b", s, flags=re.IGNORECASE) and len(words) <= 12:
            return False
        return True

    if len(_DATE_COL_RE.findall(s)) >= 2:
        return True

    if re.search(r"[-=_]{6,}", s):
        return True

    return False


def remove_table_sections(text: str, min_consecutive_lines: int = 2) -> str:
    """
    Supprime les blocs de tableaux du texte. Conserve les titres autour.
    """
    if not text:
        return text

    lines = text.split("\n")
    flags = [is_table_line(line) for line in lines]

    blocks = []
    start = None
    run = 0
    for i, is_tbl in enumerate(flags):
        if is_tbl:
            if start is None:
                start = i
            run += 1
        else:
            if run >= min_consecutive_lines:
                blocks.append((start, start + run))
            start = None
            run = 0
    if run >= min_consecutive_lines:
        blocks.append((start, start + run))

    if not blocks:
        return text

    out = []
    for i, line in enumerate(lines):
        in_block = any(a <= i < b for a, b in blocks)
        if not in_block:
            out.append(line)
    return "\n".join(out)


def clean_garbled_sequences(text: str) -> str:
    if not text:
        return text
    lines = text.split("\n")
    out = []
    for line in lines:
        if is_garbled_text_line(line) or is_noisy_line(line) or is_very_garbled_line(line):
            continue
        out.append(line)
    return "\n".join(out)


def clean_inline_garbled_segments(text: str) -> str:
    if not text:
        return text

    seg_re = re.compile(r"(?:\b[A-Z]{1,3}\b(?:\s+|\s*[\|\)\]\*:;,._#\\/-]\s*)?){8,}")
    sym_re = re.compile(r"(?:[\[\]\(\)\{\}<>|\\/:_#;.,=\-]{1,}\s*){12,}")

    lines = text.split("\n")
    out = []
    for line in lines:
        cleaned = seg_re.sub(" ", line)
        cleaned = sym_re.sub(" ", cleaned)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        if cleaned:
            out.append(cleaned)
    return "\n".join(out)


def strip_chunk_boundaries(text: str) -> str:
    if not text:
        return text
    noise = "'\"|#_—–-·•=\\/ "
    text = text.strip(noise)

    lines = text.split("\n")
    while lines and len(lines[0].strip()) < 4:
        if not any(c.isalpha() or c.isdigit() for c in lines[0]):
            lines.pop(0)
        else:
            break
    while lines and len(lines[-1].strip()) < 4:
        if not any(c.isalpha() or c.isdigit() for c in lines[-1]):
            lines.pop()
        else:
            break
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Fix spécifiques: lignes cassées sur 2 lignes dans OCR
# ─────────────────────────────────────────────────────────────────────────────

def merge_broken_label_lines(text: str) -> str:
    if not text:
        return text

    lines = text.split("\n")
    out: List[str] = []
    i = 0

    bullet_start = re.compile(r"^\s*([a-dA-D])\s*[-–]\s*(.+)\s*$")
    continuation_ok = re.compile(r"^\s*[a-zà-ÿ].{3,}$", re.IGNORECASE)

    while i < len(lines):
        cur = lines[i].rstrip()
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""

        m = bullet_start.match(cur)
        if m and nxt and continuation_ok.match(nxt) and not is_table_line(cur) and not is_table_line(nxt):
            merged = f"{m.group(1).lower()}- {m.group(2).strip()} {nxt}"
            out.append(re.sub(r"\s{2,}", " ", merged).strip())
            i += 2
            continue

        if nxt and len(nxt.split()) <= 3 and not re.search(r"\d", nxt):
            if cur.endswith(",") or cur.endswith(("créditeurs", "valeurs", "Intérêts", "dépôts", "droits")):
                merged = f"{cur} {nxt}"
                out.append(re.sub(r"\s{2,}", " ", merged).strip())
                i += 2
                continue

        out.append(cur)
        i += 1

    return "\n".join(out)


# ─────────────────────────────────────────────────────────────────────────────
# Re-split "soft" pour retrouver des lignes de tableau quand l'OCR/PDF aplatit tout
# ─────────────────────────────────────────────────────────────────────────────

def _rehydrate_lines_for_table_removal(text: str) -> str:
    """
    Quand clean_pdf_text a fusionné les \n en espaces, les tableaux deviennent une ligne longue.
    Ici on recrée des sauts de ligne AVANT remove_table_sections, de manière conservative.
    """
    if not text:
        return text

    t = text
    dense = (len(t) > 400 and t.count("\n") == 0)
    if not dense:
        return t

    # Break avant: "AC 1 -" "PA 2 -" etc.
    t = re.sub(r"\s+(?=(?:AC|PA|CP|CH|PR|PC)\s*\d+\s*[-–])", "\n", t, flags=re.IGNORECASE)
    # Break avant codes "AC1" "PA2" "CP1" (souvent collés sans '-')
    t = re.sub(r"\s+(?=(?:AC|PA|CP|CH|PR|PC)\s*\d+\b)", "\n", t, flags=re.IGNORECASE)

    # Break autour de TOTAL / ACTIF NET
    t = re.sub(r"\s+(?=TOTAL\s*ACT)", "\n", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+(?=TOTAL\s*PASS)", "\n", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+(?=ACTIF\s*NET)", "\n", t, flags=re.IGNORECASE)

    # Break avant des en-têtes d'états (souvent tables)
    t = re.sub(r"\s+(?=(?:ÉTAT|ETAT)\s+DE\s+VARIATION)", "\n", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+(?=NOMBRE\s+DE\s+PARTS)", "\n", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+(?=31/12/20\d{2})", "\n", t, flags=re.IGNORECASE)

    t = re.sub(r"\n{2,}", "\n", t)
    return t


# ─────────────────────────────────────────────────────────────────────────────
# API principale utilisée par doc_ingest.py
# ─────────────────────────────────────────────────────────────────────────────

def clean_text_for_chunking(text: str, remove_tables: bool = True) -> str:
    """
    Nettoie le texte avant chunking pour RAG.
    - nettoie OCR
    - supprime lignes garbled
    - (option) supprime sections tableau
    - fusionne libellés coupés sur 2 lignes
    """
    if not text:
        return ""

    # 1) nettoyage de base
    text = clean_pdf_text(text)

    # 2) enlever séquences garbled
    text = clean_garbled_sequences(text)

    # 3) enlever segments garbled intra-ligne
    text = clean_inline_garbled_segments(text)

    # 4) recréer des lignes si tout est aplati -> aide remove_table_sections
    text = _rehydrate_lines_for_table_removal(text)

    # 5) ancien mécanisme: si pas de \n et gros espaces
    if "\n" not in text and re.search(r"\s{4,}", text):
        text = re.sub(r"\s{4,}", "\n", text)

    # 6) suppression des tableaux si demandé
    if remove_tables:
        # si c'est un bloc dense (souvent table aplatie), on supprime même des runs de 1 ligne
        dense_mode = (len(text) > 400 and text.count("\n") <= 2)
        text = remove_table_sections(text, min_consecutive_lines=1 if dense_mode else 2)

    # 7) fusion libellés cassés (a-/b- etc.)
    text = merge_broken_label_lines(text)

    # 8) normaliser sauts de lignes multiples
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 9) espaces
    text = re.sub(r"[ \t]+", " ", text)

    # 10) strip bords
    text = strip_chunk_boundaries(text)

    return text.strip()