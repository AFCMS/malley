import {
  HiOutlineEllipsisHorizontal,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlinePencil,
  HiOutlineUser,
} from "react-icons/hi2";
import { Link, useNavigate } from "react-router";

import { closePopover } from "../../utils/popover";
import { useAuth } from "../../contexts/auth/AuthContext";
import { utils } from "../../contexts/supabase/supabase";

export default function LeftToolbarWide() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const queryValue = formData.get("search");
    if (queryValue && typeof queryValue === "string" && queryValue.trim()) {
      void navigate(`/search?query=${encodeURIComponent(queryValue.trim())}`);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="hidden border-r border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
      <div className="sticky top-8 flex h-[calc(100vh-60px)] flex-col">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col space-y-6">
            <Link className="flex h-10 items-center justify-center px-4 text-xl font-semibold select-none" to="/">
              Malley
            </Link>
            <form onSubmit={handleSearchSubmit}>
              <label className="input">
                <HiOutlineMagnifyingGlass className="h-[1em] opacity-50" />
                <input type="search" name="search" required placeholder="Search" />
              </label>
            </form>
            <div className="flex flex-col space-y-2">
              <Link className="sidebarlink" to="/">
                <HiOutlineHome className="h-5 opacity-50" />
                Home
              </Link>
              <Link
                className="sidebarlink"
                to={auth.isAuthenticated && auth.profile ? `/@${auth.profile.handle}` : "/login"}
              >
                <HiOutlineUser className="h-5 opacity-50" />
                Profile
              </Link>
              <Link
                className="btn flex shrink-0 flex-nowrap items-center justify-start gap-1.5 p-2 align-middle text-xl font-normal outline-offset-2 select-none"
                to="/post"
              >
                <HiOutlinePencil className="h-5 opacity-50" />
                Post
              </Link>
            </div>
          </div>

          {auth.isAuthenticated && auth.profile && auth.user ? (
            <div className="border-base-200 mt-auto flex items-center gap-3 border-t p-2">
              <div className="flex items-center gap-3">
                <Link to={`/@${auth.profile.handle}`} className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={utils.getAvatarUrl(auth.profile)} />
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
                <li>
                  <Link to="/settings" onClick={closePopover("popover-left-toolbar-profile")}>
                    Settings
                  </Link>
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
