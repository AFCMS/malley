# Documentation Technique - Malley

## Table des matières
- [Documentation Technique - Malley](#documentation-technique---malley)
  - [Table des matières](#table-des-matières)
  - [Vue d'ensemble du projet](#vue-densemble-du-projet)
  - [Architecture générale](#architecture-générale)
  - [Technologies utilisées](#technologies-utilisées)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Déploiement](#déploiement)
  - [Structure de la base de données](#structure-de-la-base-de-données)
    - [Tables principales](#tables-principales)
      - [Table `profiles`](#table-profiles)
      - [Table `posts`](#table-posts)
      - [Table `follows`](#table-follows)
      - [Table `likes`](#table-likes)
      - [Table `authored`](#table-authored)
      - [Table `pendingAuthors`](#table-pendingauthors)
      - [Table `category`](#table-category)
      - [Tables de liaison](#tables-de-liaison)
  - [Architecture Backend](#architecture-backend)
    - [Supabase](#supabase)
  - [Architecture Frontend](#architecture-frontend)
    - [Structure](#structure)
    - [Design responsive](#design-responsive)
  - [Sécurité](#sécurité)
  - [Installation et configuration](#installation-et-configuration)
    - [Prérequis](#prérequis)
    - [Installation](#installation)
  - [Déploiement](#déploiement-1)
  - [Justification des choix techniques](#justification-des-choix-techniques)
    - [Choix de Supabase comme Backend](#choix-de-supabase-comme-backend)
    - [Choix de React avec TypeScript](#choix-de-react-avec-typescript)
    - [Choix de TailwindCSS + DaisyUI](#choix-de-tailwindcss--daisyui)
    - [Choix de Vercel pour le déploiement](#choix-de-vercel-pour-le-déploiement)

## Vue d'ensemble du projet

Malley est une plateforme de médias sociaux inspirée de Twitter, développée dans le cadre du projet de groupe 2GPJT à l'École Hexagone. L'application permet aux utilisateurs de publier des messages, suivre d'autres utilisateurs et interagir avec les publications.

## Architecture générale

L'application suit une architecture séparant le frontend du backend :

```
Frontend (React + TypeScript) ↔ Backend (Supabase) ↔ Base de données (PostgreSQL)
```

## Technologies utilisées

### Frontend
- **React 18** : Interface utilisateur
- **TypeScript** : Langage de programmation
- **Vite** : Outil de build
- **React Router** : Routage
- **TailwindCSS** : Styles CSS
- **DaisyUI** : Composants UI

### Backend
- **Supabase** : Backend-as-a-Service
- **PostgreSQL** : Base de données
- **Node.js** : Environnement d'exécution

### Déploiement
- **Vercel** : Hébergement frontend
- **Supabase Cloud** : Hébergement backend
- **GitHub Actions** : CI/CD

## Structure de la base de données

### Tables principales

#### Table `profiles`
- `id` : Identifiant unique (UUID)
- `handle` : Nom d'utilisateur unique
- `created_at` : Date de création
- `bio` : Biographie
- `profile_pic` : Photo de profil
- `banner` : Bannière
- `pinned_posts` : Post épinglé

#### Table `posts`
- `id` : Identifiant unique (UUID)
- `created_at` : Date de création
- `body` : Contenu du post
- `media` : Médias associés
- `parent_post` : Référence au post parent (pour les réponses)

#### Table `follows`
- `follower` : Utilisateur qui suit
- `followee` : Utilisateur suivi

#### Table `likes`
- `profile` : Profil qui aime
- `post` : Post aimé

#### Table `authored`
- `profile` : Profil auteur
- `post` : Post créé

#### Table `pendingAuthors`
- `from_profile` : Demandeur
- `to_profile` : Destinataire
- `post` : Post concerné

#### Table `category`
- `id` : Identifiant unique
- `name` : Nom de la catégorie

#### Tables de liaison
- `profilesCategory` : Lie profils et catégories
- `postsCategory` : Lie posts et catégories
- `featured-users` : Utilisateurs mis en avant

## Architecture Backend

### Supabase
- API REST automatique
- Authentification JWT
- Row Level Security (RLS)
- Fonctionnalités temps réel

## Architecture Frontend

### Structure
```
src/
├── components/    # Composants réutilisables
├── pages/        # Pages de l'application
├── contexts/     # Contextes React
└── utils/        # Fonctions utilitaires
```

### Design responsive
- Mobile-first avec TailwindCSS
- Adaptation automatique aux différents écrans

## Sécurité

- **Authentification** : JWT via Supabase Auth
- **Protection des données** : Row Level Security (RLS)
- **Chiffrement** : HTTPS pour toutes les communications
- **Validation** : Entrées utilisateur sécurisées

## Installation et configuration

### Prérequis
- Node.js (version 18+)
- PNPM
- Docker ou Podman

### Installation
```bash
# Cloner le projet
git clone https://github.com/your-org/malley.git
cd malley

# Installer les dépendances
pnpm install

# Démarrer Supabase local
pnpm run supabase start

# Configurer les variables d'environnement (.env.local)
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_ANON_KEY="votre-clé"

# Lancer l'application
pnpm run dev
```

## Déploiement

- **Développement** : Supabase CLI + Vite dev server
- **Production** : Vercel (frontend) + Supabase Cloud (backend)

## Justification des choix techniques

### Choix de Supabase comme Backend
**Avantages :**
- **Développement rapide** : API REST générée automatiquement à partir du schéma de base de données, réduisant considérablement le temps de développement backend
- **Sécurité intégrée** : Authentification robuste avec JWT et Row Level Security (RLS) au niveau de la base de données
- **Fonctionnalités temps réel** : WebSockets intégrés permettant les mises à jour en direct sans développement complexe
- **Scalabilité** : Infrastructure cloud native qui s'adapte automatiquement à la charge
- **Écosystème complet** : Base de données PostgreSQL, stockage de fichiers, et edge functions dans une seule solution

**Inconvénients considérés :**
- Dépendance à un service tiers
- Coûts potentiels à grande échelle

### Choix de React avec TypeScript
**Avantages :**
- **Écosystème mature** : Large communauté, documentation extensive, et nombreuses librairies disponibles
- **Productivité** : Développement rapide grâce aux composants réutilisables et aux hooks
- **Maintenabilité** : TypeScript apporte le typage statique, réduisant les erreurs et améliorant la qualité du code
- **Performance** : Virtual DOM et optimisations automatiques de React
- **Compatibilité** : Excellent support des outils modernes (Vite, testing libraries)

### Choix de TailwindCSS + DaisyUI
**Avantages :**
- **Rapidité de développement** : Classes utilitaires permettant un prototypage rapide
- **Consistance** : Design system cohérent à travers toute l'application
- **Responsive design** : Adaptation native aux différentes tailles d'écran
- **Maintenance** : Réduction du CSS custom, moins de code à maintenir
- **DaisyUI** : Composants préconçus accélérant le développement UI

### Choix de Vercel pour le déploiement
**Avantages :**
- **Intégration Git** : Déploiement automatique à chaque push
- **Performance** : CDN global et optimisations automatiques
- **Simplicité** : Configuration zero-config pour les projets React
- **Preview deployments** : Environnements de test automatiques pour chaque PR

---

**Équipe de développement :**
- AFCMS, Roceann, AKArien0

**École Hexagone** - Promotion 2024-2025