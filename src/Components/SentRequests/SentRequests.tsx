import { useState, useEffect, useCallback } from "react";
import { HiOutlineXMark, HiOutlineClock, HiOutlineCheckCircle } from "react-icons/hi2";
import { Tables } from "../../contexts/supabase/database";
import { queries, utils } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

interface SentRequest {
  pendingAuthor: Tables<"pendingAuthors">;
  toProfile: Tables<"profiles">;
  post: Tables<"posts">;
}

export default function SentRequests() {
  const auth = useAuth();
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const loadSentRequests = useCallback(async () => {
    if (!auth.user) return;

    setIsLoading(true);
    try {
      const pendingAuthors = await queries.pendingAuthors.sent();

      // Charger les détails pour chaque demande
      const requestsWithDetails: SentRequest[] = [];
      for (const pendingAuthor of pendingAuthors) {
        try {
          const [toProfile, post] = await Promise.all([
            queries.profiles.get(pendingAuthor.to_profile),
            queries.posts.get(pendingAuthor.post),
          ]);

          requestsWithDetails.push({
            pendingAuthor,
            toProfile,
            post,
          });
        } catch (error) {
          console.error("Erreur lors du chargement des détails de la demande:", String(error));
        }
      }

      setSentRequests(requestsWithDetails);
    } catch (error) {
      console.error("Erreur lors du chargement des demandes envoyées:", String(error));
    } finally {
      setIsLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    void loadSentRequests();
  }, [loadSentRequests]);

  const handleCancelRequest = async (postId: string) => {
    setIsCancelling(postId);
    try {
      await queries.pendingAuthors.cancel(postId);
      // Recharger la liste après annulation
      await loadSentRequests();
    } catch (error) {
      console.error("Erreur lors de l'annulation de la demande:", String(error));
    } finally {
      setIsCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (sentRequests.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <HiOutlineCheckCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p>Vous n&apos;avez envoyé aucune demande de co-auteur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sentRequests.map(({ pendingAuthor, toProfile, post }) => (
        <div key={pendingAuthor.post} className="rounded-lg border border-gray-200 bg-white p-4">
          {/* En-tête avec profil destinataire */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img src={utils.getAvatarUrl(toProfile)} alt={`${toProfile.handle}'s profile`} />
                </div>
              </div>
              <div>
                <div className="font-semibold">@{toProfile.handle}</div>
                <div className="text-sm text-gray-500">Demande envoyée (date non disponible)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                <HiOutlineClock className="h-3 w-3" />
                En attente
              </div>
              <button
                onClick={() => {
                  void handleCancelRequest(pendingAuthor.post);
                }}
                className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-red-600"
                disabled={isCancelling === pendingAuthor.post}
                title="Annuler la demande"
              >
                {isCancelling === pendingAuthor.post ? (
                  <div className="loading loading-spinner loading-xs"></div>
                ) : (
                  <HiOutlineXMark className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Aperçu du post */}
          <div className="rounded-md bg-gray-50 p-3">
            <div className="mb-2 text-xs text-gray-500">Post concerné :</div>
            <p className="line-clamp-2 text-sm text-gray-700">{post.body}</p>
            <div className="mt-2 text-xs text-gray-500">Publié le {formatDate(post.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
