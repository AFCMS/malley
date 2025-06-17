import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { Tables } from "../../contexts/supabase/database";
import { queries, PostSearchQuery, ProfileSearchQuery } from "../../contexts/supabase/supabase";
import TopBar from "../../layouts/TopBar/TopBar";
import SearchBuilder from "../../Components/SearchBuilder/SearchBuilder";

type SearchType = "posts" | "profiles";

interface SearchResults {
  posts: Tables<"posts">[];
  profiles: Tables<"profiles">[];
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    posts: [],
    profiles: [],
  });
  const [lastSearchType, setLastSearchType] = useState<SearchType | null>(null);
  // Parse URL parameters for initial search
  const urlType = searchParams.get("type") as SearchType | null;
  const urlQuery = searchParams.get("q") ?? "";
  const urlCategories = searchParams.get("categories") ?? "";

  useEffect(() => {
    // Auto-search if URL parameters are present
    if (urlType && (urlQuery || urlCategories.length != 0)) {
      const performAutoSearch = async () => {
        setIsLoading(true);
        setLastSearchType(urlType);

        const baseQuery = {
          paging_limit: 20,
          ...(urlCategories.length != 0 && {
            has_categories: (
              await Promise.all(
                urlCategories
                  .split(",")
                  .filter(Boolean)
                  .map((name) => queries.categories.getIdByName(name)),
              )
            ).filter((id): id is string => id !== null),
          }),
        };

        try {
          if (urlType === "posts") {
            const query: PostSearchQuery = {
              ...baseQuery,
              ...(urlQuery && { has_text: [urlQuery] }),
            };
            const results = await queries.feed.posts.get(query);
            setSearchResults((prev) => ({ ...prev, posts: results }));
          } else {
            const query: ProfileSearchQuery = {
              ...baseQuery,
              ...(urlQuery && { has_handle: [urlQuery] }),
            };
            const results = await searchProfiles(query);
            setSearchResults((prev) => ({ ...prev, profiles: results }));
          }
        } catch (error) {
          console.error("Auto-search error:", error);
        } finally {
          setIsLoading(false);
        }
      };

      performAutoSearch().catch(console.error);
    }
  }, [urlType, urlQuery, urlCategories]);

  const searchProfiles = async (query: ProfileSearchQuery): Promise<Tables<"profiles">[]> => {
    if (!query.has_handle) {
      return queries.feed.profiles.get(query);
    }

    // Search in both handle and bio, then merge results
    const handleQuery = { ...query };
    delete handleQuery.has_bio;
    const handleResults = await queries.feed.profiles.get(handleQuery);

    const bioQuery = { ...query };
    delete bioQuery.has_handle;
    bioQuery.has_bio = query.has_handle;
    const bioResults = await queries.feed.profiles.get(bioQuery);

    // Merge and deduplicate
    const allResults = [...handleResults];
    bioResults.forEach((profile) => {
      if (!allResults.find((r) => r.id === profile.id)) {
        allResults.push(profile);
      }
    });

    return allResults;
  };
  const handleSearch = async (type: SearchType, query: PostSearchQuery | ProfileSearchQuery) => {
    setIsLoading(true);
    setLastSearchType(type);

    // Update URL with search parameters
    const newParams = new URLSearchParams();
    newParams.set("type", type);

    if (type === "posts") {
      const postQuery = query as PostSearchQuery;
      if (postQuery.has_text?.[0]) {
        newParams.set("q", postQuery.has_text[0]);
      }
    } else {
      const profileQuery = query as ProfileSearchQuery;
      if (profileQuery.has_handle?.[0]) {
        newParams.set("q", profileQuery.has_handle[0]);
      }
    }

    if (query.has_categories?.length) {
      newParams.set("categories", query.has_categories.join(","));
    }

    setSearchParams(newParams);

    try {
      if (type === "posts") {
        const results = await queries.feed.posts.get(query as PostSearchQuery);
        setSearchResults((prev) => ({ ...prev, posts: results }));
      } else {
        const results = await searchProfiles(query as ProfileSearchQuery);
        setSearchResults((prev) => ({ ...prev, profiles: results }));
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSync = (type: SearchType, query: PostSearchQuery | ProfileSearchQuery) => {
    handleSearch(type, query).catch(console.error);
  };

  const renderPostResults = () => (
    <div className="space-y-4">
      {searchResults.posts.length === 0 ? (
        <p className="text-base-content/70">No posts found.</p>
      ) : (
        searchResults.posts.map((post) => (
          <div key={post.id} className="card border-base-300 border">
            <div className="card-body">
              <p className="text-base-content/70 text-sm">{new Date(post.created_at).toLocaleDateString()}</p>
              <p>{post.body}</p>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    void navigate(`/post/${post.id}`);
                  }}
                >
                  View Post
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderProfileResults = () => (
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
                    <img src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp" alt={profile.handle} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">@{profile.handle}</h3>
                  {profile.bio && <p className="text-base-content/70 text-sm">{profile.bio}</p>}
                </div>
              </div>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    void navigate(`/@${profile.handle}`);
                  }}
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="w-full">
      <TopBar title="Search" />
      <div className="flex flex-col gap-6 px-4">
        {" "}
        <SearchBuilder
          onSearch={handleSearchSync}
          isLoading={isLoading}
          initialType={urlType ?? "posts"}
          initialQuery={urlQuery}
          initialCategories={urlCategories
            .split(",")
            .filter(Boolean)
            .map((name) => ({
              id: "",
              name: name,
            }))}
        />
        {lastSearchType && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">
                {lastSearchType === "posts" ? "Posts" : "Profiles"} Results
                <div className="badge badge-secondary">
                  {lastSearchType === "posts" ? searchResults.posts.length : searchResults.profiles.length}
                </div>
              </h2>
              {lastSearchType === "posts" ? renderPostResults() : renderProfileResults()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
