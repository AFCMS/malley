import { useEffect, useState } from "react";
import { Tables } from "../../contexts/supabase/database";
import { queries, supabase } from "../../contexts/supabase/supabase";

const SUPABASE_PROJECT_URL = "http://127.0.0.1:54321";

export default function PostViewer(props: { post: Tables<"posts"> }) {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const dateCreation = new Date(props.post.created_at).toLocaleDateString('fr-FR');

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const postCategories = await queries.postsCategories.get(props.post.id);
        setCategories(postCategories);
      } catch (err) {
        console.error("Erreur lors de la récupération des catégories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [props.post.id]);

  useEffect(() => {
    async function fetchMediaUrls() {
      console.log("props.post.media", props.post.media);
      if (!props.post.media) {
        setMediaUrls([]);
        return;
      }
      const { data, error } = await supabase.storage.from("post-media").list(props.post.media);
      console.log("LIST DATA", data, "ERROR", error);
      if (error) {
        setMediaUrls([]);
        return;
      }
      const urls = (data ?? []).map(
        (file) =>
          `${SUPABASE_PROJECT_URL}/storage/v1/object/public/post-media/${props.post.media}/${file.name}`
      );
      console.log("urls générées", urls);
      setMediaUrls(urls);
    }
    fetchMediaUrls();
  }, [props.post.media]);

  function renderMedia(url: string, i: number) {
    const ext = url.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
          📄 Voir le PDF {i + 1}
        </a>
      );
    }
    return (
      <img
        key={i}
        src={url}
        alt={`Pièce jointe ${i + 1}`}
        style={{ maxWidth: 200, margin: 8 }}
      />
    );
  }

  return (
    <div className="post-viewer">
      <p>ID: {props.post.id}</p>
      {props.post.body && <p>Contenu: {props.post.body}</p>}
      <p>Date de création: {dateCreation}</p>

      {props.post.media && (
        <div className="post-media">
          <p>Pièces jointes :</p>
          {mediaUrls.length === 0 ? (
            <p>Aucune pièce jointe trouvée</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {mediaUrls.map((url, i) => renderMedia(url, i))}
            </div>
          )}
        </div>
      )}

      <div className="post-categories">
        <p>Catégories:</p>
        {loadingCategories ? (
          <p>Chargement des catégories...</p>
        ) : categories.length > 0 ? (
          <ul>
            {categories.map((category) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
        ) : (
          <p>Aucune catégorie associée à ce post</p>
        )}
      </div>
    </div>
  );
}
