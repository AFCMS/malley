import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import CategoriesChooser from "../../Components/CategoriesChooser/CategoriesChooser";
import { Tables } from "../../contexts/supabase/database";

export default function AddPost() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Tables<"categories">[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  // Détermine si on est en mode édition
  const isEditMode = Boolean(postId);

  // Charger le post à éditer si on est en mode édition
  useEffect(() => {
    async function loadPostForEdit() {
      if (!isEditMode || !postId) return;

      try {
        setIsLoadingPost(true);

        // Charger le post
        const post = await queries.posts.get(postId);
        setBody(post.body ?? "");

        // Vérifier que l'utilisateur est bien auteur du post
        if (auth.user) {
          const authors = await queries.authors.ofPost(postId);
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
        try {
          const categories = await queries.postsCategories.get(postId);
          setSelectedCategories(categories);
        } catch (err) {
          console.error("Erreur lors du chargement des catégories:", err);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du post:", err);
        setError("Impossible de charger le post à modifier");
      } finally {
        setIsLoadingPost(false);
      }
    }

    void loadPostForEdit();
  }, [isEditMode, postId, auth.user]);

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

      if (isEditMode && postId) {
        // Mode édition : mettre à jour le post existant
        console.log("Tentative de modification du post...");
        const success = await queries.posts.edit(postId, body);

        if (!success) {
          throw new Error("Échec de la modification du post");
        }

        // Mettre à jour les catégories seulement si elles ont changé
        // Pour simplifier, on peut supprimer toutes les anciennes et ajouter les nouvelles
        // Note: Il faudrait idéalement une fonction pour gérer cela dans supabase.ts

        console.log("Post modifié avec succès");
        setError(null);
        void navigate(`/post/${postId}`);
      } else {
        // Mode création : créer un nouveau post
        console.log("Tentative de création du post...");
        const id: string = await queries.posts.new(body, mediaFiles);

        for (const category of selectedCategories) {
          await queries.postsCategories.add(id, category.name);
        }
        console.log("Post créé avec succès");
        setError(null);
        void navigate("/");
      }
    } catch (err) {
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
      setError(
        isEditMode
          ? "Vous devez être connecté pour modifier un post."
          : "Vous devez être connecté pour ajouter un post.",
      );
      setIsLoading(false);
      return;
    }

    void trySubmiting();
  };

  // Affichage du loading pendant le chargement du post à éditer
  if (isEditMode && isLoadingPost) {
    return (
      <div className="flex w-full flex-col px-4">
        <h1 className="mb-4 text-xl font-bold">Chargement...</h1>
        <div className="text-gray-500">Chargement du post à modifier...</div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col px-4">
      <h1 className="mb-4 text-xl font-bold">{isEditMode ? "Modifier le Post" : "Ajouter un Post"}</h1>

      {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="textarea mb-4 w-full resize-none"
          placeholder={isEditMode ? "Modifiez votre post ici..." : "Écrivez votre post ici..."}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
          }}
          rows={5}
          required
        />

        {/* Upload de fichiers seulement en mode création */}
        {!isEditMode && (
          <fieldset className="fieldset mb-4">
            <legend className="fieldset-legend">Ajouter des images ou médias (optionnel)</legend>
            <input id="post-file" type="file" className="file-input w-full" multiple onChange={handleFileChange} />
            {mediaFiles.length > 0 && (
              <label className="label" htmlFor="post-file">
                {mediaFiles.length} fichier(s) sélectionné(s)
              </label>
            )}
          </fieldset>
        )}

        <CategoriesChooser selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />
        <div className="flex justify-end gap-2">
          <Link className="btn btn-secondary" to={isEditMode ? `/post/${postId ?? ""}` : "/"}>
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading
              ? isEditMode
                ? "Modification en cours..."
                : "Publication en cours..."
              : isEditMode
                ? "Modifier"
                : "Publier"}
          </button>
        </div>
      </form>

      <div className="mt-4">
        <Link className="btn btn-primary" to={isEditMode ? `/post/${postId ?? ""}` : "/"}>
          {isEditMode ? "Retour au post" : "Retour à l'accueil"}
        </Link>
      </div>
      <div className="mt-8">
        {auth.isAuthenticated && auth.profile && auth.user ? (
          <>
            <div className="mb-2">{auth.profile.handle}</div>
          </>
        ) : (
          <>
            <div className="mb-2">Non connecté</div>
            <Link className="mr-2 rounded-md bg-amber-100 p-2" to="/login">
              Connexion
            </Link>
            <Link className="rounded-md bg-amber-100 p-2" to="/register">
              Inscription
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
