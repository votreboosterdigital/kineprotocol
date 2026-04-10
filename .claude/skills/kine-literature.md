# Skill : kine-literature

## Déclenchement
Quand l'utilisateur invoque `/kine-literature <pathologie>` ou demande "génère une revue de littérature pour [pathologie]".

## Mission
Générer une revue de littérature clinique structurée, evidence-based, pour la pathologie donnée, formatée comme JSON injectable dans le contexte des agents de génération de protocoles KinéProtocol.

## Processus

### Étape 1 — Analyse clinique
Pour la pathologie fournie, raisonner selon ces dimensions :
1. **Épidémiologie** : prévalence, profils patients typiques
2. **Physiopathologie** : mécanismes lésionnels, structures impliquées
3. **Traitements validés** : interventions avec niveau de preuve élevé (RCT, meta-analyses)
4. **Débats ouverts** : approches contradictoires dans la littérature actuelle
5. **Contre-indications** : absolues et relatives, documentées
6. **Références clés** : études PubMed/arXiv influentes (2018–2026 de préférence)

### Étape 2 — Format de sortie

Produire UNIQUEMENT le JSON suivant, sans markdown, sans commentaire :

```json
{
  "pathology": "nom exact de la pathologie",
  "generatedAt": "ISO 8601 date",
  "clinicalConsensus": {
    "summary": "Résumé du consensus actuel en 2-3 phrases",
    "validatedTreatments": [
      {
        "intervention": "nom de l'intervention",
        "evidenceLevel": "A|B|C",
        "description": "description clinique courte"
      }
    ]
  },
  "openDebates": [
    {
      "topic": "sujet du débat",
      "position1": "argument 1",
      "position2": "argument contre"
    }
  ],
  "contraindications": {
    "absolute": ["contre-indication absolue 1"],
    "relative": ["contre-indication relative 1"]
  },
  "keyReferences": [
    {
      "title": "titre de l'étude",
      "authors": "Auteur et al.",
      "year": 2023,
      "journal": "nom du journal",
      "pmid": "PMID ou null",
      "url": "https://pubmed.ncbi.nlm.nih.gov/PMID ou https://arxiv.org/abs/..."
    }
  ],
  "clinicalPearlsForProtocol": [
    "perle clinique pratique 1 directement utilisable dans un protocole"
  ]
}
```

## Règles
- Toujours en français dans les champs textuels
- `evidenceLevel` : A = meta-analyse/RCT de qualité, B = études cohort/cas-contrôle, C = expert opinion
- Minimum 3 références, maximum 6
- Les `clinicalPearlsForProtocol` doivent être immédiatement actionnables par un kiné (ex: "Phase aiguë : isométrie à 70% MVC 45s antalgique avant toute mobilisation")
- Si la pathologie est hors scope musculo-squelettique, répondre avec `{ "error": "pathologie hors scope KinéProtocol" }`

## Exemple d'invocation
`/kine-literature lombalgie chronique`
→ Produit le JSON structuré pour injection dans le system prompt de l'agent Protocol Designer.
