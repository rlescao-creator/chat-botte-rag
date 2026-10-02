# Spec : Insiders Dossier RAG

Spec du workflow n8n `Insiders Dossier RAG`.
Fichier source : [`n8n/workflows/Insiders Dossier RAG.workflow.ts`](../n8n/workflows/Insiders%20Dossier%20RAG.workflow.ts).

## Objectif

Permettre de poser des questions en langage naturel sur un PDF et d'obtenir une réponse
rédigée, appuyée uniquement sur le contenu du document, avec les pages citées.

## Contexte

- Instance n8n Cloud, gérée avec `n8ncli`. Accès par MCP uniquement : pas de clé REST API.
- Base Supabase avec pgvector.
- Modèles et embeddings Gemini, avec une clé API personnelle.
- Premier document : un livre de 86 pages sur les transactions d'initiés, en anglais.

## Périmètre

**Inclus**
- Ingestion d'un PDF : extraction, nettoyage, découpage, enrichissement, vectorisation, stockage.
- Réponse à une question : contexte, routage, recherche hybride, reranking, génération,
  sauvegarde de l'échange.
- Une page web hébergée à part, qui interroge le workflow.

**Exclu**
- PDF scannés sans couche de texte (pas d'OCR).
- Contenu des images et des tableaux.
- Remplacement automatique d'un document déjà ingéré.
- Graphe d'entités interrogeable : entités et relations restent des métadonnées par morceau.

## Architecture

Un seul workflow, trois points d'entrée.

| Déclencheur | Branche | Quand |
|---|---|---|
| `Upload Document` | Ingestion | Un PDF est déposé dans le formulaire. |
| `Receive Chunk` | Stockage d'un morceau | Appelé par l'ingestion, une fois par morceau. |
| `Chat Message` | Réponse | Une question arrive par le chat. |

### Ingestion

`Upload Document` → `Extract PDF Text` → `Clean Text` → `Recursive Rolling Chunks` →
`Embed One Chunk` → `Count Stored Chunks` → `Log Ingestion in Supabase`

### Stockage d'un morceau

`Receive Chunk` → `Enrich Chunk` → `Build Enriched Chunks` → `Store Chunk in Supabase`

### Réponse

| Étape | Nœuds |
|---|---|
| Context | `Inputs` → `Get Session Messages` → `Empty Conversation` → `Format History` → `Load Document Catalog` |
| Routing | `Route Question` → `Build Search Queries` |
| Search | `Vector Search` → `Keyword Search` → `Merge Search Results` |
| Reranking | `Rerank Passages` → `Select Top Passages` |
| Generation | `Write Answer` → `Save Conversation` → `Reply` |

### Données

| Table | Contenu |
|---|---|
| `documents_gemini` | Un morceau par ligne : texte, métadonnées, vecteur de 3072 dimensions. |
| `rag_sources` | Une ligne par ingestion : fichier, nombre de morceaux, date. |
| `chat_messages` | Historique des échanges, par session. |

Schéma : [`supabase/schema.sql`](../supabase/schema.sql).

## Affirmations

Chaque affirmation est vraie ou fausse, et dit comment le vérifier.

### Ingestion

- **A1.** Un PDF texte déposé produit des lignes dans `documents_gemini`, toutes avec un vecteur.
  Vérification : `select count(*), count(embedding) from documents_gemini`.
- **A2.** Un document de moins de 100 pages produit entre 10 et 100 morceaux.
  Vérification : même requête, le compte est dans l'intervalle.
- **A3.** Deux morceaux consécutifs partagent du texte, et aucun passage n'est absent.
  Vérification : sortie de `Recursive Rolling Chunks`, `charStart` du morceau n+1 inférieur ou
  égal à `charEnd` du morceau n.
- **A4.** Le texte stocké est nettoyé : ni caractère de contrôle, ni ligne réduite à un numéro
  de page. Vérification : sortie de `Clean Text`.
- **A5.** Chaque morceau porte en métadonnées : `source`, `page`, `page_end`, `chunk_index`,
  `context`, `questions`, `keywords`, `entities`, `relations`, `enriched`.
  Vérification : `select distinct jsonb_object_keys(metadata) from documents_gemini`.
- **A6.** Si le modèle échoue sur un morceau, ce morceau est quand même stocké, avec
  `enriched = false`. Vérification : `select count(*) from documents_gemini where
  metadata->>'enriched' = 'false'`.
- **A7.** Une ingestion terminée ajoute une ligne dans `rag_sources`.
  Vérification : `select * from rag_sources order by id desc limit 1`.

### Réponse

- **A8.** Une question en français reçoit une réponse en français qui cite des pages.
  Vérification : sortie de `Reply`.
- **A9.** Le routeur produit trois requêtes en anglais, des mots-clés et des filtres.
  Vérification : sortie de `Route Question`.
- **A10.** Les candidats proviennent de la recherche vectorielle et de la recherche par mots-clés.
  Vérification : champ `foundBy` dans la sortie de `Select Top Passages`.
- **A11.** Le reranker note les candidats, et seuls les mieux notés vont à la génération.
  Vérification : `reranked = true` et `rerankScore` renseigné dans `Select Top Passages`.
- **A12.** Si le reranker échoue, la réponse sort quand même.
  Vérification : `reranked = false` et une sortie non vide dans `Reply`.
- **A13.** Chaque échange est enregistré dans `chat_messages`.
  Vérification : `select role, left(content, 40) from chat_messages order by id desc limit 2`.
- **A14.** Une question de suivi est reformulée en question autonome grâce à l'historique.
  Vérification : deux questions à la suite dans la même session, puis champ
  `standalone_question` de `Route Question`.
- **A15.** Une question hors sujet reçoit une réponse qui dit que l'information est absente.
  Vérification : poser une question sans rapport avec le document.

### Chatbot hébergé

- **A16.** La page hébergée sur GitHub Pages obtient une réponse du workflow.
  Vérification : poser une question depuis la page en ligne.

## État des vérifications

Au 2 octobre 2026.

| Affirmation | État | Preuve ou raison |
|---|---|---|
| A1 | Vérifié | 83 lignes, 83 vecteurs de 3072 dimensions. |
| A2 | Vérifié | 83 morceaux pour 83 pages utiles. |
| A3 | Vérifié en local | Code exécuté sur le PDF : recouvrement moyen de 160 caractères, aucun trou. Non recontrôlé sur la sortie n8n. |
| A4 | Vérifié en local | Même réserve. |
| A5 | Vérifié | Les dix clés sont présentes en base. `keywords` est bien un tableau. |
| A6 | Vérifié | 11 morceaux stockés sans enrichissement, après refus du modèle pour limite de débit. |
| A7 | Vérifié | Ligne écrite à la fin de l'ingestion. |
| A8 | Vérifié | Plusieurs exécutions : réponses en français avec pages. |
| A9 | Vérifié | Trois requêtes, six mots-clés, filtre sur le document. |
| A10 | Vérifié | `foundBy` contient `vector` et `keyword`. |
| A11 | Vérifié avec les anciens réglages | Notes de 3 à 10, cinq passages retenus. Non revérifié depuis le passage à la clé personnelle : les essais ont buté sur la limite de débit. |
| A12 | Vérifié | Reranker en échec, `Reply` a quand même répondu. |
| A13 | Vérifié | 18 messages enregistrés sur 9 sessions. |
| A14 | Non vérifié | Aucune session ne compte plus d'un échange. |
| A15 | Non vérifié | Pas encore testé. |
| A16 | Vérifié | Question posée depuis la page en ligne, réponse reçue avec les pages. |

## Décisions prises

- **Un seul workflow qui s'appelle lui-même**, plutôt qu'un sous-workflow séparé.
- **Pas de boucle par lots** : `Embed One Chunk` appelle la branche de stockage pour chaque
  morceau. Contrepartie : le canevas n'affiche pas la progression pendant l'ingestion.
- **Enrichissement dans la branche de stockage**, après `Receive Chunk`.
- **Nettoyage par du code, pas par un modèle** : un modèle risquerait de reformuler le texte.
- **Fenêtre glissante adaptative** : environ un morceau par page, entre 10 et 100 morceaux
  sous 100 pages. Au-delà, un morceau par page, sans plafond.
- **Reranking par un modèle Gemini**, pas par Cohere : le seul reranker natif de n8n exige un
  credential Cohere.
- **Recherche hybride** : fusion par rang réciproque des vecteurs et du plein texte Postgres.
- **Embeddings Gemini** à la place d'OpenAI, après épuisement des crédits IA de l'instance
  d'essai. Cela a imposé une nouvelle table, les vecteurs n'ayant pas la même taille.
- **Relances automatiques** sur les appels au modèle, pour absorber les surcharges passagères.
- **Modifications par le serveur MCP n8n**, pas par `n8ncli push` : sans clé REST, `push` ne
  met à jour que le nom d'un workflow existant.

## Hypothèses et risques

- **Limite de débit de la clé API.** Une ingestion fait deux appels par morceau. Une clé
  gratuite peut être limitée en cours de route, ce qui laisse des morceaux sans enrichissement
  et met le reranking en repli.
- **Webhook public.** L'adresse du chat est visible dans la page. N'importe qui peut interroger
  le bot, ce qui consomme le quota de la clé et les exécutions n8n.
- **Doublons.** Un même fichier déposé deux fois est stocké deux fois. Deux ingestions lancées
  en parallèle se mélangent.
- **Lancement manuel de `Receive Chunk`.** Il stocke une ligne vide de sens. Cette branche ne
  doit être appelée que par l'ingestion.
- **Réglages liés à l'anglais.** Requêtes et recherche plein texte en anglais. Un PDF dans une
  autre langue sera moins bien servi.
- **Document sous droits d'auteur.** Il n'est pas distribué ici. Le bot résume et cite des pages.

## Questions ouvertes

- Faut-il détecter la langue à l'ingestion pour rendre le workflow générique ?
- Faut-il convertir le PDF en Markdown avant le découpage, pour couper sur les titres ?
- Faut-il empêcher l'ingestion d'un fichier déjà présent ?
- Faut-il restreindre les origines autorisées du webhook à la page du chatbot ?
