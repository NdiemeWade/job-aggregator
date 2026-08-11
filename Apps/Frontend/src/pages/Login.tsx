import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Email ou mot de passe incorrect.');
            }

            const data = await response.json();

            localStorage.setItem('token', data.access_token);

            navigate('/');

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center mt-20 px-4 transition-colors">
            <div className="w-full max-w-md bg-snow rounded-xl shadow-md border border-carbon/20 p-8 transition-colors">
                <h1 className="text-3xl font-titre text-carbon mb-6 text-center transition-colors">Connexion</h1>

                {error && (
                    <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-6 text-center border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-carbon/80 mb-1 transition-colors">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-carbon/30 rounded-md focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent text-carbon bg-transparent placeholder-carbon/40 transition-colors"
                            placeholder=""
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-carbon/80 mb-1 transition-colors">Mot de passe</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-carbon/30 rounded-md focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent text-carbon bg-transparent placeholder-carbon/40 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-coral text-snow font-bold py-3 rounded-md hover:bg-opacity-90 transition-all"
                    >
                        Se connecter
                    </button>
                    <div className="mt-6 text-center text-sm text-carbon/70 transition-colors">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-coral hover:underline font-medium">
                            Créer un compte
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}