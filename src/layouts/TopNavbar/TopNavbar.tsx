import { Link } from "react-router";

const profileImageUrl = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

export default function TopNavbar() {
  return (
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
  );
}
