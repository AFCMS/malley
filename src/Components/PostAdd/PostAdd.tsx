import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { queries, supabase } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import CategoriesChooser from "../CategoriesChooser/CategoriesChooser";
import { Tables } from "../../contexts/supabase/database";
import MediaCarousel from "../MediaCarousel/MediaCarousel";

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

  const auth = useAuth();
  const navigate = useNavigate();

  // Détermine si on est en mode édition
  const isEditMode = Boolean(editPostId);

  // Charger le post à éditer si on est en mode édition
  useEffect(() => {
    async function loadPostForEdit() {
      if (!isEditMode || !editPostId) return;

      try {
        setIsLoadingPost(true);

        // Charger le post
        const post = await queries.posts.get(editPostId);
        setBody(post.body ?? "");

        // Vérifier que l'utilisateur est bien auteur du post
        if (auth.user) {
          const authors = await queries.authors.ofPost(editPostId);
          const isAuthor = authors.some((author) => author.id === auth.user?.id);

          if (!isAuthor) {
            setError("Vous n'êtes pas autorisé à modifier ce post");
            return;
          }
        } else {
          setError("Vous devez être connecté pour modifier un post");
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
  }, [isEditMode, editPostId, auth.user, showCategories]);

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
        <div className="text-gray-500">Chargement du post à modifier...</div>
      </div>
    );
  }

  const defaultPlaceholder = isEditMode
    ? "Modifiez votre post..."
    : parentPostId
      ? "Écrivez votre réponse..."
      : "Écrivez votre post...";

  return (
    <div className={isReply ? "border-t border-gray-200 p-3" : ""}>
      {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={`flex gap-3 ${isReply ? "" : "mb-4"}`}>
          {/* Profile picture for replies */}
          {isReply && auth.profile && (
            <div className="flex-shrink-0">
              <div className="h-10 w-10 overflow-hidden rounded-full">
                <img
                  src={auth.profile.profile_pic ?? "https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"}
                  alt="Your profile"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex-1">
            <textarea
              className={`textarea w-full resize-none ${isReply ? "min-h-[80px] text-sm" : ""}`}
              placeholder={placeholder ?? defaultPlaceholder}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
              rows={isReply ? 3 : 5}
              required
            />

            {/* Affichage des médias existants en mode édition */}
            {isEditMode && (
              <div className="mt-2">
                {loadingExistingMedia ? (
                  <div className="text-sm text-gray-500">Chargement des médias...</div>
                ) : existingMediaUrls.length > 0 ? (
                  <div>
                    <div className="mb-2 text-sm text-gray-600">Médias associés au post (non modifiables) :</div>
                    <MediaCarousel mediaUrls={existingMediaUrls} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Aucun média associé à ce post</div>
                )}
              </div>
            )}

            {/* Upload de fichiers seulement en mode création et si activé */}
            {!isEditMode && showFileUpload && (
              <div className="mt-2">
                <input
                  id={`post-file-${parentPostId ?? "main"}`}
                  type="file"
                  className="file-input file-input-sm w-full"
                  multiple
                  onChange={handleFileChange}
                />
                {mediaFiles.length > 0 && (
                  <div className="mt-1 text-sm text-gray-600">{mediaFiles.length} fichier(s) sélectionné(s)</div>
                )}
              </div>
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
                className={`btn btn-primary ${isReply ? "btn-sm" : ""}`}
                disabled={isLoading || !body.trim()}
              >
                {isLoading
                  ? isEditMode
                    ? "Modification..."
                    : parentPostId
                      ? "Réponse..."
                      : "Publication..."
                  : isEditMode
                    ? "Modifier"
                    : parentPostId
                      ? "Répondre"
                      : "Publier"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
