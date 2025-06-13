import { useSearchParams } from "react-router";
import { useState } from "react";
import { Tables } from "../../contexts/supabase/database";
import { queries } from "../../contexts/supabase/supabase";
import TopBar from "../../layouts/TopBar/TopBar";
import SearchBuilder from "../../Components/SearchBuilder/SearchBuilder";

interface PostSearchQuery {
  has_text?: string[];
  has_authors?: string[];
  has_categories?: string[];
  liked_by?: string[];
  from_date?: string;
  to_date?: string;
  sort_by?: "created_at" | "likes";
  sort_order?: "asc" | "desc";
  paging_limit?: number;
  paging_offset?: number;
}

interface ProfileSearchQuery {
  has_handle?: string[];
  has_bio?: string[];
  has_categories?: string[];
  featured_by?: string[];
  features_user?: string[];
  likes_posts?: string[];
  from_date?: string;
  to_date?: string;
  sort_by?: "created_at" | "features_count";
  sort_order?: "asc" | "desc";
  paging_limit?: number;
  paging_offset?: number;
}

type SearchType = "posts" | "profiles";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    posts: Tables<"posts">[];
    profiles: Tables<"profiles">[];
  }>({
    posts: [],
    profiles: [],
  });
  const [lastSearchType, setLastSearchType] = useState<SearchType | null>(null);

  const handleSearch = async (type: SearchType, query: PostSearchQuery | ProfileSearchQuery) => {
    setIsLoading(true);
    setLastSearchType(type);

    try {
      if (type === "posts") {
        const results = await queries.feed.posts.get(query as PostSearchQuery);
        setSearchResults((prev) => ({ ...prev, posts: results }));
      } else {
        const results = await queries.feed.profiles.get(query as ProfileSearchQuery);
        setSearchResults((prev) => ({ ...prev, profiles: results }));
      }
    } catch (error) {
      console.error("Search error:", error);
      // You might want to show a toast or error message here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <TopBar title="Search" />
      <div className="flex flex-col gap-6 px-4">
        <SearchBuilder onSearch={handleSearch} isLoading={isLoading} />

        {/* Results */}
        {lastSearchType && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">
                {lastSearchType === "posts" ? "Posts" : "Profiles"} Results
                <div className="badge badge-secondary">
                  {lastSearchType === "posts" ? searchResults.posts.length : searchResults.profiles.length}
                </div>
              </h2>

              {lastSearchType === "posts" ? (
                <div className="space-y-4">
                  {searchResults.posts.length === 0 ? (
                    <p className="text-base-content/70">No posts found.</p>
                  ) : (
                    searchResults.posts.map((post) => (
                      <div key={post.id} className="card border-base-300 border">
                        <div className="card-body">
                          <p className="text-base-content/70 text-sm">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                          <p>{post.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.profiles.length === 0 ? (
                    <p className="text-base-content/70">No profiles found.</p>
                  ) : (
                    searchResults.profiles.map((profile) => (
                      <div key={profile.id} className="card border-base-300 border">
                        <div className="card-body">
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="h-12 w-12 rounded-full">
                                <img
                                  src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                                  alt={profile.handle}
                                />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold">@{profile.handle}</h3>
                              {profile.bio && <p className="text-base-content/70 text-sm">{profile.bio}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
