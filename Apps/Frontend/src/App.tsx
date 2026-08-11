import { Routes, Route } from 'react-router-dom'
import Navbar from "./components/Navbar"
import HeroSearch from "./pages/Home"
import Login from "./pages/Login";
import Register from "./pages/Register";
import JobsPage from "./pages/JobsPage";
import ProfilCandidat from "./pages/ProfilCandidat";
import ProfilAdmin from "./pages/ProfilAdmin";
import { ThemeProvider } from './components/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-snow transition-colors duration-300">
        <Navbar />
        <Routes>
          <Route path="/" element={<HeroSearch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs/:id?" element={<JobsPage />} />

          <Route path="/recherche" element={<div className="p-10 text-center text-carbon text-2xl font-bold transition-colors">Page de Recherche (à venir)</div>} />
          <Route path="/profil" element={<ProfilCandidat />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App