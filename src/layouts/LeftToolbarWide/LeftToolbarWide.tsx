import { Link } from "react-router";
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";

const profileImageUrl = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

export default function LeftToolbarWide() {
  const auth = useAuth();

  return (
    <div className="hidden border-r border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
      <div className="sticky top-8 flex h-[calc(100vh-60px)] flex-col">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col space-y-6">
            <Link className="btn btn-ghost text-xl" to="/">
              Malley
            </Link>
            <label className="input">
              <HiOutlineMagnifyingGlass className="h-[1em] opacity-50" />
              <input type="search" required placeholder="Search" />
            </label>
            <div className="flex flex-col space-y-2">
              <Link className="sidebarlink" to="/">
                <HiOutlineHome className="h-5 opacity-50" />
                Home
              </Link>
              <Link className="sidebarlink" to="/profile">
                <HiOutlineBell className="h-5 opacity-50" />
                Notifications
              </Link>
              <Link className="sidebarlink" to="/profile">
                <HiOutlineUser className="h-5 opacity-50" />
                Profile
              </Link>
            </div>
          </div>

          {auth.isAuthenticated && auth.profile && auth.user && (
            <div className="border-base-200 mt-auto flex items-center gap-3 border-t p-2">
              <Link to={`/@${auth.profile.handle}`} className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <img src={profileImageUrl} />
                  </div>
                </div>
              </Link>
              <div className="flex flex-col">
                <Link to={`/@${auth.profile.handle}`} className="text-sm font-semibold">
                  @{auth.profile.handle}
                </Link>
                <span className="text-xs text-gray-500">{auth.user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
