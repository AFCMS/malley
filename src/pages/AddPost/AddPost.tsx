import { useState } from "react";
import { Link, useLocation } from "react-router";
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";
import { supabase } from "../../contexts/supabase/supabase";
import { useAuth } from "../../contexts/auth/AuthContext";
import { useNavigate } from "react-router";

export default function AddPost() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.isAuthenticated || !auth.profile) {
      setError("Vous devez être connecté pour ajouter un post.");
      return;
    }

    try {
      // Le trigger make_poster_first_author s'occupe d'ajouter l'auteur automatiquement
      const { error: postError } = await supabase
        .from("posts")
        .insert([
          {
            body,
            created_at: new Date().toISOString(),
          }
        ]);

      if (postError) {
        throw new Error(postError.message);
      }

      // Succès !
      setError(null);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen">
      {/* NavBar mobile */}
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
        {/* Sidebar gauche */}
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

              </div> 
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold mb-6">Ajouter un Post</h1>
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="Écrivez votre post ici..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <div className="card-actions justify-end mt-4">
                <button type="submit" className="btn btn-primary">
                  Publier
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Menu dock mobile */}
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
      </div>
    </div>
  );
}