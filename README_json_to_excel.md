# JSON to Excel Converter

Script Python pour convertir plusieurs fichiers JSON en un seul fichier Excel avec une feuille par JSON.

## Installation des dépendances

```bash
pip install pandas openpyxl
```

## Utilisation

### Méthode 1: Exécution interactive

```bash
python json_to_excel.py
```

Le script vous demandera:
1. Le chemin du dossier contenant les fichiers JSON
2. Le nom du fichier Excel de sortie

### Méthode 2: Utilisation directe dans le code

```python
from json_to_excel import json_to_excel

# Convertir tous les JSON du dossier en un fichier Excel
json_to_excel("chemin/dossier/json", "resultat.xlsx")
```

## Fonctionnalités

- ✅ Lit automatiquement tous les fichiers `.json` d'un dossier
- ✅ Crée une feuille Excel par fichier JSON
- ✅ Gère différents formats JSON:
  - Liste d'objets (tableau)
  - Objet unique (ligne unique)
  - Autres types de données
- ✅ Nettoyage automatique des noms de feuilles (max 31 caractères)
- ✅ Support des caractères UTF-8
- ✅ Gestion des erreurs avec messages informatifs

## Structure des fichiers

```
dossier_json/
├── fichier1.json
├── fichier2.json
├── fichier3.json
└── ...

Résultat:
resultat.xlsx
├── fichier1 (feuille)
├── fichier2 (feuille)
├── fichier3 (feuille)
└── ...
```

## Exemple de JSON supporté

### Format 1: Liste d'objets
```json
[
  {"nom": "Alice", "âge": 25, "ville": "Paris"},
  {"nom": "Bob", "âge": 30, "ville": "Lyon"}
]
```

### Format 2: Objet unique
```json
{
  "utilisateur": "Alice",
  "âge": 25,
  "ville": "Paris"
}
```

## Notes importantes

- Les noms de feuilles sont automatiquement nettoyés et limités à 31 caractères
- Les espaces sont remplacés par des underscores
- Le script gère automatiquement différents types de données JSON
- En cas d'erreur sur un fichier, le script continue avec les autres fichiers
