import { Link } from "react-router";

import { Tables } from "../../contexts/supabase/database";
import { utils } from "../../contexts/supabase/supabase";

interface UserListElementProps {
  profile: Tables<"profiles">;
}

export default function UserListElement({ profile }: UserListElementProps) {
  const profilePicUrl = utils.getAvatarUrl(profile);

  return (
    <Link
      to={`/@${profile.handle}`}
      className="hover:bg-base-200 flex cursor-pointer items-center gap-3 rounded-lg p-3"
    >
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={profilePicUrl} alt={`${profile.handle}'s profile`} />
        </div>
      </div>
      <div className="flex-1">
        <div className="font-semibold">@{profile.handle}</div>
        <div className="mt-1 min-h-[1.25rem] text-sm text-gray-600">
          {profile.bio && <span className="line-clamp-2">{profile.bio}</span>}
        </div>
      </div>
    </Link>
  );
}
