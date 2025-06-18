import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import { HiHeart, HiOutlineCheck, HiOutlineLockOpen, HiOutlineXMark, HiXMark } from "react-icons/hi2";

import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

import TopBar from "../../layouts/TopBar/TopBar";

import FetchCard from "../../Components/FetchCard/FetchCard";
import { RejectedProfilesManager } from "../../utils/rejectedProfiles";

const BUFFER_SIZE = 3;
const PRELOAD_THRESHOLD = 2; // Increased from 1 to prevent running out of profiles
const MAX_SWIPES_PER_DAY = 20;
const PROFILES_FETCH_LIMIT = 50; // Number of profiles to fetch at once

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
  const feedOffsetRef = useRef<number>(0);
  const hasMoreProfilesRef = useRef<boolean>(true);
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
  const fetchProfilesFeed = useCallback(
    async (offset = 0, minRequired = 1): Promise<string[]> => {
      if (!auth.user) return [];

      const availableProfileIds: string[] = [];
      let currentOffset = offset;
      let maxRetries = 10; // Increased retries for better coverage
      let totalProfilesProcessed = 0;
      const maxTotalProfiles = 500; // Safety limit to prevent excessive database queries

      while (
        availableProfileIds.length < minRequired &&
        hasMoreProfilesRef.current &&
        maxRetries > 0 &&
        totalProfilesProcessed < maxTotalProfiles
      ) {
        try {
          const profiles = await queries.feed.profiles.get({
            sort_by: "created_at",
            sort_order: "desc",
            paging_limit: PROFILES_FETCH_LIMIT,
            paging_offset: currentOffset,
          });

          totalProfilesProcessed += profiles.length;

          // Only set hasMore to false when we get exactly 0 profiles
          // Don't assume no more profiles just because we got less than the limit
          if (profiles.length === 0) {
            hasMoreProfilesRef.current = false;
            break; // No more profiles available
          }

          let addedInThisBatch = 0;
          for (const profile of profiles) {
            if (profile.id === auth.user.id) continue;
            if (processedProfileIdsRef.current.has(profile.id)) continue;
            if (followedProfileIdsRef.current.has(profile.id)) continue;
            if (RejectedProfilesManager.isProfileRejected(profile.id)) continue;

            try {
              const isFollowing = await queries.follows.doesXFollowY(auth.user.id, profile.id);
              if (isFollowing) {
                followedProfileIdsRef.current.add(profile.id);
              } else {
                availableProfileIds.push(profile.id);
                addedInThisBatch++;
              }
            } catch {
              continue;
            }
          }
          currentOffset += PROFILES_FETCH_LIMIT;
          maxRetries--;

          // If we processed a full batch but got very few results, be more aggressive
          if (profiles.length === PROFILES_FETCH_LIMIT && addedInThisBatch === 0 && maxRetries > 5) {
            maxRetries = Math.min(maxRetries, 5); // Reduce retries if we're not finding anything
          }
        } catch {
          maxRetries--;
        }
      } // Update the offset reference to where we left off
      feedOffsetRef.current = currentOffset;

      return availableProfileIds;
    },
    [auth.user],
  );
  const initializeAvailableProfiles = useCallback(async () => {
    if (!auth.user || isInitializedRef.current) return;

    isInitializedRef.current = true;
    RejectedProfilesManager.clearExpiredProfiles();

    // Reset pagination
    feedOffsetRef.current = 0;
    hasMoreProfilesRef.current = true; // Get initial batch of profiles - request enough to fill buffer plus some extra
    const availableIds = await fetchProfilesFeed(0, BUFFER_SIZE + 2);

    if (availableIds.length === 0) {
      setIsSwipeFinished(true);
      setProfileIdQueue([]);
      setCurrentIndex(0);
    } else {
      const initialProfiles = availableIds.slice(0, Math.min(BUFFER_SIZE, availableIds.length));
      setProfileIdQueue(initialProfiles);
      setIsSwipeFinished(false);
    }
  }, [auth.user, fetchProfilesFeed]);
  useEffect(() => {
    if (auth.user && !isInitializedRef.current) {
      const initialize = async () => {
        setIsLoading(true);
        setError(null);
        try {
          await initializeAvailableProfiles();
        } catch {
          setError("Error loading profiles");
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
      if (!hasMoreProfilesRef.current) {
        if (currentBufferSize === 0) {
          setIsSwipeFinished(true);
        }
        setIsRefilling(false);
        return;
      }

      try {
        // Request more profiles to ensure we get enough after filtering
        // Be more aggressive - request at least 2x what we need due to heavy filtering
        const minProfilesNeeded = Math.max(5, (BUFFER_SIZE - currentBufferSize + 1) * 2);

        const newProfiles = await fetchProfilesFeed(feedOffsetRef.current, minProfilesNeeded);

        if (newProfiles.length === 0) {
          // If fetchProfilesFeed returns 0 profiles, it means it couldn't find any more
          // and it would have set hasMoreProfilesRef.current = false internally
          if (currentBufferSize === 0) {
            setIsSwipeFinished(true);
          }
        } else {
          setProfileIdQueue((prevQueue) => [...prevQueue, ...newProfiles]);

          // Preload profile data
          for (const profileId of newProfiles) {
            await queries.profiles.get(profileId).catch(() => {
              // Ignore preload errors
            });
          }
        }
      } catch (error) {
        console.error("Error refilling profiles:", error);
        setError("Error loading profiles");
      } finally {
        setIsRefilling(false);
      }
    };

    doRefill().catch(() => {
      setError("Error loading profiles");
      setIsRefilling(false);
    });
  }, [
    currentIndex,
    profileIdQueue.length,
    isLoading,
    isRefilling,
    isSwipeFinished,
    dailyLimitReached,
    fetchProfilesFeed,
  ]);
  useEffect(() => {
    // Only reset when user actually changes (not on page reload)
    if (auth.user?.id) {
      isInitializedRef.current = false;
      processedProfileIdsRef.current.clear();
      followedProfileIdsRef.current.clear();
      feedOffsetRef.current = 0;
      hasMoreProfilesRef.current = true;
      setProfileIdQueue([]);
      setCurrentIndex(0);
      setIsSwipeFinished(false);
      setIsLoading(false);
      setIsRefilling(false);
    }
  }, [auth.user?.id]);
  const advanceToNextProfile = () => {
    const currentProfileId = profileIdQueue[currentIndex];
    if (currentProfileId) {
      processedProfileIdsRef.current.add(currentProfileId);
    }

    // Increment daily counter
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
      setError(`Failed to follow profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllCooldowns = () => {
    RejectedProfilesManager.clearAllRejectedProfiles();
    // Note: We don't reset DailySwipeManager.resetDailyCount() to prevent unlimited swipes
    processedProfileIdsRef.current.clear();
    followedProfileIdsRef.current.clear();
    isInitializedRef.current = false;
    feedOffsetRef.current = 0;
    hasMoreProfilesRef.current = true;
    setProfileIdQueue([]);
    setCurrentIndex(0);
    setIsSwipeFinished(false);
    // Don't reset daily limit: setDailyLimitReached(false);
    // Don't reset remaining swipes: setRemainingSwipes(MAX_SWIPES_PER_DAY);
    setIsLoading(true);
    setIsRefilling(false);

    setTimeout(() => {
      initializeAvailableProfiles()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setError("Error during initialization");
          setIsLoading(false);
        });
    }, 100);
  };

  // Development-only function to reset everything including daily limit
  const resetEverythingForDev = () => {
    RejectedProfilesManager.clearAllRejectedProfiles();
    DailySwipeManager.resetDailyCount();
    processedProfileIdsRef.current.clear();
    followedProfileIdsRef.current.clear();
    isInitializedRef.current = false;
    feedOffsetRef.current = 0;
    hasMoreProfilesRef.current = true;
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
          setError("Error during initialization");
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
            <h2 className="mb-4 text-2xl font-bold">Daily limit reached!</h2>
            <p className="mb-4 text-gray-600">You have used your {MAX_SWIPES_PER_DAY} daily swipes.</p>
            <p className="mb-6 text-gray-600">Come back tomorrow to discover new profiles!</p>
            <div className="flex flex-col gap-3">
              <Link to="/" className="btn btn-primary">
                Back to home
              </Link>
              <button onClick={resetAllCooldowns} disabled={isLoading} className="btn btn-warning">
                <HiOutlineLockOpen className="size-6" /> Reset filters & try again
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
            <div className="mb-4 text-6xl">🔍</div>
            <h2 className="mb-4 text-2xl font-bold">No more profiles available!</h2>
            <p className="mb-6 text-gray-600">
              You have reviewed all available profiles for now. Try again later as new profiles are added regularly!
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/" className="btn btn-primary">
                Back to home
              </Link>
              <button onClick={resetAllCooldowns} disabled={isLoading} className="btn btn-warning">
                <HiOutlineLockOpen className="size-6" /> Reset filters & try again
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
        <TopBar title="Discover profiles" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (error && profileIdQueue.length === 0 && !isLoading) {
    return (
      <div className="w-full">
        <TopBar title="Discover profiles" />
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
    // Add debug info for development
    const debugInfo = {
      queueLength: profileIdQueue.length,
      currentIndex,
      isRefilling,
      hasMoreProfiles: hasMoreProfilesRef.current,
      feedOffset: feedOffsetRef.current,
      isInitialized: isInitializedRef.current,
      profileQueue: profileIdQueue,
    };
    console.log("SwipePage: No current profile ID - showing 'Preparing profiles...'", debugInfo);

    return (
      <div className="w-full">
        <TopBar title="Discover profiles" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <p>Preparing profiles...</p>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 text-xs text-gray-500">
                Queue: {profileIdQueue.length.toString()}, Index: {currentIndex.toString()}, Refilling:{" "}
                {isRefilling ? "yes" : "no"}
                <br />
                Initialized: {isInitializedRef.current ? "yes" : "no"}, HasMore:{" "}
                {hasMoreProfilesRef.current ? "yes" : "no"}
              </div>
            )}
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
        <div className="btn btn-outline btn-info mb-4 w-full rounded-lg p-2.5 hover:cursor-auto">
          <p>
            {remainingSwipes > 0
              ? `🔥 ${remainingSwipes.toString()} swipes remaining today`
              : "❌ No more swipes available today"}
          </p>
        </div>

        {error && <p style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>Error: {error}</p>}

        {isRefilling && (
          <p style={{ marginBottom: "10px", color: "#666", fontSize: "0.9rem" }}>Loading more profiles...</p>
        )}

        <div className="relative flex h-[calc(100vh-280px)] flex-col">
          <div className="relative mb-5 flex-1">
            <div
              className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[10] flex items-center justify-center rounded-lg transition-opacity duration-300 ease-out"
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

          <div className="z-20 flex items-center justify-around py-4">
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

        <div hidden={import.meta.env.PROD} className="mt-5">
          <div className="flex gap-2">
            <button onClick={resetAllCooldowns} disabled={isLoading} className="btn btn-warning btn-sm">
              <HiOutlineLockOpen className="size-4" /> Reset filters
            </button>
            <button onClick={resetEverythingForDev} disabled={isLoading} className="btn btn-error btn-sm">
              🔓 DEV: Reset daily limit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
