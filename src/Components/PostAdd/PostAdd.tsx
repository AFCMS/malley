import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { HiOutlineExclamationCircle } from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import CategoriesChooser from "../CategoriesChooser/CategoriesChooser";
import MediaCarousel from "../MediaCarousel/MediaCarousel";
import EmojiPicker from "../EmojiPicker/EmojiPicker";

interface PostAddProps {
  /** Post ID if editing an existing post */
  editPostId?: string;
  /** Parent post ID if replying to a post */
  parentPostId?: string;
  /** Callback called after successful submission */
  onSuccess?: (postId: string) => void;
  /** Whether to show the categories chooser */
  showCategories?: boolean;
  /** Whether to show file upload */
  showFileUpload?: boolean;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Whether this is a compact reply form */
  isReply?: boolean;
}

export default function PostAdd({
  editPostId,
  parentPostId,
  onSuccess,
  showCategories = true,
  showFileUpload = true,
  placeholder,
  isReply = false,
}: PostAddProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Tables<"categories">[]>([]);
  const [initialCategories, setInitialCategories] = useState<Tables<"categories">[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [loadingExistingMedia, setLoadingExistingMedia] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const auth = useAuth();
  const navigate = useNavigate();

  // Determine if we are in edit mode
  const isEditMode = Boolean(editPostId);

  // Load the post to edit if we are in edit mode
  useEffect(() => {
    async function loadPostForEdit() {
      if (!isEditMode || !editPostId) return;

      // Wait for authentication to be loaded
      if (!auth.isAuthenticated) {
        setError("You must be logged in to edit a post.");
        return;
      }

      if (!auth.user) {
        return; // Wait for user to be loaded
      }

      try {
        setIsLoadingPost(true);

        // Charger le post
        const post = await queries.posts.get(editPostId);
        setBody(post.body ?? "");

        // Check that the user is the author of the post
        const authors = await queries.authors.ofPost(editPostId);
        const currentUserId = auth.user.id;
        const isAuthor = authors.some((author) => author.id === currentUserId);

        if (!isAuthor) {
          setError("You are not allowed to edit this post.");
          return;
        }

        // Load post categories
        if (showCategories) {
          try {
            const categories = await queries.postsCategories.get(editPostId);
            setSelectedCategories(categories);
            setInitialCategories(categories);
          } catch (err: unknown) {
            console.error("Error loading categories:", err);
          }
        }

        // Load existing media in edit mode
        await loadExistingMedia(editPostId);
      } catch (err: unknown) {
        console.error("Error loading post:", err);
        setError("Unable to load the post to edit");
      } finally {
        setIsLoadingPost(false);
      }
    }

    void loadPostForEdit();
  }, [isEditMode, editPostId, auth.user, auth.isAuthenticated, auth.profile, showCategories]);

  const loadExistingMedia = async (postId: string) => {
    try {
      setLoadingExistingMedia(true);
      const { data, error } = await supabase.storage.from("post-media").list(postId, {
        limit: 10,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

      if (!error && data.length > 0) {
        const urls = data.map(
          (file) => supabase.storage.from("post-media").getPublicUrl(`${postId}/${file.name}`).data.publicUrl,
        );
        setExistingMediaUrls(urls);
      }
    } catch {
      setExistingMediaUrls([]);
    } finally {
      setLoadingExistingMedia(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = body.substring(0, cursorPos);
    const textAfter = body.substring(cursorPos);

    const newText = textBefore + emoji + textAfter;
    setBody(newText);

    // Restore focus to textarea after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    }, 0);
  };

  const trySubmiting = async () => {
    try {
      // Check that body is not empty
      if (!body.trim()) {
        throw new Error("Post content cannot be empty");
      }

      if (isEditMode && editPostId) {
        // Edit mode: update existing post
        const success = await queries.posts.edit(editPostId, body);

        if (!success) {
          throw new Error("Failed to edit post");
        }

        // Update categories only if component supports them
        if (showCategories) {
          // Trouver les catégories à ajouter
          const categoriesToAdd = selectedCategories.filter(
            (selected) => !initialCategories.find((initial) => initial.id === selected.id),
          );

          // Trouver les catégories à supprimer
          const categoriesToRemove = initialCategories.filter(
            (initial) => !selectedCategories.find((selected) => selected.id === initial.id),
          );

          // Ajouter les nouvelles catégories
          for (const category of categoriesToAdd) {
            await queries.postsCategories.add(editPostId, category.name);
          }

          // Supprimer les catégories désélectionnées
          for (const category of categoriesToRemove) {
            await queries.postsCategories.remove(editPostId, category.name);
          }
        }

        setError(null);
        onSuccess?.(editPostId);
        if (!isReply) {
          void navigate(`/post/${editPostId}`);
        }
      } else {
        // Creation mode: create new post
        const id: string = await queries.posts.new(body, mediaFiles, parentPostId);

        // Add categories only if component supports them
        if (showCategories) {
          for (const category of selectedCategories) {
            await queries.postsCategories.add(id, category.name);
          }
        }

        setError(null);
        setBody("");
        setMediaFiles([]);
        setSelectedCategories([]);

        onSuccess?.(id);

        if (!isReply && !parentPostId) {
          void navigate("/");
        }
      }
    } catch (err: unknown) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth.isAuthenticated || !auth.profile) {
      setError("You must be logged in to post.");
      setIsLoading(false);
      return;
    }

    trySubmiting().catch((error: unknown) => {
      console.error("Error during submission:", error);
      setError(error instanceof Error ? error.message : "Error during submission");
      setIsLoading(false);
    });
  };

  // Display loading while loading post to edit
  if (isEditMode && isLoadingPost) {
    return (
      <div className={isReply ? "p-2" : "px-4"}>
        <div className="loading loading-dots loading-md text-base-content/60"></div>
        <span className="text-base-content/60 ml-2">Loading post to edit...</span>
      </div>
    );
  }

  const defaultPlaceholder = isEditMode
    ? "Edit your post..."
    : parentPostId
      ? "Write your reply..."
      : "Write your post...";

  return (
    <div className={isReply ? "border-base-300 border-t p-3" : ""}>
      {error && (
        <div className="alert alert-error mb-4">
          <HiOutlineExclamationCircle className="size-6" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={`flex gap-3 ${isReply ? "" : "mb-4"}`}>
          {/* Profile picture for replies */}
          {isReply && auth.profile && (
            <div className="flex-shrink-0">
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img src={utils.getAvatarUrl(auth.profile)} alt="Your profile" />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                className={`textarea w-full resize-none ${isReply ? "min-h-[80px] text-sm" : ""}`}
                placeholder={placeholder ?? defaultPlaceholder}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                }}
                rows={isReply ? 3 : 5}
                required
              />

              <div className="absolute right-3 bottom-3 z-50">
                <EmojiPicker id="add-post-emoji" onEmojiSelect={handleEmojiSelect} />
              </div>
            </div>

            {/* Display existing media in edit mode */}
            {isEditMode && (
              <div className="mt-2">
                {loadingExistingMedia ? (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-base-content/60 text-sm">Loading media...</span>
                  </div>
                ) : existingMediaUrls.length > 0 ? (
                  <div>
                    <div className="text-base-content/70 mb-2 text-sm font-medium">
                      Media associated with the post (non-editable):
                    </div>
                    <MediaCarousel mediaUrls={existingMediaUrls} />
                  </div>
                ) : (
                  <div className="text-base-content/50 text-sm">No media associated with this post</div>
                )}
              </div>
            )}

            {/* File upload only in creation mode and if enabled */}
            {!isEditMode && showFileUpload && (
              <fieldset className="fieldset mb-4">
                <legend className="fieldset-legend">Add images or media (optional)</legend>
                <input
                  id={`post-file-${parentPostId ?? "main"}`}
                  type="file"
                  className="file-input w-full"
                  multiple
                  onChange={handleFileChange}
                />{" "}
                {mediaFiles.length > 0 && (
                  <div className="text-base-content/60 mt-1 text-sm">{mediaFiles.length} file(s) selected</div>
                )}
              </fieldset>
            )}

            {/* Categories only if enabled */}
            {showCategories && (
              <div className="mt-2">
                <CategoriesChooser
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                />
              </div>
            )}

            <div className={`flex justify-end gap-2 ${isReply ? "mt-2" : "mt-4"}`}>
              <button
                type="submit"
                className={`btn btn-primary ${isReply ? "btn-sm" : ""} ${isLoading ? "loading" : ""}`}
                disabled={isLoading || !body.trim()}
              >
                {!isLoading && <>{isEditMode ? "Edit" : parentPostId ? "Reply" : "Post"}</>}
                {isLoading && <span className="loading loading-spinner loading-sm"></span>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
