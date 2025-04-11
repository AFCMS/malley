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
<<<<<<< Updated upstream

<<<<<<< HEAD
  useEffect(() => {
    void supabase.auth.getUser().then((res) => {
      setData2(res);
    });
  }, []);

=======
  console.log("isAuthenticated:", auth.isAuthenticated);
  console.log("profile:", auth.profile);
>>>>>>> Stashed changes
=======
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
  return (
    <div className="min-h-screen">
      <div className="navbar bg-base-100 shadow-sm lg:hidden">
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
          <Link className="btn btn-ghost text-xl" to="/">
            Malley
          </Link>
        </div>
        <div className="navbar-end"></div>
      </div>
      <div className="mx-auto flex min-h-full max-w-3xl bg-amber-300 md:max-w-7xl lg:px-8">
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
        <div className="hidden lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
          <div className="sticky top-8 pb-8">
            <div className="flex min-h-[calc(100vh-60px)] flex-col justify-between space-y-9">
            <div className="flex flex-col space-y-2">
                <Link className="sidebarlink" to="/">
                  <HiOutlineHome className="h-5 opacity-50" />
                  Home
                </Link>
                <Link className="sidebarlink" to="/search">
                  <HiOutlineMagnifyingGlass className="h-5 opacity-50" />
                  Recherche
                </Link>
                <Link className="sidebarlink" to="/profile">
                  <HiOutlineBell className="h-5 opacity-50" />
                  Notifications
                </Link>
                <Link className="sidebarlink" to="/profile">
                  <HiOutlineUser className="h-5 opacity-50" />
                  Profile
                </Link>
                {/* Ajout du bouton pour créer un post (version desktop) */}
                {auth.isAuthenticated && (
                  <Link className="btn btn-primary w-full" to="/add-post">
                    Ajouter un Post
                  </Link>
                )}
              </div> 
            </div>
          </div>
        </div>
>>>>>>> Stashed changes
=======
        <div className="hidden lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
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
            </div>
          </div>
        </div>
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
        <div className="lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
          <div className="flex flex-col"></div>
          <h1>Home</h1>
          <br />
          
          {auth.isAuthenticated ? (
            <>
              <div className="mb-2">{auth.profile?.handle}</div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  auth.logout().catch(console.error);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="mb-2">Not authenticated</div>
              <div className="flex space-x-2">
                <Link className="btn btn-sm" to="/login">
                  Login
                </Link>
                <Link className="btn btn-sm" to="/register">
                  Register
                </Link>
              </div>
            </>
          )}
          {data?.data?.map((user) => {
            return <div key={user.id}>{user.id + "::" + user.created_at}</div>;
          })}
        </div>
        <span>content</span>
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
        <div className="lg:hidden">
          {/* Bouton pour ajouter un post en version mobile */}
          {auth.isAuthenticated && (
            <div className="fixed bottom-20 right-4 z-10">
              <Link className="btn btn-primary btn-circle shadow-lg" to="/add-post">
                +
              </Link>
            </div>
          )}
          
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
>>>>>>> Stashed changes
=======
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
>>>>>>> 796ffda604e7fe25ab7ed533726a8f38f1bfff00
      </div>
    </div>
  );
}