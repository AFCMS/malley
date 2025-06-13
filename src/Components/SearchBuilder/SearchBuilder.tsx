/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { useEffect, useState } from "react";
import { queries, PostSearchQuery, ProfileSearchQuery } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import { HiXMark, HiMagnifyingGlass } from "react-icons/hi2";

type SearchType = "posts" | "profiles";

interface SearchBuilderProps {
  onSearch: (query: PostSearchQuery | ProfileSearchQuery, type: SearchType) => Promise<void>;
  isLoading?: boolean;
}

export default function SearchBuilder({ onSearch, isLoading = false }: SearchBuilderProps) {
  const [searchType, setSearchType] = useState<SearchType>("posts");

  // Text inputs
  const [textTerms, setTextTerms] = useState<string[]>([]);
  const [handleTerms, setHandleTerms] = useState<string[]>([]);
  const [bioTerms, setBioTerms] = useState<string[]>([]);

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<Tables<"categories">[]>([]);
  const [categoryEntry, setCategoryEntry] = useState("");
  const [matchingCategories, setMatchingCategories] = useState<Tables<"categories">[]>([]);

  // Authors/Users
  const [selectedAuthors, setSelectedAuthors] = useState<Tables<"profiles">[]>([]);
  const [authorEntry, setAuthorEntry] = useState("");
  const [matchingProfiles, setMatchingProfiles] = useState<Tables<"profiles">[]>([]);
  const [highlightedAuthorIndex, setHighlightedAuthorIndex] = useState<number | null>(null);

  // Features Users (for profiles)
  const [selectedFeaturesUsers, setSelectedFeaturesUsers] = useState<Tables<"profiles">[]>([]);
  const [featuresUserEntry, setFeaturesUserEntry] = useState("");
  const [matchingFeaturesProfiles, setMatchingFeaturesProfiles] = useState<Tables<"profiles">[]>([]);
  const [highlightedFeaturesIndex, setHighlightedFeaturesIndex] = useState<number | null>(null);

  // Date range
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination (hidden from user)
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Current input for arrays
  const [currentTextInput, setCurrentTextInput] = useState("");
  const [currentHandleInput, setCurrentHandleInput] = useState("");
  const [currentBioInput, setCurrentBioInput] = useState("");

  // Category matching effect
  useEffect(() => {
    if (categoryEntry.trim() === "") {
      setMatchingCategories([]);
      return;
    }

    queries.categories
      .match(categoryEntry)
      .then((newMatching) => {
        setMatchingCategories(newMatching);
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [categoryEntry]);

  // Profile matching effect for authors
  useEffect(() => {
    if (authorEntry.trim() === "") {
      setMatchingProfiles([]);
      return;
    }

    queries.profiles
      .getAll()
      .then((profiles) => {
        const filtered = profiles.filter((profile) => profile.handle.toLowerCase().includes(authorEntry.toLowerCase()));
        setMatchingProfiles(filtered.slice(0, 10));
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [authorEntry]);

  // Profile matching effect for features users
  useEffect(() => {
    if (featuresUserEntry.trim() === "") {
      setMatchingFeaturesProfiles([]);
      return;
    }

    queries.profiles
      .getAll()
      .then((profiles) => {
        const filtered = profiles.filter((profile) =>
          profile.handle.toLowerCase().includes(featuresUserEntry.toLowerCase()),
        );
        setMatchingFeaturesProfiles(filtered.slice(0, 10));
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [featuresUserEntry]);

  const addTextTerm = () => {
    if (currentTextInput.trim() && !textTerms.includes(currentTextInput.trim())) {
      setTextTerms([...textTerms, currentTextInput.trim()]);
      setCurrentTextInput("");
    }
  };

  const addHandleTerm = () => {
    if (currentHandleInput.trim() && !handleTerms.includes(currentHandleInput.trim())) {
      setHandleTerms([...handleTerms, currentHandleInput.trim()]);
      setCurrentHandleInput("");
    }
  };

  const addBioTerm = () => {
    if (currentBioInput.trim() && !bioTerms.includes(currentBioInput.trim())) {
      setBioTerms([...bioTerms, currentBioInput.trim()]);
      setCurrentBioInput("");
    }
  };

  const removeTextTerm = (term: string) => {
    setTextTerms(textTerms.filter((t) => t !== term));
  };

  const removeHandleTerm = (term: string) => {
    setHandleTerms(handleTerms.filter((t) => t !== term));
  };

  const removeBioTerm = (term: string) => {
    setBioTerms(bioTerms.filter((t) => t !== term));
  };

  const handleSelectCategory = (category: Tables<"categories">) => {
    if (!selectedCategories.find((c) => c.id === category.id)) {
      setSelectedCategories([...selectedCategories, category].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setCategoryEntry("");
    setMatchingCategories([]);
  };

  const handleRemoveCategory = (id: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c.id !== id));
  };

  const handleSelectAuthor = (profile: Tables<"profiles">) => {
    if (!selectedAuthors.find((p) => p.id === profile.id)) {
      setSelectedAuthors([...selectedAuthors, profile].sort((a, b) => a.handle.localeCompare(b.handle)));
    }
    setAuthorEntry("");
    setMatchingProfiles([]);
    setHighlightedAuthorIndex(null);
  };

  const handleRemoveAuthor = (id: string) => {
    setSelectedAuthors(selectedAuthors.filter((p) => p.id !== id));
  };

  const handleSelectFeaturesUser = (profile: Tables<"profiles">) => {
    if (!selectedFeaturesUsers.find((p) => p.id === profile.id)) {
      setSelectedFeaturesUsers([...selectedFeaturesUsers, profile].sort((a, b) => a.handle.localeCompare(b.handle)));
    }
    setFeaturesUserEntry("");
    setMatchingFeaturesProfiles([]);
    setHighlightedFeaturesIndex(null);
  };

  const handleRemoveFeaturesUser = (id: string) => {
    setSelectedFeaturesUsers(selectedFeaturesUsers.filter((p) => p.id !== id));
  };

  // Keyboard navigation for authors
  const handleAuthorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setHighlightedAuthorIndex((prevIndex) =>
        prevIndex === null || prevIndex === matchingProfiles.length - 1 ? 0 : prevIndex + 1,
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedAuthorIndex((prevIndex) =>
        prevIndex === null || prevIndex === 0 ? matchingProfiles.length - 1 : prevIndex - 1,
      );
    } else if (e.key === "Enter") {
      if (highlightedAuthorIndex !== null && matchingProfiles[highlightedAuthorIndex]) {
        handleSelectAuthor(matchingProfiles[highlightedAuthorIndex]);
      }
      e.preventDefault();
    }
  };

  // Keyboard navigation for features users
  const handleFeaturesUserKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setHighlightedFeaturesIndex((prevIndex) =>
        prevIndex === null || prevIndex === matchingFeaturesProfiles.length - 1 ? 0 : prevIndex + 1,
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedFeaturesIndex((prevIndex) =>
        prevIndex === null || prevIndex === 0 ? matchingFeaturesProfiles.length - 1 : prevIndex - 1,
      );
    } else if (e.key === "Enter") {
      if (highlightedFeaturesIndex !== null && matchingFeaturesProfiles[highlightedFeaturesIndex]) {
        handleSelectFeaturesUser(matchingFeaturesProfiles[highlightedFeaturesIndex]);
      }
      e.preventDefault();
    }
  };

  const buildQuery = (): PostSearchQuery | ProfileSearchQuery => {
    const baseQuery = {
      has_categories: selectedCategories.length > 0 ? selectedCategories.map((c) => c.id) : undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      sort_order: sortOrder,
      paging_limit: limit,
      paging_offset: offset,
    };

    if (searchType === "posts") {
      return {
        ...baseQuery,
        has_text: textTerms.length > 0 ? textTerms : undefined,
        has_authors: selectedAuthors.length > 0 ? selectedAuthors.map((a) => a.id) : undefined,
        sort_by: sortBy ? (sortBy as "created_at" | "likes") : undefined,
      } as PostSearchQuery;
    } else {
      return {
        ...baseQuery,
        has_handle: handleTerms.length > 0 ? handleTerms : undefined,
        has_bio: bioTerms.length > 0 ? bioTerms : undefined,
        featured_by: selectedAuthors.length > 0 ? selectedAuthors.map((a) => a.id) : undefined,
        features_user: selectedFeaturesUsers.length > 0 ? selectedFeaturesUsers.map((a) => a.id) : undefined,
        sort_by: sortBy ? (sortBy as "created_at" | "features_count") : undefined,
      } as ProfileSearchQuery;
    }
  };

  const handleSearch = () => {
    const query = buildQuery();
    void onSearch(query, searchType);
  };

  const resetForm = () => {
    setTextTerms([]);
    setHandleTerms([]);
    setBioTerms([]);
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setSelectedFeaturesUsers([]);
    setFromDate("");
    setToDate("");
    setSortBy("");
    setSortOrder("desc");
    setLimit(20);
    setOffset(0);
    setCurrentTextInput("");
    setCurrentHandleInput("");
    setCurrentBioInput("");
    setCategoryEntry("");
    setAuthorEntry("");
    setFeaturesUserEntry("");
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Type Selector */}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Search Type</legend>
        <div className="flex gap-2">
          <label className="label cursor-pointer">
            <input
              type="radio"
              name="searchType"
              className="radio"
              checked={searchType === "posts"}
              onChange={() => {
                setSearchType("posts");
              }}
            />
            <span className="label-text ml-2">Posts</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              name="searchType"
              className="radio"
              checked={searchType === "profiles"}
              onChange={() => {
                setSearchType("profiles");
              }}
            />
            <span className="label-text ml-2">Profiles</span>
          </label>
        </div>
      </fieldset>

      {/* Text Search Fields */}
      {searchType === "posts" && (
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Text Content</legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {textTerms.map((term) => (
              <div key={term} className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs">
                {term}
                <button
                  className="size-[0.75rem] cursor-pointer"
                  onClick={() => {
                    removeTextTerm(term);
                  }}
                  aria-label={`Remove ${term}`}
                >
                  <HiXMark className="size-[0.75rem]" />
                </button>
              </div>
            ))}
          </div>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search in post content"
              className="input w-full pr-10"
              value={currentTextInput}
              onChange={(e) => {
                setCurrentTextInput(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTextTerm())}
            />
            <button
              className="btn btn-circle absolute top-1/2 right-2 -translate-y-1/2 transform"
              onClick={addTextTerm}
              disabled={!currentTextInput.trim()}
              aria-label="Add Text Term"
            >
              +
            </button>
          </div>
        </fieldset>
      )}

      {searchType === "profiles" && (
        <>
          {/* Handle Search */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Handle</legend>
            <div className="mb-2 flex flex-wrap gap-2">
              {handleTerms.map((term) => (
                <div key={term} className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs">
                  @{term}
                  <button
                    className="size-[0.75rem] cursor-pointer"
                    onClick={() => {
                      removeHandleTerm(term);
                    }}
                    aria-label={`Remove ${term}`}
                  >
                    <HiXMark className="size-[0.75rem]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by handle"
                className="input w-full pr-10"
                value={currentHandleInput}
                onChange={(e) => {
                  setCurrentHandleInput(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHandleTerm())}
              />
              <button
                className="btn btn-circle absolute top-1/2 right-2 -translate-y-1/2 transform"
                onClick={addHandleTerm}
                disabled={!currentHandleInput.trim()}
                aria-label="Add Handle Term"
              >
                +
              </button>
            </div>
          </fieldset>

          {/* Bio Search */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Bio Content</legend>
            <div className="mb-2 flex flex-wrap gap-2">
              {bioTerms.map((term) => (
                <div key={term} className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs">
                  {term}
                  <button
                    className="size-[0.75rem] cursor-pointer"
                    onClick={() => {
                      removeBioTerm(term);
                    }}
                    aria-label={`Remove ${term}`}
                  >
                    <HiXMark className="size-[0.75rem]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search in bio"
                className="input w-full pr-10"
                value={currentBioInput}
                onChange={(e) => {
                  setCurrentBioInput(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBioTerm())}
              />
              <button
                className="btn btn-circle absolute top-1/2 right-2 -translate-y-1/2 transform"
                onClick={addBioTerm}
                disabled={!currentBioInput.trim()}
                aria-label="Add Bio Term"
              >
                +
              </button>
            </div>
          </fieldset>
        </>
      )}

      {/* Categories */}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Categories</legend>
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <div
              key={category.id}
              className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs uppercase select-none"
            >
              {category.name}
              <button
                className="size-[0.75rem] cursor-pointer"
                onClick={() => {
                  handleRemoveCategory(category.id);
                }}
                aria-label={`Remove ${category.name}`}
              >
                <HiXMark className="size-[0.75rem]" />
              </button>
            </div>
          ))}
        </div>
        <div className="dropdown mb-2 w-full">
          <input
            type="text"
            placeholder="Add category"
            className="input w-full"
            value={categoryEntry}
            onChange={(e) => {
              setCategoryEntry(e.target.value);
            }}
          />
          {matchingCategories.length > 0 && (
            <ul className="dropdown-content menu bg-base-100 rounded-box z-10 max-h-48 w-52 overflow-y-auto p-2 shadow-sm">
              {matchingCategories.map((category) => (
                <li key={category.id}>
                  <a
                    onClick={() => {
                      handleSelectCategory(category);
                    }}
                    className="cursor-pointer"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>

      {/* Authors (for posts only) */}
      {searchType === "posts" && (
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Authors</legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedAuthors.map((author) => (
              <div
                key={author.id}
                className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs select-none"
              >
                @{author.handle}
                <button
                  className="size-[0.75rem] cursor-pointer"
                  onClick={() => {
                    handleRemoveAuthor(author.id);
                  }}
                  aria-label={`Remove ${author.handle}`}
                >
                  <HiXMark className="size-[0.75rem]" />
                </button>
              </div>
            ))}
          </div>
          <div className="dropdown mb-2 w-full">
            <input
              type="text"
              placeholder="Add author"
              className="input w-full"
              value={authorEntry}
              onChange={(e) => {
                setAuthorEntry(e.target.value);
              }}
              onKeyDown={handleAuthorKeyDown}
            />
            {matchingProfiles.length > 0 && (
              <ul className="dropdown-content menu bg-base-100 rounded-box z-10 max-h-48 w-52 overflow-y-auto p-2 shadow-sm">
                {matchingProfiles.map((profile, index) => (
                  <li key={profile.id} className={highlightedAuthorIndex === index ? "bg-primary text-white" : ""}>
                    <a
                      onClick={() => {
                        handleSelectAuthor(profile);
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
        </fieldset>
      )}
      {/* Replace the two separate fieldsets with this single one */}
      {searchType === "profiles" && (
        <fieldset className="fieldset">
          <legend className="fieldset-legend">User Relationships</legend>
          <div className="grid grid-cols-2 gap-2">
            {/* Featured By */}
            <div>
              <label className="label">
                <span className="label-text">Featured By</span>
              </label>
              <div className="mb-2 flex flex-wrap gap-1">
                {selectedAuthors.map((author) => (
                  <div
                    key={author.id}
                    className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs select-none"
                  >
                    @{author.handle}
                    <button
                      className="size-[0.75rem] cursor-pointer"
                      onClick={() => {
                        handleRemoveAuthor(author.id);
                      }}
                      aria-label={`Remove ${author.handle}`}
                    >
                      <HiXMark className="size-[0.75rem]" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="dropdown w-full">
                <input
                  type="text"
                  placeholder="Add user who featured"
                  className="input w-full"
                  value={authorEntry}
                  onChange={(e) => {
                    setAuthorEntry(e.target.value);
                  }}
                  onKeyDown={handleAuthorKeyDown}
                />
                {matchingProfiles.length > 0 && (
                  <ul className="dropdown-content menu bg-base-100 rounded-box z-10 max-h-48 w-52 overflow-y-auto p-2 shadow-sm">
                    {matchingProfiles.map((profile, index) => (
                      <li key={profile.id} className={highlightedAuthorIndex === index ? "bg-primary text-white" : ""}>
                        <a
                          onClick={() => {
                            handleSelectAuthor(profile);
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
            </div>

            {/* Features User */}
            <div>
              <label className="label">
                <span className="label-text">Features User</span>
              </label>
              <div className="mb-2 flex flex-wrap gap-1">
                {selectedFeaturesUsers.map((user) => (
                  <div
                    key={user.id}
                    className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs select-none"
                  >
                    @{user.handle}
                    <button
                      className="size-[0.75rem] cursor-pointer"
                      onClick={() => {
                        handleRemoveFeaturesUser(user.id);
                      }}
                      aria-label={`Remove ${user.handle}`}
                    >
                      <HiXMark className="size-[0.75rem]" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="dropdown w-full">
                <input
                  type="text"
                  placeholder="Add user who features others"
                  className="input w-full"
                  value={featuresUserEntry}
                  onChange={(e) => {
                    setFeaturesUserEntry(e.target.value);
                  }}
                  onKeyDown={handleFeaturesUserKeyDown}
                />
                {matchingFeaturesProfiles.length > 0 && (
                  <ul className="dropdown-content menu bg-base-100 rounded-box z-10 max-h-48 w-52 overflow-y-auto p-2 shadow-sm">
                    {matchingFeaturesProfiles.map((profile, index) => (
                      <li
                        key={profile.id}
                        className={highlightedFeaturesIndex === index ? "bg-primary text-white" : ""}
                      >
                        <a
                          onClick={() => {
                            handleSelectFeaturesUser(profile);
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
            </div>
          </div>
        </fieldset>
      )}

      {/* Date Range */}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Date Range</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">
              <span className="label-text">From</span>
            </label>
            <input
              type="date"
              className="input w-full"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">To</span>
            </label>
            <input
              type="date"
              className="input w-full"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
              }}
            />
          </div>
        </div>
      </fieldset>

      {/* Sorting */}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Sorting</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">
              <span className="label-text">Sort by</span>
            </label>
            <select
              className="select w-full"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
              }}
            >
              <option value="">Default</option>
              <option value="created_at">Date Created</option>
              {searchType === "posts" ? (
                <option value="likes">Likes</option>
              ) : (
                <option value="features_count">Features Count</option>
              )}
            </select>
          </div>
          <div>
            <label className="label">
              <span className="label-text">Order</span>
            </label>
            <select
              className="select w-full"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "asc" | "desc");
              }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          className={`btn btn-primary flex-1 ${isLoading ? "loading" : ""}`}
          onClick={handleSearch}
          disabled={isLoading}
        >
          <HiMagnifyingGlass className="size-4" />
          Search {searchType}
        </button>
        <button className="btn btn-ghost" onClick={resetForm} disabled={isLoading}>
          Reset
        </button>
      </div>
    </div>
  );
}
