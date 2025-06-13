import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  HiCalendar,
  HiOutlineEllipsisHorizontal,
  HiOutlineMegaphone,
  HiOutlineShare,
  HiOutlineTag,
} from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import TopBar from "../../layouts/TopBar/TopBar";
import PostViewer from "../../Components/PostViewer/PostViewer";
import Dropdown from "../../Components/Dropdown/Dropdown";

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
  const [mainPosts, setMainPosts] = useState<Tables<"posts">[]>([]);
  const [allPosts, setAllPosts] = useState<Tables<"posts">[]>([]);
  const [repliesCount, setRepliesCount] = useState<number>(0);
  const [featuredCount, setFeaturedCount] = useState<number>(0);
  const [profileCategories, setProfileCategories] = useState<Tables<"categories">[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "all">("main");
  const handle = useHandle();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setProfile(null);
    setPinnedPosts([]);
    setMainPosts([]);
    setAllPosts([]);
    setRepliesCount(0);
    setProfileCategories([]);

    async function loadProfileData() {
      if (!handle) {
        setError("No profile handle specified");
        setIsLoading(false);
        return;
      }
      try {
        const profileData = await queries.profiles.getByHandle(handle);
        setProfile(profileData); // Step 2: If profile has pinned posts, fetch them
        if (profileData.pinned_posts && profileData.pinned_posts.length > 0) {
          const pinnedPostPromises = profileData.pinned_posts.map((postId) =>
            queries.posts.get(postId).catch(() => null),
          );
          const pinnedPostsData = await Promise.all(pinnedPostPromises);
          const filteredPinnedPosts = pinnedPostsData.filter(Boolean) as Tables<"posts">[];
          // Tri par date directement ici
          const sortedPinnedPosts = filteredPinnedPosts.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          setPinnedPosts(sortedPinnedPosts);
        }
        if (profileData.id) {
          try {
            // Pour l'onglet "main" : récupère les posts normaux ET les retweets simples
            const authorPosts = await queries.authors.postsOf(profileData.id);
            const simpleRetweets = await queries.authors.simpleRetweetsOf(profileData.id);

            console.log(`[DEBUG ProfileViewer] Posts récupérés:`, {
              authorPosts: authorPosts.length,
              simpleRetweets: simpleRetweets.length,
              profileId: profileData.id,
            });

            const pinnedPostIds = profileData.pinned_posts ?? [];

            // Pour l'onglet "Posts" (main) : combine posts normaux et retweets simples
            const mainPostsCombined = [...authorPosts, ...simpleRetweets];
            const filteredMainPosts = mainPostsCombined.filter((post) => !pinnedPostIds.includes(post.id));

            // Pour l'onglet "All posts" : utilise seulement les posts normaux (avec conversations)
            const filteredAllPosts = authorPosts.filter((post) => !pinnedPostIds.includes(post.id));

            // Separate main posts (without parent) from main posts combined and sort by date
            const mainPostsData = filteredMainPosts
              .filter((post) => post.parent_post === null)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // For the "all" tab, keep all posts (including replies) and sort by date
            const allPostsData = filteredAllPosts.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );

            console.log(`[DEBUG ProfileViewer] Posts finaux:`, {
              mainPosts: mainPostsData.length,
              allPosts: allPostsData.length,
            });

            setMainPosts(mainPostsData);
            setAllPosts(allPostsData);
            setRepliesCount(allPostsData.filter((post) => post.parent_post !== null).length);
          } catch {
            // Continue execution even if posts fetching fails
          }
        }

        const featuredCount = await queries.features.byUserCount(profileData.id);
        setFeaturedCount(featuredCount);

        try {
          const categories = await queries.profilesCategories.get(profileData.id);
          setProfileCategories(categories);
        } catch {
          setProfileCategories([]);
        }
      } catch (err) {
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

  const handlePinUpdate = async () => {
    if (!profile) return;

    try {
      // Reload profile data to get updated pinned posts
      const updatedProfile = await queries.profiles.getByHandle(profile.handle);
      setProfile(updatedProfile);

      // Reload pinned posts
      if (updatedProfile.pinned_posts && updatedProfile.pinned_posts.length > 0) {
        const pinnedPostPromises = updatedProfile.pinned_posts.map((postId) =>
          queries.posts.get(postId).catch(() => null),
        );
        const pinnedPostsData = await Promise.all(pinnedPostPromises);
        const filteredPinnedPosts = pinnedPostsData.filter(Boolean) as Tables<"posts">[];
        // Tri par date directement ici
        const sortedPinnedPosts = filteredPinnedPosts.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setPinnedPosts(sortedPinnedPosts);
      } else {
        setPinnedPosts([]);
      } // Reload all posts using the new approach
      const authorPosts = await queries.authors.postsOf(updatedProfile.id);
      const simpleRetweets = await queries.authors.simpleRetweetsOf(updatedProfile.id);
      const pinnedPostIds = updatedProfile.pinned_posts ?? [];

      // For main tab: combine regular posts and simple retweets
      const mainPostsCombined = [...authorPosts, ...simpleRetweets];
      const filteredMainPosts = mainPostsCombined.filter((post) => !pinnedPostIds.includes(post.id));

      // For all tab: only regular posts (with conversations)
      const filteredAllPosts = authorPosts.filter((post) => !pinnedPostIds.includes(post.id));

      // Main posts: filter main posts only and sort by date
      const mainPostsData = filteredMainPosts
        .filter((post) => post.parent_post === null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // All posts: keep all posts (including replies) and sort by date
      const allPostsData = filteredAllPosts.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setMainPosts(mainPostsData);
      setAllPosts(allPostsData);
      setRepliesCount(allPostsData.filter((post) => post.parent_post !== null).length);
    } catch (error) {
      console.error("Error during update:", error);
    }
  };

  if (isLoading) return <TopBar title="Loading profile..." />;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>Profile not found</div>;

  const profileCreationDate = new Date(profile.created_at);

  return (
    <div className="w-full">
      <TopBar title={profile.handle} />
      <section className="relative mb-4">
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
            <Dropdown id="popover-profile" placement="bottom-end">
              {[
                {
                  title: isFeaturing ? "Unfeature" : "Feature",
                  icon: HiOutlineMegaphone,
                  onClick: () => {
                    if (auth.isAuthenticated) {
                      if (isFeaturing) {
                        void queries.features.remove(profile.id);
                        setIsFeaturing(false);
                      } else {
                        void queries.features.add(profile.id);
                        setIsFeaturing(true);
                      }
                      closePopover("popover-profile");
                    } else {
                      void navigate("/login");
                    }
                  },
                  disabled: !auth.isAuthenticated || auth.user?.id === profile.id,
                },
                {
                  title: "Categories",
                  icon: HiOutlineTag,
                  onClick: () => {
                    void navigate("/profile/categories");
                    closePopover("popover-profile");
                  },
                  disabled: auth.user?.id !== profile.id,
                },
                {
                  title: "Share",
                  icon: HiOutlineShare,
                  onClick: () => {
                    const shareUrl = `${window.location.origin}/@${profile.handle}`;
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (navigator.share) {
                      void navigator.share({
                        url: shareUrl,
                      });
                    } else {
                      void navigator.clipboard.writeText(shareUrl).then(() => {
                        alert("Profile link copied to clipboard!");
                      });
                    }
                    closePopover("popover-profile");
                  },
                },
              ]}
            </Dropdown>
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

      <div className="border-t border-gray-200"></div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "main" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("main");
            }}
          >
            Posts ({pinnedPosts.length + mainPosts.length})
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "all" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("all");
            }}
          >
            Replies ({repliesCount})
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "main" && (
        <div className="">
          {/* Pinned posts first */}
          {pinnedPosts.length > 0 && (
            <div className="pinned-posts mb-4">
              <div className="border-t border-gray-200">
                {pinnedPosts.map((post) => (
                  <PostViewer
                    key={post.id}
                    post={post}
                    isPinned={true}
                    showChildren={false}
                    onPinUpdate={() => {
                      void handlePinUpdate();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {/* Main posts */}
          {mainPosts.map((post) => (
            <PostViewer
              key={post.id}
              post={post}
              isPinned={false}
              showChildren={false}
              onPinUpdate={() => {
                void handlePinUpdate();
              }}
            />
          ))}
          {/* Message if no content */}
          {pinnedPosts.length === 0 && mainPosts.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">No main posts found</div>
          )}
        </div>
      )}

      {activeTab === "all" && (
        <div className="">
          {/* Replies only - no pinned posts in this tab */}
          {(() => {
            // Filter to only show posts that are replies (have a parent_post)
            const replyPosts = allPosts.filter((post) => post.parent_post !== null);

            return replyPosts.map((post) => (
              <PostViewer
                key={post.id}
                post={post}
                isPinned={false}
                showChildren={false}
                onPinUpdate={() => {
                  void handlePinUpdate();
                }}
              />
            ));
          })()}
          {/* Message if no content */}
          {allPosts.filter((post) => post.parent_post !== null).length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">No replies found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileViewer;
