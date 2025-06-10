import { useEffect, useState } from "react";
import { HiCalendar } from "react-icons/hi2";

import { queries, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import PostViewer from "../PostViewer/PostViewer";
import { formatDate } from "../../utils/date";

export default function FetchCard(props: { profileId: string }) {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [featuredByHandles, setFeaturedByHandles] = useState<string[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Tables<"posts">[]>([]);
  const [allPosts, setAllPosts] = useState<Tables<"posts">[]>([]);
  const [featuredCount, setFeaturedCount] = useState<number>(0);
  const [profileCategories, setProfileCategories] = useState<Tables<"categories">[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true);
      try {
        // Fetch profile
        const currentProfile = await queries.profiles.get(props.profileId);
        setProfile(currentProfile);

        // Fetch pinned posts
        if (currentProfile.pinned_posts && currentProfile.pinned_posts.length > 0) {
          const fetchedPinnedPosts = await Promise.all(
            currentProfile.pinned_posts.map((postId) => queries.posts.get(postId).catch(() => null)),
          );
          setPinnedPosts(fetchedPinnedPosts.filter(Boolean) as Tables<"posts">[]);
        } else {
          setPinnedPosts([]);
        }

        // Fetch all posts
        try {
          const allUserPosts = await queries.authors.postsOf(props.profileId);
          setAllPosts(allUserPosts);
        } catch (error) {
          console.error("Error fetching all posts by user:", error);
          setAllPosts([]);
        }

        // Fetch featured users
        try {
          const featuredProfiles = await queries.features.byUser(props.profileId);
          const handles = featuredProfiles.map((p) => p.handle);
          setFeaturedByHandles(handles);
        } catch (error) {
          console.error("Error fetching featured users:", error);
          setFeaturedByHandles([]);
        }

        // Fetch featured count
        try {
          const count = await queries.features.byUserCount(props.profileId);
          setFeaturedCount(count);
        } catch (error) {
          console.error("Error fetching featured count:", error);
          setFeaturedCount(0);
        }

        // Fetch profile categories
        try {
          const categories = await queries.profilesCategories.get(props.profileId);
          setProfileCategories(categories);
        } catch (error) {
          console.error("Error fetching profile categories:", error);
          setProfileCategories([]);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchAllData();
  }, [props.profileId]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="alert alert-error">
            <span>Erreur lors du chargement du profil</span>
          </div>
        </div>
      </div>
    );
  }

  const profileCreationDate = new Date(profile.created_at);

  return (
    <div className="h-full w-full overflow-y-auto rounded-lg bg-white shadow-lg">
      {/* ✅ CORRECTION : Ajout de h-full pour prendre toute la hauteur */}

      {/* Section profil - même style que ProfileViewer */}
      <section className="relative mb-4">
        <div className="bg-base-200 relative h-24 w-full lg:h-32">
          <img src={utils.getBannerUrl(profile)} alt="Profile Banner" className="h-full w-full object-cover" />

          <div className="avatar absolute bottom-0 left-4 translate-y-1/2">
            <div className="border-base-100 w-16 rounded-full border-4 lg:w-20">
              <img src={utils.getAvatarUrl(profile)} alt={`${profile.handle}'s Profile Picture`} className="" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 px-4">
          <h1 className="text-lg font-bold">@{profile.handle}</h1>
          {profile.bio && <p className="text-sm text-gray-600">{profile.bio}</p>}

          <div
            className="flex flex-row items-center gap-1 text-xs font-semibold text-gray-600"
            title={profileCreationDate.toLocaleDateString()}
          >
            <HiCalendar className="h-3 w-3" />
            Joined on {formatDate(profileCreationDate)}
          </div>

          <div className="flex flex-row items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">
              <strong>{featuredCount}</strong> Featured
            </span>
          </div>

          {/* Affichage des catégories du profil */}
          {profileCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profileCategories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                >
                  #{category.name}
                </span>
              ))}
            </div>
          )}

          {/* Featured users */}
          {featuredByHandles.length > 0 && (
            <div className="mt-2">
              <h4 className="mb-1 text-sm font-semibold text-gray-700">Met en avant :</h4>
              <div className="flex flex-wrap gap-1">
                {featuredByHandles.slice(0, 5).map((handle) => (
                  <span
                    key={handle}
                    className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                  >
                    @{handle}
                  </span>
                ))}
                {featuredByHandles.length > 5 && (
                  <span className="text-xs text-gray-500">+{featuredByHandles.length - 5} autres</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Posts épinglés */}
      {pinnedPosts.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 px-4 text-sm font-semibold text-gray-700">Publications épinglées</h3>
          <div className="border-t border-gray-200">
            {pinnedPosts.slice(0, 2).map((post) => (
              <PostViewer key={post.id} post={post} disableRedirect={true} showChildren={false} showParents={false} />
            ))}
          </div>
        </div>
      )}

      {/* Posts récents */}
      {allPosts.length > 0 && (
        <div className="pb-4">
          {" "}
          {/* ✅ CORRECTION : Padding bottom pour éviter que le contenu soit caché */}
          <h3 className="mb-2 px-4 text-sm font-semibold text-gray-700">Publications récentes</h3>
          <div className="border-t border-gray-200">
            {allPosts.slice(0, 3).map((post) => (
              <PostViewer key={post.id} post={post} disableRedirect={true} showChildren={false} showParents={false} />
            ))}
            {allPosts.length > 3 && (
              <div className="px-4 py-2 text-center">
                <span className="text-xs text-gray-500">+{allPosts.length - 3} autres publications</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si aucune publication */}
      {allPosts.length === 0 && pinnedPosts.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">Aucune publication à afficher pour ce profil.</p>
        </div>
      )}
    </div>
  );
}
