import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineUserMinus,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { Tables } from "../../contexts/supabase/database";
import { queries, utils } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

interface AuthorAskProps {
  post: Tables<"posts">;
}

export default function AuthorAsk({ post }: AuthorAskProps) {
  const auth = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Tables<"profiles">[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Tables<"profiles">[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [alreadyInvitedProfiles, setAlreadyInvitedProfiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [parentPostAuthor, setParentPostAuthor] = useState<Tables<"profiles"> | null>(null);
  const [loadingParentAuthor, setLoadingParentAuthor] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isLastAuthor, setIsLastAuthor] = useState(false);
  const [authors, setAuthors] = useState<Tables<"profiles">[]>([]); // Function to load already invited profiles for this post
  const loadAlreadyInvitedProfiles = useCallback(async (): Promise<Set<string>> => {
    if (!auth.user) return new Set();

    try {
      const sentRequests = await queries.pendingAuthors.sent();
      const invitedForThisPost = sentRequests
        .filter((request) => request.post === post.id)
        .map((request) => request.to_profile);

      return new Set(invitedForThisPost);
    } catch (error) {
      console.error("Error loading already invited profiles:", error);
      return new Set();
    }
  }, [auth.user, post.id]); // Function to load suggested profiles (featured profiles)
  const loadSuggestedProfiles = useCallback(async (): Promise<Tables<"profiles">[]> => {
    if (!auth.user) return [];

    try {
      // Get featured profiles by the connected user
      const featuredProfiles = await queries.features.byUser(auth.user.id);
      const alreadyInvited = await loadAlreadyInvitedProfiles();

      // Filter already invited profiles and the user themselves
      const filteredProfiles = featuredProfiles.filter((profile) => {
        return profile.id !== auth.user?.id && !alreadyInvited.has(profile.id);
      });

      return filteredProfiles;
    } catch (error) {
      console.error("Error loading featured profiles:", error);
      return [];
    }
  }, [auth.user, loadAlreadyInvitedProfiles]); // Function to perform search using getByHandleFuzzy
  const performSearch = useCallback(
    async (query: string): Promise<Tables<"profiles">[]> => {
      if (!auth.user || query.trim().length < 2) return [];

      try {
        // Use getByHandleFuzzy to search for profiles
        const searchResults = await queries.profiles.getByHandleFuzzy(query.trim());

        // Filter to exclude the logged-in user and already invited profiles
        const alreadyInvited = await loadAlreadyInvitedProfiles();
        const filteredResults = searchResults.filter((profile: Tables<"profiles">) => {
          return profile.id !== auth.user?.id && !alreadyInvited.has(profile.id);
        });

        return filteredResults;
      } catch (error) {
        console.error("Error searching for profiles:", error);
        return [];
      }
    },
    [auth.user, loadAlreadyInvitedProfiles],
  );

  // Load already invited profiles and suggestions when needed
  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      // First load already invited profiles
      const alreadyInvited = await loadAlreadyInvitedProfiles();
      setAlreadyInvitedProfiles(alreadyInvited);

      // Then load filtered suggestions
      const profiles = await loadSuggestedProfiles();
      setSuggestedProfiles(profiles);
    } catch (error) {
      console.error("Error loading suggested profiles:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [loadSuggestedProfiles, loadAlreadyInvitedProfiles]);

  // Handle opening the search modal
  const handleOpenSearchModal = useCallback(() => {
    const modal = document.getElementById(`search-modal-${post.id}`) as HTMLDialogElement | null;
    modal?.showModal();
    void loadSuggestions();
  }, [post.id, loadSuggestions]);

  // Handle closing the search modal
  const handleCloseSearchModal = useCallback(() => {
    const modal = document.getElementById(`search-modal-${post.id}`) as HTMLDialogElement | null;
    modal?.close();
    setSelectedProfiles(new Set());
    setSearchQuery("");
    setSearchResults([]);
  }, [post.id]);
  // Get the parent post author if this is a response
  useEffect(() => {
    async function fetchParentPostAuthor() {
      if (!post.parent_post) {
        setParentPostAuthor(null);
        return;
      }

      setLoadingParentAuthor(true);
      try {
        // Get authors of the parent post using standardPostInfo
        const parentPostInfo = await queries.views.standardPostInfo(post.parent_post);
        if (parentPostInfo.profiles.length > 0) {
          setParentPostAuthor(parentPostInfo.profiles[0]); // Take the first author
        } else {
          setParentPostAuthor(null);
        }
      } catch (error) {
        console.error("Error fetching parent post author:", error);
        setParentPostAuthor(null);
      } finally {
        setLoadingParentAuthor(false);
      }
    }

    void fetchParentPostAuthor();
  }, [post.parent_post]);

  // Load post authors to check if the user is the last author
  useEffect(() => {
    async function fetchAuthors() {
      try {
        const postInfo = await queries.views.standardPostInfo(post.id);
        setAuthors(postInfo.profiles);

        // Check if the user is the last author
        if (auth.user && postInfo.profiles.length === 1 && postInfo.profiles[0]?.id === auth.user.id) {
          setIsLastAuthor(true);
        } else {
          setIsLastAuthor(false);
        }
      } catch {
        setAuthors([]);
        setIsLastAuthor(false);
      }
    }

    void fetchAuthors();
  }, [post.id, auth.user]);

  const handleSearchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await performSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error during search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleProfileSelection = (profileId: string) => {
    setSelectedProfiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };
  const handleInviteSelectedUsers = async () => {
    if (selectedProfiles.size === 0) return;

    setIsInviting(true);
    try {
      const invitePromises = Array.from(selectedProfiles).map((profileId) =>
        queries.pendingAuthors.invite(profileId, post.id),
      );

      const results = await Promise.allSettled(invitePromises);
      const successCount = results.filter((result) => result.status === "fulfilled").length;

      if (successCount > 0) {
        setInviteSuccess(true);
        handleCloseSearchModal();
        setTimeout(() => {
          setInviteSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error during invitations:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleAbandonOwnership = async () => {
    if (!auth.user || isAbandoning) return;

    try {
      setIsAbandoning(true);

      // Abandon ownership
      await queries.authors.remove(post.id);

      // Success animation
      const modal = document.getElementById(`abandon-modal-${post.id}`) as HTMLDialogElement | null;
      modal?.close();

      // Refresh the page to update visually
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error abandoning ownership:", error);
    } finally {
      setIsAbandoning(false);
    }
  };

  // Removed unused function - using handleInviteSelectedUsers instead
  const dateCreation = new Date(post.created_at);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Check if the logged-in user is an author of this post
  const isAuthor = auth.user && authors.some((author) => author.id === auth.user?.id);

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {/* Post header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 text-sm text-gray-500">{formatDate(dateCreation)}</div>
            {post.parent_post && (
              <div className="mb-2 text-xs text-blue-600">
                {loadingParentAuthor ? (
                  <span>💬 Reply to another post...</span>
                ) : parentPostAuthor ? (
                  <span>💬 Reply to @{parentPostAuthor.handle}</span>
                ) : (
                  <span>💬 Reply to another post</span>
                )}
              </div>
            )}{" "}
          </div>
          <div className="flex gap-2">
            <button onClick={handleOpenSearchModal} className="btn btn-sm btn-primary gap-2" disabled={inviteSuccess}>
              <HiOutlineUserPlus className="h-4 w-4" />
              {inviteSuccess ? "Invited!" : "Add author"}
            </button>

            {/* Abandon ownership button - shown only if user is author */}
            {isAuthor && (
              <button
                onClick={() => {
                  const modal = document.getElementById(`abandon-modal-${post.id}`) as HTMLDialogElement | null;
                  modal?.showModal();
                }}
                className="btn btn-sm btn-outline btn-warning gap-2"
                disabled={isAbandoning}
              >
                <HiOutlineUserMinus className="h-4 w-4" />
                {isAbandoning ? "Abandoning..." : "Abandon"}
              </button>
            )}
          </div>
        </div>

        {/* Post content */}
        <div className="text-gray-900">
          <p className="line-clamp-3">{post.body}</p>
        </div>

        {/* Success indicator */}
        {inviteSuccess && (
          <div className="mt-3 rounded-md bg-green-100 p-2 text-sm text-green-800">
            ✅ Invitation sent successfully!
          </div>
        )}
      </div>

      {/* User search modal */}
      <dialog id={`search-modal-${post.id}`} className="modal">
        <div className="modal-box flex h-[600px] w-full max-w-md flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Invite co-authors</h3>
            <button onClick={handleCloseSearchModal} className="btn btn-ghost btn-sm btn-circle">
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>
          {/* Multiple selection indicator */}
          {selectedProfiles.size > 0 && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedProfiles.size} person{selectedProfiles.size > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => {
                    setSelectedProfiles(new Set());
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}
          {/* Search bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by @handle..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void handleSearchUsers(e.target.value);
              }}
              autoFocus
            />
            <HiOutlineMagnifyingGlass className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          </div>
          {/* Search results */}
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <div className="loading loading-spinner loading-sm"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedProfiles.has(profile.id)}
                      onChange={() => {
                        handleToggleProfileSelection(profile.id);
                      }}
                      disabled={auth.user?.id === profile.id || alreadyInvitedProfiles.has(profile.id)}
                    />
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img src={utils.getAvatarUrl(profile)} alt={`${profile.handle}'s profile`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">@{profile.handle}</div>
                      {profile.bio && <div className="line-clamp-1 text-sm text-gray-600">{profile.bio}</div>}
                      {alreadyInvitedProfiles.has(profile.id) && (
                        <div className="text-xs text-orange-600">Already invited</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="py-4 text-center text-gray-500">No user found for &quot;{searchQuery}&quot;</div>
            ) : (
              <div className="py-4 text-center text-gray-500">Type at least 2 characters to search</div>
            )}

            {/* Profile suggestions */}
            {searchQuery.length < 2 && (
              <div className="mt-4">
                <div className="mb-2 text-sm text-gray-600">Suggestions:</div>
                {loadingSuggestions ? (
                  <div className="flex justify-center py-4">
                    <div className="loading loading-spinner loading-sm"></div>
                  </div>
                ) : suggestedProfiles.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedProfiles.map((profile) => (
                      <div key={profile.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={selectedProfiles.has(profile.id)}
                          onChange={() => {
                            handleToggleProfileSelection(profile.id);
                          }}
                          disabled={auth.user?.id === profile.id}
                        />
                        <div className="avatar">
                          <div className="w-10 rounded-full">
                            <img src={utils.getAvatarUrl(profile)} alt={`${profile.handle}'s profile`} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">@{profile.handle}</div>
                          {profile.bio && <div className="line-clamp-1 text-sm text-gray-600">{profile.bio}</div>}
                        </div>
                        {auth.user?.id === profile.id && <span className="text-sm text-gray-500">You</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">No suggestions available</div>
                )}
              </div>
            )}
          </div>
          {/* Action buttons */}
          <div className="mt-6 flex gap-2">
            <button onClick={handleCloseSearchModal} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                void handleInviteSelectedUsers();
              }}
              className="btn btn-primary flex-1"
              disabled={selectedProfiles.size === 0 || isInviting}
            >
              {isInviting ? (
                <div className="loading loading-spinner loading-xs"></div>
              ) : (
                `Invite ${selectedProfiles.size > 0 ? selectedProfiles.size.toString() : ""} person${selectedProfiles.size > 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Abandon ownership confirmation modal */}
      <dialog id={`abandon-modal-${post.id}`} className="modal">
        <div className="modal-box max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <HiOutlineExclamationTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Abandon ownership</h3>
              <p className="text-sm text-gray-500">This action is irreversible</p>
            </div>
          </div>

          <div className="mb-6">
            {isLastAuthor ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Warning: Post Deletion</p>
                    <p className="mt-1 text-sm text-red-700">
                      You are the last author of this post. Abandoning it will result in its permanent deletion.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">
                You will abandon ownership of this post. You will no longer be able to edit or delete it.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                const modal = document.getElementById(`abandon-modal-${post.id}`) as HTMLDialogElement | null;
                modal?.close();
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                void handleAbandonOwnership();
              }}
              disabled={isAbandoning}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                isLastAuthor
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                  : "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400"
              } disabled:cursor-not-allowed`}
            >
              {isAbandoning ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {isLastAuthor ? "Deleting..." : "Abandoning..."}
                </div>
              ) : isLastAuthor ? (
                "Delete post"
              ) : (
                "Abandon"
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
