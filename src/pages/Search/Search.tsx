import { useSearchParams } from "react-router";
import { useState } from "react";
import TopBar from "../../layouts/TopBar/TopBar";
import SearchBuilder from "../../Components/SearchBuilder/SearchBuilder";
import { queries, PostSearchQuery, ProfileSearchQuery } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

type SearchType = "posts" | "profiles";

export default function Search() {
  const [, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Tables<"posts">[] | Tables<"profiles">[] | null>(null);
  const [searchType, setSearchType] = useState<SearchType>("posts");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: PostSearchQuery | ProfileSearchQuery, type: SearchType): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setSearchType(type);

    try {
      let searchResults;
      if (type === "posts") {
        searchResults = await queries.feed.posts.get(query as PostSearchQuery);
      } else {
        searchResults = await queries.feed.profiles.get(query as ProfileSearchQuery);
      }

      setResults(searchResults);

      // Update URL params to reflect the search
      const params = new URLSearchParams();
      params.set("type", type);
      if (Object.keys(query).length > 0) {
        params.set("query", JSON.stringify(query));
      }
      setSearchParams(params);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during search");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    if (results.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-base-content/60">No {searchType} found matching your criteria.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Found {results.length} {searchType}
        </h3>
        <div className="grid gap-4">
          {searchType === "posts"
            ? (results as Tables<"posts">[]).map((post) => (
                <div key={post.id} className="card bg-base-100 border shadow-sm">
                  <div className="card-body">
                    <p className="text-base-content/60 text-sm">{new Date(post.created_at).toLocaleDateString()}</p>
                    <p>{post.body}</p>
                    <div className="card-actions justify-end">
                      <button className="btn btn-sm btn-primary">View Post</button>
                    </div>
                  </div>
                </div>
              ))
            : (results as Tables<"profiles">[]).map((profile) => (
                <div key={profile.id} className="card bg-base-100 border shadow-sm">
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
                        <h4 className="font-semibold">@{profile.handle}</h4>
                        {profile.bio && <p className="text-base-content/60 text-sm">{profile.bio}</p>}
                      </div>
                    </div>
                    <div className="card-actions justify-end">
                      <button className="btn btn-sm btn-primary">View Profile</button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <TopBar title="Search" />
      <div className="flex flex-col space-y-6 px-4">
        <SearchBuilder onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {renderResults()}
      </div>
    </div>
  );
}
