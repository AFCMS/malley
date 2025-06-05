import { useState, useEffect, useCallback, useRef } from "react";

import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

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

const BATCH_SIZE = 3;

export default function SwipePage() {
  const auth = useAuth();
  const [profileIdQueue, setProfileIdQueue] = useState<string[]>([]);
  const [currentIndexInBatch, setCurrentIndexInBatch] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // États pour l'animation de swipe
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Utiliser useRef pour éviter la boucle infinie
  const seenProfileIdsRef = useRef<Set<string>>(new Set());
  const followedProfileIdsRef = useRef<Set<string>>(new Set());

  // Fonction pour vérifier et filtrer les profils déjà suivis
  const filterUnfollowedProfiles = useCallback(
    async (profileIds: string[]): Promise<string[]> => {
      if (!auth.user) return profileIds;

      const unfollowedProfiles: string[] = [];

      for (const profileId of profileIds) {
        // Ne pas afficher son propre profil
        if (profileId === auth.user.id) {
          continue;
        }

        // Vérifier si déjà en cache
        if (followedProfileIdsRef.current.has(profileId)) {
          continue;
        }

        try {
          const isFollowing = await queries.follows.doesXFollowY(auth.user.id, profileId);
          if (isFollowing) {
            followedProfileIdsRef.current.add(profileId);
          } else {
            unfollowedProfiles.push(profileId);
          }
        } catch {
          // En cas d'erreur, inclure le profil pour ne pas bloquer l'affichage
          unfollowedProfiles.push(profileId);
        }
      }

      return unfollowedProfiles;
    },
    [auth.user],
  );

  const fetchNewBatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!auth.user) {
      setError("Vous devez être connecté pour découvrir des profils.");
      setIsLoading(false);
      setProfileIdQueue([]);
      return;
    }

    if (ALL_KNOWN_PROFILE_IDS.length === 0) {
      setError("Aucun ID de profil connu disponible.");
      setIsLoading(false);
      setProfileIdQueue([]);
      return;
    }

    // Filtrer les profils déjà vus
    const unseenIds = ALL_KNOWN_PROFILE_IDS.filter((id) => !seenProfileIdsRef.current.has(id));

    if (unseenIds.length === 0) {
      // Reset si tous les profils ont été vus
      seenProfileIdsRef.current = new Set();
      followedProfileIdsRef.current = new Set(); // Reset aussi le cache des follows

      const unfollowedIds = await filterUnfollowedProfiles(ALL_KNOWN_PROFILE_IDS);
      if (unfollowedIds.length === 0) {
        setError("Vous suivez déjà tous les profils disponibles !");
        setProfileIdQueue([]);
        setCurrentIndexInBatch(0);
        setIsLoading(false);
        return;
      }

      const newBatch = unfollowedIds.slice(0, BATCH_SIZE);
      setProfileIdQueue(newBatch);
      setCurrentIndexInBatch(0);
      setIsLoading(false);

      // Marquer comme vus
      newBatch.forEach((id) => seenProfileIdsRef.current.add(id));
      return;
    }

    // Filtrer les profils non suivis parmi ceux non vus
    const unfollowedIds = await filterUnfollowedProfiles(unseenIds);

    if (unfollowedIds.length === 0) {
      // Si aucun profil non suivi parmi les non vus, essayer avec tous les profils
      const allUnfollowedIds = await filterUnfollowedProfiles(ALL_KNOWN_PROFILE_IDS);
      if (allUnfollowedIds.length === 0) {
        setError("Vous suivez déjà tous les profils disponibles !");
        setProfileIdQueue([]);
        setCurrentIndexInBatch(0);
        setIsLoading(false);
        return;
      }

      // Reset et prendre les premiers profils non suivis
      seenProfileIdsRef.current = new Set();
      const newBatch = allUnfollowedIds.slice(0, BATCH_SIZE);
      setProfileIdQueue(newBatch);
      setCurrentIndexInBatch(0);
      setIsLoading(false);

      // Marquer comme vus
      newBatch.forEach((id) => seenProfileIdsRef.current.add(id));
      return;
    }

    const newBatch = unfollowedIds.slice(0, BATCH_SIZE);
    setProfileIdQueue(newBatch);
    setCurrentIndexInBatch(0);
    setIsLoading(false);

    // Mettre à jour la référence
    newBatch.forEach((id) => seenProfileIdsRef.current.add(id));
  }, [auth.user, filterUnfollowedProfiles]);

  useEffect(() => {
    if (auth.user) {
      void fetchNewBatch();
    }
  }, [auth.user, fetchNewBatch]);

  useEffect(() => {
    if (profileIdQueue.length > 0 && currentIndexInBatch + 1 < profileIdQueue.length) {
      const nextProfileId = profileIdQueue[currentIndexInBatch + 1];
      if (nextProfileId) {
        queries.profiles.get(nextProfileId).catch((e: unknown) => {
          console.error(e);
        });
      }
    }
  }, [currentIndexInBatch, profileIdQueue]);

  const advanceToNextProfile = () => {
    if (currentIndexInBatch < profileIdQueue.length - 1) {
      setCurrentIndexInBatch((prevIndex) => prevIndex + 1);
      setIsLoading(false);
    } else {
      void fetchNewBatch();
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
    if (isLoading || !profileIdQueue[currentIndexInBatch] || isAnimating) return;
    advanceToNextProfile();
  };

  const handleFollow = async () => {
    if (isLoading || !profileIdQueue[currentIndexInBatch] || isAnimating) return;

    const profileToFollowId = profileIdQueue[currentIndexInBatch];
    setIsLoading(true);
    setError(null);
    try {
      await queries.follows.add(profileToFollowId);
      // Ajouter au cache des profils suivis
      followedProfileIdsRef.current.add(profileToFollowId);
      advanceToNextProfile();
    } catch (err) {
      setError(`Échec du suivi du profil : ${err instanceof Error ? err.message : String(err)}`);
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

  if (isLoading && profileIdQueue.length === 0 && currentIndexInBatch === 0) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Chargement des profils...</div>;
  }

  if (error && profileIdQueue.length === 0 && !isLoading) {
    return <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>;
  }

  if (profileIdQueue.length === 0 && !isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        {error ?? "Aucun profil disponible à swiper pour le moment."}
      </div>
    );
  }

  const currentProfileId = profileIdQueue[currentIndexInBatch];

  if (!currentProfileId && !isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        {error ?? "Aucun profil à afficher actuellement. Essayez de rafraîchir."}
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

  return (
    <div style={{ textAlign: "center", padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Swiper les Profils</h1>
      {error && currentProfileId && <p style={{ color: "red", fontWeight: "bold" }}>Avis : {error}</p>}

      {isLoading && currentProfileId && <p>Chargement du prochain ensemble de profils...</p>}

      {currentProfileId ? (
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
      ) : (
        !isLoading && <div>Préparation du prochain profil...</div>
      )}
    </div>
  );
}
