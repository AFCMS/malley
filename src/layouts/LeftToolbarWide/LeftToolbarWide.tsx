import { Link } from "react-router";
import {
  HiOutlineBell,
  HiOutlineEllipsisHorizontal,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
} from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";

const profileImageUrl = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

export default function LeftToolbarWide() {
  const auth = useAuth();

  return (
    <div className="hidden border-r border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
      <div className="sticky top-8 flex h-[calc(100vh-60px)] flex-col">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col space-y-6">
            <Link className="flex h-10 items-center justify-center px-4 text-xl font-semibold select-none" to="/">
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

          {auth.isAuthenticated && auth.profile && auth.user ? (
            <div className="border-base-200 mt-auto flex items-center gap-3 border-t p-2">
              <div className="flex items-center gap-3">
                <Link to={`/@${auth.profile.handle}`} className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={profileImageUrl} />
                    </div>
                  </div>
                </Link>
              </div>
              <div className="flex flex-col">
                <Link to={`/@${auth.profile.handle}`} className="text-sm font-semibold">
                  @{auth.profile.handle}
                </Link>
                <span className="text-xs text-gray-500">{auth.user.email}</span>
              </div>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                popoverTarget="popover-left-toolbar-profile"
                style={{ anchorName: "--popover-left-toolbar-profile" } as React.CSSProperties}
              >
                <HiOutlineEllipsisHorizontal className="h-5 w-5" />
              </button>
              <ul
                className="dropdown dropdown-top dropdown-end menu rounded-box bg-base-100 mb-2 w-52 shadow-sm"
                popover="auto"
                id="popover-left-toolbar-profile"
                style={{ positionAnchor: "--popover-left-toolbar-profile" } as React.CSSProperties}
              >
                <li>
                  <button
                    className=""
                    onClick={() => {
                      void auth.logout();
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link className="btn btn-primary flex-1" to="/login">
                Login
              </Link>
              <Link className="btn btn-secondary flex-1" to="/register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
