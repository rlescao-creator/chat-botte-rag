---
name: hostile-review
description: Revue adverse d'un code, d'un workflow ou d'une configuration, menée comme le ferait quelqu'un qui cherche à le casser, sous deux angles seulement — sécurité et performance. Chaque constat est un scénario concret, vérifié avant d'être rapporté, et classé par gravité. À utiliser dès que l'utilisateur dit « hostile review », « revue hostile », « attaque ce code », « essaie de le casser », « est-ce que ça tient en production ? », « audit sécurité », « ça passe à l'échelle ? », ou avant de déployer, publier ou partager quelque chose qui touche des secrets, des données sensibles ou un service externe — même sans demande explicite.
---

# Hostile review

Une relecture bienveillante cherche à comprendre ce que l'auteur a voulu faire. Une revue
hostile cherche comment le résultat peut être détourné, cassé ou mis à genoux. Le but n'est
pas de juger le style ni de proposer une réécriture : c'est de trouver, avant quelqu'un
d'autre, les scénarios concrets où la cible fuit, se trompe ou s'effondre.

## 1. Délimiter la cible et ses frontières

Dire précisément ce qui est revu (fichiers, workflow, diff, configuration) et le lire en
entier avant de conclure quoi que ce soit. Puis repérer les frontières de confiance, parce
que c'est là que les problèmes se trouvent :

```markdown
- Entrées : d'où viennent les données, et qui peut les contrôler ?
- Sorties : où vont-elles, et qui peut les lire ?
- Secrets : lesquels sont utilisés, où sont-ils stockés, qui y a accès ?
- Tiers : quels services externes sont appelés, avec quelles données ?
- Déclencheurs : qui ou quoi peut lancer l'exécution, et à quelle fréquence ?
```

## 2. Attaquer sous l'angle sécurité

Pour chaque frontière, chercher un scénario d'attaque concret :

- **Secrets** : clés, jetons, mots de passe dans le code, les logs, l'historique git, les
  URL, les captures d'écran, les messages d'erreur. Portée trop large, absence de rotation.
- **Entrées non fiables** : injection (SQL, commande, expression, formule de tableur),
  données d'un fichier ou d'une API externe utilisées sans validation, chemins et URL
  construits à partir d'une entrée.
- **Accès** : webhooks ou endpoints sans authentification, droits trop larges, données
  d'un utilisateur visibles par un autre, dépôt ou document public par erreur.
- **Données sensibles** : données personnelles ou financières envoyées à un tiers, stockées
  en clair, conservées sans raison.
- **Dépendances et tiers** : API non officielles, paquets non épinglés, service externe qui
  peut changer sa réponse ou disparaître.
- **Défaillances** : que se passe-t-il si un appel échoue à moitié ? Écriture partielle,
  doublons à la relance, erreur avalée en silence, valeur par défaut fausse (un `|| 0` qui
  transforme une donnée manquante en zéro crédible).

## 3. Attaquer sous l'angle performance

Se demander ce qui se passe avec 10 fois, puis 1000 fois plus de données :

- Appels réseau un par un dans une boucle, absence de traitement par lots ou de cache.
- Quotas et limites de débit des API : à partir de quel volume sont-ils atteints ?
- Complexité quadratique, chargement complet en mémoire, fichiers ou réponses non bornés.
- Absence de délai maximal, de relance avec attente, de limite de concurrence.
- Travail refait à chaque exécution alors qu'il pourrait être incrémental.
- Coût : exécutions facturées, appels payants, stockage qui grossit sans fin.

Chiffrer quand c'est possible (« 15 lignes = 15 appels ; à 60 appels/min, le quota est
atteint à partir de 60 lignes USD ») plutôt que d'affirmer que « ça ne passera pas ».

## 4. Vérifier avant d'accuser

Un constat faux détruit la crédibilité de tous les autres. Pour chaque problème, relire le
code concerné et s'assurer que le scénario est réellement atteignable. Distinguer :

- **Confirmé** : reproduit, ou démontré par la lecture du code.
- **Plausible** : le scénario tient, mais dépend d'un élément non vérifié — dire lequel.

Écarter ce qui relève du goût ou du style : ce n'est pas l'objet de cette revue.

## 5. Rapport

Classer du plus grave au moins grave. Utiliser ce format :

```markdown
# Hostile review — <cible>

## Verdict
Une phrase : peut partir en production / à corriger avant / à ne pas déployer.

## Constats
### [Critique|Élevé|Moyen|Faible] <titre court> — Sécurité|Performance
- Où : `fichier:ligne` ou nom du nœud
- Scénario : entrée ou situation précise → conséquence
- Statut : Confirmé | Plausible (dépend de …)
- Correction proposée : …

## Ce qui a été vérifié et tient
Liste courte, pour que l'absence de constat ne soit pas confondue avec une absence d'examen.

## Non examiné
Ce qui n'a pas pu être revu, et pourquoi.
```

La gravité reflète l'impact réel dans le contexte de l'utilisateur : un secret dans un
dépôt public est critique, le même dans un dépôt privé à un seul utilisateur est moyen.
Si rien de sérieux n'est trouvé, le dire simplement plutôt que de gonfler des détails.
