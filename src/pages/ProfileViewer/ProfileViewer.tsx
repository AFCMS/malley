import { useEffect, useState } from "react";
import PostViewer from "../../Components/PostViewer/PostViewer";
import { queries } from "../..//contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import { useParams } from "react-router";

const ProfileViewer = () => {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [nonPinnedPosts, setNonPinnedPosts] = useState<Tables<"posts">[] | null>(null);
  const user_id: string = useParams().id ?? "";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await queries.profiles.get(user_id);
        setProfile(response);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    const fetchNonPinnedPosts = async () => {
      try {
        const response = await queries.authors.postsOf(user_id);
        setNonPinnedPosts(response);
      } catch (error) {
        console.error("Error fetching non pinned posts:", error);
      }
    };

    void fetchProfile();
    void fetchNonPinnedPosts();
  }, [user_id]);

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

      {profile.pinned_posts && profile.pinned_posts.length > 0 && (
        <div className="pinned-posts">
          <h2>Pinned Posts</h2>
          {profile.pinned_posts.map((postId) => (
            <PostViewer key={postId} postId={postId} />
          ))}
        </div>
      )}

      {nonPinnedPosts && nonPinnedPosts.length > 0 && (
        <div className="non-pinned-posts">
          <h2>Other posts</h2>
          {nonPinnedPosts.map((postId) => (
            <PostViewer key={postId} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileViewer;
