import { Route, Routes } from "react-router";
import Home from "../pages/Home/Home";

export default function Router() {
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
      </Routes>
    </>
  );
}
