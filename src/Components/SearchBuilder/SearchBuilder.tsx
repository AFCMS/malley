import { useState, useEffect } from "react";
import { Tables } from "../../contexts/supabase/database";
import { queries } from "../../contexts/supabase/supabase";
import CategoriesChooser from "../CategoriesChooser/CategoriesChooser";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { HiXMark } from "react-icons/hi2";

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

interface SearchBuilderProps {
  onSearch: (type: SearchType, query: PostSearchQuery | ProfileSearchQuery) => void;
  isLoading?: boolean;
}

export default function SearchBuilder({ onSearch, isLoading = false }: SearchBuilderProps) {
  const [searchType, setSearchType] = useState<SearchType>("posts");
  const [basicSearch, setBasicSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Tables<"categories">[]>([]);

  // Post-specific fields
  const [hasAuthors, setHasAuthors] = useState<string[]>([]);
  const [likedBy, setLikedBy] = useState<string[]>([]);

  // Profile-specific fields
  const [featuredBy, setFeaturedBy] = useState<string[]>([]);
  const [featuresUser, setFeaturesUser] = useState<string[]>([]);

  // Common advanced fields
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagingLimit, setPagingLimit] = useState(20);

  const handleSearch = () => {
    if (searchType === "posts") {
      const query: PostSearchQuery = {
        paging_limit: pagingLimit,
        sort_order: sortOrder,
      };

      // Basic search (text)
      if (basicSearch.trim()) {
        query.has_text = [basicSearch.trim()];
      }

      // Categories
      if (selectedCategories.length > 0) {
        query.has_categories = selectedCategories.map((cat) => cat.id);
      }

      // Advanced fields
      if (hasAuthors.length > 0) query.has_authors = hasAuthors;
      if (likedBy.length > 0) query.liked_by = likedBy;
      if (fromDate) query.from_date = fromDate;
      if (toDate) query.to_date = toDate;
      if (sortBy) query.sort_by = sortBy as "created_at" | "likes";

      onSearch("posts", query);
    } else {
      const query: ProfileSearchQuery = {
        paging_limit: pagingLimit,
        sort_order: sortOrder,
      };

      // Basic search (handle/bio)
      if (basicSearch.trim()) {
        query.has_handle = [basicSearch.trim()];
        query.has_bio = [basicSearch.trim()];
      }

      // Categories
      if (selectedCategories.length > 0) {
        query.has_categories = selectedCategories.map((cat) => cat.id);
      }

      // Advanced fields
      if (featuredBy.length > 0) query.featured_by = featuredBy;
      if (featuresUser.length > 0) query.features_user = featuresUser;
      if (likesPosts.length > 0) query.likes_posts = likesPosts;
      if (fromDate) query.from_date = fromDate;
      if (toDate) query.to_date = toDate;
      if (sortBy) query.sort_by = sortBy as "created_at" | "features_count";

      onSearch("profiles", query);
    }
  };

  const addToStringArray = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value.trim()) {
      setter((prev) => [...prev, value.trim()]);
    }
  };

  const removeFromStringArray = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const StringArrayInput = ({
    label,
    placeholder,
    values,
    setter,
  }: {
    label: string;
    placeholder: string;
    values: string[];
    setter: React.Dispatch<React.SetStateAction<string[]>>;
  }) => {
    const [inputValue, setInputValue] = useState("");

    return (
      <div className="form-control">
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <div key={index} className="badge badge-neutral gap-1">
              {value}
              <button
                type="button"
                className="btn btn-circle btn-ghost btn-xs"
                onClick={() => {
                  removeFromStringArray(index, setter);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="join">
          <input
            type="text"
            placeholder={placeholder}
            className="input input-bordered join-item flex-1"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToStringArray(inputValue, setter);
                setInputValue("");
              }
            }}
          />
          <button
            type="button"
            className="btn join-item"
            onClick={() => {
              addToStringArray(inputValue, setter);
              setInputValue("");
            }}
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  const UserArrayInput = ({
    label,
    placeholder,
    values,
    setter,
  }: {
    label: string;
    placeholder: string;
    values: string[];
    setter: React.Dispatch<React.SetStateAction<string[]>>;
  }) => {
    const [entry, setEntry] = useState("");
    const [matching, setMatching] = useState<Tables<"profiles">[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

    useEffect(() => {
      if (entry.trim() === "") {
        setMatching([]);
        return;
      }

      queries.profiles
        .getByHandleFuzzy(entry)
        .then((newMatching) => {
          setMatching(newMatching);
        })
        .catch((error: unknown) => {
          console.error(error);
        });
    }, [entry]);

    const handleSelectUser = (profile: Tables<"profiles">) => {
      if (!values.includes(profile.handle)) {
        setter((prev) => [...prev, profile.handle]);
      }
      setEntry("");
      setMatching([]);
    };

    const handleRemoveUser = (handle: string) => {
      setter((prev) => prev.filter((u) => u !== handle));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        setHighlightedIndex((prevIndex) =>
          prevIndex === null || prevIndex === matching.length - 1 ? 0 : prevIndex + 1,
        );
      } else if (e.key === "ArrowUp") {
        setHighlightedIndex((prevIndex) =>
          prevIndex === null || prevIndex === 0 ? matching.length - 1 : prevIndex - 1,
        );
      } else if (e.key === "Enter") {
        if (highlightedIndex !== null && matching[highlightedIndex]) {
          handleSelectUser(matching[highlightedIndex]);
        } else if (entry.trim() !== "") {
          setter((prev) => [...prev, entry.trim()]);
          setEntry("");
        }
        e.preventDefault();
      }
    };

    const handleAddEntryAsUser = () => {
      if (entry.trim() && !values.includes(entry.trim())) {
        setter((prev) => [...prev, entry.trim()]);
      }
      setEntry("");
    };

    return (
      <div className="form-control">
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((handle) => (
            <div
              key={handle}
              className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs uppercase select-none"
            >
              @{handle}
              <button
                className="size-[0.75rem] cursor-pointer"
                onClick={() => {
                  handleRemoveUser(handle);
                }}
                aria-label={`Remove ${handle}`}
              >
                <HiXMark className="size-[0.75rem]" />
              </button>
            </div>
          ))}
        </div>
        <div className="dropdown mb-2 w-full items-center">
          <div className="relative w-full">
            <input
              type="text"
              placeholder={placeholder}
              className="input w-full pr-10"
              value={entry}
              onChange={(e) => {
                setEntry(e.target.value);
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-circle absolute top-1/2 right-2 -translate-y-1/2 transform"
              onClick={handleAddEntryAsUser}
              disabled={entry.trim() === ""}
              aria-label="Add User"
            >
              +
            </button>
          </div>
        </div>

        {matching.length > 0 && (
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-10 max-h-48 w-52 overflow-y-auto p-2 shadow-sm"
          >
            {matching.map((profile, index) => (
              <li key={profile.id} className={highlightedIndex === index ? "bg-primary text-white" : ""}>
                <a
                  onClick={() => {
                    handleSelectUser(profile);
                  }}
                  className="cursor-pointer"
                >
                  @{profile.handle}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
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
          <a
            className={`tab ${searchType === "posts" ? "tab-active" : ""}`}
            onClick={() => {
              setSearchType("posts");
            }}
          >
            Posts
          </a>
          <a
            className={`tab ${searchType === "profiles" ? "tab-active" : ""}`}
            onClick={() => {
              setSearchType("profiles");
            }}
          >
            Profiles
          </a>
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
          />
        </div>

        {/* Categories */}
        <CategoriesChooser selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

        {/* Advanced Options */}
        <div className="collapse-arrow border-base-300 bg-base-200 collapse border">
          <input type="checkbox" className="peer" />
          <div className="collapse-title">Advanced Options</div>
          <div className="collapse-content space-y-4">
            {/* Post-specific advanced options */}
            {searchType === "posts" && (
              <>
                <UserArrayInput
                  label="Authors"
                  placeholder="Author username"
                  values={hasAuthors}
                  setter={setHasAuthors}
                />
                <UserArrayInput label="Liked by users" placeholder="Username" values={likedBy} setter={setLikedBy} />
              </>
            )}

            {/* Profile-specific advanced options */}
            {searchType === "profiles" && (
              <>
                <UserArrayInput
                  label="Featured by users"
                  placeholder="Username"
                  values={featuredBy}
                  setter={setFeaturedBy}
                />
                <UserArrayInput
                  label="Features user"
                  placeholder="Username"
                  values={featuresUser}
                  setter={setFeaturesUser}
                />
              </>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">From Date</legend>
                <input
                  type="date"
                  className="input"
                  value={toDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                  }}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">To Date</legend>
                <input
                  type="date"
                  className="input"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                  }}
                />
              </fieldset>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="card-actions mt-4 justify-end">
          <button
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
