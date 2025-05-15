import { Link } from "react-router";
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";

const profileImageUrl = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

interface BaseProps {
  children: React.ReactNode;
}

export default function Base(props: BaseProps) {
  const auth = useAuth();

  return (
    <div className="min-h-screen">
      <div className="navbar bg-base-100 shadow-sm lg:hidden">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="avatar">
              <div className="w-10 rounded-full">
                <img src={profileImageUrl} />
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
        </div>
        <div className="navbar-center">
          <Link className="btn btn-ghost text-xl" to="/">
            Malley
          </Link>
        </div>
        <div className="navbar-end"></div>
      </div>
      <div className="mx-auto flex min-h-full max-w-3xl md:max-w-7xl lg:px-8">
        <div className="hidden border-r border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
          <div className="sticky top-8 pb-8">
            <div className="flex min-h-[calc(100vh-60px)] flex-col justify-between space-y-9">
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
                <div className="border-base-200 flex items-center gap-3 p-2">
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
        <div className="flex flex-1 flex-col lg:px-8 lg:pt-[30px]">{props.children}</div>
        <div className="hidden border-l border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pl-8">
          {/* You can put any content here, for now just a placeholder */}
          <div className="sticky top-8 pb-8">
            <div className="flex flex-col items-start space-y-4">
              <div className="text-lg font-semibold">Right Sidebar</div>
              {/* Add more content as needed */}
            </div>
          </div>
        </div>
        <div className="dock dock-xs lg:hidden">
          <Link className={location.pathname === "/" ? "dock-active" : undefined} to="/" title="Feed">
            <HiOutlineHome className="size-6" />
          </Link>

          <Link className={location.pathname === "/search" ? "dock-active" : undefined} to="/search" title="Search">
            <HiOutlineMagnifyingGlass className="size-6" />
          </Link>

          <Link className={location.pathname === "/profile" ? "dock-active" : undefined} to="/" title="Notifications">
            <HiOutlineBell className="size-6" />
          </Link>

          <Link className={location.pathname === "/profile" ? "dock-active" : undefined} to="/profile" title="Profile">
            <HiOutlineUser className="size-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
