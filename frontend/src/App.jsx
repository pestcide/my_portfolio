import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Photos from "./pages/Photos";
import Login from "./pages/login";
import Admin from "./pages/admin";
import Editor from "./pages/Editor";
import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Blogs />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/editor" element={<Editor />} />
        {/* <Route path="/blogs" element={<Blogs />} /> */}
        <Route path="/blog" element={<BlogPost />} />
      </Routes>
    </Router>
  );
}
