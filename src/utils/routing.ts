import { useParams } from "react-router";

export function useHandle() {
  const { handle: urlHandle } = useParams<{ handle?: string }>();

  // Remove @ symbol if present and ensure we have a string
  // React Router v7 can't do this for us
  // https://github.com/remix-run/react-router/discussions/9844
  return urlHandle ? urlHandle.replace(/^@/, "") : "";
}
