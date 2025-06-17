import { useState } from "react";
import { Tables } from "../../contexts/supabase/database";
import { PostSearchQuery, ProfileSearchQuery } from "../../contexts/supabase/supabase";
import CategoriesChooser from "../CategoriesChooser/CategoriesChooser";
import { HiMagnifyingGlass } from "react-icons/hi2";

type SearchType = "posts" | "profiles";

interface SearchBuilderProps {
  onSearch: (type: SearchType, query: PostSearchQuery | ProfileSearchQuery) => void;
  isLoading?: boolean;
  initialType?: SearchType;
  initialQuery?: string;
  initialCategories?: Tables<"categories">[];
}

export default function SearchBuilder({
  onSearch,
  isLoading = false,
  initialType = "posts",
  initialQuery = "",
  initialCategories = [],
}: SearchBuilderProps) {
  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const [basicSearch, setBasicSearch] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<Tables<"categories">[]>(initialCategories);

  const handleSearch = () => {
    const baseQuery = {
      paging_limit: 20,
      ...(selectedCategories.length > 0 && {
        has_categories: selectedCategories.map((cat) => {
          return cat.name;
        }),
      }),
    };

    if (searchType === "posts") {
      const query: PostSearchQuery = {
        ...baseQuery,
        ...(basicSearch.trim() && { has_text: [basicSearch.trim()] }),
      };
      onSearch("posts", query);
    } else {
      const query: ProfileSearchQuery = {
        ...baseQuery,
        ...(basicSearch.trim() && { has_handle: [basicSearch.trim()] }),
      };
      onSearch("profiles", query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="card-title">
          <HiMagnifyingGlass className="h-5 w-5" />
          Search
        </div>

        {/* Search Type Toggle */}
        <div className="tabs tabs-boxed w-fit">
          {" "}
          <button
            type="button"
            className={`tab ${searchType === "posts" ? "tab-active" : ""}`}
            onClick={() => {
              setSearchType("posts");
            }}
          >
            Posts
          </button>
          <button
            type="button"
            className={`tab ${searchType === "profiles" ? "tab-active" : ""}`}
            onClick={() => {
              setSearchType("profiles");
            }}
          >
            Profiles
          </button>
        </div>

        {/* Basic Search */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">{searchType === "posts" ? "Search in posts" : "Search handles/bios"}</span>
          </label>
          <input
            type="text"
            placeholder={searchType === "posts" ? "Search post content..." : "Search usernames or bios..."}
            className="input input-bordered"
            value={basicSearch}
            onChange={(e) => {
              setBasicSearch(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Categories */}
        <CategoriesChooser selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

        {/* Search Button */}
        <div className="card-actions mt-4 justify-end">
          <button
            type="button"
            className={`btn btn-primary ${isLoading ? "loading" : ""}`}
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
}
