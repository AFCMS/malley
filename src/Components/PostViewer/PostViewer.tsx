import { Tables } from "../../contexts/supabase/database";

export default function PostViewer(props: { post: Tables<"posts"> }) {
  return <p>{props.post.id}</p>;
}
