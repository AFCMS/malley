import { Route, Routes } from "react-router";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import SearchResults from "../pages/Search/SearchResult";
import AddPost from "../pages/AddPost/AddPost";

export default function Router() {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/add-post" element={<AddPost />} /> {/* Nouvelle route */}
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </>
  );
}