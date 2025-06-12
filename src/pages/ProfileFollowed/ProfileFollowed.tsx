import { useEffect, useState } from "react";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import TopBar from "../../layouts/TopBar/TopBar";
import UserListElement from "../../layouts/UserListElement/UserListElement";

export default function ProfileFollowed() {
  const auth = useAuth();
  const handle = auth.profile?.handle;
  const [followedProfiles, setFollowedProfiles] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowedProfiles = async () => {
      if (!handle) return;

      try {
        setLoading(true);
        setError(null);

        const followed = await queries.follows.get();

        setFollowedProfiles(followed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users that follow you");
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowedProfiles();
  }, [handle]);

  if (loading) {
    return (
      <div className="w-full">
        <TopBar title={"Followed by"} />
        <div className="flex items-center justify-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <TopBar title={"Followed by"} />
        <div className="flex items-center justify-center p-8">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TopBar title={"Followed by"} />
      <div className="p-4">
        {followedProfiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No profiles followed.</div>
        ) : (
          <div className="space-y-4">
            {followedProfiles.map((user) => (
              <UserListElement key={user.id} profile={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
