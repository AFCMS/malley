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
                        <img src={"https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"} />
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
        <div className="flex flex-1 flex-col lg:px-8 lg:pt-[30px]">
          <div className="flex flex-col"></div>
          <h1>Home</h1>
          <br />
          {auth.isAuthenticated && auth.profile && auth.user ? (
            <>
              <div>{auth.profile.handle}</div>
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
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis in posuere elit. Quisque mollis, massa id
          porttitor ullamcorper, sapien dolor sagittis nisi, vitae mattis purus ipsum vel purus. In sit amet orci vel ex
          iaculis placerat sit amet a diam. Ut nec ex imperdiet, lobortis erat luctus, pharetra nunc. Donec condimentum
          condimentum erat, eget sollicitudin purus laoreet sit amet. Sed eget massa a nibh lobortis lacinia. Nullam eu
          vestibulum ex. Sed eget rhoncus sapien, quis luctus erat. In facilisis convallis augue nec varius. Fusce
          vestibulum sollicitudin tellus a efficitur. Proin viverra ornare porta. In finibus sem dui, non mollis ante
          dapibus eget. Nullam mattis nulla sit amet molestie iaculis. Vestibulum porttitor erat non justo gravida
          consectetur. Donec sit amet viverra turpis. Phasellus vehicula suscipit nunc sed lobortis. Curabitur vel
          egestas sapien, aliquam vehicula quam. Aliquam laoreet venenatis dolor, volutpat pulvinar elit tristique ac.
          Fusce fermentum tortor at felis lobortis molestie. In hac habitasse platea dictumst. Vestibulum ante ipsum
          primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec pulvinar libero eros, vitae rutrum
          ante placerat sed. Vestibulum tristique magna vestibulum neque blandit, id molestie enim tristique. Nulla eget
          mollis odio. Vestibulum dignissim placerat tempor. Quisque egestas ligula erat, a varius libero placerat quis.
          In eu orci non ligula pharetra maximus. Curabitur eu tortor vitae augue pulvinar molestie. Etiam commodo lorem
          id justo ultrices ullamcorper. Quisque a scelerisque nisi, ut varius nibh. Donec varius, eros et tempor
          venenatis, orci ex vestibulum dui, nec accumsan erat lorem id libero. Fusce at purus a mi dictum tristique.
          Proin dapibus lectus ut orci fermentum accumsan. Fusce at eros nibh. Vestibulum laoreet elit augue.
          Suspendisse posuere elementum nibh a gravida. Duis commodo ex ac arcu blandit efficitur. Aliquam nec turpis
          ullamcorper, molestie nulla a, malesuada massa. Vestibulum at justo sed ligula egestas cursus. Nulla posuere
          lorem ac ligula ornare egestas. Phasellus pellentesque, sem vel condimentum auctor, nisi dui faucibus justo,
          vel pretium nibh nisi at odio. Donec consectetur iaculis vehicula. Donec eleifend facilisis pretium. Aliquam
          sed hendrerit mi. Aliquam erat volutpat. Integer lobortis ex in varius tincidunt. Integer turpis justo,
          commodo quis aliquam sed, fringilla eu nunc. Integer eu sagittis libero. Vivamus hendrerit luctus diam, nec
          blandit ante vestibulum ut. Fusce et arcu sapien. Nunc non tincidunt tortor. Cras rhoncus gravida lobortis.
          Nunc eget euismod justo, eget pharetra lectus. Nunc sit amet diam arcu. Nam ex risus, tincidunt eu risus ac,
          porttitor feugiat ipsum. Mauris interdum justo sem, aliquam finibus nibh venenatis vitae. Pellentesque ipsum
          eros, vulputate vel eros nec, pretium egestas sem. Integer sit amet nunc a libero interdum viverra non vitae
          tellus. Cras vel ante quis massa efficitur scelerisque in eu leo. Etiam orci elit, molestie vitae eleifend a,
          blandit non ante. Nulla facilisi. Phasellus libero erat, lacinia eget risus at, consequat condimentum risus.
          Integer porta metus quis tellus ultrices, quis ultricies ipsum tincidunt. Etiam egestas velit eget eros
          tincidunt, sed placerat sapien pretium. Suspendisse bibendum lorem mollis rhoncus semper. Morbi suscipit sit
          amet enim vel porta. Suspendisse potenti. Duis in lorem ante. Mauris nec felis scelerisque, congue metus a,
          viverra est. Pellentesque consequat, libero in varius mattis, sem ipsum laoreet libero, ac ultricies leo urna
          vel erat. Ut varius a felis ac condimentum. Maecenas dui urna, elementum in ultrices ac, condimentum vel ante.
          Donec eu hendrerit arcu, nec commodo neque. Vivamus a venenatis tellus, at euismod urna. Nullam posuere justo
          lectus, sed bibendum erat finibus vitae. Pellentesque diam dolor, feugiat id nisl tempus, congue posuere quam.
          Nulla ac est quis turpis pharetra efficitur a eget sem. Pellentesque habitant morbi tristique senectus et
          netus et malesuada fames ac turpis egestas. Pellentesque habitant morbi tristique senectus et netus et
          malesuada fames ac turpis egestas. Quisque sed tortor ut mi pellentesque laoreet eget at lectus. Nunc nisl
          tellus, ultrices vitae ultrices sed, pulvinar ac nibh. Maecenas sed nisl porttitor, finibus dui sit amet,
          condimentum velit. Phasellus id sollicitudin lectus. Phasellus nec turpis nisl. Quisque vestibulum vel lacus a
          molestie. Nulla a mauris non lectus mollis facilisis vel vel metus. In ut dui sollicitudin, fringilla dolor
          at, rhoncus justo. Phasellus vel lorem in sapien ornare elementum nec quis velit. Donec mollis lacus vitae
          quam auctor, quis dignissim dui ultrices. Phasellus facilisis nunc sit amet sollicitudin aliquet. Etiam
          vestibulum eleifend purus in ullamcorper. Donec convallis tristique elementum. In eget lorem eu leo fringilla
          volutpat volutpat sed urna. Phasellus vitae dictum leo. Mauris vel egestas nunc. Vestibulum ante ipsum primis
          in faucibus orci luctus et ultrices posuere cubilia curae; Interdum et malesuada fames ac ante ipsum primis in
          faucibus. Vivamus eleifend nisi sit amet tellus aliquet congue. Morbi elit turpis, finibus id maximus in,
          auctor pellentesque purus. Donec mollis lacus interdum mi tristique pharetra. Nunc urna lacus, sagittis id
          libero quis, gravida ultricies nulla. Mauris congue hendrerit tortor quis viverra. Donec consectetur urna
          massa, ac porta massa mollis eget. Integer sapien risus, porttitor eu turpis in, luctus porttitor est. Proin
          blandit est a lectus imperdiet, eu dignissim ligula aliquet. Fusce imperdiet augue at nibh pulvinar sodales at
          nec dolor. Mauris tempor dignissim orci nec iaculis. Nullam pellentesque tempor dui porta tincidunt. Nulla
          facilisi. Proin quis tortor ipsum. Duis elit odio, auctor sit amet dignissim at, pellentesque nec nunc. Etiam
          lacinia felis at mi lacinia feugiat. Sed a hendrerit felis, a elementum libero. Nunc venenatis nec ipsum
          sodales auctor. Proin malesuada rutrum tortor facilisis faucibus. Etiam mauris augue, gravida et massa et,
          accumsan accumsan nunc. Ut et sollicitudin est. Nam rutrum rhoncus tortor pharetra ornare.
        </div>
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
