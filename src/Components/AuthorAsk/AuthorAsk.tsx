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
  const [showSearchModal, setShowSearchModal] = useState(false);
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
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [isLastAuthor, setIsLastAuthor] = useState(false);
  const [authors, setAuthors] = useState<Tables<"profiles">[]>([]); // Fonction pour charger les profils déjà invités pour ce post
  const loadAlreadyInvitedProfiles = useCallback(async (): Promise<Set<string>> => {
    if (!auth.user) return new Set();

    try {
      const sentRequests = await queries.pendingAuthors.sent();
      const invitedForThisPost = sentRequests
        .filter((request) => request.post === post.id)
        .map((request) => request.to_profile);

      return new Set(invitedForThisPost);
    } catch (error) {
      console.error("Erreur lors du chargement des profils déjà invités:", error);
      return new Set();
    }
  }, [auth.user, post.id]); // Fonction pour charger les profils suggérés (featured profiles)
  const loadSuggestedProfiles = useCallback(async (): Promise<Tables<"profiles">[]> => {
    if (!auth.user) return [];

    try {
      // Récupérer les profils featured par l'utilisateur connecté
      const featuredProfiles = await queries.features.byUser(auth.user.id);
      const alreadyInvited = await loadAlreadyInvitedProfiles();

      // Filtrer les profils déjà invités et l'utilisateur lui-même
      const filteredProfiles = featuredProfiles.filter((profile) => {
        return profile.id !== auth.user?.id && !alreadyInvited.has(profile.id);
      });

      return filteredProfiles;
    } catch (error) {
      console.error("Erreur lors du chargement des profils featured:", error);
      return [];
    }
  }, [auth.user, loadAlreadyInvitedProfiles]); // Fonction pour effectuer une recherche en utilisant getByHandleFuzzy
  const performSearch = useCallback(
    async (query: string): Promise<Tables<"profiles">[]> => {
      if (!auth.user || query.trim().length < 2) return [];

      try {
        // Utiliser getByHandleFuzzy pour rechercher des profils
        // Note: getByHandleFuzzy retourne actuellement un seul profil mais devrait retourner un tableau
        const searchResult = (await queries.profiles.getByHandleFuzzy(query.trim())) as unknown as Tables<"profiles">[];

        // Filtrer pour exclure l'utilisateur connecté et les profils déjà invités
        const alreadyInvited = await loadAlreadyInvitedProfiles();
        const filteredResults = searchResult.filter((profile: Tables<"profiles">) => {
          return profile.id !== auth.user?.id && !alreadyInvited.has(profile.id);
        });

        return filteredResults;
      } catch (error) {
        console.error("Erreur lors de la recherche de profils:", error);
        return [];
      }
    },
    [auth.user, loadAlreadyInvitedProfiles],
  );

  // Charger les profils déjà invités et les suggestions quand le modal s'ouvre
  useEffect(() => {
    async function loadSuggestions() {
      if (!showSearchModal) return;

      setLoadingSuggestions(true);
      try {
        // Charger d'abord les profils déjà invités
        const alreadyInvited = await loadAlreadyInvitedProfiles();
        setAlreadyInvitedProfiles(alreadyInvited);

        // Puis charger les suggestions filtrées
        const profiles = await loadSuggestedProfiles();
        setSuggestedProfiles(profiles);
      } catch (error) {
        console.error("Erreur lors du chargement des profils suggérés:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    void loadSuggestions();
  }, [showSearchModal, loadSuggestedProfiles, loadAlreadyInvitedProfiles]);
  // Récupérer l'auteur du post parent si c'est une réponse
  useEffect(() => {
    async function fetchParentPostAuthor() {
      if (!post.parent_post) {
        setParentPostAuthor(null);
        return;
      }

      setLoadingParentAuthor(true);
      try {
        // Récupérer les auteurs du post parent
        const parentAuthors = await queries.authors.ofPost(post.parent_post);
        if (parentAuthors.length > 0) {
          setParentPostAuthor(parentAuthors[0]); // Prendre le premier auteur
        } else {
          setParentPostAuthor(null);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'auteur du post parent:", error);
        setParentPostAuthor(null);
      } finally {
        setLoadingParentAuthor(false);
      }
    }

    void fetchParentPostAuthor();
  }, [post.parent_post]);

  // Charger les auteurs du post pour vérifier si l'utilisateur est le dernier auteur
  useEffect(() => {
    async function fetchAuthors() {
      try {
        const postAuthors = await queries.authors.ofPost(post.id);
        setAuthors(postAuthors);

        // Vérifier si l'utilisateur est le dernier auteur
        if (auth.user && postAuthors.length === 1 && postAuthors[0]?.id === auth.user.id) {
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
      console.error("Erreur lors de la recherche:", error);
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
        setShowSearchModal(false);
        setSelectedProfiles(new Set());
        setTimeout(() => {
          setInviteSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur lors des invitations:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleAbandonOwnership = async () => {
    if (!auth.user || isAbandoning) return;

    try {
      setIsAbandoning(true);

      // Abandon de la propriété
      await queries.authors.remove(post.id);

      // Animation de succès
      setShowAbandonConfirm(false);

      // Rafraîchir la page pour actualiser visuellement
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'abandon de propriété:", error);
    } finally {
      setIsAbandoning(false);
    }
  };

  // Fonction supprimée car non utilisée - utilisation de handleInviteSelectedUsers à la place
  const dateCreation = new Date(post.created_at);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Vérifier si l'utilisateur connecté est auteur de ce post
  const isAuthor = auth.user && authors.some((author) => author.id === auth.user?.id);

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {/* En-tête du post */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 text-sm text-gray-500">{formatDate(dateCreation)}</div>
            {post.parent_post && (
              <div className="mb-2 text-xs text-blue-600">
                {loadingParentAuthor ? (
                  <span>💬 Réponse à un autre post...</span>
                ) : parentPostAuthor ? (
                  <span>💬 Réponse à @{parentPostAuthor.handle}</span>
                ) : (
                  <span>💬 Réponse à un autre post</span>
                )}
              </div>
            )}{" "}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSearchModal(true);
              }}
              className="btn btn-sm btn-primary gap-2"
              disabled={inviteSuccess}
            >
              <HiOutlineUserPlus className="h-4 w-4" />
              {inviteSuccess ? "Invité !" : "Ajouter un auteur"}
            </button>

            {/* Bouton d'abandon de propriété - affiché uniquement si l'utilisateur est auteur */}
            {isAuthor && (
              <button
                onClick={() => {
                  setShowAbandonConfirm(true);
                }}
                className="btn btn-sm btn-outline btn-warning gap-2"
                disabled={isAbandoning}
              >
                <HiOutlineUserMinus className="h-4 w-4" />
                {isAbandoning ? "Abandon..." : "Abandonner"}
              </button>
            )}
          </div>
        </div>

        {/* Contenu du post */}
        <div className="text-gray-900">
          <p className="line-clamp-3">{post.body}</p>
        </div>

        {/* Indicateur de succès */}
        {inviteSuccess && (
          <div className="mt-3 rounded-md bg-green-100 p-2 text-sm text-green-800">
            ✅ Invitation envoyée avec succès !
          </div>
        )}
      </div>

      {/* Modal de recherche d'utilisateur */}
      {showSearchModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inviter des co-auteurs</h3>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSelectedProfiles(new Set());
                }}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
            {/* Indicateur de sélection multiple */}
            {selectedProfiles.size > 0 && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    {selectedProfiles.size} personne{selectedProfiles.size > 1 ? "s" : ""} sélectionnée
                    {selectedProfiles.size > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedProfiles(new Set());
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
            )}
            {/* Barre de recherche */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Rechercher par @handle..."
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
            {/* Résultats de recherche */}
            <div className="max-h-60 overflow-y-auto">
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
                          <div className="text-xs text-orange-600">Déjà invité</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-4 text-center text-gray-500">
                  Aucun utilisateur trouvé pour &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">Tapez au moins 2 caractères pour rechercher</div>
              )}
            </div>
            {/* Suggestions de profils */}
            {searchQuery.length < 2 && (
              <div className="mt-4">
                <div className="mb-2 text-sm text-gray-600">Suggestions :</div>
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
                        {auth.user?.id === profile.id && <span className="text-sm text-gray-500">Vous</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">Aucune suggestion disponible</div>
                )}
              </div>
            )}
            {/* Boutons d'action */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSelectedProfiles(new Set());
                }}
                className="btn btn-outline flex-1"
              >
                Annuler
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
                  `Inviter ${selectedProfiles.size > 0 ? selectedProfiles.size.toString() : ""} personne${selectedProfiles.size > 1 ? "s" : ""}`
                )}
              </button>
            </div>{" "}
          </div>
        </div>
      )}

      {/* Modal de confirmation d'abandon de propriété */}
      {showAbandonConfirm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <HiOutlineExclamationTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Abandonner la propriété</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="mb-6">
              {isLastAuthor ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Attention : Suppression du post</p>
                      <p className="mt-1 text-sm text-red-700">
                        Vous êtes le dernier auteur de ce post. L&apos;abandonner entraînera sa suppression définitive.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">
                  Vous abandonnerez la propriété de ce post. Vous ne pourrez plus le modifier ni le supprimer.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAbandonConfirm(false);
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Annuler
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
                    {isLastAuthor ? "Suppression..." : "Abandon..."}
                  </div>
                ) : isLastAuthor ? (
                  "Supprimer le post"
                ) : (
                  "Abandonner"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
