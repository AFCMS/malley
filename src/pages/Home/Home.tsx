import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";

import { supabase } from "../../contexts/supabase/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { useAuth } from "../../contexts/auth/AuthContext";

export default function Home() {
  const auth = useAuth();

  const [data, setData] = useState<PostgrestSingleResponse<
    {
      created_at: string;
      handle: string | null;
      id: string;
    }[]
  > | null>(null);

  const location = useLocation();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then((res) => {
        setData(res);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="avatar">
              <div className="w-10 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
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
          <a className="btn btn-ghost text-xl">Malley</a>
        </div>
        <div className="navbar-end"></div>
      </div>
      <div className="mx-auto flex min-h-full max-w-3xl bg-amber-300 md:max-w-7xl lg:px-8">
        <div className="lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
          <div className="flex flex-col"></div>
          <h1>Home</h1>
          <br />
          {auth.isAuthenticated ? (
            <>
              <div>{auth.profile?.handle}</div>
              <button
                onClick={() => {
                  auth.logout().catch(console.error);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <div>Not authenticated</div>
              <Link className="mr-2 bg-amber-100 p-2" to="/login">
                Login
              </Link>
              <Link className="bg-amber-100 p-2" to="/register">
                Register
              </Link>
            </>
          )}
          {data?.data?.map((user) => {
            return <div key={user.id}>{user.id + "::" + user.created_at}</div>;
          })}
        </div>
        <span>content</span>
        <div className="dock dock-xs">
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
