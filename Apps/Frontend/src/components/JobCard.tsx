import { useNavigate } from 'react-router-dom';

interface JobCardProps {
    id: number;
    title: string;
    profession?: string | null;
    companyName: string;
    location: string;
    contractType?: string | null;
    rythm?: string | null;
    minSalary?: number | null;
    maxSalary?: number | null;
    currency?: string | null;
    description: string;
    skills?: string[];

}

export default function JobCard({
    id,
    title,
    profession,
    companyName,
    location,
    contractType,
    rythm,
    minSalary,
    maxSalary,
    currency = 'EUR',
    description,
    skills = [],
}: JobCardProps) {
    const navigate = useNavigate();

    const formatSalary = () => {
        if (!minSalary && !maxSalary) return null;
        const symbol = currency === 'EUR' ? '€' : currency;

        // détermine le suffixe selon le type de contrat
        let suffix = '';
        if (contractType === 'Freelance') suffix = ' / jour';
        else if (contractType === 'Stage' || contractType === 'Alternance') suffix = ' / mois';

        // Fonction de formatage
        const format = (val: number) => {
            // Si c'est un Freelance, un Stage ou une Alternance
            if (contractType === 'Freelance' || contractType === 'Stage' || contractType === 'Alternance') {
                // jour : si la donnée est type "489000", on divise par 1000 (sans "k")
                if (val >= 1000) return `${val / 1000}`;
                return val;
            }
            // Pour les CDI / CDD classiques (ex: 45000 -> 45k)
            return val >= 1000 ? `${val / 1000}k` : val;
        };

        // Rendu de la plage salariale
        if (minSalary && maxSalary && minSalary !== maxSalary) {
            return `${format(minSalary)} - ${format(maxSalary)} ${symbol}${suffix}`;
        }
        if (minSalary) return `${format(minSalary)} ${symbol}${suffix}`;
        return null;
    };

    const salaryText = formatSalary();

    return (
        <div className="bg-snow border border-carbon/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">

            {/* En-tête (Titre, Entreprise et Badges) */}
            <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                    <h2 className="text-xl font-titre text-carbon leading-tight">{title}</h2>
                    {profession && (
                        <div className="mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-white bg-indigo-500 px-2 py-1 rounded">
                                {profession}
                            </span>
                        </div>
                    )}
                    <p className="text-coral font-medium mt-1">{companyName}</p>
                </div>
            </div>

            {/* Tags (Contrat + Rythme) */}
            <div className="flex flex-wrap gap-2 mb-4">
                {contractType && <span className="bg-snow text-carbon border border-carbon/20 text-xs px-3 py-1 rounded-full font-semibold">{contractType}</span>}
                {rythm && <span className="bg-carbon/5 text-carbon/70 border border-carbon/20 text-xs px-3 py-1 rounded-full font-semibold">{rythm}</span>}
            </div>

            {/* Lieu + Salaire */}
            <div className="flex flex-col gap-2 text-sm text-carbon/70 mb-4 font-medium">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {location}
                </div>
                {salaryText && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {salaryText}
                    </div>
                )}
            </div>

            {/* Description auto-coupée : line-clamp-3 */}
            <div className="flex-grow mb-6">
                <p className="text-carbon/80 text-sm line-clamp-3">{description}</p>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {skills.slice(0, 4).map((skill, index) => (
                        <span key={index} className="text-xs bg-coral bg-opacity-10 text-carbon px-2 py-1 rounded border border-coral border-opacity-20">{skill}</span>
                    ))}
                    {skills.length > 4 && <span className="text-xs text-carbon/50 py-1">+{skills.length - 4}</span>}
                </div>
            )}

            {/* Bouton "voir l'offre" => Amène sur la page /job/+l'id du job*/}
            <div className="mt-auto pt-4 border-t border-carbon/10 flex gap-2">
                <button
                    onClick={() => navigate(`/jobs/${id}`)}
                    className="w-full bg-snow text-coral font-bold py-2 rounded-lg border-2 border-coral hover:bg-coral hover:text-snow transition-colors"
                >
                    Voir l'offre
                </button>
            </div>
        </div>
    );
}