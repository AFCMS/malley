import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import TopBar from "../../layouts/TopBar/TopBar";
import AuthorAsk from "../../Components/AuthorAsk/AuthorAsk";
import ResponseAuthor from "../../Components/ResponseAuthor/ResponseAuthor";
import SentRequests from "../../Components/SentRequests/SentRequests";

type TabType = "demander" | "recu" | "envoye";

export default function AskAuthor() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("demander");
  const [userPosts, setUserPosts] = useState<Tables<"posts">[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserPosts = useCallback(async () => {
    if (!auth.user) return;

    setIsLoading(true);
    try {
      const posts = await queries.authors.postsOf(auth.user.id);
      setUserPosts(posts);
    } catch (error) {
      console.error("Erreur lors du chargement des posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [auth.user]);

  // Charger les posts de l'utilisateur pour l'onglet "demander"
  useEffect(() => {
    if (activeTab === "demander" && auth.user) {
      void loadUserPosts();
    }
  }, [activeTab, auth.user, loadUserPosts]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "demander":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sélectionnez un de vos posts pour inviter un autre utilisateur comme co-auteur.
            </p>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">Vous n&apos;avez pas encore de posts.</div>
                ) : (
                  userPosts.map((post) => <AuthorAsk key={post.id} post={post} />)
                )}
              </div>
            )}
          </div>
        );

      case "recu":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Gérez les demandes de co-auteur que vous avez reçues.</p>
            <ResponseAuthor />
          </div>
        );

      case "envoye":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Consultez toutes les demandes de co-auteur que vous avez envoyées.</p>
            <SentRequests />
          </div>
        );

      default:
        return null;
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="w-full">
        <TopBar title="Gestion des co-auteurs" />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold">Connexion requise</h2>
            <p className="text-gray-600">Vous devez être connecté pour gérer les co-auteurs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TopBar title="Gestion des co-auteurs" />

      <div className="mx-auto max-w-2xl p-4">
        {/* Onglets */}
        <div className="tabs tabs-boxed mb-6 bg-gray-100">
          <button
            className={`tab tab-lg ${activeTab === "demander" ? "tab-active" : ""}`}
            onClick={() => {
              setActiveTab("demander");
            }}
          >
            Demander
          </button>
          <button
            className={`tab tab-lg ${activeTab === "recu" ? "tab-active" : ""}`}
            onClick={() => {
              setActiveTab("recu");
            }}
          >
            Reçu
          </button>
          <button
            className={`tab tab-lg ${activeTab === "envoye" ? "tab-active" : ""}`}
            onClick={() => {
              setActiveTab("envoye");
            }}
          >
            Envoyé
          </button>
        </div>

        {/* Contenu des onglets */}
        {renderTabContent()}
      </div>
    </div>
  );
}
