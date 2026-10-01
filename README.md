# n8n RAG workflows

Un workflow n8n de RAG sur PDF, géré comme du code avec
[`n8ncli`](https://www.npmjs.com/package/@workflows-accelerator/n8n-cli), avec sa spec et les
skills d'agent utilisées pour le construire.

## Contenu

| Dossier | Contenu |
|---|---|
| `n8n/workflows/` | Le workflow en TypeScript (SDK n8n). |
| `specs/` | La spec du workflow : objectif, architecture, affirmations vérifiables, état des vérifications. |
| `supabase/` | Les schémas SQL des tables utilisées. |
| `skills/` | Des skills de méthode pour agents de code : cadrage, vérification, revue. |

## Le workflow

`Insiders Dossier RAG` fait deux choses.

**Ingestion** d'un PDF déposé dans un formulaire : extraction du texte, nettoyage, découpage
récursif en fenêtres glissantes avec recouvrement, enrichissement de chaque morceau par Gemini
Flash (contexte, questions hypothétiques, mots-clés, entités, relations), puis vectorisation
et stockage dans Supabase.

**Réponse** à une question par chat, en cinq étapes :

| Étape | Ce qui se passe |
|---|---|
| Context | Config, historique de la session, catalogue des documents. |
| Routing | Gemini Flash produit une question autonome, des requêtes, des mots-clés et des filtres. |
| Search | Recherche vectorielle par requête, recherche plein texte, fusion des résultats. |
| Reranking | Gemini Flash Lite note les candidats. Les meilleurs sont gardés. |
| Generation | Réponse rédigée à partir de ces passages seulement, avec les pages citées. |

Le détail est dans [`specs/insiders-dossier-rag.md`](specs/insiders-dossier-rag.md), y compris
ce qui a été vérifié et ce qui ne l'a pas encore été.

## Pour le réutiliser

1. Appliquer `supabase/rag_setup.sql` puis `supabase/chat_messages.sql` sur un projet Supabase.
2. Importer le workflow dans n8n.
3. Créer et sélectionner les credentials : Supabase sur les nœuds Supabase, Postgres sur les
   nœuds Postgres, OpenAI pour les embeddings, Google Gemini pour les modèles.
4. Dans le nœud `Embed One Chunk`, remplacer l'identifiant du workflow par celui du workflow
   importé : il s'appelle lui-même.

Les identifiants de credentials et de webhooks ont été retirés du fichier publié.

## Skills

| Skill | Usage |
|---|---|
| `spec-challenge` | Cadrer un besoin et écrire une spec vérifiable avant de coder. |
| `doubt-driven-dev` | Vérifier chaque résultat par une preuve observée. |
| `hostile-review` | Revue adverse sous les angles sécurité et performance. |

## Secrets

Aucun secret n'est stocké ici. Les credentials sont dans n8n et ne sont référencés que par
leur nom.
