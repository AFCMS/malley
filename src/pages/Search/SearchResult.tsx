import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { HiOutlineBell, HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineUser } from "react-icons/hi2";
import { supabase } from '../../contexts/supabase/supabase';
import type { Tables } from '../../contexts/supabase/database';
import SearchBar from '../../components/Search/SerachBarre';
import { useAuth } from "../../contexts/auth/AuthContext";

const SearchResults = () => {
  const auth = useAuth();
  const location = useLocation();
  const [posts, setPosts] = useState<Tables<"posts">[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Chargement initial des posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('posts').select('*');
        if (data) {
          setPosts(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);
  
  const handleSearchResults = (results: Tables<"posts">[]) => {
    setPosts(results);
  };

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
        {/* Sidebar gauche */}
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
        </div>
        
        {/* Contenu principal - Recherche */}
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold mb-4">Recherche de posts</h2>
          <SearchBar onSearch={handleSearchResults} />
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Résultats ({posts.length})</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body">
                      <h4 className="card-title">{post.title || 'Sans titre'}</h4>
                      <p>{post.body && post.body.length > 150 
                        ? `${post.body.substring(0, 150)}...` 
                        : post.body}
                      </p>
                      <div className="card-actions justify-end">
                        <Link className="btn btn-sm" to={`/posts/${post.id}`}>
                          Voir plus
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert">
                <p>Aucun post trouvé</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar droite - Profil */}
        <div className="hidden lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pl-8">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Profil</h2>
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
          </div>
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
};

export default SearchResults;