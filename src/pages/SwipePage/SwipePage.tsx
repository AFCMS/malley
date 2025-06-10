import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";

import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import { RejectedProfilesManager } from "../../utils/rejectedProfiles";

import FetchCard from "../../Components/FetchCard/FetchCard";
import TopBar from "../../layouts/TopBar/TopBar";

const ALL_KNOWN_PROFILE_IDS: string[] = [
  "09ae7c64-bb08-49f3-8e64-7c90f62fa37c",
  "ac7c2be0-e885-4905-a245-9ed9c7c1fec5",
  "d385aa53-59b5-4a83-91a6-9716c0e76dfd",
  "e332aa67-c716-4edb-934c-dee540618f34",
  "f5c93267-abf2-43ea-8973-bcc48520bdb7",
  "d3dedc23-87d9-4b3f-94cc-3d68e7f4c05e",
];

const BUFFER_SIZE = 3;
const PRELOAD_THRESHOLD = 1;

export default function SwipePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [profileIdQueue, setProfileIdQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSwipeFinished, setIsSwipeFinished] = useState<boolean>(false);
  const [isRefilling, setIsRefilling] = useState<boolean>(false);

  // États pour l'animation
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs pour le cache
  const processedProfileIdsRef = useRef<Set<string>>(new Set());
  const followedProfileIdsRef = useRef<Set<string>>(new Set());
  const allAvailableProfilesRef = useRef<string[]>([]);
  const nextIndexToLoadRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Filtrer les profils disponibles
  const filterAvailableProfiles = useCallback(
    async (profileIds: string[]): Promise<string[]> => {
      if (!auth.user) return [];

      const availableProfiles: string[] = [];

      for (const profileId of profileIds) {
        // Filtres de base
        if (profileId === auth.user.id) continue;
        if (processedProfileIdsRef.current.has(profileId)) continue;
        if (followedProfileIdsRef.current.has(profileId)) continue;
        if (RejectedProfilesManager.isProfileRejected(profileId)) continue;

        try {
          // Vérifier existence du profil
          await queries.profiles.get(profileId);

          // Vérifier si déjà suivi
          const isFollowing = await queries.follows.doesXFollowY(auth.user.id, profileId);
          if (isFollowing) {
            followedProfileIdsRef.current.add(profileId);
          } else {
            availableProfiles.push(profileId);
          }
        } catch {
          // Ignorer les profils avec erreurs
          continue;
        }
      }

      return availableProfiles;
    },
    [auth.user],
  );

  // Initialiser les profils disponibles
  const initializeAvailableProfiles = useCallback(async () => {
    if (!auth.user || isInitializedRef.current) return;

    isInitializedRef.current = true;
    RejectedProfilesManager.clearExpiredProfiles();

    const availableIds = await filterAvailableProfiles(ALL_KNOWN_PROFILE_IDS);
    allAvailableProfilesRef.current = availableIds;
    nextIndexToLoadRef.current = 0;

    if (availableIds.length === 0) {
      setIsSwipeFinished(true);
      setProfileIdQueue([]);
      setCurrentIndex(0);
    } else {
      const initialProfiles = availableIds.slice(0, Math.min(BUFFER_SIZE, availableIds.length));
      setProfileIdQueue(initialProfiles);
      nextIndexToLoadRef.current = initialProfiles.length;
      setIsSwipeFinished(false);
    }
  }, [auth.user, filterAvailableProfiles]);

  // Initialisation
  useEffect(() => {
    if (auth.user && !isInitializedRef.current) {
      const initialize = async () => {
        setIsLoading(true);
        setError(null);
        try {
          await initializeAvailableProfiles();
        } catch {
          // ✅ FIX: Supprimer la variable err non utilisée
          setError("Erreur lors du chargement des profils");
        } finally {
          setIsLoading(false);
        }
      };
      void initialize();
    }
  }, [auth.user, initializeAvailableProfiles]);

  // Refill du buffer
  useEffect(() => {
    if (!isInitializedRef.current || isRefilling || isSwipeFinished || isLoading) return;

    const currentBufferSize = profileIdQueue.length - currentIndex;

    if (currentBufferSize <= PRELOAD_THRESHOLD) {
      const doRefill = async () => {
        // ✅ FIX: Supprimer les conditions redondantes déjà vérifiées dans le useEffect parent
        setIsRefilling(true);
        const availableProfiles = allAvailableProfilesRef.current;
        const startIndex = nextIndexToLoadRef.current;
        const profilesNeeded = BUFFER_SIZE - currentBufferSize;
        const remainingProfiles = availableProfiles.length - startIndex;

        if (profilesNeeded <= 0) {
          setIsRefilling(false);
          return;
        }

        if (remainingProfiles <= 0) {
          if (currentBufferSize === 0) setIsSwipeFinished(true);
          setIsRefilling(false);
          return;
        }

        const profilesToAdd = Math.min(profilesNeeded, remainingProfiles);
        const newProfiles = availableProfiles.slice(startIndex, startIndex + profilesToAdd);

        setProfileIdQueue((prevQueue) => [...prevQueue, ...newProfiles]);
        nextIndexToLoadRef.current = startIndex + profilesToAdd;

        // Précharger les profils
        for (const profileId of newProfiles) {
          await queries.profiles.get(profileId).catch(() => {
            // Ignorer les erreurs de préchargement
          });
        }

        setIsRefilling(false);
      };

      void doRefill();
    }
  }, [currentIndex, profileIdQueue.length, isLoading, isRefilling, isSwipeFinished]);


  // Détection fin de swipe
  useEffect(() => {
    if (!isInitializedRef.current || isLoading || isRefilling) return;

    const currentBufferSize = profileIdQueue.length - currentIndex;
    const availableProfiles = allAvailableProfilesRef.current;
    const nextIndex = nextIndexToLoadRef.current;

    if (currentBufferSize === 0 && nextIndex >= availableProfiles.length) {
      setIsSwipeFinished(true);
    }
  }, [currentIndex, profileIdQueue.length, isLoading, isRefilling]);

  // Reset utilisateur
  useEffect(() => {
    isInitializedRef.current = false;
    processedProfileIdsRef.current.clear();
    followedProfileIdsRef.current.clear();
    allAvailableProfilesRef.current = [];
    nextIndexToLoadRef.current = 0;
    setProfileIdQueue([]);
    setCurrentIndex(0);
    setIsSwipeFinished(false);
    setIsLoading(false);
    setIsRefilling(false);
  }, [auth.user?.id]);

  // Navigation
  const advanceToNextProfile = () => {
    const currentProfileId = profileIdQueue[currentIndex];
    if (currentProfileId) {
      processedProfileIdsRef.current.add(currentProfileId);
    }

    const newIndex = currentIndex + 1;
    const remainingInBuffer = profileIdQueue.length - newIndex;
    const remainingToLoad = allAvailableProfilesRef.current.length - nextIndexToLoadRef.current;

    setCurrentIndex(newIndex);

    if (remainingInBuffer === 0 && remainingToLoad === 0) {
      setIsSwipeFinished(true);
      return;
    }

    // Nettoyer si nécessaire
    if (newIndex >= 10) {
      setProfileIdQueue((prevQueue) => prevQueue.slice(newIndex));
      setCurrentIndex(0);
    }
  };

  // Actions utilisateur
  const handlePass = () => {
    if (isLoading || !profileIdQueue[currentIndex] || isAnimating) return;

    const profileId = profileIdQueue[currentIndex];
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
      followedProfileIdsRef.current.add(profileToFollowId);
      advanceToNextProfile();
    } catch (err) {
      setError(`Échec du suivi du profil : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllCooldowns = () => {
    RejectedProfilesManager.clearAllRejectedProfiles();
    processedProfileIdsRef.current.clear();
    followedProfileIdsRef.current.clear();
    isInitializedRef.current = false;
    allAvailableProfilesRef.current = [];
    nextIndexToLoadRef.current = 0;
    setProfileIdQueue([]);
    setCurrentIndex(0);
    setIsSwipeFinished(false);
    setIsLoading(true);
    setIsRefilling(false);

    setTimeout(() => {
      // ✅ FIX: Corriger la fonction qui retourne void
      void initializeAvailableProfiles().then(() => {
        setIsLoading(false);
      });
    }, 100);
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

  // Handlers souris/tactile
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating || isLoading) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isAnimating) return;
    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
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
    setDragOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
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

  // Rendu conditionnel
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

  if (isSwipeFinished && !isLoading && !isRefilling) {
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
            <div className="flex flex-col gap-3">
              <button onClick={() => 
                void navigate("/")} 
                className="btn btn-primary">
                Retour à l&apos;accueil
              </button>
              <button onClick={resetAllCooldowns} className="btn btn-warning">
                🔄 Reset tous les temps d&apos;attente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  // Calculs pour l'animation
  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.5, 1 - Math.abs(dragOffset.x) / 300);
  let backgroundColor = "transparent";
  let backgroundOpacity = 0;

  if (isDragging && Math.abs(dragOffset.x) > 30) {
    backgroundOpacity = Math.min(0.7, Math.abs(dragOffset.x) / 150);
    backgroundColor = dragOffset.x > 0 ? "#55efc4" : "#ff7675";
  }

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

        {/* ✅ CORRECTION : Restructuration du layout */}
        <div
          style={{
            position: "relative",
            height: "calc(100vh - 200px)", // Hauteur adaptative moins l'espace pour les boutons
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Fond animé */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor,
              opacity: backgroundOpacity,
              transition: isDragging ? "none" : "opacity 0.3s ease-out",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none", // ✅ Permet les interactions avec la carte en dessous
            }}
          >
            {isDragging && Math.abs(dragOffset.x) > 50 && (
              <div
                style={{
                  fontSize: "4rem",
                  fontWeight: "900",
                  color: "white",
                  textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
                  transform: `scale(${String(Math.min(1.5, 1 + Math.abs(dragOffset.x) / 300))})`,
                  transition: "transform 0.1s ease-out",
                }}
              >
                {dragOffset.x > 0 ? "💚 SUIVRE" : "❌ PASSER"}
              </div>
            )}
          </div>

          {/* ✅ CORRECTION : Conteneur de la carte avec hauteur fixe et scroll */}
          <div
            style={{
              flex: 1,
              position: "relative",
              marginBottom: "20px", // Espace pour les boutons
            }}
          >
            <div
              key={currentProfileId}
              style={{
                transform: `translateX(${String(dragOffset.x)}px) translateY(${String(dragOffset.y * 0.1)}px) rotate(${String(rotation)}deg)`,
                opacity,
                transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                height: "100%", // ✅ Prend toute la hauteur disponible
                zIndex: 2,
                position: "relative",
              }}
              // ✅ FIX: Corriger les handlers de Promise
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
          </div>

          {/* ✅ CORRECTION : Boutons positionnés en position fixe en bas */}
          <div
            style={{
              position: "sticky", // ✅ Reste visible même avec le scroll
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              zIndex: 10, // ✅ Z-index élevé pour rester au-dessus
              backgroundColor: "rgba(255, 255, 255, 0.95)", // ✅ Fond semi-transparent
              backdropFilter: "blur(5px)", // ✅ Effet de flou pour la lisibilité
              padding: "15px 0",
              borderTop: "1px solid rgba(0,0,0,0.1)", // ✅ Séparation visuelle
            }}
          >
            <button
              onClick={handlePass}
              disabled={isLoading || isAnimating}
              className="btn btn-circle btn-lg"
              style={{
                backgroundColor: "#ff7675",
                color: "white",
                border: "none",
                opacity: isAnimating ? 0.5 : 1,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // ✅ Ombre pour le relief
              }}
            >
              ❌
            </button>
            <button
              onClick={() => {
                void handleFollow();
              }}
              disabled={isLoading || isAnimating}
              className="btn btn-circle btn-lg"
              style={{
                backgroundColor: "#55efc4",
                color: "#2d3436",
                border: "none",
                opacity: isAnimating ? 0.5 : 1,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // ✅ Ombre pour le relief
              }}
            >
              ✔️
            </button>
          </div>
        </div>

        {/* Bouton reset */}
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={resetAllCooldowns}
            disabled={isLoading}
            className="btn btn-sm"
            style={{
              backgroundColor: "#fdcb6e",
              color: "#2d3436",
              border: "none",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🔄 Reset temps d&apos;attente
          </button>
        </div>
      </div>
    </div>
  );
}
