# Rapport Final - Malley

## Tâches réalisées

### CI/CD/Environnement

L’environnement de développement a permis une grande productivité pour chacun des membres et a assuré le bon fonctionnement de l’instance de production à tout moment.

### Base de données

Les technologies de supabase permettent une base de données performante et sécurisée. Supabase-as-a-backend simplifie les interactions entre le frontend et le backend, qui se fait à travers une librairie client (src/contexts/supabase/supabase.ts)
Des tests permettent de vérifier son bon fonctionnement avant de valider les changements. La suite de tests couvre presque tous les aspects d’interatctions entre le client et supabase, et vérifie que les fonctionalités nécéssaires au fonctionnement sont autorisées, et que les requêtes innapropriées sont bloquées.

### Frontend

Construit en React Typescript, il est moderne, reprend le language visuel de Twitter/X et autres alternatives.
Les choix de présentation étant arbitraires, il n’y a guère de justifications autres que liberté artistique et fidélité au modèle.

## Difficultés rencontrées

### CI/CD/Environnement

Il n’y a pas eu de difficultés particulières, il a juste fallu de la rigueur pour l’établir, rigueur qu’elle a maintenu à travers le projet.

### Base de données

Établir un schéma a ammené ses difficultés, au vu des contraintes auto-imposées dès l’établissement du MVP de partage du statut d’auteur ainsi qu’un réseau social centré sur les relations entre les utilisateurs.
Nous avons fait quelques prototypes pour faire des tests de scalabilité, et avons convenu que le schéma actuel permettait la plus grande flexibilité et efficacité.
Les fonctions (postgres et edge), triggers et autres configurations sont construites pour répondre aux besoins du schéma de données réclamées par le MVP
L’établissement de règles de sécurité était une tâche réclamant la plus haute attention, que nous pensons avoir pourvenu avec succès.

### Frontend

La fonctionalité de « swipe à la tinder », centrale au MVP, a été le point le plus difficile du frontend.
Les règles tacites de qualité et d’organisation, ainsi que les exigeances strictes de la CI ont mené à une base de code plus lente à développer, mais bien plus faciles à maintenir et retraivailler.
Les choix et la permanence du style graphique ne sont jamais faciles, mais ont été unanimes.

## Pistes d’améliorations

### CI/CD/Environnement

Elle a été établie en premier et nous la considérons comme presque parfaite.
Sa performance pourrait être améliorée avec du caching ou autre.
Nous avons pensé à ajouter quelques fonctionalités, telles qu’une vérification orthographique, mais si elles n’ont pas été implémentées, c’est par un manque de besoin et non pas par un excès de complexité.

### Base de données

Nous aurions voulu faire des tests de charge avancés et des optimisations supplémentaires. Nous avons cependant eu le cours de systèmes d’informations, où nous avons appris les tests de charge, vers la fin du projet, il était donc difficile de les formuler et intégrer.
Toutes les interactions ne sont pas soumises à des tests, et bien qu’il n’y aie de grand problème de sécurité, certains pourraient sans doute être rajoutés.

### Frontend

Le respect de la charte graphique est approximatif par endroits, notemment dans la visualisation des posts.
L’expérience utilisateur pourrait être affinée sur certains aspects.
Pas assez de caching, menant à des performances suboptimales par endroits.

---

<img align="right" src="../.github/Hexa_Logo_Sign_RVB_Full.svg" width="300px"/>

**Fait par :**

- [AFCMS](https://github.com/AFCMS)
- [Roceann](https://github.com/Roceann)
- [AKArien0](https://github.com/AKArien0)

[**École Hexagone**](https://www.ecole-hexagone.com) 🇫🇷 - Promotion 2024/2025
