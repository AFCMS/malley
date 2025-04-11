import { useEffect, useState } from "react";
import { supabase } from "../../contexts/supabase/supabase";
import { PostgrestSingleResponse, UserResponse } from "@supabase/supabase-js";
import { useAuth } from "../../contexts/auth/AuthContext";
import { Link } from "react-router";

export default function Home() {
  const auth = useAuth();

  const [data, setData] = useState<PostgrestSingleResponse<
    {
      created_at: string;
      handle: string | null;
      id: string;
    }[]
  > | null>(null);

  const [data2, setData2] = useState<UserResponse | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then((res) => {
        setData(res);
      });
  }, []);
<<<<<<< Updated upstream

  useEffect(() => {
    void supabase.auth.getUser().then((res) => {
      setData2(res);
    });
  }, []);

=======
  console.log("isAuthenticated:", auth.isAuthenticated);
  console.log("profile:", auth.profile);
>>>>>>> Stashed changes
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-full max-w-3xl bg-amber-300 md:max-w-7xl lg:px-8">
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
        <div className="lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pr-8">
          <div className="flex flex-col"></div>
          <h1>Home</h1>
          <span>{JSON.stringify(data2?.data.user)}</span>
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
      </div>
    </div>
  );
}