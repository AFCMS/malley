import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import PostViewer from "../../Components/PostViewer/PostViewer";
import TopBarRoot from "../../layouts/TopBarRoot/TopBarRoot";

export default function Home() {
  const [posts, setPosts] = useState<Tables<"posts">[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const auth = useAuth();
  const location = useLocation();
  const observerRef = useRef<HTMLDivElement>(null);
  const currentOffset = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const PAGE_SIZE = 10;

  // Keep refs in sync with state
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Load initial feed
  const loadInitialFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get initial posts
      const feedPosts = await queries.feed.posts.get({
        sort_by: "created_at",
        sort_order: "desc",
        paging_limit: PAGE_SIZE,
        paging_offset: 0,
      });

      // Filter out replies (parent_post !== null) - client-side filtering for now
      const mainPosts = feedPosts.filter((post) => post.parent_post === null);

      setPosts(mainPosts);
      currentOffset.current = feedPosts.length; // Use actual count of fetched posts
      setHasMore(feedPosts.length === PAGE_SIZE); // Check if we got full page from DB
    } catch (err) {
      console.error("Error loading feed:", err);
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    // Use refs to check current state values to avoid stale closures
    const currentLoadingMore = loadingMoreRef.current;
    const currentHasMore = hasMoreRef.current;
    
    console.log('[INFINITE SCROLL] loadMorePosts called:', {
      loadingMore: currentLoadingMore,
      hasMore: currentHasMore,
      currentOffset: currentOffset.current
    });
    
    if (currentLoadingMore || !currentHasMore) {
      console.log('[INFINITE SCROLL] Skipping load - loadingMore:', currentLoadingMore, 'hasMore:', currentHasMore);
      return;
    }

    try {
      setLoadingMore(true);
      console.log('[INFINITE SCROLL] Fetching posts with offset:', currentOffset.current);

      // Get more posts with the current offset
      const morePosts = await queries.feed.posts.get({
        sort_by: "created_at",
        sort_order: "desc",
        paging_limit: PAGE_SIZE,
        paging_offset: currentOffset.current,
      });

      console.log('[INFINITE SCROLL] Received posts:', {
        totalPosts: morePosts.length,
        postIds: morePosts.map(p => p.id)
      });

      // Filter out replies
      const newMainPosts = morePosts.filter((post) => post.parent_post === null);
      
      console.log('[INFINITE SCROLL] After filtering:', {
        mainPosts: newMainPosts.length,
        mainPostIds: newMainPosts.map(p => p.id)
      });

      if (newMainPosts.length > 0) {
        setPosts((prev) => {
          const newPosts = [...prev, ...newMainPosts];
          console.log('[INFINITE SCROLL] Updated posts count:', newPosts.length);
          return newPosts;
        });
        // Only increment offset by the number of total posts fetched, not filtered posts
        currentOffset.current += morePosts.length;
        // Continue if we got a full page from the database
        setHasMore(morePosts.length === PAGE_SIZE);
        console.log('[INFINITE SCROLL] New offset:', currentOffset.current, 'hasMore:', morePosts.length === PAGE_SIZE);
      } else if (morePosts.length > 0 && morePosts.length === PAGE_SIZE) {
        // If we got posts but none were main posts (all were replies),
        // and we got a full page, try to get more posts
        currentOffset.current += morePosts.length;
        setHasMore(true);
        console.log('[INFINITE SCROLL] Page full of replies, continuing with offset:', currentOffset.current);
        // Recursively load more if we only got replies
        setTimeout(() => {
          void loadMorePosts();
        }, 100);
      } else {
        setHasMore(false);
        console.log('[INFINITE SCROLL] End of feed reached');
      }
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, []); // Empty dependency array to prevent recreation

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting;
        const currentHasMore = hasMoreRef.current;
        const currentLoadingMore = loadingMoreRef.current;
        
        console.log('[INFINITE SCROLL] Observer triggered:', {
          isIntersecting,
          hasMore: currentHasMore,
          loadingMore: currentLoadingMore,
          currentOffset: currentOffset.current,
          postsCount: posts.length
        });
        
        if (isIntersecting && currentHasMore && !currentLoadingMore) {
          console.log('[INFINITE SCROLL] Loading more posts...');
          void loadMorePosts();
        }
      },
      { threshold: 0.1 },
    );

    if (observerRef.current) {
      console.log('[INFINITE SCROLL] Observing element:', observerRef.current);
      observer.observe(observerRef.current);
    } else {
      console.log('[INFINITE SCROLL] No observer target found');
    }

    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts, posts.length]); // Remove hasMore and loadingMore from dependencies

  // Load initial feed when auth changes
  useEffect(() => {
    // Add a small delay to ensure auth is properly initialized
    const timer = setTimeout(() => {
      // Reset state when auth changes
      setPosts([]);
      currentOffset.current = 0;
      setHasMore(true);
      void loadInitialFeed();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [loadInitialFeed]);

  // Handle messages from navigation
  useEffect(() => {
    if (location.state && typeof location.state === "object" && "message" in location.state) {
      const state = location.state as { message: string; type: "success" | "error" | "info" };
      setShowMessage({
        message: state.message,
        type: state.type,
      });

      const timer = setTimeout(() => {
        setShowMessage(null);
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [location.state]);

  return (
    <div className="mb-10 flex w-full flex-col">
      <TopBarRoot title="Recent Posts" />
      {/* Message de notification */}
      {showMessage && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            showMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : showMessage.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{showMessage.message}</span>
            <button
              onClick={() => {
                setShowMessage(null);
              }}
              className="ml-4 text-sm underline opacity-75 hover:opacity-100"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Loading state for initial load */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button
            onClick={() => {
              void loadInitialFeed();
            }}
            className="btn btn-sm btn-outline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Posts feed */}
      {!loading && !error && (
        <>
          {posts.length === 0 && auth.isAuthenticated && (
            <div className="py-12 text-center">
              <div className="mb-4 text-gray-500">
                <p className="text-lg font-medium">Welcome to your feed!</p>
                <p className="text-sm">
                  Start by creating your first post or following some users with similar interests.
                </p>
              </div>
            </div>
          )}

          {posts.length === 0 && !auth.isAuthenticated && (
            <div className="py-12 text-center">
              <div className="mb-4 text-gray-500">
                <p className="text-lg font-medium">Welcome to Malley!</p>
                <p className="text-sm">Please log in to see your personalized feed, or browse public posts below.</p>
              </div>
            </div>
          )}

          {posts.length > 0 && (
            <>
              <div className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <PostViewer
                    key={post.id}
                    post={post}
                    showChildren={false}
                    showParents={false}
                    allowExpandChildren={false}
                  />
                ))}
              </div>
            </>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="loading loading-spinner loading-md text-primary"></div>
            </div>
          )}

          {/* Intersection observer target for infinite scroll */}
          <div ref={observerRef} className="h-4" />

          {/* End of feed message */}
          {!hasMore && posts.length > 0 && (
            <div className="py-8 text-center text-gray-500">
              <p>You&apos;ve reached the end of your feed!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
