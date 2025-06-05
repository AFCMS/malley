import { Link, useLocation } from "react-router";
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";

export default function BottomDock() {
  const auth = useAuth();
  const location = useLocation();

  return (
    <nav className="dock dock-xs lg:hidden">
      <Link className={location.pathname === "/" ? "dock-active" : undefined} to="/" title="Feed">
        <HiOutlineHome className="size-6" />
      </Link>

      <Link className={location.pathname === "/search" ? "dock-active" : undefined} to="/search" title="Search">
        <HiOutlineMagnifyingGlass className="size-6" />
      </Link>

      <Link className={location.pathname === "/profile" ? "dock-active" : undefined} to="/" title="Notifications">
        <HiOutlineBell className="size-6" />
      </Link>

      <Link
        className={location.pathname === `/@${auth.profile?.handle ?? ""}` ? "dock-active" : undefined}
        to={auth.isAuthenticated && auth.profile ? `/@${auth.profile.handle}` : "/login"}
        title="Profile"
      >
        <HiOutlineUser className="size-6" />
      </Link>
    </nav>
  );
}
