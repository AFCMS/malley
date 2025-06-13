import { useState, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { Tables } from "../../contexts/supabase/database";
import { queries, supabase, utils } from "../../contexts/supabase/supabase";
import PostAdd from "../PostAdd/PostAdd";

interface QuoteTweetModalProps {
  post: Tables<"posts">;
  originalPost?: Tables<"posts"> | null;
  modalId: string;
  onSuccess?: () => void;
}

export default function QuoteTweetModal({ post, originalPost, modalId, onSuccess }: QuoteTweetModalProps) {
  const [author, setAuthor] = useState<Tables<"profiles"> | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const postToQuote = queries.posts.isSimpleRetweet(post) && originalPost ? originalPost : post;

  useEffect(() => {
    async function fetchData() {
      if (!postToQuote.id) return;

      setLoading(true);
      try {
        const [authorsResult, { data: mediaFiles }] = await Promise.all([
          queries.authors.ofPost(postToQuote.id),
          supabase.storage.from("post-media").list(postToQuote.id, { limit: 1 }),
        ]);

        setAuthor(authorsResult[0] || null);

        if (mediaFiles?.length) {
          const url = supabase.storage.from("post-media").getPublicUrl(`${postToQuote.id}/${mediaFiles[0].name}`)
            .data.publicUrl;
          setMediaUrl(url);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [postToQuote.id]);

  const handleSuccess = (newPostId: string) => {
    const modal = document.getElementById(modalId) as HTMLDialogElement;
    modal.close();
    onSuccess?.();
    console.log(`Quote tweet created: ${newPostId}`);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Quote Tweet</h3>
          <form method="dialog">
            <button className="btn btn-ghost btn-sm btn-circle">
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </form>
        </div>

        <PostAdd
          parentPostId={undefined}
          rtOf={postToQuote.id}
          onSuccess={handleSuccess}
          showCategories={true}
          showFileUpload={true}
          placeholder="Add your comment..."
          isReply={false}
        />

        <div className="divider my-4">Quoting</div>

        <div className="card bg-base-200 p-3">
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {author && (
                <div className="flex items-center gap-2">
                  <div className="avatar">
                    <div className="h-6 w-6 rounded-full">
                      <img src={utils.getAvatarUrl(author)} alt="" />
                    </div>
                  </div>
                  <span className="text-sm font-medium">@{author.handle}</span>
                </div>
              )}

              {postToQuote.body && <p className="line-clamp-2 text-sm">{postToQuote.body}</p>}

              {mediaUrl && (
                <div className="relative">
                  <img src={mediaUrl} alt="Media" className="h-16 w-full rounded object-cover" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
