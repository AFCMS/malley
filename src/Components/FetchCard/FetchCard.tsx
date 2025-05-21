import { useEffect, useState } from "react";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import PostViewer from "../PostViewer/PostViewer";

export default function FetchCard(props: {
  profileId: string;
}) {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [featuredByHandles, setFeaturedByHandles] = useState<string[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Tables<"posts">[]>([]);
  const [AllPosts, setAllPosts] = useState<Tables<"posts">[]>([]);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const currentProfile = await queries.profiles.get(props.profileId);
        setProfile(currentProfile);

        if (currentProfile && currentProfile.pinned_posts && currentProfile.pinned_posts.length > 0) {
          const fetchedPinnedPosts = await Promise.all(
            currentProfile.pinned_posts.map(postId => queries.posts.get(postId))
          );
          setPinnedPosts(fetchedPinnedPosts.filter(post => post !== null) as Tables<"posts">[]);
        } else {
          setPinnedPosts([]);
        }
      } catch (error) {
        console.error("Error fetching profile or pinned posts:", error);
        setProfile(null);
        setPinnedPosts([]);
      }
    }
    fetchProfileData();

    async function fetchFeaturedUsers() { 
      try {
        const featuredProfiles = await queries.featuredUsers.byUser(props.profileId);
        if (featuredProfiles && featuredProfiles.length > 0) {
          const handles = featuredProfiles.map(p => p.handle); 
          setFeaturedByHandles(handles);
        } else {
          setFeaturedByHandles([]);
        }
      } catch (error) {
        console.error("Error fetching featured users:", error);
        setFeaturedByHandles([]);
      }
    }
    fetchFeaturedUsers();

    async function fetchAllUserPosts() {
      try {
        const allUserPosts = await queries.authors.postsOf(props.profileId);
        setAllPosts(allUserPosts);
        console.log(allUserPosts);
      } catch (error) {
        console.error("Error fetching all posts by user:", error);
        setAllPosts([]);
      }
    }
    fetchAllUserPosts();
  }
  , [props.profileId]);

  if (!profile) {
    return <div className="fetch-card">Chargement du profil...</div>;
  }

  return (
    <div className="fetch-card">
      <h2>Profil de {profile.handle}</h2>
      {profile.bio && <p>Bio: {profile.bio}</p>}
      {profile.profile_pic && <img src={profile.profile_pic} alt={`Photo de profil de ${profile.handle}`} style={{ maxWidth: '150px', borderRadius: '50%' }} />}
      {profile.banner && <img src={profile.banner} alt={`Bannière de ${profile.handle}`} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} />}

      {featuredByHandles.length > 0 && (
        <div>
          <h3>Met en avant :</h3> 
          <ul>
            {featuredByHandles.map((handle) => (
              <li key={handle}>{handle}</li>
            ))}
          </ul>
        </div>
      )}

      {pinnedPosts.length > 0 && (
        <div>
          <h3>Publications épinglées :</h3>
          {pinnedPosts.map((post) => (
            <PostViewer key={post.id} post={post} />
          ))}
        </div>
      )}

      {AllPosts.length > 0 && (
        <div>
          <h3>Toutes les publications :</h3>
          {AllPosts.map((post) => (
            <PostViewer key={post.id} post={post} />
          ))}
        </div>
      )}

      {AllPosts.length === 0 && pinnedPosts.length === 0 && (
        <p>Aucune publication à afficher pour ce profil.</p>
      )}
    </div>
  );
}