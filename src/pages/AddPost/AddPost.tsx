import { Link, useParams } from "react-router";
import { useAuth } from "../../contexts/auth/AuthContext";
import PostAdd from "../../Components/PostAdd/PostAdd";

export default function AddPost() {
  const auth = useAuth();
  const { postId } = useParams<{ postId: string }>();

  // Détermine si on est en mode édition
  const isEditMode = Boolean(postId);

  return (
    <div className="flex w-full flex-col px-4">
      <h1 className="mb-4 text-xl font-bold">{isEditMode ? "Modifier le Post" : "Ajouter un Post"}</h1>

      <PostAdd editPostId={postId} showCategories={true} showFileUpload={true} />

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
