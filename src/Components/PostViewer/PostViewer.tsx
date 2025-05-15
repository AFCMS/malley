import { Tables } from "../../contexts/supabase/database";

export default function PostViewer(props: { post: Tables<"posts"> }) {
  // On formate la date pour l'afficher dans le format français car j'aime trop la france la chienneté
  const dateCreation = new Date(props.post.created_at).toLocaleDateString("fr-FR");

  return (
    <div>
      <p>ID: {props.post.id}</p>
      {props.post.body && <p>Contenu: {props.post.body}</p>}
      <p>Date de création: {dateCreation}</p>
      {props.post.media && (
        <div>
          {/\.(jpeg|jpg|gif|png)$/i.exec(props.post.media) ? (
            <img src={props.post.media} alt="Image du post" width="300" />
          ) : /\.(mp4|webm|ogg)$/i.exec(props.post.media) ? (
            <video src={props.post.media} controls width="300" />
          ) : (
            <a href={props.post.media}>Voir la pièce jointe</a>
          )}
        </div>
      )}
    </div>
  );
}
