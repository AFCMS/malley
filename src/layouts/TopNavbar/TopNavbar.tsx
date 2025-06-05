import { Link } from "react-router";

import { useAuth } from "../../contexts/auth/AuthContext";
import { utils } from "../../contexts/supabase/supabase";

export default function TopNavbar() {
  const auth = useAuth();

  return (
    <nav className="navbar bg-base-100 border-b border-slate-200 shadow-sm lg:hidden">
      <div className="navbar-start">
        {auth.isAuthenticated && auth.profile && (
          <div className="dropdown">
            <div tabIndex={0} role="button" className="avatar">
              <div className="w-10 rounded-full">
                <img src={utils.getAvatarUrl(auth.profile)} />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
              <li>
                <a>Homepage</a>
              </li>
              <li>
                <a>Portfolio</a>
              </li>
              <li>
                <a>About</a>
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
