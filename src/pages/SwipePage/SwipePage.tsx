import { useState, useEffect, useCallback } from "react";
import { queries } from "../../contexts/supabase/supabase";
import FetchCard from "../../Components/FetchCard/FetchCard";

// IMPORTANT : pour l'instant les uuids de profils sont codés en dur ici.
// plus tard on pourrait les récupérer dynamiquement depuis la base de données quand emimi fera son travail (non je rigole je sias pas quand il va le faire)
const ALL_KNOWN_PROFILE_IDS: string[] = [
  // Exemple : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "07ca3b50-198b-49f8-92b2-d8152fe0743f",
  "4fd4c815-c133-4114-8ade-682ab80bef7b",
  "a4001762-1076-48fe-be1c-ccb9888c8a3b",
  "c335b11c-c72b-481a-8aa8-faab4d8cc4ba",
];

const BATCH_SIZE = 3; // Nombre de profils à charger

export default function SwipePage() {
  const [profileIdQueue, setProfileIdQueue] = useState<string[]>([]);
  const [currentIndexInBatch, setCurrentIndexInBatch] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Suit tous les ID de profil jamais ajoutés à la file d'attente dans la session actuelle pour éviter les répétitions immédiates
  const [seenProfileIds, setSeenProfileIds] = useState<Set<string>>(new Set());

  const fetchNewBatch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (ALL_KNOWN_PROFILE_IDS.length === 0) {
      setError("Aucun ID de profil connu disponible.");
      setIsLoading(false);
      setProfileIdQueue([]);
      return;
    }

    const availableIds = ALL_KNOWN_PROFILE_IDS.filter((id) => !seenProfileIds.has(id));

    if (availableIds.length === 0) {
      setError("Aucun nouveau profil unique disponible dans la liste prédéfinie à afficher.");
      setProfileIdQueue([]); // Vider la file d'attente car il n'y a rien de nouveau
      setCurrentIndexInBatch(0); // Réinitialiser l'index
      setIsLoading(false);
      return;
    }

    // Mélanger les ID disponibles et prendre un nouveau lot
    // Fisher-Yates shuffle algorithm for better randomization
    const shuffled = [...availableIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const newBatch = shuffled.slice(0, BATCH_SIZE);

    setProfileIdQueue(newBatch);
    setCurrentIndexInBatch(0); // Commencer depuis le début du nouveau lot
    setIsLoading(false);

    // Ajouter les ID de ce nouveau lot à l'ensemble des ID vus
    const updatedSeenIds = new Set(seenProfileIds);
    newBatch.forEach((id) => updatedSeenIds.add(id));
    setSeenProfileIds(updatedSeenIds);
  }, [seenProfileIds]); // `seenProfileIds` est la dépendance principale qui change lorsque nous avons besoin d'une nouvelle logique pour la récupération

  // Récupération initiale du premier lot de profils
  useEffect(() => {
    fetchNewBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // MODIFIÉ : Changement de la dépendance de [fetchNewBatch] à []

  // Pré-chargement "doux" : Lorsque le profil actuel change,
  // essayer de lancer une récupération pour le profil suivant dans le lot.
  // FetchCard effectuera toujours sa propre récupération ; cela ne fait que "chauffer" le cache/la connexion.
  useEffect(() => {
    if (profileIdQueue.length > 0 && currentIndexInBatch + 1 < profileIdQueue.length) {
      const nextProfileId = profileIdQueue[currentIndexInBatch + 1];
      if (nextProfileId) {
        // console.log(`Pré-chargement doux des données pour l'ID de profil : ${nextProfileId}`);
        queries.profiles.get(nextProfileId).catch(() => {
          // console.warn(`Le pré-chargement a échoué pour ${nextProfileId}:`, err.message);
          // Optionnel : gérer l'erreur de pré-chargement silencieusement, car c'est une optimisation non critique
        });
      }
    }
  }, [currentIndexInBatch, profileIdQueue]);

  const advanceToNextProfile = () => {
    if (currentIndexInBatch < profileIdQueue.length - 1) {
      // Passer au profil suivant dans le lot actuel
      setCurrentIndexInBatch((prevIndex) => prevIndex + 1);
    } else {
      // Fin du lot actuel, récupérer un nouveau lot
      // console.log("Fin du lot actuel, récupération d'un nouveau lot.");
      fetchNewBatch();
    }
  };

  const handlePass = () => {
    if (isLoading || !profileIdQueue[currentIndexInBatch]) return; // Empêcher l'action si chargement en cours ou pas de profil actuel
    // console.log(`Profil passé : ${profileIdQueue[currentIndexInBatch]}`);
    advanceToNextProfile();
  };

  const handleFollow = async () => {
    if (isLoading || !profileIdQueue[currentIndexInBatch]) return; // Empêcher l'action si chargement en cours ou pas de profil actuel

    const profileToFollowId = profileIdQueue[currentIndexInBatch];
    // console.log(`Tentative de suivi du profil : ${profileToFollowId}`);
    setIsLoading(true); // Indiquer l'état de chargement pour l'action de suivi
    setError(null); // Effacer les erreurs précédentes
    try {
      await queries.follows.add(profileToFollowId);
      // console.log(`Suivi réussi de ${profileToFollowId}`);
      // Optionnel : ajouter un message de succès/toast ici
      advanceToNextProfile(); // Passer au profil suivant uniquement en cas de succès du suivi
    } catch (err) {
      console.error(`Échec du suivi de ${profileToFollowId}:`, err);
      setError(`Échec du suivi du profil : ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false); // Réinitialiser l'état de chargement en cas d'erreur
      // Ne pas avancer, pour que l'utilisateur puisse voir l'erreur et réessayer ou passer
    }
    // setIsLoading(false) est géré par advanceToNextProfile ou le bloc catch
  };

  // --- Logique de Rendu ---

  if (isLoading && profileIdQueue.length === 0 && currentIndexInBatch === 0) {
    // C'est l'état de chargement initial avant que des profils ne soient récupérés ou lors de la récupération du tout premier lot.
    return <div style={{ textAlign: "center", padding: "20px" }}>Chargement des profils...</div>;
  }

  if (error && profileIdQueue.length === 0 && !isLoading) {
    // Afficher l'erreur s'il n'y a pas de profils à afficher et que nous ne sommes pas en train de les charger.
    // Cela signifie généralement "Plus de profils" ou une erreur de configuration.
    return <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>;
  }

  if (profileIdQueue.length === 0 && !isLoading) {
    // Cet état se produit si fetchNewBatch n'a trouvé aucun profil (par exemple, tous les ID connus ont été vus)
    // et aucune erreur spécifique n'a été définie autre que potentiellement "Plus de nouveaux profils".
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        {error ?? "Aucun profil disponible à swiper pour le moment."}
      </div>
    );
  }

  const currentProfileId = profileIdQueue[currentIndexInBatch];

  if (!currentProfileId && !isLoading) {
    // Solution de repli pour un état inattendu où il n'y a pas d'ID de profil actuel, mais pas de chargement.
    // Cela pourrait indiquer la fin de tous les profils si une erreur est également définie.
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        {error ?? "Aucun profil à afficher actuellement. Essayez de rafraîchir."}
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Swiper les Profils</h1>
      {/* Afficher les erreurs non critiques (par exemple, échec du suivi) tout en affichant une carte si possible */}
      {error && currentProfileId && <p style={{ color: "red", fontWeight: "bold" }}>Avis : {error}</p>}

      {/* Indiquer si nous chargeons le prochain lot en arrière-plan */}
      {isLoading && currentProfileId && <p>Chargement du prochain ensemble de profils...</p>}

      {currentProfileId ? (
        <div key={currentProfileId}>
          {" "}
          {/* La clé est cruciale pour que FetchCard se re-rende avec de nouvelles props */}
          <FetchCard profileId={currentProfileId} />
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            <button
              onClick={handlePass}
              disabled={isLoading} // Désactiver le bouton si une opération de chargement est en cours
              style={{
                padding: "15px 30px",
                fontSize: "24px", // Emoji/texte plus grand
                cursor: "pointer",
                backgroundColor: "#ff7675", // Rouge plus doux
                color: "white",
                border: "none",
                borderRadius: "50%", // Bouton circulaire
                width: "80px",
                height: "80px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              aria-label="Passer le profil"
            >
              ❌
            </button>
            <button
              onClick={() => {
                void handleFollow();
              }}
              disabled={isLoading} // Désactiver le bouton si une opération de chargement est en cours
              style={{
                padding: "15px 30px",
                fontSize: "24px", // Emoji/texte plus grand
                cursor: "pointer",
                backgroundColor: "#55efc4", // Vert plus doux
                color: "#2d3436", // Texte plus foncé pour un meilleur contraste sur vert clair
                border: "none",
                borderRadius: "50%", // Bouton circulaire
                width: "80px",
                height: "80px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              aria-label="Suivre le profil"
            >
              ✔️
            </button>
          </div>
        </div>
      ) : (
        // Cette partie ne devrait idéalement pas être atteinte si les états de chargement/erreur sont gérés correctement ci-dessus.
        // Si currentProfileId est nul mais pas en chargement et sans erreur, c'est un état vide.
        !isLoading && <div>Préparation du prochain profil...</div>
      )}
    </div>
  );
}
