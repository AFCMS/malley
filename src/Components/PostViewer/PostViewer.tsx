import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  HiOutlineChatBubbleOvalLeft,
  HiOutlineArrowPath,
  HiOutlineBookmark,
  HiOutlineHeart,
  HiOutlineEllipsisHorizontal,
  HiOutlinePencil,
  HiOutlineMapPin,
  HiMapPin,
} from "react-icons/hi2";

import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import MediaCarousel from "../MediaCarousel/MediaCarousel";
import PostAdd from "../PostAdd/PostAdd";
import { useAuth } from "../../contexts/auth/AuthContext";

interface PostViewerProps {
  post: Tables<"posts">;
  showParents?: boolean;
  showChildren?: boolean;
  disableRedirect?: boolean;
  isMainPost?: boolean;
  depth?: number;
  highlightPostId?: string;
  isPinned?: boolean;
  onPinUpdate?: () => void;
  allowExpandChildren?: boolean;
}

export default function PostViewer(props: PostViewerProps) {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [authors, setAuthors] = useState<Tables<"profiles">[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [children, setChildren] = useState<Tables<"posts">[]>([]);
  const [parents, setParents] = useState<Tables<"posts">[]>([]);
  const [isPinning, setIsPinning] = useState(false);
  const [showPinAnimation, setShowPinAnimation] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState(props.post.body ?? "");
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [showChildrenPosts, setShowChildrenPosts] = useState(props.showChildren ?? false);

  const auth = useAuth();
  const navigate = useNavigate();
  const dateCreation = new Date(props.post.created_at);
  const depth = props.depth ?? 0;
  const isMainPost = props.isMainPost ?? false;
  const isPinned = props.isPinned ?? false;
  const mainAuthor = authors.length > 0 ? authors[0] : null;
  const isAuthor = auth.user && authors.some((author) => author.id === auth.user?.id);

  // Fetch post authors
  useEffect(() => {
    async function fetchAuthors() {
      try {
        const postAuthors = await queries.authors.ofPost(props.post.id);
        setAuthors(postAuthors);
      } catch {
        setAuthors([]);
      }
    }

    void fetchAuthors();
  }, [props.post.id]);

  // Récupération des catégories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const postCategories = await queries.postsCategories.get(props.post.id);
        setCategories(postCategories);
      } catch {
        setCategories([]);
      }
    }

    void fetchCategories();
  }, [props.post.id]);

  // Récupération des posts enfants
  useEffect(() => {
    async function fetchChildren() {
      try {
        const childPosts = await queries.posts.getChildren(props.post.id);
        setChildren(childPosts);
      } catch {
        setChildren([]);
      }
    }

    void fetchChildren();
  }, [props.post.id]);

  // Récupération des posts parents
  useEffect(() => {
    async function fetchParents() {
      if (!props.showParents || !props.post.parent_post) {
        return;
      }

      try {
        const parentChain = await queries.posts.getParentChain(props.post.parent_post, 0);
        const filteredParents = parentChain.filter((parent) => parent.id !== props.post.id);
        setParents(filteredParents);
      } catch {
        setParents([]);
      }
    }

    void fetchParents();
  }, [props.post.id, props.showParents, props.post.parent_post]);

  // Récupération des médias
  useEffect(() => {
    async function fetchMediaUrls() {
      if (!props.post.id) {
        setMediaUrls([]);
        return;
      }

      try {
        setLoadingMedia(true);
        const { data, error } = await supabase.storage.from("post-media").list(props.post.id, {
          limit: 10,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

        if (!error && data.length > 0) {
          const urls = data.map(
            (file) => supabase.storage.from("post-media").getPublicUrl(`${props.post.id}/${file.name}`).data.publicUrl,
          );
          setMediaUrls(urls);
        }
      } catch {
        setMediaUrls([]);
      } finally {
        setLoadingMedia(false);
      }
    }

    void fetchMediaUrls();
  }, [props.post.id]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showBurgerMenu) {
        setShowBurgerMenu(false);
      }
    };

    if (showBurgerMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showBurgerMenu]);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    queries.posts
      .getChildren(props.post.id)
      .then((childPosts) => {
        setChildren(childPosts);
      })
      .catch((error: unknown) => {
        console.error("Erreur lors du rechargement des réponses:", error);
        setChildren([]);
      });
  };

  const handlePostClick = (e: React.MouseEvent) => {
    if (props.disableRedirect && isMainPost) return;

    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
      return;
    }

    // Si c'est un post parent/enfant, naviguer avec highlight
    if (props.highlightPostId && !isMainPost) {
      void navigate(`/post/${props.post.id}?highlight=${props.post.id}`);
    } else {
      void navigate(`/post/${props.post.id}`);
    }
  };

  const handlePinPost = async () => {
    if (!auth.user || isPinning) return;

    try {
      setIsPinning(true);
      setShowPinAnimation(true);

      if (isPinned) {
        await queries.profiles.setPinnedPost(null);
      } else {
        await queries.profiles.setPinnedPost(props.post.id);
      }

      // Appeler la callback de mise à jour immédiatement
      props.onPinUpdate?.();

      // Animation d'épinglage avec feedback visuel
      setTimeout(() => {
        setShowPinAnimation(false);
      }, 2000);

      // Ne pas recharger la page, l'état est déjà mis à jour
    } catch (error) {
      console.error("Erreur lors de l'épinglage:", error);
      setShowPinAnimation(false);
    } finally {
      setIsPinning(false);
    }
  };

  const handleEditPost = async () => {
    if (!editContent.trim()) return;

    try {
      await queries.posts.edit(props.post.id, editContent);
      setIsEditMode(false);
      // Mise à jour du post parent si nécessaire
      props.onPinUpdate?.();
    } catch (error) {
      console.error("Erreur lors de l'édition:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditContent(props.post.body ?? "");
  };

  const formatPostDate = (date: Date): string => {
    try {
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }

      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return diffInMinutes < 1 ? "now" : `${diffInMinutes.toString()}m`;
      } else if (diffInHours < 24) {
        return `${diffInHours.toString()}h`;
      } else if (diffInHours < 24 * 7) {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays.toString()}d`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Date invalide";
    }
  };

  return (
    <div className="w-full">
      {/* Posts parents */}
      {props.showParents && parents.length > 0 && (
        <div className="relative">
          {parents
            .slice()
            .reverse()
            .filter((parent) => parent.id !== props.post.id)
            .map((parent) => (
              <div key={parent.id} className="relative">
                <div className="absolute top-0 left-6 h-full w-1 bg-gray-400"></div>
                <div className="relative border-b border-gray-100">
                  <PostViewer
                    post={parent}
                    showParents={false}
                    showChildren={false}
                    disableRedirect={props.disableRedirect}
                    depth={depth}
                    highlightPostId={props.highlightPostId}
                  />
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Post principal */}
      <div className="relative" id={`post-${props.post.id}`}>
        {!isMainPost && depth > 0 && <div className="absolute top-0 left-6 h-full w-1 bg-gray-400"></div>}

        {!isMainPost && (
          <div className="absolute top-6 left-5.5 h-3 w-3 rounded-full border-2 border-white bg-gray-500"></div>
        )}

        {/* Indicateur de post épinglé */}
        {isPinned && (
          <div
            className={`relative overflow-hidden border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 ${
              showPinAnimation ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-md ${
                  showPinAnimation ? "animate-bounce" : ""
                }`}
              >
                <HiMapPin className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-blue-800">
                  📌 Post épinglé par @{mainAuthor?.handle ?? "Utilisateur inconnu"}
                </span>
                <span className="text-xs text-blue-600">
                  {showPinAnimation ? "Épinglage en cours..." : "Ce post est mis en avant sur le profil"}
                </span>
              </div>
            </div>
            {showPinAnimation && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-200 to-indigo-200 opacity-70"></div>
            )}
          </div>
        )}

        <div
          className={`relative transition-colors ${
            isMainPost
              ? "border-b-2 border-gray-300 bg-white px-4 py-6"
              : "border-b border-gray-100 px-4 py-3 hover:bg-gray-50/50"
          } ${props.disableRedirect && isMainPost ? "cursor-default" : "cursor-pointer"} ${depth > 0 ? "ml-10" : ""} ${
            props.highlightPostId === props.post.id ? "border-yellow-200 bg-yellow-50" : ""
          }`}
          onClick={handlePostClick}
        >
          {/* Menu burger pour l'auteur */}
          {isAuthor && (
            <div className="absolute top-3 right-3 z-10">
              <button
                className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBurgerMenu(!showBurgerMenu);
                }}
              >
                <HiOutlineEllipsisHorizontal className="h-5 w-5" />
              </button>

              {showBurgerMenu && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditMode(true);
                        setShowBurgerMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-gray-100"
                    >
                      <HiOutlinePencil className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handlePinPost();
                        setShowBurgerMenu(false);
                      }}
                      disabled={isPinning}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-gray-100 disabled:opacity-50"
                    >
                      {isPinned ? (
                        <HiMapPin className="h-4 w-4 text-blue-500" />
                      ) : (
                        <HiOutlineMapPin className="h-4 w-4" />
                      )}
                      {isPinned ? "Désépingler" : "Épingler"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-start gap-3">
            {/* Profile picture */}
            <div className="flex-shrink-0">
              <div className={`overflow-hidden rounded-full ${isMainPost ? "h-14 w-14" : "h-12 w-12"}`}>
                <img
                  src={
                    mainAuthor
                      ? utils.getAvatarUrl(mainAuthor)
                      : "https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                  }
                  alt={`${mainAuthor?.handle ?? "Unknown"}'s profile`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Author info and date */}
              <div className={`flex items-center gap-1 ${isMainPost ? "text-base" : "text-sm"}`}>
                <span
                  className="cursor-pointer font-bold text-gray-900 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mainAuthor) {
                      void navigate(`/@${mainAuthor.handle}`);
                    }
                  }}
                >
                  @{mainAuthor?.handle ?? "Unknown Author"}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500" title={dateCreation.toLocaleDateString()}>
                  {formatPostDate(dateCreation)}
                </span>
              </div>

              {/* Post content */}
              {isEditMode ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                    }}
                    className="min-h-20 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Modifiez votre post..."
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleEditPost();
                      }}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                props.post.body && (
                  <div
                    className={`mt-2 break-words whitespace-pre-wrap text-gray-900 ${isMainPost ? "text-lg leading-relaxed" : ""}`}
                  >
                    {props.post.body}
                  </div>
                )
              )}

              {/* Media carousel */}
              {props.post.id && !loadingMedia && mediaUrls.length > 0 && (
                <div className="mt-3">
                  <MediaCarousel mediaUrls={mediaUrls} />
                </div>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex cursor-pointer items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                    >
                      #{category.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className={`mt-3 flex max-w-md items-center justify-between ${isMainPost ? "mt-4" : ""}`}>
                <button
                  className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMainPost || props.showChildren) {
                      setShowReplyForm(!showReplyForm);
                    } else if (children.length > 0) {
                      setShowChildrenPosts(!showChildrenPosts);
                    } else {
                      setShowReplyForm(!showReplyForm);
                    }
                  }}
                >
                  <div className="rounded-full p-2 transition-colors group-hover:bg-blue-50">
                    <HiOutlineChatBubbleOvalLeft className="h-5 w-5" />
                  </div>
                  <span className="text-sm">{children.length}</span>
                </button>

                {/* Bouton pour afficher les réponses - uniquement pour les posts enfants sur ViewPost */}
                {props.allowExpandChildren &&
                  !isMainPost &&
                  !showChildrenPosts &&
                  !props.showChildren &&
                  children.length > 0 && (
                    <button
                      className="text-xs text-blue-600 underline transition-colors hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowChildrenPosts(true);
                      }}
                    >
                      Afficher les {children.length.toString()} réponse{children.length > 1 ? "s" : ""}
                    </button>
                  )}

                {/* Bouton pour masquer les réponses quand elles sont affichées via l'état local */}
                {props.allowExpandChildren &&
                  !isMainPost &&
                  showChildrenPosts &&
                  !props.showChildren &&
                  children.length > 0 && (
                    <button
                      className="text-xs text-gray-600 underline transition-colors hover:text-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowChildrenPosts(false);
                      }}
                    >
                      Masquer les {children.length.toString()} réponse{children.length > 1 ? "s" : ""}
                    </button>
                  )}

                <button
                  className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-green-500"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="rounded-full p-2 transition-colors group-hover:bg-green-50">
                    <HiOutlineArrowPath className="h-5 w-5" />
                  </div>
                  <span className="text-sm">12</span>
                </button>

                <button
                  className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="rounded-full p-2 transition-colors group-hover:bg-red-50">
                    <HiOutlineHeart className="h-5 w-5" />
                  </div>
                  <span className="text-sm">156</span>
                </button>

                <button
                  className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="rounded-full p-2 transition-colors group-hover:bg-blue-50">
                    <HiOutlineBookmark className="h-5 w-5" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Reply form */}
          {showReplyForm && auth.isAuthenticated && (
            <div
              className="mt-4 border-t border-gray-200 pt-4"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <PostAdd
                parentPostId={props.post.id}
                onSuccess={handleReplySuccess}
                showCategories={false}
                showFileUpload={true}
                isReply={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Posts enfants */}
      {(props.showChildren ?? showChildrenPosts) && children.length > 0 && (
        <div className="relative">
          {children.map((child) => (
            <div key={child.id} className="relative">
              {/* Ligne de connexion hiérarchique améliorée */}
              <div
                className={`absolute top-0 left-6 h-full w-px ${
                  depth === 0
                    ? "bg-blue-300"
                    : depth === 1
                      ? "bg-green-300"
                      : depth === 2
                        ? "bg-orange-300"
                        : "bg-gray-300"
                }`}
              ></div>

              {/* Connecteur horizontal */}
              <div
                className={`absolute top-6 left-6 h-px w-4 ${
                  depth === 0
                    ? "bg-blue-300"
                    : depth === 1
                      ? "bg-green-300"
                      : depth === 2
                        ? "bg-orange-300"
                        : "bg-gray-300"
                }`}
              ></div>

              {/* Boule de connexion */}
              <div
                className={`absolute top-5 left-5 h-2 w-2 rounded-full border-2 border-white ${
                  depth === 0
                    ? "bg-blue-500"
                    : depth === 1
                      ? "bg-green-500"
                      : depth === 2
                        ? "bg-orange-500"
                        : "bg-gray-500"
                }`}
              ></div>

              <div className={`ml-12 ${depth > 0 ? "pl-2" : ""}`}>
                <PostViewer
                  post={child}
                  showChildren={false}
                  showParents={false}
                  disableRedirect={props.disableRedirect}
                  depth={depth + 1}
                  highlightPostId={props.highlightPostId}
                  allowExpandChildren={props.allowExpandChildren}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
