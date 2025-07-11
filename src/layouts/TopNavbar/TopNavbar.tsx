import { Link } from "react-router";
import { HiOutlineArrowLeftStartOnRectangle, HiOutlineCog6Tooth, HiOutlineUsers } from "react-icons/hi2";

import { useAuth } from "../../contexts/auth/AuthContext";
import { utils } from "../../contexts/supabase/supabase";

import Dropdown from "../../Components/Dropdown/Dropdown";

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
            <Dropdown id="popover-top-navbar-profile" placement="bottom-start">
              {[
                {
                  title: "Logout",
                  icon: HiOutlineArrowLeftStartOnRectangle,
                  onClick: () => {
                    void auth.logout();
                  },
                },
                {
                  title: "Settings",
                  icon: HiOutlineCog6Tooth,
                  href: "/settings",
                },
                {
                  title: "Following",
                  icon: HiOutlineUsers,
                  href: "/profile/following",
                },
                {
                  title: "Followed",
                  icon: HiOutlineUsers,
                  href: "/profile/followed",
                },
              ]}
            </Dropdown>
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
