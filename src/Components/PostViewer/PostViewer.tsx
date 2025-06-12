import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  HiOutlineChatBubbleOvalLeft,
  HiOutlineArrowPath,
  HiOutlineBookmark,
  HiOutlineHeart,
  HiHeart,
  HiOutlineEllipsisHorizontal,
  HiOutlinePencil,
  HiOutlineMapPin,
  HiMapPin,
} from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import MediaCarousel from "../MediaCarousel/MediaCarousel";
import PostAdd from "../PostAdd/PostAdd";
import Dropdown from "../Dropdown/Dropdown";

import { closePopover } from "../../utils/popover";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState(props.post.body ?? "");
  const [showChildrenPosts, setShowChildrenPosts] = useState(props.showChildren ?? false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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

  // Récupération des posts enfants avec tri par likes
  useEffect(() => {
    async function fetchChildren() {
      try {
        const childPosts = await queries.posts.getChildren(props.post.id);

        // Pour chaque enfant, récupérer le nombre de likes
        const childrenWithLikes = await Promise.all(
          childPosts.map(async (child) => {
            try {
              const likes = await queries.like.byWho(child.id);
              return {
                ...child,
                likeCount: likes.length,
              };
            } catch {
              return {
                ...child,
                likeCount: 0,
              };
            }
          }),
        );

        // Trier par nombre de likes (décroissant), puis par date de création (plus récent en cas d'égalité)
        const sortedChildren = childrenWithLikes.sort((a, b) => {
          // D'abord par nombre de likes (décroissant)
          if (b.likeCount !== a.likeCount) {
            return b.likeCount - a.likeCount;
          }
          // En cas d'égalité, par date de création (plus récent d'abord)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setChildren(sortedChildren);
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

  // Récupération des likes
  useEffect(() => {
    async function fetchLikes() {
      try {
        const likedByUsers = await queries.like.byWho(props.post.id);
        setLikeCount(likedByUsers.length);

        if (auth.user) {
          const userLikesPost = await queries.like.doesUserLikePost(auth.user.id, props.post.id);
          setIsLiked(userLikesPost);
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error("[ERROR] Erreur lors de la récupération des likes:", error);
        setLikeCount(0);
        setIsLiked(false);
      }
    }

    void fetchLikes();
  }, [props.post.id, auth.user]);

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

      if (isPinned) {
        await queries.profiles.setPinnedPost(null);
      } else {
        await queries.profiles.setPinnedPost(props.post.id);
      }

      // Appeler la callback de mise à jour immédiatement
      props.onPinUpdate?.();

      // Ne pas recharger la page, l'état est déjà mis à jour
    } catch (error) {
      console.error("Erreur lors de l'épinglage:", error);
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
  const handleLikeToggle = async () => {
    if (!auth.user || isLiking) return;

    try {
      setIsLiking(true);
      console.log(
        `[DEBUG] Like toggle - Post: ${props.post.id}, Current isLiked: ${String(isLiked)}, User: ${auth.user.id}`,
      );

      if (isLiked) {
        console.log(`[DEBUG] Removing like for user ${auth.user.id} on post ${props.post.id}...`);

        // Vérifier avant suppression
        const beforeRemove = await queries.like.doesUserLikePost(auth.user.id, props.post.id);
        console.log(`[DEBUG] Before remove - User likes post:`, beforeRemove);

        const result = await queries.like.remove(props.post.id);
        console.log(`[DEBUG] Remove function returned:`, result);

        // Vérifier après suppression
        const afterRemove = await queries.like.doesUserLikePost(auth.user.id, props.post.id);
        console.log(`[DEBUG] After remove - User likes post:`, afterRemove);

        if (!afterRemove) {
          setLikeCount((prev) => prev - 1);
          setIsLiked(false);
          console.log(`[DEBUG] Like successfully removed from database`);
        } else {
          console.error(`[ERROR] Like was not removed from database!`);
        }
      } else {
        console.log(`[DEBUG] Adding like for user ${auth.user.id} on post ${props.post.id}...`);
        const result = await queries.like.add(props.post.id);
        console.log(`[DEBUG] Add result:`, result);
        setLikeCount((prev) => prev + 1);
        setIsLiked(true);
        console.log(`[DEBUG] Like added, new state: isLiked=true, count=`, likeCount + 1);
      }
    } catch (error) {
      console.error("[ERROR] Erreur lors du like/unlike:", error);
      // En cas d'erreur, on remet l'état d'origine
      console.log(`[DEBUG] Erreur, remise à l'état original`);
    } finally {
      setIsLiking(false);
    }
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

        <div
          className={`relative transition-colors ${
            isMainPost
              ? "border-b-2 border-gray-300 bg-white px-4 py-6"
              : "border-b border-gray-100 px-4 py-3 hover:bg-gray-50/50"
          } ${props.disableRedirect && isMainPost ? "cursor-default" : "cursor-pointer"} ${depth > 0 ? "ml-10" : ""} ${
            props.highlightPostId === props.post.id ? "border-yellow-200 bg-yellow-50" : ""
          } ${isPinned ? "border-b-4 border-blue-500" : ""}`}
          onClick={handlePostClick}
        >
          {/* Menu burger pour l'auteur */}
          {isAuthor && (
            <div className="absolute top-3 right-3 z-10">
              <button
                className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100"
                popoverTarget={`popover-post-${props.post.id}`}
                style={{ anchorName: `--popover-post-${props.post.id}` } as React.CSSProperties}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <HiOutlineEllipsisHorizontal className="h-5 w-5" />
              </button>
              <Dropdown id={`popover-post-${props.post.id}`}>
                {[
                  {
                    title: "Modify",
                    icon: HiOutlinePencil,
                    onClick: () => {
                      setIsEditMode(true);
                      closePopover(`popover-post-${props.post.id}`)();
                    },
                  },
                  {
                    title: isPinned ? "Unpin" : "Pin",
                    icon: isPinned ? HiMapPin : HiOutlineMapPin,
                    onClick: () => {
                      void handlePinPost();
                      closePopover(`popover-post-${props.post.id}`)();
                    },
                    disabled: isPinning,
                  },
                ]}
              </Dropdown>
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
                {isPinned && (
                  <>
                    <span className="text-gray-500">·</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <HiOutlineMapPin className="h-3 w-3" />
                      Pinned
                    </span>
                  </>
                )}
              </div>

              {/* Co-authors */}
              {authors.length > 1 && (
                <div className={`mt-1 ${isMainPost ? "text-sm" : "text-xs"} text-gray-600`}>
                  <span>co-écrit par </span>
                  {authors
                    .filter((author) => author.id !== mainAuthor?.id)
                    .map((coAuthor, index, filteredAuthors) => (
                      <span key={coAuthor.id}>
                        <span
                          className="cursor-pointer font-medium text-gray-700 hover:text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            void navigate(`/@${coAuthor.handle}`);
                          }}
                        >
                          @{coAuthor.handle}
                        </span>
                        {index < filteredAuthors.length - 1 && (
                          <span>{index === filteredAuthors.length - 2 ? " et " : ", "}</span>
                        )}
                      </span>
                    ))}
                </div>
              )}

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
                      className="btn btn-primary"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="btn btn-secondary"
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
                {(() => {
                  const shouldShow =
                    props.allowExpandChildren &&
                    !isMainPost &&
                    !showChildrenPosts &&
                    !props.showChildren &&
                    children.length > 0;

                  console.log(`Debug bouton réponses - Post ${props.post.id}:`, {
                    allowExpandChildren: props.allowExpandChildren,
                    isMainPost,
                    showChildrenPosts,
                    showChildren: props.showChildren,
                    childrenLength: children.length,
                    shouldShow,
                  });

                  return shouldShow;
                })() && (
                  <button
                    className="text-xs text-blue-600 underline transition-colors hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChildrenPosts(true);
                    }}
                  >
                    {children.length === 1
                      ? "Afficher la réponse"
                      : `Afficher les ${children.length.toString()} réponses`}
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
                  className={`group flex items-center gap-2 transition-colors ${
                    isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleLikeToggle();
                  }}
                  disabled={isLiking}
                >
                  <div className="rounded-full p-2 transition-colors group-hover:bg-red-50">
                    {isLiked ? <HiHeart className="h-5 w-5" /> : <HiOutlineHeart className="h-5 w-5" />}
                  </div>
                  <span className="text-sm">{likeCount}</span>
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
