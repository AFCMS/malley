import { useState, useEffect, useCallback } from "react";
import { HiOutlineCheck, HiOutlineClock } from "react-icons/hi2";
import { Tables } from "../../contexts/supabase/database";
import { queries, utils } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";

interface PendingAuthorWithDetails {
  id: string;
  from_profile: string;
  to_profile: string;
  post: string;
  created_at: string;
  fromProfile?: Tables<"profiles">;
  postData?: Tables<"posts">;
}

export default function ResponseAuthor() {
  const auth = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PendingAuthorWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const loadPendingRequests = useCallback(async () => {
    if (!auth.user) return;

    setIsLoading(true);
    try {
      const requests = await queries.pendingAuthors.get();

      // Charger les détails des profils et posts pour chaque demande
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          try {
            const [fromProfile, postData] = await Promise.all([
              queries.profiles.get(request.from_profile),
              queries.posts.get(request.post),
            ]);

            return {
              id: `${request.from_profile}-${request.post}`,
              from_profile: request.from_profile,
              to_profile: request.to_profile,
              post: request.post,
              created_at: new Date().toISOString(), // Placeholder car created_at n'existe pas dans pendingAuthors
              fromProfile,
              postData,
            };
          } catch (error) {
            console.error("Erreur lors du chargement des détails:", error);
            return {
              id: `${request.from_profile}-${request.post}`,
              from_profile: request.from_profile,
              to_profile: request.to_profile,
              post: request.post,
              created_at: new Date().toISOString(),
            };
          }
        }),
      );

      setPendingRequests(requestsWithDetails);
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (auth.user) {
      void loadPendingRequests();
    }
  }, [auth.user, loadPendingRequests]);

  const handleAcceptRequest = async (postId: string) => {
    setProcessingIds((prev) => new Set(prev).add(postId));
    try {
      const success = await queries.pendingAuthors.accept(postId);
      if (success) {
        // Retirer la demande de la liste
        setPendingRequests((prev) => prev.filter((req) => req.post !== postId));
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
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

  if (pendingRequests.length === 0) {
    return (
      <div className="py-8 text-center">
        <HiOutlineClock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Aucune demande en attente</h3>
        <p className="text-gray-600">Vous n&apos;avez pas de demandes de co-auteur en attente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-4">
            {/* Avatar du demandeur */}
            <div className="flex-shrink-0">
              <div className="avatar">
                <div className="w-12 rounded-full">
                  <img
                    src={request.fromProfile ? utils.getAvatarUrl(request.fromProfile) : ""}
                    alt={`${request.fromProfile?.handle ?? "Utilisateur"}'s profile`}
                  />
                </div>
              </div>
            </div>

            {/* Contenu de la demande */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  @{request.fromProfile?.handle ?? "Utilisateur inconnu"}
                </span>
                <span className="text-gray-500">souhaite devenir co-auteur</span>
              </div>

              {/* Bio du demandeur */}
              {request.fromProfile?.bio && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-600">{request.fromProfile.bio}</p>
              )}

              {/* Extrait du post concerné */}
              {request.postData && (
                <div className="mb-3 rounded-lg bg-gray-50 p-3">
                  <div className="mb-1 text-xs text-gray-500">Post concerné :</div>
                  <p className="line-clamp-2 text-sm text-gray-800">{request.postData.body}</p>
                </div>
              )}

              {/* Date de la demande */}
              <div className="mb-3 text-xs text-gray-500">Demandé le {formatDate(request.created_at)}</div>

              {/* Boutons d'action - Seulement accepter pour l'instant */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    void handleAcceptRequest(request.post);
                  }}
                  disabled={processingIds.has(request.post)}
                  className="btn btn-sm btn-success gap-2"
                >
                  {processingIds.has(request.post) ? (
                    <div className="loading loading-spinner loading-xs"></div>
                  ) : (
                    <HiOutlineCheck className="h-4 w-4" />
                  )}
                  Accepter
                </button>

                {/* Note: Bouton refuser retiré temporairement */}
                <div className="text-xs text-gray-500 italic">(Fonction refuser en développement)</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
