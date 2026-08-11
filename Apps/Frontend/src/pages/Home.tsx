import { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';

interface ApiJobOffer {
    id: number;
    title: string;
    profession?: string | null;
    description: string;
    location: string;
    contract_type?: string;
    rythm?: string;
    min_salary?: number;
    max_salary?: number;
    company_name: string;
    company_logo_url?: string;
    skills: { name: string; relevance: number }[];
}

export default function HeroSearch() {
    const [jobs, setJobs] = useState<ApiJobOffer[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 9; // 9 offres pour avoir 3 rangées de 3

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:8000/api/jobs?page=${page}&size=${limit}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setJobs(data.items);
                    setTotalPages(Math.ceil(data.total / limit));
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
            }
        };
        fetchJobs();
    }, [page]);

    return (
        <div className="w-full flex flex-col items-center justify-center mt-20 px-4 transition-colors">
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <h1 className="text-4xl font-titre text-carbon mb-2 text-center transition-colors">  GATEWAY </h1>
            <p className="text-carbon/70 mb-8 text-center transition-colors">La passerelle vers votre prochain stage</p>

            {/* Search Container (en dur) */}
            <div className="w-full max-w-4xl bg-snow rounded-full shadow-md border border-carbon/20 flex flex-col md:flex-row overflow-hidden mb-16 transition-colors">

                {/* Quoi ? */}
                <div className="flex-1 flex items-center px-4 py-3 md:border-r border-carbon/20">
                    <svg className="w-5 h-5 text-carbon/50 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Intitulé du poste, mots-clés..."
                        className="w-full outline-none text-carbon bg-transparent placeholder-carbon/40"
                    />
                </div>

                {/* Où ? */}
                <div className="flex-1 flex items-center px-4 py-3 md:border-r border-carbon/20 border-t md:border-t-0">
                    <svg className="w-5 h-5 text-carbon/50 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Nancy (54), Paris..."
                        className="w-full outline-none text-carbon bg-transparent placeholder-carbon/40"
                    />
                </div>

                {/* Bouton */}
                <button className="bg-coral text-snow font-bold px-8 py-4 md:py-0 hover:bg-opacity-90 transition-all w-full md:w-auto">
                    Rechercher
                </button>
            </div>

            {/* Section des JobCard */}
            <div className="w-full max-w-6xl px-4 pb-20">
                <h2 className="text-2xl font-titre text-carbon mb-6 text-left w-full transition-colors">Dernières offres WeLoveDevs</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <JobCard
                            key={job.id}
                            id={job.id}
                            title={job.title}
                            companyName={job.company_name}
                            location={job.location}
                            contractType={job.contract_type}
                            rythm={job.rythm}
                            minSalary={job.min_salary}
                            maxSalary={job.max_salary}
                            description={job.description}
                            skills={job.skills ? job.skills.map((s) => s.name) : []}
                            profession={job.profession}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 border-2 border-coral text-coral rounded-md font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-coral hover:text-snow transition-colors"
                        >
                            Précédent
                        </button>
                        <span className="font-bold text-carbon transition-colors">Page {page} / {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 border-2 border-coral text-coral rounded-md font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-coral hover:text-snow transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}