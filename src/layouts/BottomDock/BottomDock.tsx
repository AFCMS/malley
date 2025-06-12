import { Link, useLocation } from "react-router";
import {
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlinePencil,
  HiOutlineSquare2Stack,
  HiOutlineUser,
} from "react-icons/hi2";

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

      <Link
        className={location.pathname === "/swipe" ? "dock-active" : undefined}
        to={auth.isAuthenticated && auth.profile ? "/swipe" : "/login"}
        title="Discover"
      >
        <HiOutlineSquare2Stack className="size-6" />
      </Link>

      <Link
        className={location.pathname === "/post" ? "dock-active" : undefined}
        to={auth.isAuthenticated && auth.profile ? "/post" : "/login"}
        title="Post"
      >
        <HiOutlinePencil className="size-6" />
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
