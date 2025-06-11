import { Link, useParams } from "react-router";
import PostAdd from "../../Components/PostAdd/PostAdd";
import TopBar from "../../layouts/TopBar/TopBar";

export default function AddPost() {
  const { postId } = useParams<{ postId: string }>();

  // Détermine si on est en mode édition
  const isEditMode = Boolean(postId);

  return (
    <div className="flex w-full flex-col">
      <TopBar title={isEditMode ? "Edit Post" : "Add Post"} />
      <div className="mt-4 px-4">
        <PostAdd editPostId={postId} showCategories={true} showFileUpload={true} />

        {isEditMode && (
          <div className="mt-4">
            <Link className="btn btn-primary" to={`/post/${postId ?? ""}`}>
              Back to Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
