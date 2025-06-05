import { Link } from "react-router";

import { useAuth } from "../../contexts/auth/AuthContext";
import { utils } from "../../contexts/supabase/supabase";
import { closePopover } from "../../utils/popover";

export default function TopNavbar() {
  const auth = useAuth();

  return (
    <nav className="navbar bg-base-100 border-b border-slate-200 shadow-sm lg:hidden">
      <div className="navbar-start">
        {auth.isAuthenticated && auth.profile && (
          <div className="">
            <button
              className="avatar"
              popoverTarget="popover-top-navbar-profile"
              style={{ anchorName: "--popover-top-navbar-profile" } as React.CSSProperties}
            >
              <div className="w-10 rounded-full">
                <img src={utils.getAvatarUrl(auth.profile)} />
              </div>
            </button>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown dropdown-bottom dropdown-start bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
              popover="auto"
              id="popover-top-navbar-profile"
              style={{ positionAnchor: "--popover-top-navbar-profile" } as React.CSSProperties}
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
                <Link to="/settings" onClick={closePopover("popover-top-navbar-profile")}>
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
      <div className="navbar-center">
        <Link className="flex h-10 items-center justify-center px-4 text-xl font-semibold select-none" to="/">
          Malley
        </Link>
      </div>
      <div className="navbar-end"></div>
    </nav>
  );
}
