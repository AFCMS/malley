# Documentation Technique - Malley

## Vue d'ensemble du projet

Malley est une plateforme de médias sociaux inspirée de Twitter, développée dans le cadre du projet de groupe 2GPJT à l'École Hexagone. L'application permet aux utilisateurs de publier des messages, suivre d'autres utilisateurs et interagir avec les publications.

## Architecture générale

L'application suit une architecture conçue pour minimiser le nombre de couches requises et le coût d'hébergement (pas besoin d'un VPS, d'un serveur dédié ou de conteneurs):

```
Frontend (Vercel + React) ↔ Backend (Supabase Cloud)
```

## Technologies utilisées

### Frontend

| Technologie          | Utilisation                            |
| -------------------- | -------------------------------------- |
| **TypeScript**       | Langage de programmation               |
| **Vite**             | Outil de build                         |
| **React 19**         | Interface utilisateur                  |
| **React Router**     | Routage                                |
| **TailwindCSS**      | Styles CSS                             |
| **DaisyUI**          | Composants UI                          |
| **PWA**              | Application web installable sur mobile |
| **Supabase Client**  | Communication avec le Backend          |
| **Vercel Analytics** | Statistiques utilisateurs              |
| **Vercel**           | Hébergement Frontend                   |

### Backend

| Technologie                 | Utilisation                   |
| --------------------------- | ----------------------------- |
| **Supabase**                | (BaaS) Backend-as-a-Service   |
| **⤷ Auth**                  | Authentification utilisateurs |
| **⤷ Database (PostgreSQL)** | Base de données               |
| **⤷ Storage**               | Hébergement de fichiers       |

### Développement

| Outil                      | Utilisation                                |
| -------------------------- | ------------------------------------------ |
| **PNPM**                   | Gestionnaire de paquets                    |
| **GitHub**                 | Hébergement du dépôt Git                   |
| **GitHub Actions**         | Intégration continue / Déploiement continu |
| **GitHub Issues/Projects** | Gestion de projet                          |
| **Grafana**                | Monitoring de l'instance Supabase          |

## Structure de la base de données

Voir [README Supabase](../supabase/README.md) pour la structure de la base de données.

## Structure du code

```
.github/           # Configuration GitHub (CI/CD, etc.)
public/            # Fichiers statiques (favicon, images, etc.)
src/
├── components/    # Composants réutilisables
├── layouts/       # Méga-composants pour les pages
├── pages/         # Pages de l'application
├── contexts/      # Contextes React (Supabase, Authentification, etc.)
└── utils/         # Fonctions utilitaires
supabase/
└── migrations/    # Migrations de base de données
```

## Installation et configuration

Voir [README](../README.md) pour les instructions d'installation et de configuration.

## Justification des choix techniques

### Choix de Supabase comme Backend

**Avantages :**

- **Système d'authentification complet**, intégré directement à la base de données
- Définition du backend en entier sans avoir à écrire de code serveur, en SQL directement. Les RLS (Row Level Security) permettent de sécuriser les données grâce au système d'authentification.
- Une API REST est générée automatiquement à partir du schéma de base de données, ainsi que des types TypeScript pour l'utilisation avec le client Supabase. On a donc une sûreté de type pour les données échangées entre le frontend et le backend si on considère l'intégration complète de ces mécanismes dans le pipeline CI/CD.
- Le stockage de fichiers est intégré, avec la même gestion via PostgreSQL et les mêmes règles de sécurité.
- Supabase est open source et basé sur PostgreSQL, ce qui permet une grande flexibilité et un auto-hébergement si nécessaire.
- On peut également facilement créer des notifications temps réel ainsi que des fonctions serverless (Edge Functions) pour des tâches spécifiques (non exploitées dans ce projet).

**Inconvénients considérés :**

- Dépendance à un service tiers pour l'hébergement.
- Coûts potentiels à grande échelle vis à vis d'une solution spécifiquement conçue et auto-hébergée.

### Choix de React avec TypeScript

**Avantages :**

- **Modernité** : Outils rapides, modernes et avec une bonne DX (Vite, Vitest, TypeScript, etc.)
- **Écosystème mature** : Large communauté, documentation extensive, et nombreuses librairies disponibles
- **Productivité** : Développement rapide grâce aux composants réutilisables et aux hooks

### Choix de TailwindCSS + DaisyUI

**Avantages :**

- **Design System** : Le design system de TailwindCSS est très cohérent et permet de ne toucher que rarement au CSS custom.
- **Maintenance** : Réduction du CSS custom, moins de code à maintenir.
- **DaisyUI** : Composants préconçus basés sur TailwindCSS accélérant le développement UI pour aller plus vite dans la création de l'interface utilisateur par rapport à l'utilisation directe des classes utilitaires du framework de base.

### Choix de Vercel pour l'hébergement Frontend

**Avantages :**

- **Simplicité** : Déploiement très facile avec GitHub Actions, pas de configuration complexe.
- **Performance** : CDN intégré, optimisations automatiques pour les performances.
- **Analytics** : Outils d'analyse intégrés pour suivre l'utilisation de l'application.

---

<img align="right" src="../.github/Hexa_Logo_Sign_RVB_Full.svg" width="300px"/>

**Fait par :**

- [AFCMS](https://github.com/AFCMS)
- [Roceann](https://github.com/Roceann)
- [AKArien0](https://github.com/AKArien0)

[**École Hexagone**](https://www.ecole-hexagone.com) 🇫🇷 - Promotion 2024/2025
