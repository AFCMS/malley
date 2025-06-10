import { useState, useEffect, useCallback, useRef } from "react";

import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import { RejectedProfilesManager } from "../../utils/rejectedProfiles";

import FetchCard from "../../Components/FetchCard/FetchCard";
import TopBar from "../../layouts/TopBar/TopBar";

// IMPORTANT : pour l'instant les uuids de profils sont codés en dur ici.
// plus tard on pourrait les récupérer dynamiquement depuis la base de données
const ALL_KNOWN_PROFILE_IDS: string[] = [
  "f3c38d08-5223-4f3c-b730-93c3a5e0f7b0",
  "849e8cb9-f347-493d-b147-e149a7bb4d76",
  "acb406fd-8fe8-4923-bfc7-2d16afba243a",
  "acb406fd-8fe8-4923-bfc7-2d16afba243a",
];

const BUFFER_SIZE = 3; // 1 affiché + 2 en réserve
const PRELOAD_THRESHOLD = 1; // Recharger quand il reste 1 profil

export default function SwipePage() {
  const auth = useAuth();
  const [profileIdQueue, setProfileIdQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSwipeFinished, setIsSwipeFinished] = useState<boolean>(false);
  const [isRefilling, setIsRefilling] = useState<boolean>(false);

  // États pour l'animation de swipe
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cache pour éviter les requêtes répétées
  const processedProfileIdsRef = useRef<Set<string>>(new Set());
  const followedProfileIdsRef = useRef<Set<string>>(new Set());
  const allAvailableProfilesRef = useRef<string[]>([]);
  const nextIndexToLoadRef = useRef<number>(0);

  // Fonction pour filtrer les profils disponibles (pas suivis + pas rejetés récemment)
  const filterAvailableProfiles = useCallback(
    async (profileIds: string[]): Promise<string[]> => {
      if (!auth.user) return [];

      const availableProfiles: string[] = [];

      for (const profileId of profileIds) {
        // Ne pas afficher son propre profil
        if (profileId === auth.user.id) {
          continue;
        }

        // Ne pas retraiter les profils déjà traités dans cette session
        if (processedProfileIdsRef.current.has(profileId)) {
          continue;
        }

        // Vérifier si déjà suivi (cache)
        if (followedProfileIdsRef.current.has(profileId)) {
          continue;
        }

        // Vérifier si récemment refusé (72h)
        if (RejectedProfilesManager.isProfileRejected(profileId)) {
          continue;
        }

        try {
          const isFollowing = await queries.follows.doesXFollowY(auth.user.id, profileId);
          if (isFollowing) {
            followedProfileIdsRef.current.add(profileId);
          } else {
            availableProfiles.push(profileId);
          }
        } catch {
          // En cas d'erreur, inclure le profil pour ne pas bloquer l'affichage
          availableProfiles.push(profileId);
        }
      }

      return availableProfiles;
    },
    [auth.user],
  );

  // Fonction pour remplir la liste des profils disponibles
  const initializeAvailableProfiles = useCallback(async () => {
    if (!auth.user) return;

    // Nettoyer les profils expirés (après 72h)
    RejectedProfilesManager.clearExpiredProfiles();

    // Filtrer les profils disponibles
    const availableIds = await filterAvailableProfiles(ALL_KNOWN_PROFILE_IDS);

    allAvailableProfilesRef.current = availableIds;
    nextIndexToLoadRef.current = 0;

    if (availableIds.length === 0) {
      setIsSwipeFinished(true);
      setProfileIdQueue([]);
      setCurrentIndex(0);
      return;
    }
  }, [auth.user, filterAvailableProfiles]);

  // Fonction pour remplir le buffer avec les prochains profils
  const refillBuffer = useCallback(async () => {
    if (isRefilling || isSwipeFinished) return;

    setIsRefilling(true);

    const availableProfiles = allAvailableProfilesRef.current;
    const startIndex = nextIndexToLoadRef.current;

    // Calculer combien de profils nous devons ajouter pour atteindre BUFFER_SIZE
    const currentBufferSize = profileIdQueue.length - currentIndex;
    const profilesNeeded = BUFFER_SIZE - currentBufferSize;

    if (profilesNeeded <= 0) {
      setIsRefilling(false);
      return;
    }

    // Vérifier s'il y a assez de profils disponibles
    const remainingProfiles = availableProfiles.length - startIndex;

    if (remainingProfiles <= 0) {
      // Plus de profils disponibles
      if (currentBufferSize === 0) {
        setIsSwipeFinished(true);
      }
      setIsRefilling(false);
      return;
    }

    // Prendre les prochains profils disponibles
    const profilesToAdd = Math.min(profilesNeeded, remainingProfiles);
    const newProfiles = availableProfiles.slice(startIndex, startIndex + profilesToAdd);

    // Ajouter les nouveaux profils à la queue
    setProfileIdQueue((prevQueue) => [...prevQueue, ...newProfiles]);

    // Mettre à jour l'index de chargement
    nextIndexToLoadRef.current = startIndex + profilesToAdd;

    // Précharger les données des nouveaux profils
    for (const profileId of newProfiles) {
      // Correction ESLint: await ajouté même si non nécessaire pour éviter l'erreur require-await
      await queries.profiles.get(profileId).catch((e: unknown) => {
        console.error("Erreur precharge:", e);
      });
    }

    setIsRefilling(false);
  }, [profileIdQueue.length, currentIndex, isRefilling, isSwipeFinished]);

  // Initialisation - charger les profils disponibles et remplir le buffer initial
  useEffect(() => {
    if (auth.user) {
      const initialize = async () => {
        setIsLoading(true);
        setError(null);

        await initializeAvailableProfiles();

        if (!isSwipeFinished) {
          await refillBuffer();
        }

        setIsLoading(false);
      };

      void initialize();
    }
  }, [auth.user, initializeAvailableProfiles, refillBuffer, isSwipeFinished]);

  // Surveiller le buffer et le remplir si nécessaire
  useEffect(() => {
    const currentBufferSize = profileIdQueue.length - currentIndex;

    if (currentBufferSize <= PRELOAD_THRESHOLD && !isRefilling && !isSwipeFinished) {
      void refillBuffer();
    }
  }, [currentIndex, profileIdQueue.length, refillBuffer, isRefilling, isSwipeFinished]);

  const advanceToNextProfile = () => {
    const currentProfileId = profileIdQueue[currentIndex];
    if (currentProfileId) {
      processedProfileIdsRef.current.add(currentProfileId);
    }

    // Avancer à l'index suivant
    setCurrentIndex((prevIndex) => prevIndex + 1);

    // Nettoyer la queue si elle devient trop longue (garder seulement les profils non traités)
    if (currentIndex >= 10) {
      setProfileIdQueue((prevQueue) => prevQueue.slice(currentIndex + 1));
      setCurrentIndex(0);
    }
  };

  const handleSwipeComplete = (direction: "left" | "right") => {
    setIsAnimating(true);

    if (direction === "right") {
      void handleFollow();
    } else {
      handlePass();
    }

    setTimeout(() => {
      setDragOffset({ x: 0, y: 0 });
      setIsAnimating(false);
    }, 300);
  };

  const handlePass = () => {
    if (isLoading || !profileIdQueue[currentIndex] || isAnimating) return;

    const profileId = profileIdQueue[currentIndex];

    // Ajouter le profil aux refusés avec un cooldown de 72h
    RejectedProfilesManager.addRejectedProfile(profileId);

    advanceToNextProfile();
  };

  const handleFollow = async () => {
    if (isLoading || !profileIdQueue[currentIndex] || isAnimating) return;

    const profileToFollowId = profileIdQueue[currentIndex];
    setIsLoading(true);
    setError(null);

    try {
      await queries.follows.add(profileToFollowId);
      // Ajouter au cache des profils suivis
      followedProfileIdsRef.current.add(profileToFollowId);
      advanceToNextProfile();
    } catch (err) {
      setError(`Échec du suivi du profil : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating || isLoading) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isAnimating) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging || isAnimating) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      handleSwipeComplete(dragOffset.x > 0 ? "right" : "left");
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || isLoading) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging || isAnimating) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      handleSwipeComplete(dragOffset.x > 0 ? "right" : "left");
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const resetSwipeSession = () => {
    processedProfileIdsRef.current = new Set();
    followedProfileIdsRef.current = new Set();
    allAvailableProfilesRef.current = [];
    nextIndexToLoadRef.current = 0;
    setProfileIdQueue([]);
    setCurrentIndex(0);
    setIsSwipeFinished(false);
    setIsLoading(true);

    // Redémarrer l'initialisation
    setTimeout(() => {
      void initializeAvailableProfiles().then(() => {
        void refillBuffer().then(() => {
          setIsLoading(false);
        });
      });
    }, 100);
  };

  // Vérifier si l'utilisateur est connecté
  if (!auth.user) {
    return (
      <div className="w-full">
        <TopBar title="Découvrir des profils" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="alert alert-warning max-w-md">
            <span>Vous devez être connecté pour découvrir des profils.</span>
          </div>
        </div>
      </div>
    );
  }

  // Affichage quand le swipe est terminé
  if (isSwipeFinished) {
    return (
      <div className="w-full">
        <TopBar title="Découvrir des profils" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md p-6 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-4 text-2xl font-bold">Swipe terminé pour aujourd&apos;hui !</h2>
            <p className="mb-6 text-gray-600">
              Vous avez passé en revue tous les profils disponibles. Certains profils seront à nouveau disponibles dans
              72h.
            </p>
            <button onClick={resetSwipeSession} className="btn btn-primary">
              Recommencer la session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chargement initial
  if (isLoading && profileIdQueue.length === 0) {
    return (
      <div className="w-full">
        <TopBar title="Découvrir des profils" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  // Erreur
  if (error && profileIdQueue.length === 0 && !isLoading) {
    return (
      <div className="w-full">
        <TopBar title="Découvrir des profils" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="alert alert-error max-w-md">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const currentProfileId = profileIdQueue[currentIndex];

  if (!currentProfileId) {
    return (
      <div className="w-full">
        <TopBar title="Découvrir des profils" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <p>Préparation des profils...</p>
          </div>
        </div>
      </div>
    );
  }

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.5, 1 - Math.abs(dragOffset.x) / 300);

  // Calcul des couleurs de fond selon la direction
  let backgroundColor = "transparent";
  let backgroundOpacity = 0;

  if (isDragging && Math.abs(dragOffset.x) > 30) {
    backgroundOpacity = Math.min(0.7, Math.abs(dragOffset.x) / 150);
    backgroundColor = dragOffset.x > 0 ? "#55efc4" : "#ff7675";
  }

  // Afficher des informations de debug sur le buffer (optionnel)
  const currentBufferSize = profileIdQueue.length - currentIndex;
  const debugInfo = `Buffer: ${currentBufferSize.toString()}/3 | Queue: ${profileIdQueue.length.toString()} | Index: ${currentIndex.toString()}`;

  return (
    <div className="w-full">
      <TopBar title="Découvrir des profils" />
      <div style={{ textAlign: "center", padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        {error && <p style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>⚠️ {error}</p>}

        {isRefilling && (
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>
            🔄 Chargement de nouveaux profils...
          </p>
        )}

        {/* Debug info - à supprimer en production */}
        {process.env.NODE_ENV === "development" && (
          <p style={{ fontSize: "0.8rem", color: "#999", marginBottom: "10px" }}>{debugInfo}</p>
        )}

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            height: "70vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Fond coloré animé */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: backgroundColor,
              opacity: backgroundOpacity,
              transition: isDragging ? "none" : "opacity 0.3s ease-out",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDragging && Math.abs(dragOffset.x) > 50 && (
              <div
                style={{
                  fontSize: "4rem",
                  fontWeight: "900",
                  color: "white",
                  textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
                  fontFamily: "Impact, Arial Black, sans-serif",
                  letterSpacing: "0.1em",
                  transform: `scale(${Math.min(1.5, 1 + Math.abs(dragOffset.x) / 300).toString()})`,
                  transition: "transform 0.1s ease-out",
                }}
              >
                {dragOffset.x > 0 ? "💚 SUIVRE" : "❌ PASSER"}
              </div>
            )}
          </div>

          {/* Carte swipable */}
          <div
            key={currentProfileId}
            style={{
              transform: `translateX(${dragOffset.x.toString()}px) translateY(${(dragOffset.y * 0.1).toString()}px) rotate(${rotation.toString()}deg)`,
              opacity: opacity,
              transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              zIndex: 2,
              position: "relative",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <FetchCard profileId={currentProfileId} />
          </div>

          {/* Boutons de contrôle */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              zIndex: 3,
              position: "relative",
            }}
          >
            <button
              onClick={handlePass}
              disabled={isLoading || isAnimating}
              style={{
                padding: "15px 30px",
                fontSize: "24px",
                cursor: isLoading || isAnimating ? "not-allowed" : "pointer",
                backgroundColor: "#ff7675",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "80px",
                height: "80px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: isAnimating ? 0.5 : 1,
                transition: "opacity 0.3s ease, transform 0.1s ease",
                transform: isLoading || isAnimating ? "scale(0.9)" : "scale(1)",
              }}
              aria-label="Passer le profil"
            >
              ❌
            </button>
            <button
              onClick={() => {
                void handleFollow();
              }}
              disabled={isLoading || isAnimating}
              style={{
                padding: "15px 30px",
                fontSize: "24px",
                cursor: isLoading || isAnimating ? "not-allowed" : "pointer",
                backgroundColor: "#55efc4",
                color: "#2d3436",
                border: "none",
                borderRadius: "50%",
                width: "80px",
                height: "80px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: isAnimating ? 0.5 : 1,
                transition: "opacity 0.3s ease, transform 0.1s ease",
                transform: isLoading || isAnimating ? "scale(0.9)" : "scale(1)",
              }}
              aria-label="Suivre le profil"
            >
              ✔️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}