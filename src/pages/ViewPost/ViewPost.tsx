import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { HiOutlinePencil } from "react-icons/hi2";

import { Tables } from "../../contexts/supabase/database";
import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import PostViewer from "../../Components/PostViewer/PostViewer";
import TopBar from "../../layouts/TopBar/TopBar";

export default function ViewPost() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Tables<"posts"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  const auth = useAuth();

  useEffect(() => {
    async function fetchPostData() {
      if (!postId) return;

      try {
        const postData = await queries.posts.get(postId);
        setPost(postData);

        // Vérifier si l'utilisateur connecté est auteur du post
        if (auth.user) {
          const authors = await queries.authors.ofPost(postId);
          const isUserAuthor = authors.some((author) => author.id === auth.user?.id);
          setIsAuthor(isUserAuthor);
        }
      } catch {
        setError("Impossible de charger ce post");
      } finally {
        setLoading(false);
      }
    }

    void fetchPostData();
  }, [postId, auth.user]);

  if (loading) return <TopBar title="Chargement..." />;
  if (error) return <div>Erreur: {error}</div>;
  if (!post) return <div>Post introuvable</div>;

  return (
    <div className="w-full">
      <TopBar title="Publication" />

      {/* Bouton d'édition si l'utilisateur est auteur */}
      {isAuthor && (
        <div className="border-b border-gray-200 px-4 py-2">
          <Link to={`/post/${post.id}/edit`} className="btn btn-sm btn-outline gap-2">
            <HiOutlinePencil className="h-4 w-4" />
            Modifier ce post
          </Link>
        </div>
      )}

      <div className="view-post">
        <PostViewer post={post} showParents={true} showChildren={true} />
      </div>
    </div>
  );
}
