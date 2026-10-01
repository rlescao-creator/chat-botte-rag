# Insiders Dossier RAG

Spec du workflow n8n `Insiders Dossier RAG` (ID `pyNBw6XbD5faF0Zm`).
Fichier source : `n8n/workflows/Insiders Dossier RAG.workflow.ts`.

## Objectif

Permettre de poser des questions en langage naturel sur un PDF et d'obtenir une réponse
rédigée, appuyée uniquement sur le contenu du document, avec les pages citées.

## Contexte

- Instance n8n Cloud, gérée avec `n8ncli`. Accès par MCP uniquement : pas de
  clé REST API, pas d'accès direct à la base n8n.
- Base Supabase (organisation « N8N RAG ») avec pgvector.
- Modèles fournis par les crédits intégrés de n8n : OpenAI pour les embeddings, Gemini pour
  le reste.
- Premier document visé : un livre de 86 pages sur les transactions d'initiés.

## Périmètre

- Inclus :
  - Ingestion d'un PDF déposé dans un formulaire : extraction, nettoyage, découpage,
    enrichissement, vectorisation, stockage.
  - Réponse à une question par chat : contexte, routage, recherche hybride, reranking,
    génération, sauvegarde de l'échange.
- Exclu :
  - PDF scannés sans couche de texte (pas d'OCR).
  - Contenu des images et des tableaux.
  - Remplacement automatique d'un document déjà ingéré.
  - Graphe d'entités interrogeable : entités et relations restent des métadonnées par morceau.
  - Publication du workflow et exposition publique du chat.

## Architecture

Un seul workflow, trois points d'entrée.

### Ingestion (déclencheur `Upload Document`)

`Upload Document` → `Extract PDF Text` → `Clean Text` → `Recursive Rolling Chunks` →
`Loop Over Chunk Batches` → `Enrich Chunk` → `Build Enriched Chunks` → `Embed One Chunk`

En fin de boucle : `Count Stored Chunks` → `Log Ingestion in Supabase`.

| Nœud | Rôle |
|---|---|
| Clean Text (Code) | Nettoie chaque page, puis recolle tout en un seul texte continu. Mémorise où commence chaque page. |
| Recursive Rolling Chunks (Code) | Découpe récursive (paragraphe, ligne, phrase, virgule, mot), puis fenêtre glissante avec environ 200 caractères de recouvrement. |
| Enrich Chunk (Gemini Flash) | Pour chaque morceau : contexte, trois questions hypothétiques, mots-clés, entités, relations. |
| Build Enriched Chunks (Code) | Assemble le texte à vectoriser : contexte + passage + questions + mots-clés. |
| Embed One Chunk | Appelle ce même workflow une fois par morceau. |

### Stockage d'un morceau (déclencheur `Receive Chunk`)

`Receive Chunk` → `Store Chunk in Supabase` (avec `Embed Chunk`, `Chunk Loader`,
`Keep Chunk Whole`).

### Réponse (déclencheur `Chat Message`)

| Étape | Nœuds |
|---|---|
| Context | `Inputs` → `Get Session Messages` → `Empty Conversation` → `Format History` → `Load Document Catalog` |
| Routing | `Route Question` (Gemini Flash) → `Build Search Queries` |
| Search | `Vector Search` → `Keyword Search` → `Merge Search Results` |
| Reranking | `Rerank Passages` (Gemini 2.5 Flash Lite) → `Select Top Passages` |
| Generation | `Write Answer` (Gemini Flash) → `Save Conversation` → `Reply` |

### Données (Supabase)

| Table | Contenu |
|---|---|
| `documents` | Un morceau par ligne : texte, métadonnées, vecteur de 1536 dimensions. |
| `rag_sources` | Une ligne par ingestion : fichier, nombre de morceaux, date. |
| `chat_messages` | Historique des échanges, par session. |

Schémas : `supabase/rag_setup.sql` et `supabase/chat_messages.sql`.

## Affirmations

Chaque affirmation est vraie ou fausse une fois le travail terminé, et dit comment le vérifier.

### Ingestion

- A1. Un PDF texte déposé dans le formulaire produit des lignes dans `documents`, toutes avec
  un vecteur non nul. — Vérification : `select count(*), count(embedding) from documents
  where metadata->>'source' = '<fichier>'`.
- A2. Un document de moins de 100 pages produit entre 10 et 100 morceaux. — Vérification :
  même requête, le compte est dans l'intervalle.
- A3. Deux morceaux consécutifs partagent du texte (recouvrement), et aucun passage du
  document n'est absent. — Vérification : sortie de `Recursive Rolling Chunks`,
  `charStart` du morceau n+1 inférieur ou égal à `charEnd` du morceau n.
- A4. Le texte stocké est nettoyé : ni caractère de contrôle, ni caractère invisible, ni
  ligne réduite à un numéro de page. — Vérification : sortie de `Clean Text`.
- A5. Chaque morceau porte en métadonnées : `source`, `page`, `page_end`, `chunk_index`,
  `context`, `questions`, `keywords`, `entities`, `relations`, `enriched`. — Vérification :
  `select jsonb_object_keys(metadata) from documents limit 20`.
- A6. Si Gemini échoue sur un morceau, ce morceau est quand même stocké, avec
  `enriched = false`. — Vérification : `select count(*) from documents where
  metadata->>'enriched' = 'false'`.
- A7. Une ingestion terminée ajoute une ligne dans `rag_sources`. — Vérification :
  `select * from rag_sources order by id desc limit 1`.

### Réponse

- A8. Une question en français sur le contenu reçoit une réponse en français qui cite des
  pages. — Vérification : exécution manuelle du déclencheur `Chat Message`, sortie de `Reply`.
- A9. Le routeur produit trois requêtes en anglais, des mots-clés et des filtres. —
  Vérification : sortie de `Route Question`.
- A10. Les candidats proviennent de la recherche vectorielle et de la recherche par
  mots-clés. — Vérification : champ `foundBy` dans la sortie de `Select Top Passages`.
- A11. Le reranker note les candidats, et seuls les mieux notés vont à la génération. —
  Vérification : `reranked = true` et `rerankScore` renseigné dans `Select Top Passages`.
- A12. Si le reranker échoue, la réponse sort quand même, à partir de l'ordre de recherche. —
  Vérification : `reranked = false` et une sortie non vide dans `Reply`.
- A13. Chaque échange est enregistré dans `chat_messages`. — Vérification :
  `select role, left(content, 40) from chat_messages order by id desc limit 2`.
- A14. Une question de suivi (« et pour les ventes ? ») est reformulée en question autonome
  grâce à l'historique de la session. — Vérification : deux questions à la suite dans le chat
  n8n, puis champ `standalone_question` de `Route Question`.
- A15. Une question hors sujet reçoit une réponse qui dit que l'information est absente, sans
  invention. — Vérification : poser une question sans rapport avec le document.

## État des vérifications au 1er octobre 2026

| Affirmation | État | Preuve ou raison |
|---|---|---|
| A8 | Vérifié | Exécutions 18, 19 et 20 : réponses en français avec pages. |
| A9 | Vérifié | Exécution 18 : trois requêtes, six mots-clés, filtre sur le document. |
| A10 | Vérifié | Exécution 18 : `foundBy` contient `vector` et `keyword`. |
| A11 | Vérifié | Exécutions 18 et 20 : notes de 3 à 10, cinq passages retenus. |
| A12 | Vérifié | Exécution 19 : modèle refusé, `Reply` a quand même répondu. |
| A13 | Vérifié | Exécution 19 : `Save Conversation` a renvoyé un identifiant. |
| A1 à A7 | Non vérifié dans n8n | La nouvelle ingestion n'a pas abouti, par manque de crédits IA sur l'instance d'essai. Le code de A2, A3 et A4 est validé en local sur le PDF : 83 morceaux, recouvrement moyen de 160 caractères, aucun trou. |
| A14 | Non vérifié | L'outil de test ouvre une nouvelle session à chaque appel. |
| A15 | Non vérifié | Pas encore testé. |

## Décisions prises

- **Un seul workflow qui s'appelle lui-même**, plutôt qu'un sous-workflow séparé — demande
  explicite. Alternative écartée : le workflow `Insiders Dossier Chunk Embedder`, qui existe
  encore mais n'est plus appelé.
- **Nettoyage par du code, pas par un modèle** — un modèle risquerait de reformuler le texte
  source.
- **Fenêtre glissante adaptative** : environ un morceau par page, borné entre 10 et 100 sous
  100 pages — demande explicite. Au-delà de 100 pages, un morceau par page, sans plafond.
- **Reranking par Gemini Flash Lite**, pas par Cohere — le seul reranker natif de n8n exige
  un credential Cohere, absent. `gemini-3.1-flash-lite-preview` est refusé par les crédits
  n8n ; `gemini-2.5-flash-lite` passe.
- **Recherche hybride** : fusion par rang réciproque de la recherche vectorielle et du plein
  texte Postgres.
- **Embeddings OpenAI `text-embedding-3-small`** — changer de fournisseur imposerait de
  modifier la table et de tout revectoriser.
- **Modifications du workflow par le serveur MCP n8n**, pas par `n8ncli push` — sans clé
  REST, `push` ne met à jour que le nom d'un workflow existant et annonce un succès.

## Hypothèses et risques

- **L'appel du workflow sur lui-même fonctionne sans publication.** Non confirmé. S'il est
  faux, `Embed One Chunk` échoue et rien n'est stocké.
- **Les crédits n8n supportent environ 83 appels Gemini et 83 embeddings par document.** Non
  confirmé. Une ingestion précédente, avec un autre découpage, est restée bloquée onze minutes
  sans rien écrire, par manque de crédits.
- **`Extract PDF Text` renvoie une liste de textes, un par page.** Si n8n renvoie un seul
  bloc, tous les morceaux seront marqués page 1.
- **La base contient encore 178 morceaux de la première ingestion**, sans enrichissement. Les tests de réponse ont tourné sur ces morceaux.
- **Un même fichier déposé deux fois est stocké deux fois.** Aucune protection.
- **Réglages liés à ce livre** : requêtes et recherche plein texte en anglais, types d'entités
  orientés finance. Un PDF en français ou d'un autre domaine sera moins bien servi.
- **Le document source est sous droits d'auteur.** Il n'est pas distribué ici, et le chat
  doit rester privé.

## Questions ouvertes

- Faut-il rendre le workflow générique (langue détectée à l'ingestion, types d'entités
  généraux) ? À décider par le propriétaire du projet.
- Faut-il convertir le PDF en Markdown avant le découpage, pour couper sur les titres ? À décider par le propriétaire du projet.
- Faut-il archiver le workflow `Insiders Dossier Chunk Embedder` ? À décider par le propriétaire du projet.
- Faut-il garder `Load Document Catalog`, qui n'est pas sur le schéma du cours ? À décider par le propriétaire du projet.
