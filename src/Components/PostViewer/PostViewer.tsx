import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HiOutlineArrowPath, HiOutlineBookmark, HiOutlineChatBubbleOvalLeft, HiOutlineHeart } from "react-icons/hi2";

import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import MediaCarousel from "../MediaCarousel/MediaCarousel";
import PostAdd from "../PostAdd/PostAdd";
import { formatDatePost } from "../../utils/date";
import { useAuth } from "../../contexts/auth/AuthContext";

interface PostViewerProps {
  post: Tables<"posts">;
  showParents?: boolean;
  showChildren?: boolean;
  disableRedirect?: boolean;
  isMainPost?: boolean;
  depth?: number;
}

export default function PostViewer(props: PostViewerProps) {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(false);
  const [authors, setAuthors] = useState<Tables<"profiles">[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [children, setChildren] = useState<Tables<"posts">[]>([]);
  const [parents, setParents] = useState<Tables<"posts">[]>([]);

  const auth = useAuth();
  const navigate = useNavigate();
  const dateCreation = new Date(props.post.created_at);
  const depth = props.depth ?? 0;
  const isMainPost = props.isMainPost ?? false;

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
      if (!props.showChildren) return;

      try {
        const childPosts = await queries.posts.getChildren(props.post.id);
        setChildren(childPosts);
      } catch {
        setChildren([]);
      }
    }

    void fetchChildren();
  }, [props.post.id, props.showChildren]);

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
  }, [props.post.id, props.showParents, props.post.parent_post, isMainPost]);

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

    void navigate(`/post/${props.post.id}`);
  };

  const mainAuthor = authors.length > 0 ? authors[0] : null;

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
                  />
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Post principal */}
      <div className="relative">
        {!isMainPost && depth > 0 && <div className="absolute top-0 left-6 h-full w-1 bg-gray-400"></div>}

        {!isMainPost && (
          <div className="absolute top-6 left-5.5 h-3 w-3 rounded-full border-2 border-white bg-gray-500"></div>
        )}

        <div
          className={`relative transition-colors ${
            isMainPost
              ? "border-b-2 border-gray-300 bg-white px-4 py-6"
              : "border-b border-gray-100 px-4 py-3 hover:bg-gray-50/50"
          } ${props.disableRedirect && isMainPost ? "cursor-default" : "cursor-pointer"} ${depth > 0 ? "ml-10" : ""} `}
          onClick={handlePostClick}
        >
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
                  {formatDatePost(dateCreation)}
                </span>
              </div>

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
                    setShowReplyForm(!showReplyForm);
                  }}
                >
                  <div className="rounded-full p-2 transition-colors group-hover:bg-blue-50">
                    <HiOutlineChatBubbleOvalLeft className="h-5 w-5" />
                  </div>
                  <span className="text-sm">{children.length}</span>
                </button>

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
      {props.showChildren && children.length > 0 && (
        <div className="relative">
          {children.map((child, index) => (
            <div key={child.id} className="relative">
              {index < children.length - 1 && <div className="absolute top-0 left-6 h-full w-1 bg-gray-400"></div>}
              <PostViewer
                post={child}
                showChildren={true}
                showParents={false}
                disableRedirect={props.disableRedirect}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
