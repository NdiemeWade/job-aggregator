import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    required_experience?: string;
    posted_at?: string;
    source?: string;
}

export default function JobsPage() {
    const { id } = useParams();
    const navigate = useNavigate(); // rend les cartes cliquables
    const [jobs, setJobs] = useState<ApiJobOffer[]>([]);

    // States pour le scroll infini
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const limit = 15;

    useEffect(() => {
        const fetchJobs = async () => {
            if (loading || !hasMore) return;
            setLoading(true);

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

                    setJobs(prev => page === 1 ? data.items : [...prev, ...data.items]);

                    if (data.items.length < limit) {
                        setHasMore(false);
                    }
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [page]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            if (!loading && hasMore) {
                setPage(prev => prev + 1);
            }
        }
    };

    const selectedJob = jobs.find(job => job.id === Number(id));

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-snow overflow-hidden transition-colors">

            {/* EN-TÊTE : BARRE DE RECHERCHE */}
            <div className="w-full px-4 py-4 border-b border-carbon/20 bg-snow flex justify-center shrink-0 shadow-sm z-10 transition-colors">
                <div className="w-full max-w-4xl bg-snow rounded-full border border-carbon/30 flex flex-col md:flex-row overflow-hidden transition-colors">
                    <div className="flex-1 flex items-center px-4 py-2 md:border-r border-carbon/20">
                        <svg className="w-5 h-5 text-carbon/50 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input type="text" placeholder="Intitulé du poste, mots-clés..." className="w-full outline-none text-carbon bg-transparent text-sm placeholder-carbon/40" />
                    </div>
                    <div className="flex-1 flex items-center px-4 py-2 md:border-r border-carbon/20 border-t md:border-t-0">
                        <svg className="w-5 h-5 text-carbon/50 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <input type="text" placeholder="Nancy (54), Paris..." className="w-full outline-none text-carbon bg-transparent text-sm placeholder-carbon/40" />
                    </div>
                    <button className="bg-coral text-snow font-bold px-6 py-2 md:py-0 hover:bg-opacity-90 transition-all w-full md:w-auto">
                        Rechercher
                    </button>
                </div>
            </div>

            {/* ZONE SPLIT SCREEN */}
            <div className="flex flex-1 overflow-hidden">

                {/* PANNEAU GAUCHE */}
                <div
                    className="w-full md:w-1/3 h-full overflow-y-auto border-r border-carbon/20 p-4 bg-carbon/5 transition-colors"
                    onScroll={handleScroll}
                >
                    <div className="flex flex-col gap-4 pb-20">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/jobs/${job.id}`)}
                                className={`transition-all duration-200 ${Number(id) === job.id ? 'ring-2 ring-coral rounded-xl opacity-100' : 'opacity-75 hover:opacity-100 cursor-pointer'}`}
                            >
                                <JobCard
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
                            </div>
                        ))}

                        {loading && (
                            <div className="text-center py-4 text-coral font-bold animate-pulse">
                                Chargement des offres...
                            </div>
                        )}
                    </div>
                </div>

                {/* PANNEAU DROIT */}
                <div className="hidden md:block w-2/3 h-full overflow-y-auto p-10 bg-snow transition-colors relative">
                    {selectedJob ? (
                        <div className="max-w-3xl mx-auto pb-20 px-4">

                            <div className="mb-8">
                                {selectedJob.profession && (
                                    <span className="inline-block mb-3 bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                        {selectedJob.profession}
                                    </span>
                                )}
                                <h1 className="text-3xl md:text-4xl font-titre text-carbon mb-2 transition-colors">{selectedJob.title}</h1>
                                <p className="text-xl text-coral font-bold">{selectedJob.company_name}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {selectedJob.contract_type && <span className="bg-snow border border-carbon/20 px-3 py-1 rounded-md text-sm font-semibold text-carbon transition-colors">{selectedJob.contract_type}</span>}
                                {selectedJob.rythm && <span className="bg-carbon/10 text-carbon/70 border border-carbon/20 px-3 py-1 rounded-md text-sm font-semibold transition-colors">{selectedJob.rythm}</span>}
                                {selectedJob.location && <span className="bg-snow border border-carbon/20 px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-1 text-carbon transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>{selectedJob.location}</span>}
                                {(selectedJob.min_salary || selectedJob.max_salary) && (
                                    <span className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-md text-sm font-semibold transition-colors">
                                        {selectedJob.min_salary ? `${(selectedJob.min_salary / 1000).toFixed(0)}k` : ''}
                                        {selectedJob.min_salary && selectedJob.max_salary ? ' - ' : ''}
                                        {selectedJob.max_salary ? `${(selectedJob.max_salary / 1000).toFixed(0)}k` : ''} €
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 bg-carbon/5 p-4 rounded-lg border border-carbon/10 text-sm transition-colors">
                                <div>
                                    <p className="text-carbon/60">Expérience</p>
                                    <p className="font-semibold text-carbon">{selectedJob.required_experience || "Non précisé"}</p>
                                </div>
                                <div>
                                    <p className="text-carbon/60">Publié le</p>
                                    <p className="font-semibold text-carbon">
                                        {selectedJob.posted_at ? new Date(selectedJob.posted_at).toLocaleDateString('fr-FR') : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-carbon/60">Source</p>
                                    <p className="font-semibold text-coral">{selectedJob.source || "WeLoveDevs"}</p>
                                </div>
                            </div>

                            <div className="mb-10">
                                <h3 className="text-xl font-titre text-carbon mb-4 transition-colors">Description du poste</h3>
                                <div className="text-carbon/80 leading-relaxed whitespace-pre-wrap text-base break-words transition-colors">
                                    {selectedJob.description}
                                </div>
                            </div>

                            {selectedJob.skills && selectedJob.skills.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="text-xl font-titre text-carbon mb-4 transition-colors">Compétences</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJob.skills.map((skill, index) => (
                                            <span key={index} className="bg-coral bg-opacity-10 text-carbon px-3 py-1 rounded-md font-medium text-sm border border-coral border-opacity-20 transition-colors">
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BOUTON POSTULER (EN DUR) */}
                            <div className="sticky bottom-0 pt-4 bg-snow border-t border-carbon/10 transition-colors">
                                <button className="w-full bg-coral text-white font-bold py-4 rounded-lg hover:bg-opacity-90 transition-all shadow-lg text-lg">
                                    Postuler à cette offre
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-carbon/50 transition-colors">
                            <svg className="w-24 h-24 mb-6 text-carbon/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <p className="text-3xl font-titre text-carbon transition-colors">Sélectionnez une offre</p>
                            <p className="text-lg mt-2 text-center text-carbon/70">Cliquez sur une carte à gauche pour afficher les détails ici.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}