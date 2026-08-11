// IMPORTATION
import { useState, useEffect } from "react";
import "boxicons/css/boxicons.min.css";

// COULEURS 
const C = {
  black:      "#1F1C1B",
  coralDark:  "#C56D53",
  coral:      "#FC8865",
  coralLight: "#FCDCD3",
  muted:      "#575352",
  border:     "#E8E4E3",
  snow:       "#FCF8F7",
  white:      "#fff",
  blue:       "#03779A",
  blueLight:  "#D4F3FC",
  green:      "#059669",
  greenLight: "#D1FAE5",
  red:        "#C0392B",
  redLight:   "#FDECEA",
  yellow:     "#92400E",
  yellowLight:"#FEF3C7",
};

// STYLES
const s: Record<string, React.CSSProperties> = {
  // LAYOUT
  shell:     { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: C.snow, color: C.black },
  sidebar:   { width: 220, background: C.white, borderRight: `3px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" },
  main:      { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar:    { background: C.white, borderBottom: `3px solid ${C.border}`, padding: "0 1.75rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  content:   { padding: "1.75rem", flex: 1 },

  // SIDEBAR
  sideHead:  { padding: "1.25rem 1.25rem 0.5rem", borderBottom: `3px solid ${C.border}` },
  sideTitle: { fontWeight: 800, fontSize: 18, color: C.coral, letterSpacing: "-0.5px" },
  sideNav:   { padding: "0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  sideItem:  { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s", color: C.muted, border: "none", background: "transparent", fontFamily: "inherit", width: "100%", textAlign: "left" },
  sideItemActive: { background: C.coral, color: C.white },
  sideFoot:  { padding: "1rem", borderTop: `3px solid ${C.border}` },

  // CARDS
  card:      { background: C.white, border: `3px solid ${C.border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" },
  cardTitle: { fontWeight: 700, fontSize: 15, display: "block", marginBottom: "1rem", letterSpacing: "0.03em" },
  cardGrid:  { display: "grid", gap: "1.25rem", marginBottom: "1.25rem" },

  // STAT BOX
  statBox:   { background: C.white, border: `3px solid ${C.border}`, borderRadius: 8, padding: "1.25rem 1.5rem" },
  statVal:   { fontSize: 30, fontWeight: 800, color: C.coral, lineHeight: 1.1, marginBottom: 4 },
  statLbl:   { fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" },

  // TYPOGRAPHY
  label:     { fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3, display: "block" },

  // FORM
  input:     { border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "7px 11px", fontSize: 13, fontFamily: "inherit", background: C.white, outline: "none", color: C.black, boxSizing: "border-box" },
  inputGray: { border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "7px 11px", fontSize: 13, fontFamily: "inherit", background: C.snow, outline: "none", color: C.black, boxSizing: "border-box" },

  // BUTTONS
  btn:        { background: C.coral, color: C.white, border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnOutline: { background: "transparent", color: C.coral, border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnGhost:   { background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  btnDanger:  { background: C.redLight, color: C.red, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  // TABLE
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "6px 10px", borderBottom: `2px solid ${C.border}` },
  td:        { padding: "10px", fontSize: 13, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" },

  // MISC
  infoBox:   { background: C.snow, border: `3px solid ${C.border}`, borderRadius: 8, padding: "0.75rem 1rem" },
  tag:       { borderRadius: 8, padding: "3px 12px", fontSize: 11, fontWeight: 700, display: "inline-block" },
  dot:       { width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 6, flexShrink: 0 },
};

// API HELPER
// Toutes les requêtes vers FastAPI passent ici. Token JWT lu depuis localStorage.
const API = "http://localhost:8000/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Erreur ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// TYPES

interface Stats {
  total_users: number;         // COUNT(users)
  total_offers: number;        // COUNT(job_offers)
  pending_moderation: number;  // COUNT(job_offers WHERE is_moderated = false)
  total_companies: number;     // COUNT(companies)
  total_skills: number;        // COUNT(skills)
  total_favorites: number;     // COUNT(user_favorite)
}

interface AdminUser {
  id: number;           // users.id
  email: string;        // users.email
  role: string;         // roles.name via users.role_id
  created_at: string;   // users.created_at
}

interface AdminOffer {
  id: number;               // job_offers.id
  title: string;            // job_offers.title
  company_name: string;     // companies.name (JOIN)
  location: string;         // job_offers.location
  contract_type: string;    // job_offers.contract_type
  source: string;           // job_offers.source
  is_moderated: boolean;    // job_offers.is_moderated
  posted_at: string;        // job_offers.posted_at
  relevance_score: number;  // job_offers.relevance_score
}

interface AdminCompany {
  id: number;          // companies.id
  name: string;        // companies.name
  logo_url: string;    // companies.logo_url
  website_url: string; // companies.website_url
  offers_count: number;// COUNT(job_offers WHERE company_id = id)
}

// PAGES DE NAVIGATION 
type Page = "overview" | "users" | "offers" | "companies" | "moderation";

// UTILITAIRE
function Badge({ children, color = "coral" }: { children: React.ReactNode; color?: "coral" | "blue" | "green" | "red" | "yellow" }) {
  const map = {
    coral:  { background: C.coralLight,  color: C.coralDark },
    blue:   { background: C.blueLight,   color: C.blue },
    green:  { background: C.greenLight,  color: C.green },
    red:    { background: C.redLight,    color: C.red },
    yellow: { background: C.yellowLight, color: C.yellow },
  };
  return <span style={{ ...s.tag, ...map[color] }}>{children}</span>;
}

function Flash({ msg, type }: { msg: string; type: "ok" | "err" }) {
  if (!msg) return null;
  const ok = type === "ok";
  return (
    <div style={{ ...s.infoBox, background: ok ? C.greenLight : C.redLight, border: `3px solid ${ok ? C.green : C.red}`, color: ok ? C.green : C.red, marginBottom: "1rem", fontSize: 13, fontWeight: 600 }}>
      {ok ? "✓" : "⚠"} {msg}
    </div>
  );
}

function Spinner() {
  return <span style={{ fontSize: 13, color: C.muted }}>Chargement…</span>;
}

function useFlash() {
  const [msg, setMsg] = useState({ text: "", type: "ok" as "ok" | "err" });
  const ok  = (text: string) => { setMsg({ text, type: "ok"  }); setTimeout(() => setMsg({ text: "", type: "ok" }), 3500); };
  const err = (text: string) => { setMsg({ text, type: "err" }); setTimeout(() => setMsg({ text: "", type: "ok" }), 4000); };
  return { msg, ok, err };
}

// VUE : OVERVIEW 
function VueOverview({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers]   = useState<AdminUser[]>([]);
  const [pendingOffers, setPendingOffers] = useState<AdminOffer[]>([]);

  // GET /api/admin/stats
  // SQL: SELECT COUNT(*) pour chaque table principale
  useEffect(() => {
    apiFetch("/admin/stats").then(setStats).catch(console.error).finally(() => setLoading(false));
    // GET /api/admin/users?limit=5&sort=created_at_desc
    // SQL: SELECT ... FROM users ORDER BY created_at DESC LIMIT 5
    apiFetch("/admin/users?limit=5&sort=recent").then(setRecentUsers).catch(console.error);
    // GET /api/admin/offers?moderated=false&limit=5
    // SQL: SELECT ... FROM job_offers WHERE is_moderated = false LIMIT 5
    apiFetch("/admin/offers?moderated=false&limit=5").then(setPendingOffers).catch(console.error);
  }, []);

  const STAT_ITEMS = [
    { label: "Utilisateurs",   key: "total_users",        icon: "bx-group",     page: "users"      as Page },
    { label: "Offres",         key: "total_offers",       icon: "bx-briefcase", page: "offers"     as Page },
    { label: "Entreprises",    key: "total_companies",    icon: "bx-building",  page: "companies"  as Page },
  ];

  return (
    <>
      {/* STATS */}
      <div style={{ ...s.cardGrid, gridTemplateColumns: "repeat(3, 1fr)" }}>
        {STAT_ITEMS.map(({ label, key, icon, page }) => (
          <div
            key={key}
            style={{ ...s.statBox, cursor: page ? "pointer" : "default", transition: "border-color 0.15s" }}
            onClick={() => page && onNavigate(page)}
            onMouseEnter={e => page && ((e.currentTarget as HTMLDivElement).style.borderColor = C.coral)}
            onMouseLeave={e => page && ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={s.statVal}>{loading ? "—" : stats?.[key as keyof Stats] ?? 0}</div>
                <span style={s.statLbl}>{label}</span>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.coralLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`bx ${icon}`} style={{ fontSize: 20, color: C.coral }} />
              </div>
            </div>
            {page && <div style={{ marginTop: 12, fontSize: 11, color: C.coral, fontWeight: 600 }}>Voir tout →</div>}
          </div>
        ))}
      </div>

      {/* DEUX COLONNES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* DERNIERS INSCRITS */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ ...s.cardTitle, marginBottom: 0 }}>DERNIERS INSCRITS</span>
            <button style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px" }} onClick={() => onNavigate("users")}>Voir tout</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentUsers.length === 0
              ? <span style={{ fontSize: 13, color: C.muted }}>Aucun utilisateur.</span>
              : recentUsers.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.coralLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: C.coralDark, flexShrink: 0 }}>
                    {u.email[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <Badge color={u.role === "admin" ? "coral" : "blue"}>{u.role === "admin" ? "Admin" : "Candidat"}</Badge>
                </div>
              ))
            }
          </div>
        </div>

        {/* OFFRES EN ATTENTE */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ ...s.cardTitle, marginBottom: 0 }}>OFFRES À MODÉRER</span>
            <button style={{ ...s.btnGhost, fontSize: 11, padding: "4px 10px" }} onClick={() => onNavigate("moderation")}>Voir tout</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingOffers.length === 0
              ? <div style={{ ...s.infoBox, background: C.greenLight, border: `3px solid ${C.green}`, color: C.green, fontSize: 13, fontWeight: 600 }}>✓ Tout est modéré !</div>
              : pendingOffers.map(o => (
                <div key={o.id} style={{ ...s.infoBox, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{o.company_name} — {o.location}</div>
                  </div>
                  <Badge color="yellow">En attente</Badge>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </>
  );
}

// ─── VUE : UTILISATEURS ───────────────────────────────────────────────────────
function VueUsers() {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const { msg, ok, err }      = useFlash();

  // 📌 GET /api/admin/users?search=...
  // SQL: SELECT u.id, u.email, r.name AS role, u.created_at
  //      FROM users u JOIN roles r ON r.id = u.role_id
  //      WHERE u.email ILIKE '%search%' ORDER BY u.created_at DESC
  useEffect(() => {
    setLoading(true);
    apiFetch(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then(setUsers).catch(e => err(e.message)).finally(() => setLoading(false));
  }, [search]);

  // 📌 PATCH /api/admin/users/:id/role  — { role: "admin"|"user" }
  // SQL: UPDATE users SET role_id = (SELECT id FROM roles WHERE name=$1) WHERE id=$2
  const changeRole = async (id: number, newRole: string) => {
    try {
      await apiFetch(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      ok("Rôle mis à jour.");
    } catch (e: any) { err(e.message); }
  };

  // 📌 DELETE /api/admin/users/:id
  // SQL: DELETE FROM users WHERE id=$1
  const deleteUser = async (id: number) => {
    if (!confirm("Supprimer définitivement cet utilisateur ?")) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== id));
      ok("Utilisateur supprimé.");
    } catch (e: any) { err(e.message); }
  };

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ ...s.cardTitle, marginBottom: 0 }}>UTILISATEURS</span>
        <input style={{ ...s.inputGray, width: 230 }} placeholder="Rechercher par email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Flash msg={msg.text} type={msg.type} />
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Email</th>       {/* users.email */}
                <th style={s.th}>Rôle</th>        {/* roles.name */}
                <th style={s.th}>Inscrit le</th>  {/* users.created_at */}
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} style={{ ...s.td, color: C.muted, textAlign: "center" }}>Aucun utilisateur.</td></tr>}
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ ...s.td, color: C.muted, fontSize: 12 }}>#{u.id}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{u.email}</td>
                  <td style={s.td}><Badge color={u.role === "admin" ? "coral" : "blue"}>{u.role === "admin" ? "Admin" : "Candidat"}</Badge></td>
                  <td style={{ ...s.td, color: C.muted, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                  <td style={s.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.role === "user"
                        ? <button style={{ ...s.btnOutline, fontSize: 12, padding: "5px 12px" }} onClick={() => changeRole(u.id, "admin")}>↑ Admin</button>
                        : <button style={{ ...s.btnGhost,   fontSize: 12, padding: "5px 12px" }} onClick={() => changeRole(u.id, "user")}>↓ Candidat</button>
                      }
                      <button style={{ ...s.btnDanger, fontSize: 12, padding: "5px 12px" }} onClick={() => deleteUser(u.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// VUE : OFFRES
function VueOffres() {
  const [offers, setOffers]   = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filtre, setFiltre]   = useState<"all" | "pending" | "done">("all");
  const { msg, ok, err }      = useFlash();

  // GET /api/admin/offers?search=...&moderated=true|false
  // SQL: SELECT jo.id, jo.title, c.name AS company_name, jo.location,
  //            jo.contract_type, jo.source, jo.is_moderated, jo.posted_at, jo.relevance_score
  //      FROM job_offers jo JOIN companies c ON c.id = jo.company_id
  //      WHERE jo.title ILIKE '%search%' [AND jo.is_moderated=$1]
  //      ORDER BY jo.posted_at DESC
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filtre === "pending") params.set("moderated", "false");
    if (filtre === "done")    params.set("moderated", "true");
    apiFetch(`/admin/offers${params.toString() ? "?" + params : ""}`)
      .then(setOffers).catch(e => err(e.message)).finally(() => setLoading(false));
  }, [search, filtre]);

  // PATCH /api/admin/offers/:id/moderate  — { is_moderated: bool }
  // SQL: UPDATE job_offers SET is_moderated=$1 WHERE id=$2
  const toggleMod = async (id: number, current: boolean) => {
    try {
      await apiFetch(`/admin/offers/${id}/moderate`, { method: "PATCH", body: JSON.stringify({ is_moderated: !current }) });
      setOffers(prev => prev.map(o => o.id === id ? { ...o, is_moderated: !current } : o));
      ok("Statut mis à jour.");
    } catch (e: any) { err(e.message); }
  };

  // DELETE /api/admin/offers/:id
  // SQL: DELETE FROM job_offers WHERE id=$1
  const deleteOffer = async (id: number) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try {
      await apiFetch(`/admin/offers/${id}`, { method: "DELETE" });
      setOffers(prev => prev.filter(o => o.id !== id));
      ok("Offre supprimée.");
    } catch (e: any) { err(e.message); }
  };

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <span style={{ ...s.cardTitle, marginBottom: 0 }}>OFFRES</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input style={{ ...s.inputGray, width: 200 }} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          {(["all", "pending", "done"] as const).map(f => (
            <button key={f} style={{ ...(filtre === f ? s.btn : s.btnGhost), fontSize: 12, padding: "5px 12px" }} onClick={() => setFiltre(f)}>
              {f === "all" ? "Toutes" : f === "pending" ? "En attente" : "Validées"}
            </button>
          ))}
        </div>
      </div>
      <Flash msg={msg.text} type={msg.type} />
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Titre</th>           {/* job_offers.title */}
                <th style={s.th}>Entreprise</th>      {/* companies.name */}
                <th style={s.th}>Lieu</th>            {/* job_offers.location */}
                <th style={s.th}>Contrat</th>         {/* job_offers.contract_type */}
                <th style={s.th}>Source</th>          {/* job_offers.source */}
                <th style={s.th}>Score IA</th>        {/* job_offers.relevance_score */}
                <th style={s.th}>Statut</th>          {/* job_offers.is_moderated */}
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 && <tr><td colSpan={8} style={{ ...s.td, color: C.muted, textAlign: "center" }}>Aucune offre.</td></tr>}
              {offers.map(o => (
                <tr key={o.id}>
                  <td style={{ ...s.td, fontWeight: 600, maxWidth: 200 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                  </td>
                  <td style={s.td}>{o.company_name}</td>
                  <td style={{ ...s.td, color: C.muted, fontSize: 12 }}>{o.location}</td>
                  <td style={s.td}><Badge color="coral">{o.contract_type}</Badge></td>
                  <td style={{ ...s.td, color: C.muted, fontSize: 12 }}>{o.source}</td>
                  <td style={{ ...s.td, color: C.muted, fontSize: 12 }}>
                    {o.relevance_score != null ? (
                      <span style={{ fontWeight: 700, color: o.relevance_score > 70 ? C.green : o.relevance_score > 40 ? C.yellow : C.red }}>
                        {o.relevance_score.toFixed(0)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td style={s.td}><Badge color={o.is_moderated ? "green" : "yellow"}>{o.is_moderated ? "✓ Validé" : "⏳ Attente"}</Badge></td>
                  <td style={s.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...(o.is_moderated ? s.btnGhost : s.btn), fontSize: 12, padding: "5px 12px" }} onClick={() => toggleMod(o.id, o.is_moderated)}>
                        {o.is_moderated ? "Dépublier" : "Valider"}
                      </button>
                      <button style={{ ...s.btnDanger, fontSize: 12, padding: "5px 12px" }} onClick={() => deleteOffer(o.id)}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// VUE : ENTREPRISES
function VueCompanies() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading]     = useState(true);
  const { msg, ok, err }          = useFlash();

  // GET /api/admin/companies
  // SQL: SELECT c.id, c.name, c.logo_url, c.website_url,
  //            COUNT(jo.id) AS offers_count
  //      FROM companies c
  //      LEFT JOIN job_offers jo ON jo.company_id = c.id
  //      GROUP BY c.id ORDER BY offers_count DESC
  useEffect(() => {
    apiFetch("/admin/companies")
      .then(setCompanies).catch(e => err(e.message)).finally(() => setLoading(false));
  }, []);

  // DELETE /api/admin/companies/:id
  // SQL: DELETE FROM companies WHERE id=$1
  const deleteCompany = async (id: number) => {
    if (!confirm("Supprimer cette entreprise et toutes ses offres ?")) return;
    try {
      await apiFetch(`/admin/companies/${id}`, { method: "DELETE" });
      setCompanies(prev => prev.filter(c => c.id !== id));
      ok("Entreprise supprimée.");
    } catch (e: any) { err(e.message); }
  };

  return (
    <div style={s.card}>
      <span style={s.cardTitle}>ENTREPRISES</span>
      <Flash msg={msg.text} type={msg.type} />
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {companies.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>Aucune entreprise.</span>}
          {companies.map(c => (
            <div key={c.id} style={{ ...s.infoBox, display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Logo / initiales — companies.logo_url ou fallback */}
              <div style={{ width: 44, height: 44, borderRadius: 8, background: C.coralLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: C.coralDark, flexShrink: 0, overflow: "hidden" }}>
                {c.logo_url
                  ? <img src={c.logo_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : c.name[0].toUpperCase()
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* companies.name */}
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                {/* companies.website_url */}
                {c.website_url && <a href={c.website_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.coral, textDecoration: "none" }}>{c.website_url}</a>}
              </div>
              {/* COUNT(job_offers) */}
              <div style={{ ...s.infoBox, padding: "4px 12px", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.coral }}>{c.offers_count}</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>offres</div>
              </div>
              <button style={{ ...s.btnDanger, fontSize: 12, padding: "5px 12px" }} onClick={() => deleteCompany(c.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// VUE : MODÉRATION 
function VueModeration() {
  const [offers, setOffers]   = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const { msg, ok, err }      = useFlash();

  // GET /api/admin/offers?moderated=false
  // SQL: SELECT jo.id, jo.title, c.name AS company_name, jo.location,
  //            jo.contract_type, jo.source, jo.posted_at, jo.ai_summary
  //      FROM job_offers jo JOIN companies c ON c.id = jo.company_id
  //      WHERE jo.is_moderated = false ORDER BY jo.posted_at DESC
  useEffect(() => {
    apiFetch("/admin/offers?moderated=false")
      .then(setOffers).catch(e => err(e.message)).finally(() => setLoading(false));
  }, []);

  // PATCH /api/admin/offers/:id/moderate  — { is_moderated: true }
  // SQL: UPDATE job_offers SET is_moderated = true WHERE id=$1
  const validate = async (id: number) => {
    try {
      await apiFetch(`/admin/offers/${id}/moderate`, { method: "PATCH", body: JSON.stringify({ is_moderated: true }) });
      setOffers(prev => prev.filter(o => o.id !== id));
      ok("Offre validée et publiée.");
    } catch (e: any) { err(e.message); }
  };

  // DELETE /api/admin/offers/:id
  const reject = async (id: number) => {
    if (!confirm("Rejeter et supprimer cette offre ?")) return;
    try {
      await apiFetch(`/admin/offers/${id}`, { method: "DELETE" });
      setOffers(prev => prev.filter(o => o.id !== id));
      ok("Offre rejetée.");
    } catch (e: any) { err(e.message); }
  };

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ ...s.cardTitle, marginBottom: 0 }}>FILE DE MODÉRATION</span>
        <Badge color="yellow">{loading ? "…" : offers.length} en attente</Badge>
      </div>
      <Flash msg={msg.text} type={msg.type} />
      {loading ? <Spinner /> : (
        offers.length === 0
          ? <div style={{ ...s.infoBox, background: C.greenLight, border: `3px solid ${C.green}`, color: C.green, fontSize: 13, fontWeight: 600 }}>✓ Aucune offre en attente. Tout est à jour !</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {offers.map(o => (
                <div key={o.id} style={{ ...s.infoBox, display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    {/* job_offers.title */}
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{o.title}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      {/* companies.name */}
                      <span style={{ fontSize: 12, color: C.muted }}>{o.company_name}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>·</span>
                      {/* job_offers.location */}
                      <span style={{ fontSize: 12, color: C.muted }}>{o.location}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>·</span>
                      {/* job_offers.source */}
                      <Badge color="blue">{o.source}</Badge>
                      {/* job_offers.contract_type */}
                      <Badge color="coral">{o.contract_type}</Badge>
                    </div>
                    {/* job_offers.posted_at */}
                    <div style={{ fontSize: 11, color: C.muted }}>Reçu le {new Date(o.posted_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...s.btn, fontSize: 12, padding: "6px 16px" }} onClick={() => validate(o.id)}>✓ Valider</button>
                    <button style={{ ...s.btnDanger, fontSize: 12, padding: "6px 16px" }} onClick={() => reject(o.id)}>✕ Rejeter</button>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}

// COMPOSANT PRINCIPAL
export default function AdminDashboard() {
  const [page, setPage] = useState<Page>("overview");

  const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
    { id: "overview",   label: "Vue d'ensemble", icon: "bx-home-alt"    },
    { id: "users",      label: "Utilisateurs",   icon: "bx-group"       },
    { id: "offers",     label: "Offres",         icon: "bx-briefcase"   },
    { id: "companies",  label: "Entreprises",    icon: "bx-building"    },
    { id: "moderation", label: "Modération",     icon: "bx-shield-quarter" },
  ];

  const PAGE_TITLES: Record<Page, string> = {
    overview:   "Vue d'ensemble",
    users:      "Utilisateurs",
    offers:     "Offres",
    companies:  "Entreprises",
    moderation: "Modération",
  };

  return (
    <div style={s.shell}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/*SIDEBAR*/}
      <aside style={s.sidebar}>
        {/* LOGO */}
        <div style={s.sideHead}>
          <div style={s.sideTitle}>GATEWAY</div>
        </div>

        {/* NAVIGATION */}
        <nav style={s.sideNav}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              style={{ ...s.sideItem, ...(page === item.id ? s.sideItemActive : {}) }}
              onClick={() => setPage(item.id)}
            >
              <i className={`bx ${item.icon}`} style={{ fontSize: 18, flexShrink: 0 }} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN*/}
      <div style={s.main}>

        {/* TOPBAR */}
        <header style={s.topbar}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{PAGE_TITLES[page]}</div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.muted }}>
              <span style={{ ...s.dot, background: C.green, display: "inline-block" }} />
              API connectée
            </span>
            {/* Lien retour site */}
            <a href="/" style={{...s.btnGhost, textDecoration: "none", fontSize: 12, padding: "5px 14px" }}>
              ← Retour au site
            </a>
          </div>
        </header>

        {/* CONTENU */}
        <main style={s.content}>
          {page === "overview"   && <VueOverview onNavigate={setPage} />}
          {page === "users"      && <VueUsers />}
          {page === "offers"     && <VueOffres />}
          {page === "companies"  && <VueCompanies />}
          {page === "moderation" && <VueModeration />}
        </main>

      </div>
    </div>
  );
}