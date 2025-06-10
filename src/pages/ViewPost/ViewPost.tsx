import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { HiOutlinePencil, HiEllipsisVertical } from "react-icons/hi2";

import { Tables } from "../../contexts/supabase/database";
import { queries, supabase } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import PostViewer from "../../Components/PostViewer/PostViewer";
import TopBar from "../../layouts/TopBar/TopBar";

export default function ViewPost() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Tables<"posts"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

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

        // Charger les médias
        await fetchMediaUrls(postId);
      } catch {
        setError("Impossible de charger ce post");
      } finally {
        setLoading(false);
      }
    }

    void fetchPostData();
  }, [postId, auth.user]);

  const fetchMediaUrls = async (postId: string) => {
    try {
      setLoadingMedia(true);
      const { data, error } = await supabase.storage.from("post-media").list(postId, {
        limit: 10,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

      if (!error && data.length > 0) {
        const urls = data.map(
          (file) => supabase.storage.from("post-media").getPublicUrl(`${postId}/${file.name}`).data.publicUrl,
        );
        setMediaUrls(urls);
      }
    } catch {
      setMediaUrls([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  if (loading) return <TopBar title="Chargement..." />;
  if (error) return <div>Erreur: {error}</div>;
  if (!post) return <div>Post introuvable</div>;

  return (
    <div className="w-full">
      <TopBar title="Publication" />

      <div className="view-post relative">
        {/* Menu burger pour l'auteur */}
        {isAuthor && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMenu(!showMenu)}>
                <HiEllipsisVertical className="h-5 w-5" />
              </button>

              {showMenu && (
                <>
                  {/* Overlay pour fermer le menu */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

                  {/* Menu dropdown */}
                  <div className="absolute top-full right-0 z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                    <Link
                      to={`/post/${post.id}/edit`}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <HiOutlinePencil className="h-4 w-4" />
                      Modifier ce post
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <PostViewer post={post} showParents={true} showChildren={true} disableRedirect={true} isMainPost={true} />
      </div>
    </div>
  );
}
