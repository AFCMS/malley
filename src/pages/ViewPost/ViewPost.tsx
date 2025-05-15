import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Tables } from "../../contexts/supabase/database";
import { queries } from "../../contexts/supabase/supabase";
import PostViewer from "../../Components/PostViewer/PostViewer";

export default function ViewPost() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Tables<"posts"> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);

        if (!postId) {
          throw new Error("ID du post non spécifié");
        }

        // Utilisation de la fonction get du module queries.posts
        const postData = await queries.posts.get(postId);
        setPost(postData);
      } catch (err) {
        console.error("Erreur lors de la récupération du post:", err);
        setError("Impossible de charger ce post. Veuillez vérifier l'URL ou réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    }

    void fetchPost();
  }, [postId]);

  if (loading) {
    return <div>Chargement de la publication...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  if (!post) {
    return <div>Post introuvable</div>;
  }

  return (
    <div className="view-post-container">
      <h1>Publication : </h1>
      <PostViewer post={post} />
    </div>
  );
}
