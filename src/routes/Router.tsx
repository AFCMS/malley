import { Route, Routes } from "react-router";

import Home from "../pages/Home/Home";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ProfileViewer from "../pages/ProfileViewer/ProfileViewer";
import AddPost from "../pages/AddPost/AddPost";
import ViewPost from "../pages/ViewPost/ViewPost";

export default function Router() {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<div>Settings</div>} />
        <Route path="/post" element={<AddPost />} />
        <Route path="/post/:postId" element={<ViewPost />} />
        <Route path="/:handle" element={<ProfileViewer />} />
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </>
  );
}
