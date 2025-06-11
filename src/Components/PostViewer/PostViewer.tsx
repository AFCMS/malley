import { HiOutlineArrowPath, HiOutlineBookmark, HiOutlineChatBubbleOvalLeft, HiOutlineHeart } from "react-icons/hi2";
import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { useEffect, useState } from "react";

import CategoryBadge from "../CategoryBadge/CategoryBadge";
import MediaCarousel from "../MediaCarousel/MediaCarousel";
import { Tables } from "../../contexts/supabase/database";
import { formatDatePost } from "../../utils/date";

interface PostViewerProps {
  post: Tables<"posts">;
}

export default function PostViewer(props: PostViewerProps) {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(false);
  const [authors, setAuthors] = useState<Tables<"profiles">[]>([]);

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
        console.log(data);

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

  // Get the first author for display (main poster)
  const mainAuthor = authors.length > 0 ? authors[0] : null;

  return (
    <div className="border-b border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50/50">
      {/* Header: Profile pic, handle, and date */}
      <div className="flex items-start gap-3">
        {/* Profile picture */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 overflow-hidden rounded-full">
            <img
              src={mainAuthor ? utils.getAvatarUrl(mainAuthor) : ""}
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
                <CategoryBadge key={category.id} name={category.name} />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex max-w-md items-center justify-between">
            {/* Reply button */}
            <button className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-blue-500">
              <div className="rounded-full p-2 transition-colors group-hover:bg-blue-50">
                <HiOutlineChatBubbleOvalLeft className="h-5 w-5" />
              </div>
              <span className="text-sm">24</span>
            </button>

            {/* Retweet button */}
            <button className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-green-500">
              <div className="rounded-full p-2 transition-colors group-hover:bg-green-50">
                <HiOutlineArrowPath className="h-5 w-5" />
              </div>
              <span className="text-sm">12</span>
            </button>

            {/* Like button */}
            <button className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-red-500">
              <div className="rounded-full p-2 transition-colors group-hover:bg-red-50">
                <HiOutlineHeart className="h-5 w-5" />
              </div>
              <span className="text-sm">156</span>
            </button>

            {/* Bookmark button */}
            <button className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-blue-500">
              <div className="rounded-full p-2 transition-colors group-hover:bg-blue-50">
                <HiOutlineBookmark className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
