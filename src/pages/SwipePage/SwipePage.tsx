import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { HiHeart, HiOutlineCheck, HiOutlineLockOpen, HiOutlineXMark, HiXMark } from "react-icons/hi2";

import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

import TopBar from "../../layouts/TopBar/TopBar";

import FetchCard from "../../Components/FetchCard/FetchCard";
import { RejectedProfilesManager } from "../../utils/rejectedProfiles";

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
const MAX_SWIPES_PER_DAY = 20;

const DailySwipeManager = {
  STORAGE_KEY: "daily_swipe_data",

  getTodayKey(): string {
    return new Date().toISOString().split("T")[0];
  },

  getSwipeData(): { date: string; count: number } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return { date: this.getTodayKey(), count: 0 };
    }

    try {
      const data = JSON.parse(stored) as { date: string; count: number };

      if (data.date !== this.getTodayKey()) {
        const newData = { date: this.getTodayKey(), count: 0 };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
        return newData;
      }

      return data;
    } catch {
      const newData = { date: this.getTodayKey(), count: 0 };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
      return newData;
    }
  },

  incrementSwipeCount(): void {
    const data = this.getSwipeData();
    data.count += 1;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  getRemainingSwipes(): number {
    const data = this.getSwipeData();
    return Math.max(0, MAX_SWIPES_PER_DAY - data.count);
  },

  hasReachedLimit(): boolean {
    return this.getRemainingSwipes() === 0;
  },

  resetDailyCount(): void {
    const data = { date: this.getTodayKey(), count: 0 };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },
};

