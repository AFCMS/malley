import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import CategoriesChooser from "../CategoriesChooser/CategoriesChooser";
import { Tables } from "../../contexts/supabase/database";
import MediaCarousel from "../MediaCarousel/MediaCarousel";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiData {
  native: string;
  id: string;
  name: string;
  colons: string;
  skin: number;
  unified: string;
}

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
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [loadingExistingMedia, setLoadingExistingMedia] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const auth = useAuth();
  const navigate = useNavigate();

  // Détermine si on est en mode édition
  const isEditMode = Boolean(editPostId);

  // Charger le post à éditer si on est en mode édition
  useEffect(() => {
    async function loadPostForEdit() {
      if (!isEditMode || !editPostId) return;

      // Attendre que l'authentification soit chargée
      if (!auth.isAuthenticated) {
        setError("Vous devez être connecté pour modifier un post");
        return;
      }

      if (!auth.user) {
        return; // Attendre que l'utilisateur soit chargé
      }

      try {
        setIsLoadingPost(true);

        // Charger le post
        const post = await queries.posts.get(editPostId);
        setBody(post.body ?? "");

        // Vérifier que l'utilisateur est bien auteur du post
        const authors = await queries.authors.ofPost(editPostId);
        const currentUserId = auth.user.id;
        const isAuthor = authors.some((author) => author.id === currentUserId);

        if (!isAuthor) {
          setError("Vous n'êtes pas autorisé à modifier ce post");
          return;
        }

        // Charger les catégories du post
        if (showCategories) {
          try {
            const categories = await queries.postsCategories.get(editPostId);
            setSelectedCategories(categories);
          } catch (err: unknown) {
            console.error("Erreur lors du chargement des catégories:", err);
          }
        }

        // Charger les médias existants en mode édition
        await loadExistingMedia(editPostId);
      } catch (err: unknown) {
        console.error("Erreur lors du chargement du post:", err);
        setError("Impossible de charger le post à modifier");
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

  const handleEmojiSelect = (emoji: EmojiData) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = body.substring(0, cursorPos);
    const textAfter = body.substring(cursorPos);

    const newText = textBefore + emoji.native + textAfter;
    setBody(newText);

    // Remettre le focus sur le textarea après insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + emoji.native.length, cursorPos + emoji.native.length);
    }, 0);
  };

  const trySubmiting = async () => {
    try {
      // Vérification que body n'est pas vide
      if (!body.trim()) {
        throw new Error("Le contenu du post ne peut pas être vide");
      }

      if (isEditMode && editPostId) {
        // Mode édition : mettre à jour le post existant
        const success = await queries.posts.edit(editPostId, body);

        if (!success) {
          throw new Error("Échec de la modification du post");
        }

        setError(null);
        onSuccess?.(editPostId);
        if (!isReply) {
          void navigate(`/post/${editPostId}`);
        }
      } else {
        // Mode création : créer un nouveau post
        const id: string = await queries.posts.new(body, mediaFiles, parentPostId);

        // Ajouter les catégories seulement si le composant les supporte
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
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth.isAuthenticated || !auth.profile) {
      setError("Vous devez être connecté pour publier.");
      setIsLoading(false);
      return;
    }

    trySubmiting().catch((error: unknown) => {
      console.error("Erreur lors de la soumission:", error);
      setError(error instanceof Error ? error.message : "Erreur lors de la soumission");
      setIsLoading(false);
    });
  };

  // Affichage du loading pendant le chargement du post à éditer
  if (isEditMode && isLoadingPost) {
    return (
      <div className={isReply ? "p-2" : "px-4"}>
        <div className="loading loading-dots loading-md text-base-content/60"></div>
        <span className="text-base-content/60 ml-2">Chargement du post à modifier...</span>
      </div>
    );
  }

  const defaultPlaceholder = isEditMode
    ? "Modifiez votre post..."
    : parentPostId
      ? "Écrivez votre réponse..."
      : "Écrivez votre post...";

  return (
    <div className={isReply ? "border-base-300 border-t p-3" : ""}>
      {error && (
        <div className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
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

              {/* Bouton emoji - Toujours visible en mode création ET édition */}
              <div className="dropdown dropdown-bottom dropdown-end absolute right-3 bottom-3 z-50">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm hover:bg-base-200 bg-base-100/80 border-base-300/50 h-9 min-h-9 w-9 border p-0 shadow-sm backdrop-blur-sm"
                  title={`Ajouter un emoji ${isEditMode ? "(mode édition)" : ""}`}
                  style={{ fontSize: "16px" }}
                >
                  😀
                </div>
                <div
                  tabIndex={0}
                  className="dropdown-content bg-base-100 rounded-box border-base-300 z-[999] mt-1 overflow-hidden border p-2 shadow-2xl"
                  style={{ transform: "translateX(-20px)" }}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    locale="fr"
                    previewPosition="none"
                    searchPosition="sticky"
                    navPosition="bottom"
                    perLine={8}
                    maxFrequentRows={2}
                  />
                </div>
              </div>
            </div>

            {/* Affichage des médias existants en mode édition */}
            {isEditMode && (
              <div className="mt-2">
                {loadingExistingMedia ? (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-base-content/60 text-sm">Chargement des médias...</span>
                  </div>
                ) : existingMediaUrls.length > 0 ? (
                  <div>
                    <div className="text-base-content/70 mb-2 text-sm font-medium">
                      Médias associés au post (non modifiables) :
                    </div>
                    <MediaCarousel mediaUrls={existingMediaUrls} />
                  </div>
                ) : (
                  <div className="text-base-content/50 text-sm">Aucun média associé à ce post</div>
                )}
              </div>
            )}

            {/* Upload de fichiers seulement en mode création et si activé */}
            {!isEditMode && showFileUpload && (
              <fieldset className="fieldset mb-4">
                <legend className="fieldset-legend">Ajouter des images ou médias (optionnel)</legend>
                <input
                  id={`post-file-${parentPostId ?? "main"}`}
                  type="file"
                  className="file-input w-full"
                  multiple
                  onChange={handleFileChange}
                />{" "}
                {mediaFiles.length > 0 && (
                  <div className="text-base-content/60 mt-1 text-sm">{mediaFiles.length} fichier(s) sélectionné(s)</div>
                )}
              </fieldset>
            )}

            {/* Catégories seulement si activées */}
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
                {!isLoading && <>{isEditMode ? "Modifier" : parentPostId ? "Répondre" : "Publier"}</>}
                {isLoading && <span className="loading loading-spinner loading-sm"></span>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
