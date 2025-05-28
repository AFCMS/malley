import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { HiCalendar } from "react-icons/hi2";

import PostViewer from "../../Components/PostViewer/PostViewer";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import { formatDate } from "../../utils/date";

const profileBannerPlaceholder =
  "https://pixabay.com/get/g5393d73223e3fcc3f0ca56021f86d63b8044cd1a7a97cc6ac89cf971aa06eaef36426adec83666062cbfb47346ef7967e76d61681cd5cf55b6bdbd0aa132682cfcf21eb25225e37c898126349c510aa3_1920.jpg";
const profilePicturePlaceholder = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

const ProfileViewer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [pinnedPosts, setPinnedPosts] = useState<Tables<"posts">[]>([]);
  const [allPosts, setAllPosts] = useState<Tables<"posts">[]>([]);

  const { handle: urlHandle } = useParams<{ handle?: string }>();

  // Remove @ symbol if present and ensure we have a string
  // React Router v7 can't do this for us
  // https://github.com/remix-run/react-router/discussions/9844
  const handle = urlHandle ? urlHandle.replace(/^@/, "") : "";

  useEffect(() => {
    // Reset state when handle changes
    setIsLoading(true);
    setError(null);
    setProfile(null);
    setPinnedPosts([]);
    setAllPosts([]);

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
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfileData();
  }, [handle]);

  if (isLoading) {
    return <div>Loading profile...</div>;
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
      <section className="mb-16">
        <div className="bg-base-200 relative h-32 w-full lg:h-48">
          <img
            src={profile.banner ?? profileBannerPlaceholder}
            alt="Profile Banner"
            className="h-full w-full object-cover"
          />

          <div className="avatar absolute bottom-0 left-4 translate-y-1/2">
            <div className="border-base-100 w-24 rounded-full border-4">
              <img
                src={profile.profile_pic ?? profilePicturePlaceholder}
                alt={`${profile.handle}'s Profile Picture`}
                className=""
              />
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 px-5">
          <h1 className="font-bold">@{profile.handle}</h1>

          {/* TODO: replace fallback */}
          {!profile.bio && <p className="text-base text-gray-600">{"French developper and gamer"}</p>}

          <div className="flex flex-row items-center gap-1 text-sm font-semibold text-gray-600">
            <HiCalendar className="h-4 w-4" />
            Joined on {formatDate(profileCreationDate)}
          </div>
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
        <div className="all-posts">
          <h2>Other posts</h2>
          {allPosts.map((post) => (
            <PostViewer key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileViewer;
