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
  /** Si true, désactive la redirection pour éviter les boucles dans ViewPost */
  disableRedirect?: boolean;
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
      if (!props.showParents || !props.post.parent_post) return;

      try {
        const parentChain = await queries.posts.getParentChain(props.post.parent_post, 3);
        setParents(parentChain);
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
          return;
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
    // Recharger les posts enfants
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
    // Ne pas rediriger si on clique sur un bouton ou si la redirection est désactivée
    if (props.disableRedirect) return;

    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
      return;
    }

    void navigate(`/post/${props.post.id}`);
  };

  // Get the first author for display (main poster)
  const mainAuthor = authors.length > 0 ? authors[0] : null;

  return (
    <div className="w-full">
      {/* Posts parents */}
      {props.showParents && parents.length > 0 && (
        <div className="border-l-2 border-gray-200 pl-4">
          {parents.reverse().map((parent) => (
            <PostViewer key={parent.id} post={parent} disableRedirect={props.disableRedirect} />
          ))}
        </div>
      )}

      {/* Post principal */}
      <div
        className={`border-b border-gray-200 px-4 py-3 transition-colors ${
          props.disableRedirect ? "cursor-default" : "cursor-pointer hover:bg-gray-50/50"
        }`}
        onClick={handlePostClick}
      >
        {/* Header: Profile pic, handle, and date */}
        <div className="flex items-start gap-3">
          {/* Profile picture */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 overflow-hidden rounded-full">
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
            <div className="flex items-center gap-1 text-sm">
              <span className="cursor-pointer font-bold text-gray-900 hover:underline">
                @{mainAuthor?.handle ?? "Unknown Author"}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500" title={dateCreation.toLocaleDateString()}>
                {formatDatePost(dateCreation)}
              </span>
            </div>

            {/* Post content */}
            {props.post.body && (
              <div className="mt-2 break-words whitespace-pre-wrap text-gray-900">{props.post.body}</div>
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
            <div className="mt-3 flex max-w-md items-center justify-between">
              {/* Reply button */}
              <button
                className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation(); // Empêche la propagation vers handlePostClick
                  setShowReplyForm(!showReplyForm);
                }}
              >
                <div className="rounded-full p-2 transition-colors group-hover:bg-blue-50">
                  <HiOutlineChatBubbleOvalLeft className="h-5 w-5" />
                </div>
                <span className="text-sm">{children.length}</span>
              </button>

              {/* Retweet button */}
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

              {/* Like button */}
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

              {/* Bookmark button */}
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
        {showReplyForm && auth.isAuthenticated && !props.disableRedirect && (
          <div
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

      {/* Posts enfants */}
      {props.showChildren && children.length > 0 && (
        <div className="border-l-2 border-gray-200 pl-4">
          {children.map((child) => (
            <PostViewer key={child.id} post={child} showChildren={true} disableRedirect={props.disableRedirect} />
          ))}
        </div>
      )}
    </div>
  );
}
