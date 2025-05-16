import { useEffect, useState } from "react";
import PostViewer from "../../Components/PostViewer/PostViewer";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import { useParams } from "react-router";

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

  return (
    <div className="profile-viewer">
      {profile.banner && <img src={profile.banner} alt="Profile Banner" className="profile-banner" />}

      {profile.profile_pic && (
        <img src={profile.profile_pic} alt={`${profile.handle}'s Profile Picture`} className="profile-picture" />
      )}

      <h1>{profile.handle}</h1>
      {profile.bio && <p>{profile.bio}</p>}
      <p>Joined on: {new Date(profile.created_at).toLocaleDateString()}</p>

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
