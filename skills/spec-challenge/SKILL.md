---
name: spec-challenge
description: Transforme une demande floue en spec écrite et vérifiable avant toute implémentation — en interrogeant l'utilisateur, en challengeant ses hypothèses, puis en rédigeant un fichier de spec dont chaque affirmation dit comment la vérifier. À utiliser dès que l'utilisateur dit « écris une spec », « spec-driven », « challenge mon idée », « pose-moi des questions avant de coder », « cadre le besoin », ou quand une demande de construction est ambiguë, large, ou engage un choix difficile à défaire (architecture, modèle de données, intégration externe) — même sans demande explicite.
---

# Spec challenge

Coder une demande mal comprise coûte plus cher que de poser dix questions. Cette méthode
repousse l'implémentation jusqu'à ce que le besoin tienne en une liste d'affirmations
vérifiables, validée par l'utilisateur. Le livrable est un fichier de spec, pas du code.

## 1. Comprendre avant de questionner

Lire ce qui existe déjà : le message de l'utilisateur, le code, les fichiers, la
configuration, les specs précédentes. Ne jamais demander ce qui peut être trouvé en
cherchant. Reformuler ensuite la demande en une ou deux phrases et la faire confirmer :
si cette reformulation est fausse, toutes les questions suivantes le seront aussi.

## 2. Interroger

Poser les questions par petits lots (trois ou quatre à la fois, les plus structurantes
d'abord), en proposant pour chacune des options concrètes avec une recommandation. Continuer
tant que les réponses font apparaître de nouvelles inconnues ; s'arrêter quand les réponses
ne changent plus rien à la spec.

Axes à couvrir, sans en faire un questionnaire mécanique :

- **Le vrai objectif** : quel problème est résolu, pour qui, et comment saura-t-on que c'est
  réussi ? Demander « pourquoi » jusqu'à atteindre un résultat métier, pas une solution.
- **Le périmètre** : ce qui est explicitement exclu compte autant que ce qui est inclus.
- **Les entrées et sorties** : format exact, provenance, volume, exemple réel.
- **Les cas limites** : données manquantes, doublons, service externe en panne, quotas,
  valeurs inattendues (devise inconnue, ticker invalide, cellule vide).
- **Les contraintes** : sécurité, confidentialité, coût, délai, outils imposés, qui maintient.
- **L'exploitation** : qui lance, à quelle fréquence, que se passe-t-il en cas d'échec, qui
  est prévenu.

## 3. Challenger

Ne pas accepter une réponse parce qu'elle a été donnée avec assurance. Pour chaque choix
important :

- Reformuler l'hypothèse implicite et demander si elle est vraie (« vous supposez que Yahoo
  renvoie toujours la devise de cotation en unité principale — c'est faux pour Londres »).
- Proposer au moins une alternative plus simple et dire ce qu'on y perd.
- Signaler les contradictions entre deux réponses au lieu de trancher en silence.
- Dire clairement quand une demande semble être une mauvaise idée, et pourquoi. L'utilisateur
  décide, mais en connaissance de cause.

Rester factuel et bref : challenger n'est pas faire la leçon. Une objection, sa raison, une
proposition.

## 4. Écrire la spec

Écrire la spec dans un fichier `specs/<nom-court>.md` (ou à l'endroit indiqué par
l'utilisateur), avec cette structure :

```markdown
# <Titre>

## Objectif
Une à trois phrases : le résultat attendu et pour qui. Pas de solution technique ici.

## Contexte
Ce qui existe déjà et ce qui motive le besoin.

## Périmètre
- Inclus : …
- Exclu : …

## Affirmations
Chaque affirmation est vraie ou fausse une fois le travail terminé, et dit comment le vérifier.
- A1. <énoncé vérifiable> — Vérification : <commande, test, observation>
- A2. …

## Décisions prises
- <décision> — raison, alternative écartée.

## Hypothèses et risques
- <hypothèse non confirmée> — ce qui casse si elle est fausse.

## Questions ouvertes
- <question restée sans réponse>, qui doit y répondre.
```

Une bonne affirmation est observable et précise : « pour un ticker `.L`, la valeur écrite est
en livres (cours Yahoo en pence divisé par 100) » plutôt que « les devises sont bien gérées ».
Si une affirmation ne peut pas être vérifiée, la reformuler ou la déplacer dans les risques.

Terminer en présentant la spec à l'utilisateur et en demandant sa validation avant toute
implémentation. Les questions ouvertes restantes doivent être visibles, pas enterrées.
