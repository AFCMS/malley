import { useEffect, useState } from "react";

import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import TopBar from "../../layouts/TopBar/TopBar";
import UserListElement from "../../layouts/UserListElement/UserListElement";

export default function ProfileList() {
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowedProfiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const followed = await queries.profiles.getAll();

        setProfiles(followed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowedProfiles();
  }, []);

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
      <TopBar title={"Profiles"} />
      <div className="p-4">
        {profiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No profiles</div>
        ) : (
          <div className="space-y-4">
            {profiles.map((user) => (
              <UserListElement key={user.id} profile={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
