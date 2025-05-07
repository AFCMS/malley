import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";
import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

export default function AddPost() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth.isAuthenticated || !auth.profile) {
      setError("Vous devez être connecté pour ajouter un post.");
      setIsLoading(false);
      return;
    }

    try {
      // Ajout d'une vérification que body n'est pas vide
      if (!body.trim()) {
        throw new Error("Le contenu du post ne peut pas être vide");
      }
      
      console.log("Tentative de création du post...");
      await queries.posts.new(body, mediaFiles);
      
      console.log("Post créé avec succès");
      setError(null);
      navigate("/");
    } catch (err) {
      console.error("Erreur lors de la création du post:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

// utilisation de gpt pour le return 
  return (
    <>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Ajouter un Post</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <textarea
              className="w-full p-3 border rounded-md"
              placeholder="Écrivez votre post ici..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Ajouter des images ou médias (optionnel)</label>
            <input 
              type="file" 
              className="w-full p-2 border rounded-md" 
              multiple
              onChange={handleFileChange}
            />
            {mediaFiles.length > 0 && (
              <p className="text-sm mt-2">{mediaFiles.length} fichier(s) sélectionné(s)</p>
            )}
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-amber-100 p-2 rounded-md hover:bg-amber-200"
              disabled={isLoading}
            >
              {isLoading ? "Publication en cours..." : "Publier"}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <Link className="bg-amber-100 p-2 rounded-md mr-2" to="/">
            Retour à l'accueil
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
              <Link className="mr-2 bg-amber-100 p-2 rounded-md" to="/login">
                Connexion
              </Link>
              <Link className="bg-amber-100 p-2 rounded-md" to="/register">
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}