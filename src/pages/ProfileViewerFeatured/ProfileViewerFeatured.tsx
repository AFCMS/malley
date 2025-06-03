import { useEffect, useState } from "react";

import TopBar from "../../layouts/TopBar/TopBar";
import UserListElement from "../../layouts/UserListElement/UserListElement";

import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

import { useHandle } from "../../utils/routing";

export default function ProfileViewerFeatured() {
  const handle = useHandle();
  const [featuredUsers, setFeaturedUsers] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedUsers = async () => {
      if (!handle) return;

      try {
        setLoading(true);
        setError(null);

        // Get user ID from handle
        const user = await queries.profiles.getByHandle(handle);

        // Get featured users for this user
        const featured = await queries.featuredUsers.byUser(user.id);

        setFeaturedUsers(featured);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load featured users");
      } finally {
        setLoading(false);
      }
    };

    void fetchFeaturedUsers();
  }, [handle]);

  if (loading) {
    return (
      <div className="w-full">
        <TopBar title={`${handle}'s Featured Profiles`} />
        <div className="flex items-center justify-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <TopBar title={`${handle}'s Featured Profiles`} />
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
      <TopBar title={`${handle}'s Featured Profiles`} />
      <div className="p-4">
        {featuredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No featured profiles yet.</div>
        ) : (
          <div className="space-y-4">
            {featuredUsers.map((user) => (
              <UserListElement key={user.id} profile={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
