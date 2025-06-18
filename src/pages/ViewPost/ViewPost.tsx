import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import { Tables } from "../../contexts/supabase/database";
import { queries } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import PostViewer from "../../Components/PostViewer/PostViewer";
import TopBar from "../../layouts/TopBar/TopBar";

export default function ViewPost() {
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const [post, setPost] = useState<Tables<"posts"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const scrollTargetRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchPostData() {
      if (!postId) return;
      try {
        const postData = await queries.posts.get(postId);
        setPost(postData);

        // Vérifier s'il y a un post à mettre en évidence
        const highlightPostId = searchParams.get("highlight");
        scrollTargetRef.current = highlightPostId ?? postId;
      } catch {
        setError("Impossible de charger ce post");
      } finally {
        setLoading(false);
      }
    }
    void fetchPostData();
  }, [postId, auth.user, searchParams]);

  useEffect(() => {
    if (post && scrollTargetRef.current) {
      const timer = setTimeout(() => {
        const targetPostId = scrollTargetRef.current;
        if (targetPostId) {
          const targetElement = document.getElementById(`post-${targetPostId}`);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            scrollTargetRef.current = null;
          }
        }
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [post]);

  if (loading) {
    return <TopBar title="Chargement..." />;
  }
  if (error) {
    return <div>Erreur: {error}</div>;
  }
  if (!post) {
    return <div>Post introuvable</div>;
  }

  const highlightPostId = searchParams.get("highlight") ?? undefined;

  return (
    <div className="w-full">
      <TopBar title="Publication" />
      <div className="view-post relative mb-10">
        <PostViewer
          post={post}
          showParents={true}
          showChildren={true}
          disableRedirect={true}
          isMainPost={true}
          highlightPostId={highlightPostId}
          allowExpandChildren={true}
        />
      </div>
    </div>
  );
}
