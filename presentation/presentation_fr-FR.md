---
marp: true
author: Équipe Malley
lang: fr-FR
theme: default
backgroundImage: url('https://marp.app/assets/hero-background.svg')
paginate: true
---

# Malley

Une plateforme de réseau social sur le modèle d'X

![w:200 bg right](../public/favicon.svg)

---

## L'équipe

<style scoped>
.image-row {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  margin: 2rem 0;
  gap: 2rem;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.square-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.image-text {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
}

.role-text {
  font-size: 0.9rem;
  font-style: italic;
  color: #666;
  margin-top: 0.25rem;
}

.github-link {
  margin-top: 0.5rem;
}

.github-link a {
  color: #333;
  text-decoration: none;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.github-icon {
  width: 24px;
  height: 24px;
}

.github-link a:hover {
  color: #0066cc;
}
</style>

<div class="image-row">
  <div class="image-item">
    <img src="./assets/profiles/AFCMS.png" alt="Posts" class="square-image">
    <div class="image-text">Louis WALTER</div>
    <div class="role-text">Infra & Frontend</div>
    <div class="github-link">
      <a href="https://github.com/AFCMS" target="_blank">
        <img src="./assets/simpleicons/github.svg" class="github-icon"/>
        @AFCMS
      </a>
    </div>

  </div>
  <div class="image-item">
    <img src="./assets/profiles/emimi.png" alt="Interactions" class="square-image">
    <div class="image-text">Émilien DESSARPS</div>
    <div class="role-text">Backend & Optimisation</div>
    <div class="github-link">
      <a href="https://github.com/AKArien0" target="_blank">
        <img src="./assets/simpleicons/github.svg" class="github-icon"/>
        @AKArien0
      </a>
    </div>

  </div>
  <div class="image-item">
    <img src="./assets/profiles/raphael.jpg" alt="Profils" class="square-image">
    <div class="image-text">Raphaël MALET</div>
    <div class="role-text">Frontend & Business</div>
    <div class="github-link">
      <a href="https://github.com/Roceann" target="_blank">
        <img src="./assets/simpleicons/github.svg" class="github-icon"/>
        @Roceann
      </a>
    </div>
  </div>
</div>

---

<style scoped>
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
  align-items: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.feature-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.mission-text {
  font-size: 1.5rem;
  font-style: italic;
  color: #4A90E2;
  text-align: center;
  margin: 1.5rem 0;
}
</style>

# 🌟 Malley

<div class="features-grid">
  <div class="feature-item">
    <div class="feature-icon">📱</div>
    <div class="feature-text">Feed personnalisé</div>
  </div>
  <div class="feature-item">
    <div class="feature-icon">⭐</div>
    <div class="feature-text">Utilisateurs vedettes</div>
  </div>
  <div class="feature-item">
    <div class="feature-icon">👆</div>
    <div class="feature-text">Système de glissement</div>
  </div>
  <div class="feature-item">
    <div class="feature-icon">🤝</div>
    <div class="feature-text">Co-auteurs</div>
  </div>
</div>

<div class="mission-text">
Connexions par centres d'intérêt
</div>

---

<style scoped>
.commercial-grid {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.commercial-section {
  text-align: center;
  max-width: 500px;
}

.section-title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.item-list {
  list-style: none;
  padding: 0;
}

.item-list li {
  font-size: 1.1rem;
  margin: 1rem 0;
  color: #666;
}

.unique-value {
  font-size: 2rem;
  font-weight: bold;
  color: #4A90E2;
  text-align: center;
  margin: 2rem 0;
}
</style>

# 💼 Valeur commerciale

<div class="commercial-grid">
  <div class="commercial-section">
    <div class="section-title">✨ Différenciation</div>
    <ul class="item-list">
      <li>Découverte intelligente</li>
      <li>Catégorisation des contenus</li>
      <li>Co-création de contenu</li>
      <li>Interactions personnalisées</li>
    </ul>
  </div>
</div>

<div class="unique-value">
🔗 Écosystème d'interactions uniques
</div>

---

## Architecture

<style scoped>
.architecture-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 3rem 0;
  gap: 4rem;
}

.arch-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.arch-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 1rem;
  object-fit: contain;
}

.arch-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.arch-subtitle {
  font-size: 1rem;
  color: #666;
  font-style: italic;
}

.arrow {
  font-size: 3rem;
  color: #0066cc;
  display: flex;
  align-items: center;
  margin: 0 1rem;
}

.architecture-description {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  color: #555;
}
</style>

<div class="architecture-container">
  <div class="arch-component">
    <img src="./assets/supabase.svg" alt="Supabase" class="arch-icon">
    <div class="arch-title">Supabase Cloud</div>
    <div class="arch-subtitle">Backend-as-a-Service</div>
  </div>
  
  <div class="arrow">↔</div>
  
  <div class="arch-component">
    <img src="./assets/vercel-icon-light.svg" alt="Vercel" class="arch-icon">
    <div class="arch-title">Vercel</div>
    <div class="arch-subtitle">Frontend SPA</div>
  </div>
</div>

<div class="architecture-description">
  <strong>Moderne, Scalable & développement facile</strong>
</div>

---

## Technologies

<style scoped>
.tech-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin: 1.5rem 0;
  align-items: center;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.tech-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 0.5rem;
  object-fit: contain;
}

.tech-item:last-child .tech-icon {
  width: 80px;
  height: 60px;
}

.tech-title {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.3rem;
}

.tech-description {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.tech-summary {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  color: #555;
}
</style>

<div class="tech-grid">
  <div class="tech-item">
    <img src="./assets/react.svg" alt="React" class="tech-icon">
    <div class="tech-title">React 19</div>
    <div class="tech-description">Interface utilisateur moderne</div>
  </div>
  
  <div class="tech-item">
    <img src="./assets/typescript.svg" alt="TypeScript" class="tech-icon">
    <div class="tech-title">TypeScript</div>
    <div class="tech-description">Typage statique & robustesse</div>
  </div>
  
  <div class="tech-item">
    <img src="./assets/tailwind.svg" alt="TailwindCSS" class="tech-icon">
    <div class="tech-title">TailwindCSS</div>
    <div class="tech-description">Avec daisyUI pour un CSS moderne et cohérent</div>
  </div>
  
  <div class="tech-item">
    <img src="./assets/pwa.svg" alt="PWA" class="tech-icon">
    <div class="tech-title">PWA</div>
    <div class="tech-description">Expérience proche d'une application native, pour une fraction de la complexité</div>
  </div>
</div>

<div class="tech-summary">
<strong>Stack moderne pour une expérience utilisateur optimale</strong>
</div>
