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

  const [isLastAuthor, setIsLastAuthor] = useState(false);

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
  }, [props.post.id, auth.user]);

  // Fetch categories
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

  // Fetch likes
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
        console.error("[ERROR] Error fetching likes:", error);
        setLikeCount(0);
        setIsLiked(false);
      }
    }

    void fetchLikes();
  }, [props.post.id, auth.user]);

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
      console.log(
        `[DEBUG] Like toggle - Post: ${props.post.id}, Current isLiked: ${String(isLiked)}, User: ${auth.user.id}`,
      );

      if (isLiked) {
        console.log(`[DEBUG] Removing like for user ${auth.user.id} on post ${props.post.id}...`);

        // Check before removal
        const beforeRemove = await queries.like.doesUserLikePost(auth.user.id, props.post.id);
        console.log(`[DEBUG] Before remove - User likes post:`, beforeRemove);

        const result = await queries.like.remove(props.post.id);
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
        console.log(`[DEBUG] Adding like for user ${auth.user.id} on post ${props.post.id}...`);
        const result = await queries.like.add(props.post.id);
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
          {/* Author menu */}
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
              <Dropdown id={`popover-post-${props.post.id}`} placement="bottom-end">
                {[
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
              )}

              {/* Post content */}
              {props.post.body && (
                <div
                  className={`mt-2 break-words whitespace-pre-wrap text-gray-900 ${isMainPost ? "text-lg leading-relaxed" : ""}`}
                >
                  {props.post.body}
                </div>
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

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Cancel</button>
            </form>
            <button
              onClick={() => {
                void handleAbandonOwnership();
              }}
              disabled={isAbandoning}
              className={`btn text-white ${isLastAuthor ? "btn-error" : "btn-warning"}`}
            >
              {isAbandoning ? (
                <div className="flex items-center gap-2">
                  <div className="loading loading-spinner loading-sm"></div>
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
    </div>
  );
}
