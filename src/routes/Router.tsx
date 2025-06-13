import { Route, Routes } from "react-router";

import Home from "../pages/Home/Home";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Settings from "../pages/Settings/Settings";
import ProfileViewer from "../pages/ProfileViewer/ProfileViewer";
import ProfileViewerFeatured from "../pages/ProfileViewerFeatured/ProfileViewerFeatured";
import AddPost from "../pages/AddPost/AddPost";
import ViewPost from "../pages/ViewPost/ViewPost";
import SwipePage from "../pages/SwipePage/SwipePage";
import Search from "../pages/Search/Search";
import ProfileCategories from "../pages/ProfileCategories/ProfileCategories";
import ProfileFollowing from "../pages/ProfileFollowing/ProfileFollowing";
import ProfileFollowed from "../pages/ProfileFollowed/ProfileFollowed";
import ProfileList from "../pages/ProfileList/ProfileList";
import AskAuthor from "../pages/AskAuthor/AskAuthor";

export default function Router() {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/search" element={<Search />} />
        <Route path="/post" element={<AddPost />} />
        <Route path="/post/:postId" element={<ViewPost />} />
        <Route path="/post/:postId/edit" element={<AddPost />} />
        <Route path="/:handle" element={<ProfileViewer />} />
        <Route path="/:handle/featured" element={<ProfileViewerFeatured />} />
        <Route path="/profile/categories" element={<ProfileCategories />} />
        <Route path="/profile/following" element={<ProfileFollowing />} />
        <Route path="/profile/followed" element={<ProfileFollowed />} />
        <Route path="/profile/list" element={<ProfileList />} />
        <Route path="/ask-author" element={<AskAuthor />} />
        <Route path="/swipe" element={<SwipePage />} />
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </>
  );
}
