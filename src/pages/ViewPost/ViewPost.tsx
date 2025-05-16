import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Tables } from "../../contexts/supabase/database";
import { queries } from "../../contexts/supabase/supabase";
import PostViewer from "../../Components/PostViewer/PostViewer";

export default function ViewPost() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Tables<"posts"> | null>(null);
  const [authors, setAuthors] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPostData() {
      if (!postId) return;
      
      try {
        // Chargement du post et des auteurs
        const postData = await queries.posts.get(postId);
        setPost(postData);
        
        // Utilisation de la fonction spécifique pour récupérer les auteurs
        try {
          const authorProfiles = await queries.authors.ofPost(postId);
          setAuthors(authorProfiles);
        } catch {
          setAuthors([]);
        }
      } catch (err) {
        setError("Impossible de charger ce post");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPostData();
  }, [postId]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!post) return <div>Post introuvable</div>;

  return (
    <div className="view-post">
      <h1>Publication par : {authors.length > 0 ? 
        authors.map(author => author.handle).join(", ") : 
        "Auteur inconnu"}
      </h1>
      <PostViewer post={post} />
    </div>
  );
}