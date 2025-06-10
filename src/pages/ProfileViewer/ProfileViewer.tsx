import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { HiCalendar, HiMegaphone, HiOutlineEllipsisHorizontal } from "react-icons/hi2";

import TopBar from "../../layouts/TopBar/TopBar";
import PostViewer from "../../Components/PostViewer/PostViewer";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import { formatDate } from "../../utils/date";
import { closePopover } from "../../utils/popover";
import { useHandle } from "../../utils/routing";

const ProfileViewer = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [pinnedPosts, setPinnedPosts] = useState<Tables<"posts">[]>([]);
  const [allPosts, setAllPosts] = useState<Tables<"posts">[]>([]);
  const [featuredCount, setFeaturedCount] = useState<number>(0);
  const [profileCategories, setProfileCategories] = useState<Tables<"categories">[]>([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false);

  const handle = useHandle();

  useEffect(() => {
    // Reset state when handle changes
    setIsLoading(true);
    setError(null);
    setProfile(null);
    setPinnedPosts([]);
    setAllPosts([]);
    setProfileCategories([]);

    async function loadProfileData() {
      if (!handle) {
        setError("No profile handle specified");
        setIsLoading(false);
        return;
      }

      try {
        // Step 1: Fetch profile data
        const profileData = await queries.profiles.getByHandle(handle);
        setProfile(profileData);

        // Step 2: If profile has pinned posts, fetch them
        if (profileData.pinned_posts && profileData.pinned_posts.length > 0) {
          const pinnedPostPromises = profileData.pinned_posts.map((postId) =>
            queries.posts.get(postId).catch((err: unknown) => {
              console.error(`Failed to fetch pinned post ${postId}:`, err);
              return null;
            }),
          );

          const pinnedPostsData = await Promise.all(pinnedPostPromises);
          // Filter out any null results (failed fetches)
          setPinnedPosts(pinnedPostsData.filter(Boolean) as Tables<"posts">[]);
        }

        // Step 3: Fetch all author's posts only if we have a valid profile ID
        if (profileData.id) {
          try {
            const authorPosts = await queries.authors.postsOf(profileData.id);
            setAllPosts(authorPosts);
          } catch (postsError) {
            console.error("Failed to fetch author posts:", postsError);
            // Continue execution even if posts fetching fails
          }
        }

        // Step 4: Fetch referers count
        const featuredCount = await queries.features.byUserCount(profileData.id);
        setFeaturedCount(featuredCount);

        // Step 5: Fetch profile categories
        try {
          const categories = await queries.profilesCategories.get(profileData.id);
          setProfileCategories(categories);
        } catch (categoriesError) {
          console.error("Failed to fetch profile categories:", categoriesError);
          setProfileCategories([]);
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfileData();
  }, [handle]);

  useEffect(() => {
    async function checkFollowingStatus() {
      if (!profile || !auth.user) return;

      const isFollowing = await queries.follows.doesXFollowY(auth.user.id, profile.id);
      setIsFollowing(isFollowing);
    }

    void checkFollowingStatus();
  }, [profile, auth.user]);

  useEffect(() => {
    async function checkFeaturingStatus() {
      if (!profile || !auth.user) return;

      const isFeaturing = await queries.features.doesXfeatureY(auth.user.id, profile.id);
      setIsFeaturing(isFeaturing);
    }

    void checkFeaturingStatus();
  }, [profile, auth.user]);

  if (isLoading) {
    return <TopBar title="Loading profile..." />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  const profileCreationDate = new Date(profile.created_at);

  return (
    <div className="w-full">
      <TopBar title={profile.handle} />
      <section className="relative mb-16">
        <div className="bg-base-200 relative h-32 w-full lg:h-48">
          <img src={utils.getBannerUrl(profile)} alt="Profile Banner" className="h-full w-full object-cover" />

          <div className="avatar absolute bottom-0 left-4 translate-y-1/2">
            <div className="border-base-100 w-24 rounded-full border-4">
              <img src={utils.getAvatarUrl(profile)} alt={`${profile.handle}'s Profile Picture`} className="" />
            </div>
          </div>
        </div>

        <div className="absolute top-32 right-4 mt-3 lg:top-48">
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              popoverTarget="popover-profile"
              style={{ anchorName: "--popover-profile" } as React.CSSProperties}
            >
              <HiOutlineEllipsisHorizontal className="h-5 w-5" />
            </button>
            <ul
              className="dropdown dropdown-top dropdown-end menu rounded-box bg-base-100 mb-2 w-52 shadow-sm"
              popover="auto"
              id="popover-profile"
              style={{ positionAnchor: "--popover-profile" } as React.CSSProperties}
            >
              <li>
                <button
                  className=""
                  disabled={!auth.isAuthenticated || auth.user?.id === profile.id}
                  onClick={() => {
                    if (auth.isAuthenticated) {
                      if (isFeaturing) {
                        void queries.features.remove(profile.id);
                        setIsFeaturing(false);
                      } else {
                        void queries.features.add(profile.id);
                        setIsFeaturing(true);
                      }
                      closePopover("popover-profile")();
                    } else {
                      void navigate("/login");
                    }
                  }}
                >
                  <HiMegaphone />
                  {isFeaturing ? "Unfeature" : "Feature"}
                </button>
              </li>
              <li>
                <button
                  className=""
                  hidden={auth.user?.id !== profile.id}
                  onClick={() => {
                    void navigate("/profile/categories");
                    closePopover("popover-profile")();
                  }}
                >
                  Catégories
                </button>
              </li>
            </ul>
            <button
              className={"btn btn-sm " + (isFollowing ? "btn-secondary" : "btn-primary")}
              hidden={auth.user?.id === profile.id}
              onClick={() => {
                if (auth.isAuthenticated) {
                  if (isFollowing) {
                    void queries.follows.remove(profile.id);
                    setIsFollowing(false);
                  } else {
                    void queries.follows.add(profile.id);
                    setIsFollowing(true);
                  }
                } else {
                  void navigate("/login");
                }
              }}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 px-5">
          <h1 className="font-bold">@{profile.handle}</h1>
          {profile.bio && <p className="text-base text-gray-600">{profile.bio}</p>}
          <div
            className="flex flex-row items-center gap-1 text-sm font-semibold text-gray-600"
            title={profileCreationDate.toLocaleDateString()}
          >
            <HiCalendar className="h-4 w-4" />
            Joined on {formatDate(profileCreationDate)}
          </div>
          <div className="flex flex-row items-center gap-2">
            <Link className="text-sm font-semibold text-gray-600" to={`/@${profile.handle}/featured`}>
              <strong>{featuredCount}</strong> Featured
            </Link>
          </div>

          {/* Affichage des catégories du profil */}
          {profileCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {profileCategories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex cursor-pointer items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                >
                  #{category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {pinnedPosts.length > 0 && (
        <div className="pinned-posts">
          <h2>Pinned Posts</h2>
          {pinnedPosts.map((post) => (
            <PostViewer key={post.id} post={post} />
          ))}
        </div>
      )}

      {allPosts.length > 0 && (
        <div className="">
          {allPosts.map((post) => (
            <PostViewer key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileViewer;
