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
  HiOutlineUserMinus,
  HiOutlineExclamationTriangle,
  HiOutlineShare,
} from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import MediaCarousel from "../MediaCarousel/MediaCarousel";
import PostAdd from "../PostAdd/PostAdd";
import Dropdown from "../Dropdown/Dropdown";
import { closePopover } from "../../utils/popover";
import QuoteTweetModal from "../QuoteTweetModal/QuoteTweetModal";

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
  const [showChildrenPosts, setShowChildrenPosts] = useState(props.showChildren ?? false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [isLastAuthor, setIsLastAuthor] = useState(false);
  const [hasRetweeted, setHasRetweeted] = useState(false);
  const [originalPost, setOriginalPost] = useState<Tables<"posts"> | null>(null);
  const [retweetedBy, setRetweetedBy] = useState<Tables<"profiles"> | null>(null);
  const [quotedPost, setQuotedPost] = useState<Tables<"posts"> | null>(null);
  const [quotedPostAuthors, setQuotedPostAuthors] = useState<Tables<"profiles">[]>([]);
  const [quotedPostCategories, setQuotedPostCategories] = useState<Tables<"categories">[]>([]);
  const [quotedPostMediaUrls, setQuotedPostMediaUrls] = useState<string[]>([]);
  const [loadingQuotedMedia, setLoadingQuotedMedia] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const dateCreation = new Date(props.post.created_at);
  const depth = props.depth ?? 0;
  const isMainPost = props.isMainPost ?? false;
  const isPinned = props.isPinned ?? false;
  const mainAuthor = authors.length > 0 ? authors[0] : null;
  const isAuthor = auth.user && authors.some((author) => author.id === auth.user?.id);
  const isSimpleRetweet = queries.posts.isSimpleRetweet(props.post);
  // Fetch post authors
  useEffect(() => {
    async function fetchAuthors() {
      try {
        // Si c'est un retweet simple, on récupère les auteurs du post original
        if (queries.posts.isSimpleRetweet(props.post)) {
          const originalPost = await queries.posts.getOriginalPost(props.post);
          if (originalPost) {
            const originalAuthors = await queries.authors.ofPost(originalPost.id);
            setAuthors(originalAuthors);

            // Pour un retweet simple, l'utilisateur n'est jamais le dernier auteur du post original
            setIsLastAuthor(false);
            return;
          }
        }

        // Pour les posts normaux ou les quote retweets
        const postAuthors = await queries.authors.ofPost(props.post.id);
        setAuthors(postAuthors);

        // Check if the user is the last author
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
  }, [props.post.id, props.post, auth.user]);
  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        // Si c'est un retweet simple, récupérer les catégories du post original
        let postIdToUse = props.post.id;
        if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
          postIdToUse = originalPost.id;
        }

        const postCategories = await queries.postsCategories.get(postIdToUse);
        setCategories(postCategories);
      } catch {
        setCategories([]);
      }
    }
    void fetchCategories();
  }, [props.post.id, props.post, originalPost]);

  // Fetch child posts with likes sorting
  useEffect(() => {
    async function fetchChildren() {
      try {
        const childPosts = await queries.posts.getChildren(props.post.id);

        // For each child, get the number of likes
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

        // Sort by number of likes (descending), then by creation date (most recent in case of tie)
        const sortedChildren = childrenWithLikes.sort((a, b) => {
          // First by number of likes (descending)
          if (b.likeCount !== a.likeCount) {
            return b.likeCount - a.likeCount;
          }
          // In case of tie, by creation date (most recent first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setChildren(sortedChildren);
      } catch {
        setChildren([]);
      }
    }

    void fetchChildren();
  }, [props.post.id]);

  // Fetch parent posts
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

  // Fetch media
  useEffect(() => {
    async function fetchMediaUrls() {
      // Si c'est un retweet simple, utiliser l'ID du post original
      let postIdToUse = props.post.id;
      if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
        postIdToUse = originalPost.id;
      }

      if (!postIdToUse) {
        setMediaUrls([]);
        return;
      }

      try {
        setLoadingMedia(true);
        const { data, error } = await supabase.storage.from("post-media").list(postIdToUse, {
          limit: 10,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

        if (!error && data.length > 0) {
          const urls = data.map(
            (file) => supabase.storage.from("post-media").getPublicUrl(`${postIdToUse}/${file.name}`).data.publicUrl,
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

  // Fetch likes
  useEffect(() => {
    async function fetchLikes() {
      try {
        // Si c'est un retweet simple, on récupère les likes du post original
        let targetPostId = props.post.id;
        if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
          targetPostId = originalPost.id;
        }

        const likedByUsers = await queries.like.byWho(targetPostId);
        setLikeCount(likedByUsers.length);

        if (auth.user) {
          const userLikesPost = await queries.like.doesUserLikePost(auth.user.id, targetPostId);
          setIsLiked(userLikesPost);
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error("[ERROR] Error fetching likes:", error);
        setLikeCount(0);
        setIsLiked(false);
      }
    }
    void fetchLikes();
  }, [props.post.id, props.post, auth.user, originalPost]); // Récupération des retweets
  useEffect(() => {
    async function fetchRetweets() {
      try {
        // Pour les retweets simples, compter les retweets du post original
        let targetPostId = props.post.id;
        if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
          targetPostId = originalPost.id;
        }

        const retweets = await queries.posts.getRetweetsOf(targetPostId);
        setRetweetCount(retweets.length);
      } catch (error) {
        console.error("[ERROR] Error fetching retweets:", error);
        setRetweetCount(0);
      }
    }
    void fetchRetweets();
  }, [props.post.id, props.post, originalPost]); // Vérifier si l'utilisateur a déjà retweeté ce post
  useEffect(() => {
    async function checkUserRetweet() {
      if (!auth.user) {
        setHasRetweeted(false);
        return;
      }

      try {
        // Pour les retweets simples, vérifier sur le post original
        let targetPostId = props.post.id;
        if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
          targetPostId = originalPost.id;
        }

        const hasUserRetweeted = await queries.posts.hasUserRetweeted(targetPostId, auth.user.id);
        setHasRetweeted(hasUserRetweeted);
      } catch (error) {
        console.error("[ERROR] Error checking retweet:", error);
        setHasRetweeted(false);
      }
    }

    void checkUserRetweet();
  }, [props.post.id, props.post, auth.user, originalPost]);

  // Récupérer le post original si c'est un retweet simple
  useEffect(() => {
    async function fetchOriginalPost() {
      if (queries.posts.isSimpleRetweet(props.post)) {
        try {
          const original = await queries.posts.getOriginalPost(props.post);
          setOriginalPost(original);

          // Récupérer l'auteur du retweet
          const retweetAuthors = await queries.authors.ofPost(props.post.id);
          setRetweetedBy(retweetAuthors[0] || null);
        } catch (error) {
          console.error("[ERROR] Error fetching original post:", error);
          setOriginalPost(null);
          setRetweetedBy(null);
        }
      } else {
        setOriginalPost(null);
        setRetweetedBy(null);
      }
    }

    void fetchOriginalPost();
  }, [props.post]);
  // Récupérer le post cité si c'est un quote tweet
  useEffect(() => {
    async function fetchQuotedPost() {
      if (queries.posts.isQuoteRetweet(props.post)) {
        try {
          const quoted = await queries.posts.getOriginalPost(props.post);
          setQuotedPost(quoted);

          if (quoted) {
            const quotedAuthors = await queries.authors.ofPost(quoted.id);
            setQuotedPostAuthors(quotedAuthors);

            // Récupérer les catégories du post cité
            const quotedCategories = await queries.postsCategories.get(quoted.id);
            setQuotedPostCategories(quotedCategories);

            // Récupérer les médias du post cité
            try {
              setLoadingQuotedMedia(true);
              const { data, error } = await supabase.storage.from("post-media").list(quoted.id, {
                limit: 10,
                offset: 0,
                sortBy: { column: "name", order: "asc" },
              });

              if (!error && data.length > 0) {
                const urls = data.map(
                  (file) =>
                    supabase.storage.from("post-media").getPublicUrl(`${quoted.id}/${file.name}`).data.publicUrl,
                );
                setQuotedPostMediaUrls(urls);
              } else {
                setQuotedPostMediaUrls([]);
              }
            } catch {
              setQuotedPostMediaUrls([]);
            } finally {
              setLoadingQuotedMedia(false);
            }
          }
        } catch (error) {
          console.error("[ERROR] Error fetching quoted post:", error);
          setQuotedPost(null);
          setQuotedPostAuthors([]);
          setQuotedPostCategories([]);
          setQuotedPostMediaUrls([]);
        }
      } else {
        setQuotedPost(null);
        setQuotedPostAuthors([]);
        setQuotedPostCategories([]);
        setQuotedPostMediaUrls([]);
      }
    }

    void fetchQuotedPost();
  }, [props.post]);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    queries.posts
      .getChildren(props.post.id)
      .then((childPosts) => {
        setChildren(childPosts);
      })
      .catch((error: unknown) => {
        console.error("Error reloading replies:", error);
        setChildren([]);
      });
  };

  const handlePostClick = (e: React.MouseEvent) => {
    if (props.disableRedirect && isMainPost) return;

    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
      return;
    }

    // If it's a parent/child post, navigate with highlight
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

      // Call update callback immediately
      props.onPinUpdate?.();

      // Don't reload the page, state is already updated
    } catch (error) {
      console.error("Error during pinning:", error);
    } finally {
      setIsPinning(false);
    }
  };
  const handleLikeToggle = async () => {
    if (!auth.user || isLiking) return;

    try {
      setIsLiking(true);

      // Déterminer quel post liker (original pour les retweets simples)
      let targetPostId = props.post.id;
      if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
        targetPostId = originalPost.id;
      }

      console.log(
        `[DEBUG] Like toggle - Post: ${targetPostId}, Current isLiked: ${String(isLiked)}, User: ${auth.user.id}`,
      );

      if (isLiked) {
        console.log(`[DEBUG] Removing like for user ${auth.user.id} on post ${targetPostId}...`);

        // Check before removal
        const beforeRemove = await queries.like.doesUserLikePost(auth.user.id, props.post.id);
        console.log(`[DEBUG] Before remove - User likes post:`, beforeRemove);

        const result = await queries.like.remove(targetPostId);
        console.log(`[DEBUG] Remove function returned:`, result);

        // Check after removal
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
        console.log(`[DEBUG] Adding like for user ${auth.user.id} on post ${targetPostId}...`);
        const result = await queries.like.add(targetPostId);
        console.log(`[DEBUG] Add result:`, result);
        setLikeCount((prev) => prev + 1);
        setIsLiked(true);
        console.log(`[DEBUG] Like added, new state: isLiked=true, count=`, likeCount + 1);
      }
    } catch (error) {
      console.error("[ERROR] Error during like/unlike:", error);
      // In case of error, restore original state
      console.log(`[DEBUG] Error, restoring original state`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAbandonOwnership = async () => {
    if (!auth.user || isAbandoning) return;

    try {
      setIsAbandoning(true);

      // Abandon ownership
      await queries.authors.remove(props.post.id);

      // Close modal
      const modal = document.getElementById(`abandon-modal-${props.post.id}`) as HTMLDialogElement | null;
      modal?.close();

      // If it's a main post (ViewPost page)
      if (props.isMainPost) {
        if (isLastAuthor) {
          // Redirect to home with deletion message
          setTimeout(() => {
            void navigate("/", {
              state: {
                message: "Post deleted successfully after ownership abandonment",
                type: "success",
              },
            });
          }, 1000);
        } else {
          // Redirect to home with abandonment message
          setTimeout(() => {
            void navigate("/", {
              state: {
                message: "Post ownership abandoned successfully",
                type: "success",
              },
            });
          }, 1000);
        }
      } else {
        // If it's not a main post, refresh the page to update visually
        if (isLastAuthor) {
          // The post will be deleted, refresh the page
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Reload authors and refresh after a delay
          setTimeout(() => {
            void (async () => {
              try {
                const postAuthors = await queries.authors.ofPost(props.post.id);
                setAuthors(postAuthors);
                // Refresh the page to ensure everything is up to date
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              } catch {
                // The post may have been deleted, refresh the page
                window.location.reload();
              }
            })();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error during ownership abandonment:", error);
    } finally {
      setIsAbandoning(false);
    }
  };
  const formatPostDate = (date: Date): string => {
    try {
      if (isNaN(date.getTime())) {
        return "Invalid date";
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
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="w-full">
      {/* Parent posts */}
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

      {/* Main post */}
      <div className="relative" id={`post-${props.post.id}`}>
        {!isMainPost && depth > 0 && <div className="absolute top-0 left-6 h-full w-1 bg-gray-400"></div>}
        {!isMainPost && (
          <div className="absolute top-6 left-5.5 h-3 w-3 rounded-full border-2 border-white bg-gray-500"></div>
        )}{" "}
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
          {" "}
          {/* Indicateur de retweet simple */}
          {queries.posts.isSimpleRetweet(props.post) && retweetedBy && (
            <div className="mb-2 flex items-center gap-1 text-sm text-gray-500">
              <HiOutlineArrowPath className="h-4 w-4" />
              <span>{retweetedBy.handle} retweeted</span>
            </div>
          )}
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
              </button>{" "}
              <Dropdown id={`popover-post-${props.post.id}`} placement="bottom-end">
                {isSimpleRetweet
                  ? [
                      // Menu spécial pour les retweets : seulement abandon ownership
                      {
                        title: isAbandoning ? "Abandoning..." : "Abandon retweet",
                        icon: HiOutlineUserMinus,
                        onClick() {
                          setShowAbandonConfirm(true);
                        },
                      },
                    ]
                  : [
                      // Menu normal pour les posts originaux
                      {
                        title: "Edit",
                        icon: HiOutlinePencil,
                        href: `/post/${props.post.id}/edit`,
                      },
                      {
                        title: isPinned ? "Unpin" : "Pin",
                        icon: isPinned ? HiMapPin : HiOutlineMapPin,
                        onClick: () => {
                          void handlePinPost();
                        },
                      },
                      {
                        title: "Share",
                        icon: HiOutlineShare,
                        onClick: () => {
                          const shareUrl = `${window.location.origin}/post/${props.post.id}`;
                          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                          if (navigator.share) {
                            void navigator.share({
                              url: shareUrl,
                            });
                          } else {
                            void navigator.clipboard.writeText(shareUrl).then(() => {
                              alert("Profile link copied to clipboard!");
                            });
                          }
                          closePopover(`popover-post-${props.post.id}`);
                        },
                      },
                      {
                        title: isAbandoning ? "Abandoning..." : "Abandon ownership",
                        icon: HiOutlineUserMinus,
                        onClick() {
                          const modal = document.getElementById(
                            `abandon-modal-${props.post.id}`,
                          ) as HTMLDialogElement | null;
                          modal?.showModal();
                        },
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
                  src={utils.getAvatarUrl(mainAuthor)}
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
              </div>{" "}
              {/* Co-authors */}
              {authors.length > 1 && (
                <div className={`mt-1 ${isMainPost ? "text-sm" : "text-xs"} text-gray-600`}>
                  <span>co-written by </span>
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
                          <span>{index === filteredAuthors.length - 2 ? " and " : ", "}</span>
                        )}
                      </span>
                    ))}
                </div>
              )}{" "}
              {/* Post content */}
              {queries.posts.isSimpleRetweet(props.post) && originalPost ? (
                // Display original post for simple retweets
                <div className="mt-2 break-words whitespace-pre-wrap text-gray-900">{originalPost.body}</div>
              ) : (
                // Display normal content for other posts (including quote tweets)
                <>
                  {props.post.body && (
                    <div
                      className={`mt-2 break-words whitespace-pre-wrap text-gray-900 ${isMainPost ? "text-lg leading-relaxed" : ""}`}
                    >
                      {props.post.body}
                    </div>
                  )}

                  {/* Quote tweet display - integrated within post content */}
                  {queries.posts.isQuoteRetweet(props.post) && quotedPost && quotedPostAuthors.length > 0 && (
                    <div className="mt-3">
                      {/* Quoted post container - compact version */}
                      <div
                        className="cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          void navigate(`/post/${quotedPost.id}`);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {/* Quoted post author avatar - smaller */}
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 overflow-hidden rounded-full">
                              <img
                                src={
                                  quotedPostAuthors[0]
                                    ? utils.getAvatarUrl(quotedPostAuthors[0])
                                    : "https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                                }
                                alt={`${quotedPostAuthors[0]?.handle ?? "Unknown"}'s profile`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Quoted post content - compact */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-xs">
                              <span
                                className="cursor-pointer font-bold text-gray-900 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void navigate(`/@${quotedPostAuthors[0]?.handle}`);
                                }}
                              >
                                @{quotedPostAuthors[0]?.handle ?? "Unknown"}
                              </span>
                              <span className="text-gray-500">·</span>
                              <span className="text-gray-500">{formatPostDate(new Date(quotedPost.created_at))}</span>
                            </div>
                            {quotedPost.body && (
                              <div className="mt-1 line-clamp-3 text-sm break-words whitespace-pre-wrap text-gray-700">
                                {quotedPost.body}
                              </div>
                            )}
                            {/* Quoted post media carousel - smaller */}
                            {quotedPost.id && !loadingQuotedMedia && quotedPostMediaUrls.length > 0 && (
                              <div className="relative mt-2">
                                <div className="max-h-24 overflow-hidden rounded-lg">
                                  <img
                                    src={quotedPostMediaUrls[0]}
                                    alt="Quoted post media"
                                    className="h-24 w-full object-cover"
                                  />
                                </div>
                                {quotedPostMediaUrls.length > 1 && (
                                  <div className="bg-opacity-70 absolute right-1 bottom-1 rounded bg-black px-1.5 py-0.5 text-xs text-white">
                                    +{quotedPostMediaUrls.length - 1}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Quoted post categories - smaller */}
                            {quotedPostCategories.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {quotedPostCategories.slice(0, 3).map((category) => (
                                  <span
                                    key={category.id}
                                    className="inline-flex cursor-pointer items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800 hover:bg-green-200"
                                  >
                                    #{category.name}
                                  </span>
                                ))}
                                {quotedPostCategories.length > 3 && (
                                  <span className="text-xs text-gray-500">+{quotedPostCategories.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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

                {/* Button to show replies - only for child posts on ViewPost */}
                {(() => {
                  const shouldShow =
                    props.allowExpandChildren &&
                    !isMainPost &&
                    !showChildrenPosts &&
                    !props.showChildren &&
                    children.length > 0;

                  console.log(`Debug replies button - Post ${props.post.id}:`, {
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
                    {children.length === 1 ? "Show reply" : `Show ${children.length.toString()} replies`}
                  </button>
                )}

                {/* Button to hide replies when displayed via local state */}
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
                      Hide {children.length.toString()} repl{children.length > 1 ? "ies" : "y"}
                    </button>
                  )}
                <button
                  className={`group flex items-center gap-2 transition-colors ${
                    hasRetweeted
                      ? "text-green-600 hover:text-green-700"
                      : retweetCount > 0
                        ? "cursor-not-allowed text-gray-400"
                        : "text-gray-500 hover:text-green-500"
                  }`}
                  disabled={retweetCount > 0 && !hasRetweeted}
                  onClick={(e) => {
                    e.stopPropagation();

                    // Si le bouton est désactivé, ne rien faire
                    if (retweetCount > 0 && !hasRetweeted) return;

                    // Wrap async logic to avoid async handlers
                    void (async () => {
                      if (hasRetweeted) {
                        try {
                          // Déterminer quel post utiliser pour chercher les retweets
                          let targetPostId = props.post.id;
                          if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
                            targetPostId = originalPost.id;
                          }
                          // Trouver le retweet de l'utilisateur et l'abandonner
                          const retweets = await queries.posts.getRetweetsOf(targetPostId);

                          // Rechercher le retweet de l'utilisateur actuel
                          let userRetweetId: string | null = null;
                          for (const rt of retweets) {
                            const retweetAuthors = await queries.authors.ofPost(rt.id);
                            if (retweetAuthors.some((author) => author.id === auth.user?.id)) {
                              userRetweetId = rt.id;
                              break;
                            }
                          }

                          if (userRetweetId) {
                            await queries.authors.remove(userRetweetId);
                          }
                          // Update state immediately
                          const updatedRetweets = await queries.posts.getRetweetsOf(targetPostId);
                          setRetweetCount(updatedRetweets.length);
                          setHasRetweeted(false);

                          // If this is a simple retweet post, trigger parent update
                          if (queries.posts.isSimpleRetweet(props.post)) {
                            // For simple retweets, we need to refresh the parent component
                            props.onPinUpdate?.();
                          }

                          console.log(`[DEBUG] Retweet deleted successfully, new count:`, updatedRetweets.length);
                        } catch (error) {
                          console.error("Error deleting retweet:", error);
                          if (error instanceof Error) {
                            alert(`Error: ${error.message}`);
                          } else {
                            alert("Error deleting retweet.");
                          }
                        }
                      } else {
                        // Ouvrir le dialog pour retweeter
                        const modal = document.getElementById(`retweet-modal-${props.post.id}`) as HTMLDialogElement;
                        modal.showModal();
                      }
                    })();
                  }}
                  title={
                    retweetCount > 0 && !hasRetweeted
                      ? "This post has already been retweeted"
                      : hasRetweeted
                        ? "Delete retweet"
                        : "Retweet"
                  }
                >
                  <div
                    className={`rounded-full p-2 transition-colors ${
                      hasRetweeted
                        ? "bg-green-100 group-hover:bg-green-200"
                        : retweetCount > 0
                          ? "bg-gray-100"
                          : "group-hover:bg-green-50"
                    }`}
                  >
                    <HiOutlineArrowPath className="h-5 w-5" />
                  </div>
                  <span className="text-sm">{retweetCount}</span>
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
          )}{" "}
        </div>
      </div>

      {/* Child posts */}
      {(props.showChildren ?? showChildrenPosts) && children.length > 0 && (
        <div className="relative">
          {children.map((child) => (
            <div key={child.id} className="relative">
              {/* Enhanced hierarchical connection line */}
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

              {/* Horizontal connector */}
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

              {/* Connection ball */}
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

      {/* Ownership abandonment confirmation modal */}
      <dialog id={`abandon-modal-${props.post.id}`} className="modal">
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
                    <p className="text-sm font-medium text-red-800">Warning: Post deletion</p>
                    <p className="mt-1 text-sm text-red-700">
                      You are the last author of this post. Abandoning it will result in its permanent deletion.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">
                You will abandon ownership of this post. You will no longer be able to modify or delete it.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                const modal = document.getElementById(`abandon-modal-${props.post.id}`) as HTMLDialogElement | null;
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
      {/* DaisyUI retweet choice dialog */}
      <dialog id={`retweet-modal-${props.post.id}`} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Retweet this post</h3>

          <div className="py-4">
            {" "}
            <p className="text-gray-700">How would you like to retweet @{mainAuthor?.handle}&apos;s post?</p>
          </div>

          <div className="modal-action flex-col gap-3">
            <button
              onClick={() => {
                // Async IIFE to handle retweet
                void (async () => {
                  // Close the dialog
                  const modal = document.getElementById(`retweet-modal-${props.post.id}`) as HTMLDialogElement;
                  modal.close();
                  try {
                    // Determine which post to retweet (original for simple retweets)
                    let targetPostId = props.post.id;
                    if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
                      targetPostId = originalPost.id;
                    }
                    await queries.posts.retweet(targetPostId, "");
                    // Update retweet counter and hasRetweeted state
                    const retweets = await queries.posts.getRetweetsOf(targetPostId);
                    setRetweetCount(retweets.length);
                    setHasRetweeted(true);
                    console.log(`[DEBUG] Simple retweet successful, new count:`, retweets.length);
                  } catch (error) {
                    console.error("Error during retweet:", error);
                    if (error instanceof Error) {
                      alert(`Error: ${error.message}`);
                    } else {
                      alert("Error during retweet. Please try again.");
                    }
                  }
                })();
              }}
              className="btn btn-success w-full justify-start"
            >
              <HiOutlineArrowPath className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Retweet</div>
                <div className="text-sm opacity-70">Share instantly to your profile</div>
              </div>
            </button>{" "}
            <button
              onClick={() => {
                // Close the dialog
                const modal = document.getElementById(`retweet-modal-${props.post.id}`) as HTMLDialogElement;
                modal.close();

                // Open quote tweet modal
                const quoteTweetModal = document.getElementById(
                  `quote-tweet-modal-${props.post.id}`,
                ) as HTMLDialogElement;
                quoteTweetModal.showModal();
              }}
              className="btn btn-primary w-full justify-start"
            >
              <HiOutlineChatBubbleOvalLeft className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Quote Tweet</div>
                <div className="text-sm opacity-70">Add your comment</div>
              </div>
            </button>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cancel</button>
              </form>
            </div>
          </div>
        </div>{" "}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      {/* Quote Tweet Modal */}
      <QuoteTweetModal
        post={props.post}
        originalPost={originalPost}
        modalId={`quote-tweet-modal-${props.post.id}`}
        onSuccess={() => {
          // Refresh retweet count after quote tweet
          void (async () => {
            try {
              let targetPostId = props.post.id;
              if (queries.posts.isSimpleRetweet(props.post) && originalPost) {
                targetPostId = originalPost.id;
              }
              const retweets = await queries.posts.getRetweetsOf(targetPostId);
              setRetweetCount(retweets.length);
              setHasRetweeted(true);
            } catch (error) {
              console.error("Error refreshing retweet count:", error);
            }
          })();
        }}
      />
    </div>
  );
}
