import TopBar from "../../layouts/TopBar/TopBar";
import UserListElement from "../../layouts/UserListElement/UserListElement";

import { useHandle } from "../../utils/routing";

export default function ProfileViewerFeatured() {
  const handle = useHandle();

  return (
    <div className="w-full">
      <TopBar title={`${handle}'s Featured Profiles`} />
      <UserListElement />
    </div>
  );
}
