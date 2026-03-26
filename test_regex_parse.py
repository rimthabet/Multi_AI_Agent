import re

def _normalize_key(key):
    return key.strip().replace(' ', '_').lower()

def _parse_key_values(question: str) -> dict[str, str]:
    pairs = re.findall(r"(?:^|[;,]|avec)\s*([\w\s\-À-ÿ]+?)\s*(?:[:=]|\\best\\b)\s*([^,;\n]+)", question, re.UNICODE)
    result: dict[str, str] = {}
    for key, value in pairs:
        k = _normalize_key(key)
        v = value.strip().strip("\"'")
        if k and v:
            result[k] = v
    return result

# Test phrase
phrase = "ajoute un projet avec nom du projet est projetex ; activité = santé ;"
extracted = _parse_key_values(phrase)
print(extracted)
