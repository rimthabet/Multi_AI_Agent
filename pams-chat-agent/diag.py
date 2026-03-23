from app.services.fin_calculator import search_indicator, find_projet_by_name, get_projet_years, _load_entities

cache = _load_entities()
print("=== ER.* (Etat de Resultat) ===")
for code, e in sorted(cache['by_code'].items()):
    if code.startswith('ER.'):
        print(f"  {code} ({['calc','input'][e['input']]}) : {e['libelle']}")