export default function SwipePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profileIdQueue, setProfileIdQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSwipeFinished, setIsSwipeFinished] = useState<boolean>(false);
  const [isRefilling, setIsRefilling] = useState<boolean>(false);
  const [remainingSwipes, setRemainingSwipes] = useState<number>(MAX_SWIPES_PER_DAY);
  const [dailyLimitReached, setDailyLimitReached] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const processedProfileIdsRef = useRef<Set<string>>(new Set());
  const followedProfileIdsRef = useRef<Set<string>>(new Set());
  const allAvailableProfilesRef = useRef<string[]>([]);
  const nextIndexToLoadRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  useEffect(() => {
    const updateSwipeStatus = () => {
      const remaining = DailySwipeManager.getRemainingSwipes();
      const limitReached = DailySwipeManager.hasReachedLimit();

      setRemainingSwipes(remaining);
      setDailyLimitReached(limitReached);
    };

    updateSwipeStatus();
    const interval = setInterval(updateSwipeStatus, 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  const filterAvailableProfiles = useCallback(
    async (profileIds: string[]): Promise<string[]> => {
      if (!auth.user) return [];

      const availableProfiles: string[] = [];

      for (const profileId of profileIds) {
        if (profileId === auth.user.id) continue;
        if (processedProfileIdsRef.current.has(profileId)) continue;
        if (followedProfileIdsRef.current.has(profileId)) continue;
        if (RejectedProfilesManager.isProfileRejected(profileId)) continue;

        try {
          await queries.profiles.get(profileId);
          const isFollowing = await queries.follows.doesXFollowY(auth.user.id, profileId);
          if (isFollowing) {
            followedProfileIdsRef.current.add(profileId);
          } else {
            availableProfiles.push(profileId);
          }
        } catch {
          continue;
        }
      }

      return availableProfiles;
    },
    [auth.user],
  );
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
  useEffect(() => {
    if (auth.user && !isInitializedRef.current) {
      const initialize = async () => {
        setIsLoading(true);
        setError(null);
        try {
          await initializeAvailableProfiles();
        } catch {
          setError("Erreur lors du chargement des profils");
        } finally {
          setIsLoading(false);
        }
      };
      void initialize();
    }
  }, [auth.user, initializeAvailableProfiles]);
  useEffect(() => {
    if (!isInitializedRef.current || isRefilling || isSwipeFinished || isLoading || dailyLimitReached) return;

    const currentBufferSize = profileIdQueue.length - currentIndex;

    if (currentBufferSize > PRELOAD_THRESHOLD) return;

    const doRefill = async () => {
      setIsRefilling(true);
      const availableProfiles = allAvailableProfilesRef.current;
      const startIndex = nextIndexToLoadRef.current;
      const profilesNeeded = BUFFER_SIZE - currentBufferSize;
      const remainingProfiles = availableProfiles.length - startIndex;

      if (profilesNeeded <= 0 || remainingProfiles <= 0) {
        if (currentBufferSize === 0 && remainingProfiles <= 0) setIsSwipeFinished(true);
        setIsRefilling(false);
        return;
      }

      const profilesToAdd = Math.min(profilesNeeded, remainingProfiles);
      const newProfiles = availableProfiles.slice(startIndex, startIndex + profilesToAdd);

      setProfileIdQueue((prevQueue) => [...prevQueue, ...newProfiles]);
      nextIndexToLoadRef.current = startIndex + profilesToAdd;
      for (const profileId of newProfiles) {
        await queries.profiles.get(profileId).catch(() => {
          // Ignore preload errors
        });
      }

      setIsRefilling(false);
    };

    doRefill().catch(() => {
      setError("Error loading profiles");
      setIsRefilling(false);
    });
  }, [currentIndex, profileIdQueue.length, isLoading, isRefilling, isSwipeFinished, dailyLimitReached]);
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
  const advanceToNextProfile = () => {
    const currentProfileId = profileIdQueue[currentIndex];
    if (currentProfileId) {
      processedProfileIdsRef.current.add(currentProfileId);
    }

    DailySwipeManager.incrementSwipeCount();
    const remaining = DailySwipeManager.getRemainingSwipes();
    setRemainingSwipes(remaining);

    if (remaining === 0) {
      setDailyLimitReached(true);
      return;
    }
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    if (newIndex >= 10) {
      setProfileIdQueue((prevQueue) => prevQueue.slice(newIndex));
      setCurrentIndex(0);
    }
  };
  const handlePass = () => {
    if (isLoading || !profileIdQueue[currentIndex] || isAnimating || dailyLimitReached) return;

    const profileId = profileIdQueue[currentIndex];
    RejectedProfilesManager.addRejectedProfile(profileId);
    advanceToNextProfile();
  };

  const handleFollow = async () => {
    if (isLoading || !profileIdQueue[currentIndex] || isAnimating || dailyLimitReached) return;

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
    DailySwipeManager.resetDailyCount();
    processedProfileIdsRef.current.clear();
    followedProfileIdsRef.current.clear();
    isInitializedRef.current = false;
    allAvailableProfilesRef.current = [];
    nextIndexToLoadRef.current = 0;
    setProfileIdQueue([]);
    setCurrentIndex(0);
    setIsSwipeFinished(false);
    setDailyLimitReached(false);
    setRemainingSwipes(MAX_SWIPES_PER_DAY);
    setIsLoading(true);
    setIsRefilling(false);

    setTimeout(() => {
      initializeAvailableProfiles()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setError("Erreur lors de l'initialisation");
          setIsLoading(false);
        });
    }, 100);
  };

  const handleSwipeComplete = (direction: "left" | "right") => {
    if (dailyLimitReached) return;

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

  const handleDragEvents = {
    onMouseDown: (e: React.MouseEvent) => {
      if (isAnimating || isLoading || dailyLimitReached) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    onMouseMove: (e: React.MouseEvent) => {
      if (!isDragging || isAnimating || dailyLimitReached) return;
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    onMouseUp: () => {
      if (!isDragging || isAnimating || dailyLimitReached) return;
      setIsDragging(false);
      const threshold = 100;
      if (Math.abs(dragOffset.x) > threshold) {
        handleSwipeComplete(dragOffset.x > 0 ? "right" : "left");
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    },
    onTouchStart: (e: React.TouchEvent) => {
      if (isAnimating || isLoading || dailyLimitReached) return;
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!isDragging || isAnimating || dailyLimitReached) return;
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    },
    onTouchEnd: () => {
      if (!isDragging || isAnimating || dailyLimitReached) return;
      setIsDragging(false);
      const threshold = 100;
      if (Math.abs(dragOffset.x) > threshold) {
        handleSwipeComplete(dragOffset.x > 0 ? "right" : "left");
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    },
  };

  if (!auth.user) {
    return (
      <div className="w-full">
        <TopBar title="Discover" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="alert alert-warning max-w-md">
            <span>You must be connected to discover profiles.</span>
          </div>
        </div>
      </div>
    );
  }

  if (dailyLimitReached && !isLoading && !isRefilling) {
    return (
      <div className="w-full">
        <TopBar title="Discover" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md p-6 text-center">
            <div className="mb-4 text-6xl">⏰</div>
            <h2 className="mb-4 text-2xl font-bold">Limite quotidienne atteinte !</h2>
            <p className="mb-4 text-gray-600">Vous avez utilisé vos {MAX_SWIPES_PER_DAY} swipes quotidiens.</p>
            <p className="mb-6 text-gray-600">Revenez demain pour découvrir de nouveaux profils !</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  void navigate("/");
                }}
                className="btn btn-primary"
              >
                Retour à l&apos;accueil
              </button>
              <button onClick={resetAllCooldowns} className="btn btn-warning">
                🔓 Annuler tous les blockages
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSwipeFinished && !isLoading && !isRefilling) {
    return (
      <div className="w-full">
        <TopBar title="Discover" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md p-6 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-4 text-2xl font-bold">Swipe terminé pour aujourd&apos;hui !</h2>
            <p className="mb-6 text-gray-600">
              Vous avez passé en revue tous les profils disponibles. Certains profils seront à nouveau disponibles dans
              72h.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  void navigate("/");
                }}
                className="btn btn-primary"
              >
                Retour à l&apos;accueil
              </button>
              <button onClick={resetAllCooldowns} className="btn btn-warning">
                🔓 Annuler tous les blockages
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
  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.5, 1 - Math.abs(dragOffset.x) / 300);
  let backgroundColor = "transparent";
  let backgroundOpacity = 0;

  if (isDragging && Math.abs(dragOffset.x) > 30) {
    backgroundOpacity = Math.min(0.7, Math.abs(dragOffset.x) / 150);
    backgroundColor = dragOffset.x > 0 ? "var(--color-success)" : "var(--color-error)";
  }

  return (
    <div className="w-full">
      <TopBar title="Discover" />
      <div className="m-[0_auto] max-w-[500px] p-5 text-center">
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: remainingSwipes <= 5 ? "#fff3cd" : "#e7f3ff",
            borderRadius: "8px",
            border: `1px solid ${remainingSwipes <= 5 ? "#ffeaa7" : "#74b9ff"}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: "600",
              color: remainingSwipes <= 5 ? "#856404" : "#0984e3",
            }}
          >
            {remainingSwipes > 0
              ? `🔥 ${remainingSwipes.toString()} swipes restants aujourd'hui`
              : "❌ Plus de swipes disponibles aujourd'hui"}
          </p>
        </div>

        {error && <p style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>⚠️ {error}</p>}

        {isRefilling && (
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>
            🔄 Chargement de nouveaux profils...
          </p>
        )}

        <div className="relative flex h-[calc(100vh-280px)] flex-col">
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[1] flex items-center justify-center rounded-lg transition-opacity duration-300 ease-out"
            style={{
              backgroundColor,
              opacity: backgroundOpacity,
            }}
          >
            {isDragging && Math.abs(dragOffset.x) > 50 && !dailyLimitReached && (
              <div
                className="text-6xl font-black transition-transform duration-100 ease-out text-shadow-lg"
                style={{
                  color: "white",
                  textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
                  transform: `scale(${Math.min(1.5, 1 + Math.abs(dragOffset.x) / 300).toString()})`,
                }}
              >
                {dragOffset.x > 0 ? (
                  <span className="flex items-center gap-2">
                    <HiHeart className="size-16" />
                    FOLLOW
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <HiXMark className="size-16" />
                    PASS
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="relative mb-5 flex-1">
            <div
              key={currentProfileId}
              className="relative z-[2] h-full transition-[transform,opacity] duration-300 ease-out select-none"
              style={{
                transform: `translateX(${dragOffset.x.toString()}px) translateY(${(dragOffset.y * 0.1).toString()}px) rotate(${rotation.toString()}deg)`,
                opacity: dailyLimitReached ? 0.5 : opacity,
                cursor: dailyLimitReached ? "not-allowed" : isDragging ? "grabbing" : "grab",
              }}
              {...handleDragEvents}
              onMouseLeave={handleDragEvents.onMouseUp}
            >
              <FetchCard profileId={currentProfileId} />
            </div>
          </div>

          <div
            className=""
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              zIndex: 10,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(5px)",
              padding: "15px 0",
            }}
          >
            <button
              onClick={handlePass}
              disabled={isLoading || isAnimating || dailyLimitReached}
              className="btn btn-circle btn-xl btn-error"
              style={{
                cursor: dailyLimitReached ? "not-allowed" : "pointer",
              }}
            >
              <HiOutlineXMark className="size-6" />
            </button>

            <button
              onClick={() => {
                void handleFollow();
              }}
              disabled={isLoading || isAnimating || dailyLimitReached}
              className="btn btn-circle btn-xl btn-success"
              style={{
                cursor: dailyLimitReached ? "not-allowed" : "pointer",
              }}
            >
              <HiOutlineCheck className="size-6" />
            </button>
          </div>
        </div>

        <div hidden={true} className="mt-5">
          <button onClick={resetAllCooldowns} disabled={isLoading} className="btn btn-warning">
            <HiOutlineLockOpen className="size-6" /> Annuler tous les blockages
          </button>
        </div>
      </div>
    </div>
  );
}
