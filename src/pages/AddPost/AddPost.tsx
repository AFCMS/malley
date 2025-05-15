import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
  const auth = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const trySubmiting = async () => {
    try {
      // Ajout d'une vérification que body n'est pas vide
      if (!body.trim()) {
        throw new Error("Le contenu du post ne peut pas être vide");
      }

      console.log("Tentative de création du post...");
      const id: string = await queries.posts.new(body, mediaFiles);

      for (const category of selectedCategories) {
        await queries.postsCategories.add(id, await queries.categories.getEnsuredId(category.name));
      }
      console.log("Post créé avec succès");
      setError(null);
      void navigate("/");
    } catch (err) {
      console.error("Erreur lors de la création du post:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth.isAuthenticated || !auth.profile) {
      setError("Vous devez être connecté pour ajouter un post.");
      setIsLoading(false);
      return;
    }

    void trySubmiting();
  };

  // utilisation de gpt pour le return
  return (
    <>
      <div className="flex flex-col">
        <h1 className="mb-4 text-2xl font-bold">Ajouter un Post</h1>

        {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <textarea
              className="w-full rounded-md border p-3"
              placeholder="Écrivez votre post ici..."
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
              rows={5}
              required
            />
          </div>

          <CategoriesChooser selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

          <div className="mb-4">
            <label className="mb-2 block">Ajouter des images ou médias (optionnel)</label>
            <input type="file" className="w-full rounded-md border p-2" multiple onChange={handleFileChange} />
            {mediaFiles.length > 0 && <p className="mt-2 text-sm">{mediaFiles.length} fichier(s) sélectionné(s)</p>}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="rounded-md bg-amber-100 p-2 hover:bg-amber-200" disabled={isLoading}>
              {isLoading ? "Publication en cours..." : "Publier"}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <Link className="mr-2 rounded-md bg-amber-100 p-2" to="/">
            Retour à l’accueil
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
    </>
  );
}
