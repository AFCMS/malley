import { useEffect, useState } from "react";
import PostViewer from "../../Components/PostViewer/PostViewer";
import { queries } from "../..//contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import { useParams } from "react-router";

const ProfileViewer = () => {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [pinnedPosts, setPinnedPosts] = useState<Tables<"posts">[] | null>(null);
  const [allPosts, setAllPosts] = useState<Tables<"posts">[] | null>(null);
  const user_id: string = useParams().id ?? "";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await queries.profiles.get(user_id);
        setProfile(response);
        await fetchPinnedPosts();
        await fetchAllPosts();
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    const fetchPinnedPosts = async () => {
      try {
        if (!profile?.pinned_posts) {
          return;
        }

        for (const id of profile.pinned_posts) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          setPinnedPosts(pinnedPosts!.concat(await queries.posts.get(id)));
        }
      } catch (error) {
        console.error("Error fetching pinned posts:", error);
      }
    };

    const fetchAllPosts = async () => {
      try {
        const response = await queries.authors.postsOf(user_id);
        setAllPosts(response);
      } catch (error) {
        console.error("Error fetching non pinned posts:", error);
      }
    };

    void fetchProfile();
  }, [user_id, pinnedPosts, profile?.pinned_posts]);

  if (!profile) {
    return <div>Loading profile...</div>;
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

      {pinnedPosts && pinnedPosts.length > 0 && (
        <div className="pinned-posts">
          <h2>Pinned Posts</h2>
          {pinnedPosts.map((post) => (
            <PostViewer key={post.id} post={post} />
          ))}
        </div>
      )}

      {allPosts && allPosts.length > 0 && (
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
