import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../components/ThemeContext';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Permet de détecter les changements de page
    const { theme, toggleTheme } = useTheme();

    // Vérifie la présence du token à chaque changement de route
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setIsOpen(false);
        navigate('/');
    };

    return (
        <nav className="bg-snow text-carbon shadow-sm w-full transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Nom */}
                    <Link
                        to="/"
                        className="flex-shrink-0 flex items-center font-bold text-xl tracking-wider text-carbon hover:text-coral transition-colors no-underline"
                    >
                        GATEWAY
                    </Link>

                    {/* Menu desktop */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/recherche" className="hover:text-coral transition-colors font-medium">Recherche</Link>
                        <Link to="/profil" className="hover:text-coral transition-colors font-medium">Profil</Link>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-carbon hover:bg-coral hover:text-snow transition-colors flex items-center justify-center"
                            aria-label="Basculer le thème"
                        >
                            {theme === 'light' ? (
                                <i className="bx bx-moon text-xl"></i>
                            ) : (
                                <i className="bx bx-sun text-xl"></i>
                            )}
                        </button>
                        {/* Bouton Connexion, si connecter alors bouton déconnexion */}
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="text-carbon/70 border-2 border-carbon/30 hover:bg-carbon/10 transition-colors px-4 py-2 rounded-md font-semibold"
                            >
                                Déconnexion
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="text-coral border-2 border-coral hover:bg-coral hover:text-snow transition-colors px-4 py-2 rounded-md font-semibold no-underline"
                            >
                                Se connecter
                            </Link>
                        )}
                    </div>

                    {/* Bouton Moon/Sun (Thème) */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-carbon hover:text-coral focus:outline-none flex items-center justify-center"
                            aria-label="Basculer le thème"
                        >
                            {theme === 'light' ? (
                                <i className="bx bx-moon text-xl"></i>
                            ) : (
                                <i className="bx bx-sun text-xl"></i>
                            )}
                        </button>

                        {/* Toggle Menu */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-carbon hover:text-coral focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bouton burger mobile */}
            {isOpen && (
                <div className="md:hidden bg-snow border-t border-carbon/20">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
                        <Link
                            to="/recherche"
                            className="block px-3 py-2 hover:bg-carbon/10 rounded-md font-medium text-carbon no-underline"
                            onClick={() => setIsOpen(false)}
                        >
                            Recherche
                        </Link>
                        <Link
                            to="/profil"
                            className="block px-3 py-2 hover:bg-carbon/10 rounded-md font-medium text-carbon no-underline"
                            onClick={() => setIsOpen(false)}
                        >
                            Profil
                        </Link>

                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="mt-2 w-full text-center text-carbon/80 bg-carbon/5 hover:bg-carbon/10 px-4 py-2 rounded-md font-semibold"
                            >
                                Déconnexion
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => setIsOpen(false)}
                                className="mt-2 block w-full text-center text-snow bg-coral hover:bg-opacity-90 px-4 py-2 rounded-md font-semibold no-underline"
                            >
                                Se connecter
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}