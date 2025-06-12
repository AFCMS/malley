import { useEffect, useState } from "react";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import TopBar from "../../layouts/TopBar/TopBar";
import UserListElement from "../../layouts/UserListElement/UserListElement";

export default function ProfileFollowing() {
  const auth = useAuth();
  const handle = auth.profile?.handle;
  const [followingProfiles, setFollowingProfiles] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowingProfiles = async () => {
      if (!handle) return;

      try {
        setLoading(true);
        setError(null);

        const following = await queries.follows.get();

        setFollowingProfiles(following);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load following users");
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowingProfiles();
  }, [handle]);

  if (loading) {
    return (
      <div className="w-full">
        <TopBar title={"Following"} />
        <div className="flex items-center justify-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <TopBar title={"Following"} />
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
      <TopBar title={"Following"} />
      <div className="p-4">
        {followingProfiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No profiles followed.</div>
        ) : (
          <div className="space-y-4">
            {followingProfiles.map((user) => (
              <UserListElement key={user.id} profile={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
