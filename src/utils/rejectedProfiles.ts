interface RejectedProfile {
  profileId: string;
  rejectedAt: number; // timestamp
  expiresAt: number; // timestamp
}

const REJECTED_PROFILES_KEY = "malley_rejected_profiles";
const COOLDOWN_HOURS = 72;

function getCooldownDuration(): number {
  return COOLDOWN_HOURS * 60 * 60 * 1000; // 72h en millisecondes
}

export function addRejectedProfile(profileId: string): void {
  const now = Date.now();
  const cooldownDuration = getCooldownDuration();

  const rejectedProfile: RejectedProfile = {
    profileId,
    rejectedAt: now,
    expiresAt: now + cooldownDuration,
  };

  const existing = getRejectedProfiles();
  const updated = existing.filter((p) => p.profileId !== profileId); // supprimer l'ancien si existe
  updated.push(rejectedProfile);

  localStorage.setItem(REJECTED_PROFILES_KEY, JSON.stringify(updated));
}

export function isProfileRejected(profileId: string): boolean {
  const rejectedProfiles = getRejectedProfiles();
  const now = Date.now();

  const rejection = rejectedProfiles.find((p) => p.profileId === profileId);

  if (!rejection) return false;

  // Vérifier si le cooldown de 72h est encore actif
  return rejection.expiresAt > now;
}

export function getRejectedProfiles(): RejectedProfile[] {
  try {
    const stored = localStorage.getItem(REJECTED_PROFILES_KEY);
    if (!stored) return [];

    // Type assertion plus sûre
    const profiles = JSON.parse(stored) as RejectedProfile[];
    const now = Date.now();

    // Nettoyer les profils expirés (après 72h)
    const activeProfiles = profiles.filter((p) => p.expiresAt > now);

    // Sauvegarder la liste nettoyée
    localStorage.setItem(REJECTED_PROFILES_KEY, JSON.stringify(activeProfiles));

    return activeProfiles;
  } catch (error) {
    console.error("Erreur lors de la lecture des profils refusés:", error);
    return [];
  }
}

export function clearExpiredProfiles(): void {
  // Cette méthode est appelée automatiquement dans getRejectedProfiles()
  getRejectedProfiles();
}

export function getTimeUntilProfileAvailable(profileId: string): number | null {
  const rejectedProfiles = getRejectedProfiles();
  const rejection = rejectedProfiles.find((p) => p.profileId === profileId);

  if (!rejection) return null;

  const now = Date.now();
  const timeLeft = rejection.expiresAt - now;

  return timeLeft > 0 ? timeLeft : null;
}

// Utilitaire pour formater le temps restant
export function formatTimeUntilAvailable(profileId: string): string | null {
  const timeLeft = getTimeUntilProfileAvailable(profileId);
  if (!timeLeft) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    // Conversion explicite en string
    return `${hours.toString()}h ${minutes.toString()}m`;
  } else {
    // Conversion explicite en string
    return `${minutes.toString()}m`;
  }
}

// Pour le debug/admin
export function clearAllRejectedProfiles(): void {
  localStorage.removeItem(REJECTED_PROFILES_KEY);
}

// Méthode pour obtenir le nombre d'heures de cooldown (pour info)
export function getCooldownHours(): number {
  return COOLDOWN_HOURS;
}

// Export d'un objet pour compatibilité avec l'usage existant
export const RejectedProfilesManager = {
  addRejectedProfile,
  isProfileRejected,
  getRejectedProfiles,
  clearExpiredProfiles,
  getTimeUntilProfileAvailable,
  formatTimeUntilAvailable,
  clearAllRejectedProfiles,
  getCooldownHours,
};
