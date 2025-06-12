import { useEffect, useState } from "react";
import { HiCalendar } from "react-icons/hi2";
import { queries, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import PostViewer from "../PostViewer/PostViewer";
import { formatDate } from "../../utils/date";

interface FetchCardProps {
  profileId: string;
}

interface ProfileData {
  profile: Tables<"profiles">;
  featuredByHandles: string[];
  pinnedPost: Tables<"posts"> | null;
  recentPosts: Tables<"posts">[];
  featuredCount: number;
  profileCategories: Tables<"categories">[];
}

export default function FetchCard({ profileId }: FetchCardProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true);
      try {
        const profile = await queries.profiles.get(profileId);
        const [pinnedPostResult, allPostsResult, featuredProfilesResult, featuredCountResult, categoriesResult] =
          await Promise.allSettled([
            profile.pinned_posts?.length
              ? queries.posts.get(profile.pinned_posts[0]).catch(() => null)
              : Promise.resolve(null),
            queries.authors.postsOf(profileId).catch(() => []),
            queries.features.byUser(profileId).catch(() => []),
            queries.features.byUserCount(profileId).catch(() => 0),
            queries.profilesCategories.get(profileId).catch(() => []),
          ]);
        const allPostsData = allPostsResult.status === "fulfilled" ? allPostsResult.value : [];
        const pinnedPostIds = profile.pinned_posts ?? [];
        const recentPosts = allPostsData
          .filter((post) => post.parent_post === null)
          .filter((post) => !pinnedPostIds.includes(post.id))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 2);

        setProfileData({
          profile,
          pinnedPost: pinnedPostResult.status === "fulfilled" ? pinnedPostResult.value : null,
          recentPosts,
          featuredByHandles:
            featuredProfilesResult.status === "fulfilled" ? featuredProfilesResult.value.map((p) => p.handle) : [],
          featuredCount: featuredCountResult.status === "fulfilled" ? featuredCountResult.value : 0,
          profileCategories: categoriesResult.status === "fulfilled" ? categoriesResult.value : [],
        });
      } catch {
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchAllData();
  }, [profileId]);

  const handlePostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const NonClickablePost = ({ post }: { post: Tables<"posts"> }) => (
    <div
      onClick={handlePostClick}
      onMouseDown={handlePostClick}
      onTouchStart={handleTouchStart}
      className="pointer-events-none relative select-none"
    >
      <div style={{ pointerEvents: "none" }}>
        <PostViewer post={post} disableRedirect={true} showChildren={false} showParents={false} />
      </div>
      <div
        className="absolute top-0 right-0 bottom-0 left-0 z-10 cursor-default"
        onClick={handlePostClick}
        onMouseDown={handlePostClick}
        onTouchStart={handleTouchStart}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
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

  const { profile, featuredByHandles, pinnedPost, recentPosts, featuredCount, profileCategories } = profileData;
  const profileCreationDate = new Date(profile.created_at);

  return (
    <div className="h-full w-full overflow-y-auto rounded-lg bg-white shadow-lg">
      <section className="relative mb-4">
        <div className="bg-base-200 relative h-24 w-full lg:h-32">
          <img src={utils.getBannerUrl(profile)} alt="Profile Banner" className="h-full w-full object-cover" />
          <div className="avatar absolute bottom-0 left-4 translate-y-1/2">
            <div className="border-base-100 w-16 rounded-full border-4 lg:w-20">
              <img src={utils.getAvatarUrl(profile)} alt={`${profile.handle}'s Profile Picture`} />
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

      {pinnedPost && (
        <div className="mb-4">
          <h3 className="mb-2 px-4 text-sm font-semibold text-gray-700">Publication épinglée</h3>
          <div className="border-t border-gray-200">
            <NonClickablePost key={`pinned-${pinnedPost.id}`} post={pinnedPost} />
          </div>
        </div>
      )}
      {recentPosts.length > 0 && (
        <div className="pb-4">
          <h3 className="mb-2 px-4 text-sm font-semibold text-gray-700">Publications récentes</h3>
          <div className="border-t border-gray-200">
            {recentPosts.map((post, index) => (
              <div key={`recent-post-${String(index)}`}>
                <NonClickablePost post={post} />
              </div>
            ))}
          </div>
        </div>
      )}
      {!pinnedPost && recentPosts.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">Aucune publication à afficher pour ce profil.</p>
        </div>
      )}
    </div>
  );
}
