// IMPORTATION
import React, { useState } from "react";
import "boxicons/css/boxicons.min.css";

// TYPES TYPESCRIPT
interface Period {
  id: number;
  task: string;
  start: number;
  end: number;
  color: string;
  type: string;
}

interface LinkItem {
  label: string;
  url: string;
}

interface UserProfile {
  avatar: string;
  name: string;
  location: string;
  formation: string;
  recherche: string;
  skills: string[];
  links: LinkItem[];
  gantt: Period[];
  cv1?: { name: string; url: string; size: number } | null;
  cv2?: { name: string; url: string; size: number } | null;
}

// C = Colors
const C = {
  black: "#1F1C1B",
  coralDark: "#C56D53",
  coral: "#FC8865",
  coralLight: "#FCDCD3",
  muted: "#575352",
  border: "#E8E4E3",
  snow: "#FCF8F7",
  white: "#fff",
};

// s = styles
const s: { [key: string]: React.CSSProperties } = {
  page: { fontFamily: "'DM Sans', sans-serif", background: C.snow, minHeight: "100vh", color: C.black },
  wrap: { maxWidth: 780, margin: "0 auto", padding: "2.5rem 1.5rem" },

  card: { background: C.white, border: `3px solid ${C.border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" },
  cardTitle: { fontWeight: 700, fontSize: 15, display: "block", marginBottom: "1rem", letterSpacing: "0.03em" },

  label: { fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3, display: "block" },
  input: { border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "7px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", background: "#fff", outline: "none", color: C.black, boxSizing: "border-box" },
  select: { border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "7px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", background: "#fff", outline: "none", color: C.black, boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" },
  tag: { background: C.coral, color: C.white, borderRadius: 8, padding: "4px 14px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 },
  btn: { background: C.coral, color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnOutline: { background: "transparent", color: C.coral, border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  editBtn: { background: C.coralLight, border: "none", borderRadius: 45, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, flexShrink: 0, color: C.coralDark },
  deleteBtn: { background: C.coralLight, border: "none", borderRadius: 45, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.coralDark, fontSize: 15, flexShrink: 0 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  infoBox: { background: C.snow, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.75rem 1rem" },
  fieldBlock: { marginBottom: "0.9rem" },
  periodEditor: { background: C.snow, border: `1px solid ${C.border}`, borderRadius: 8, padding: "1rem", marginBottom: 8 },
  periodEditorGrid: { display: "grid", gridTemplateColumns: "1fr 80px 80px 34px", gap: 8, alignItems: "end" },
  colorDot: { width: 14, height: 14, borderRadius: 45, display: "inline-block", flexShrink: 0 },
  addForm: { background: C.white, border: `1.5px dashed ${C.coral}`, borderRadius: 8, padding: "1rem", marginTop: 8 },
};

// CONSTANTES
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const COLORS = ["#FC8865", "#fcc765", "#fced65", "#7efc65", "#65fce3", "#65a6fc", "#6865fc", "#c065fc", "#fc65e8", "#fc6597", "#fc6565"];
const PERIOD_TYPES = ["Formation", "Stage", "Projet", "Emploi", "Autre"];
const TYPE_COLORS: Record<string, string> = { Formation: "#fde8df", Stage: "#e0f0ff", Projet: "#f0ebff", Emploi: "#d1fae5", Autre: "#f3f4f6" };
const TYPE_TEXT: Record<string, string> = { Formation: "#d96a46", Stage: "#2563eb", Projet: "#7c3aed", Emploi: "#059669", Autre: "#6b7280" };
const LINK_ICONS: Record<string, React.ReactNode> = { GitHub: <i className="bx bx-link"></i>, Portfolio: <i className="bx bx-link"></i>, LinkedIn: <i className="bx bx-link"></i>, Twitter: <i className="bx bx-link"></i>, Autre: <i className="bx bx-link"></i> };

// CONSTANTE A LIE A LA DATABASE
const USER: UserProfile = {
  avatar: "",
  name: "Nouveau Candidat",
  location: "Non renseignée",
  formation: "Non renseignée",
  recherche: "Non renseigné",
  skills: [],
  links: [],
  gantt: [],
};

// PETIT COMPOSANT CHAMP
interface FieldProps {
  label?: string;
  value: string;
  editing: boolean;
  onChange: (val: string) => void;
  multiline?: boolean;
}

function Field({ label, value, editing, onChange, multiline }: FieldProps) {
  return (
    <div style={s.fieldBlock}>
      {label && <span style={s.label}>{label}</span>}
      {editing
        ? multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} style={{ ...s.input, resize: "vertical" }} />
          : <input value={value} onChange={e => onChange(e.target.value)} style={s.input} />
        : <div style={{ fontSize: 14, lineHeight: 1.6 }}>{value}</div>}
    </div>
  );
}

// SELECTEUR DE COULEUR
interface ColorPickerProps {
  value: string;
  onChange: (val: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
      {COLORS.map(c => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 20, height: 20, borderRadius: 8, cursor: "pointer",
            background: c,
            border: value === c ? "2px solid #1F1C1B" : "2px solid transparent",
            transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// EDITEUR DE PERIODE 
interface PeriodEditorProps {
  period: Period;
  onChange: (updated: Period) => void;
  onDelete: () => void;
}

function PeriodEditor({ period, onChange, onDelete }: PeriodEditorProps) {
  const set = (field: keyof Period, val: string | number) => onChange({ ...period, [field]: val });
  return (
    <div style={s.periodEditor}>
      <div style={s.periodEditorGrid}>
        <div>
          <span style={s.label}>Titre</span>
          <input style={s.input} value={period.task} onChange={e => set("task", e.target.value)} placeholder="exemple : stage en développement web" />
        </div>
        <div>
          <span style={s.label}>Début</span>
          <select style={s.select} value={period.start} onChange={e => set("start", +e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <span style={s.label}>Fin</span>
          <select style={s.select} value={period.end} onChange={e => set("end", +e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <button style={s.deleteBtn} onClick={onDelete} title="Supprimer">×</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <div>
          <span style={s.label}>Type</span>
          <select style={s.select} value={period.type} onChange={e => set("type", e.target.value)}>
            {PERIOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <span style={s.label}>Couleur</span>
          <ColorPicker value={period.color} onChange={c => set("color", c)} />
        </div>
      </div>

      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ ...s.colorDot, background: period.color }} />
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          background: TYPE_COLORS[period.type] || "#f3f4f6",
          color: TYPE_TEXT[period.type] || "#6b7280",
          padding: "2px 6px", borderRadius: 4
        }}>
          {period.type}
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>
          {MONTHS[period.start - 1]} → {MONTHS[period.end - 1]}
        </span>
      </div>
    </div>
  );
}

// FONCTION / GANTCHART / FEATURE AJOUT PERDIODE 
interface AddPeriodFormProps {
  onAdd: (p: Omit<Period, "id">) => void;
  onCancel: () => void;
}

function AddPeriodForm({ onAdd, onCancel }: AddPeriodFormProps) {
  const [p, setP] = useState<Omit<Period, "id">>({ task: "", start: 1, end: 3, color: "#FC8865", type: "Projet" });
  const set = (field: string, val: string | number) => setP(prev => ({ ...prev, [field]: val }));

  const handleAdd = () => {
    if (!p.task.trim()) { alert("Donnez un titre à cette période."); return; }
    if (p.start > p.end) { alert("Le début ne peut pas être après la fin."); return; }
    onAdd(p);
  };

  return (
    <div style={s.addForm}>
      <span style={{ ...s.label, marginBottom: 8, display: "block" }}>Nouvelle période</span>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8, marginBottom: 10 }}>
        <div>
          <span style={s.label}>Titre</span>
          <input style={s.input} value={p.task} onChange={e => set("task", e.target.value)} placeholder="ex: Stage UX" />
        </div>
        <div>
          <span style={s.label}>Début</span>
          <select style={s.select} value={p.start} onChange={e => set("start", +e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <span style={s.label}>Fin</span>
          <select style={s.select} value={p.end} onChange={e => set("end", +e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div>
          <span style={s.label}>Type</span>
          <select style={s.select} value={p.type} onChange={e => set("type", e.target.value)}>
            {PERIOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <span style={s.label}>Couleur</span>
          <ColorPicker value={p.color} onChange={c => set("color", c)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={s.btn} onClick={handleAdd}>Ajouter cette période</button>
        <button style={s.btnOutline} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

interface GanttChartProps {
  items: Period[];
}

function GanttChart({ items }: GanttChartProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 500 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(12, 1fr)", gap: 2, marginBottom: 6 }}>
          <div />
          {MONTHS.map(m => <div key={m} style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>{m}</div>)}
        </div>
        {items.length === 0 && (
          <div style={{ fontSize: 13, color: C.muted, padding: "1rem 0" }}>Aucune période à afficher.</div>
        )}
        {items.map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px repeat(12, 1fr)", gap: 2, marginBottom: 5, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: C.black, paddingRight: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.task}
            </div>
            {Array.from({ length: 12 }, (_, m) => (
              <div key={m} style={{
                height: 18, borderRadius: 0,
                background: m + 1 >= item.start && m + 1 <= item.end ? item.color : "transparent",
                opacity: 0.85,
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant principal 
export default function ProfilCandidat() {
  const [data, setData] = useState<UserProfile>(USER);
  const [editing, setEditing] = useState(false);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [nextId, setNextId] = useState(4);

  const set = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) =>
    setData(prev => ({ ...prev, [field]: value }));

  // Extraction propre des initiales
  const nameParts = data.name.split(" ").filter(w => w.length > 0);
  const initials = nameParts.length > 0 ? nameParts.map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  // Periodes
  const updatePeriod = (id: number, updated: Period) =>
    set("gantt", data.gantt.map(p => p.id === id ? updated : p));

  const deletePeriod = (id: number) =>
    set("gantt", data.gantt.filter(p => p.id !== id));

  const addPeriod = (newP: Omit<Period, "id">) => {
    set("gantt", [...data.gantt, { id: nextId, ...newP }]);
    setNextId(n => n + 1);
    setShowAddPeriod(false);
  };

  // Links
  const updateLink = (i: number, field: keyof LinkItem, val: string) =>
    set("links", data.links.map((l, j) => j === i ? { ...l, [field]: val } : l));

  const deleteLink = (i: number) =>
    set("links", data.links.filter((_, j) => j !== i));

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* PAGE COMPLETE */}
      <div style={s.wrap}>

        {/* PROFIL */}
        <div style={s.card}>
          <span style={s.cardTitle}>PROFIL</span>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div style={{ width: 68, height: 68, borderRadius: 8, background: C.coral, border: `2px solid ${C.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: C.white, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Nom complet" value={data.name} editing={editing} onChange={v => set("name", v)} />
              <div style={s.infoGrid}>
                <Field label="Localisation" value={data.location} editing={editing} onChange={v => set("location", v)} />
                <Field label="Formation actuelle" value={data.formation} editing={editing} onChange={v => set("formation", v)} />
              </div>
              <Field label="Je recherche" value={data.recherche} editing={editing} onChange={v => set("recherche", v)} />
            </div>
            <button style={s.editBtn} onClick={() => { setEditing(e => !e); setShowAddPeriod(false); }} title={editing ? "Sauvegarder" : "Modifier"}>
              {editing ? "✓" : <i className='bx bx-pen'></i>}
            </button>
          </div>
        </div>

        {/* CVs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          {[
            { key: "cv1" as keyof UserProfile, label: "CV FORMAT IMAGE", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" },
            { key: "cv2" as keyof UserProfile, label: "CV FORMAT VIDEO", accept: "video/*,.mp4,.mov,.avi" },
          ].map(({ key, label, accept }) => {
            const file = data[key] as { name: string; url: string; size: number } | null | undefined;
            const isVideo = accept.includes("video");
            const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`;

            return (
              <div key={key} style={{ ...s.card, margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "1.5rem" }}>
                <span style={{ ...s.label, textAlign: "center" }}>{label}</span>

                {editing ? (
                  <label style={{
                    width: "100%", minHeight: 110, borderRadius: 8, cursor: "pointer",
                    border: `2px dashed ${C.border}`, background: C.snow,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 8, padding: "0.8rem",
                  }}>
                    <input type="file" accept={accept} style={{ display: "none" }}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) set(key, { name: f.name, url: URL.createObjectURL(f), size: f.size });
                      }}
                    />
                    {file ? (
                      <>
                        <i className={`bx ${isVideo ? "bx-video" : "bx-file"}`} style={{ fontSize: 32, color: C.coral }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.black, textAlign: "center", wordBreak: "break-all" }}>{file.name}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{formatSize(file.size)}</span>
                        <span style={{ fontSize: 11, color: C.coral, fontWeight: 600 }}>Cliquer pour remplacer</span>
                      </>
                    ) : (
                      <>
                        <i className="bx bx-upload" style={{ fontSize: 32, color: C.muted }} />
                        <span style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
                          Glisser-déposer ou <span style={{ color: C.coral, fontWeight: 600 }}>parcourir</span>
                        </span>
                        <span style={{ fontSize: 10, color: C.muted }}>{isVideo ? "MP4, MOV, AVI…" : "PDF, DOCX, JPG…"}</span>
                      </>
                    )}
                  </label>
                ) : (
                  <>
                    <i className={`bx ${isVideo ? "bx-video" : "bx-file"}`} style={{ fontSize: 36, color: file ? C.coral : C.muted, opacity: file ? 1 : 0.4 }} />
                    {file
                      ? <span style={{ fontSize: 12, color: C.muted, textAlign: "center", wordBreak: "break-all" }}>{file.name}</span>
                      : <span style={{ fontSize: 12, color: C.muted }}>Aucun fichier déposé</span>}
                    {file && <a href={file.url} download={file.name} style={{ ...s.btn, textDecoration: "none" }}>Télécharger</a>}
                  </>
                )}

                {editing && file && (
                  <button style={{ ...s.btnOutline, fontSize: 11, padding: "3px 10px", color: C.muted, borderColor: C.border }}
                    onClick={() => set(key, null)}>
                    Supprimer
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* COMPÉTENCES */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ ...s.cardTitle, marginBottom: 0 }}>COMPÉTENCES</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {data.skills.map((sk, i) => (
              <span key={i} style={s.tag}>
                {sk}
                {editing && (
                  <span onClick={() => set("skills", data.skills.filter((_, j) => j !== i))}
                    style={{ cursor: "pointer", marginLeft: 2, opacity: 0.6, fontSize: 14 }}>×</span>
                )}
              </span>
            ))}
            {editing && (
              <button style={{ ...s.btnOutline, fontSize: 12, padding: "4px 12px" }}
                onClick={() => { const v = prompt("Nouvelle compétence :"); if (v?.trim()) set("skills", [...data.skills, v.trim()]); }}>
                + Ajouter
              </button>
            )}
          </div>
        </div>

        {/* CHRONOLOGIE */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", }}>
            <span style={{ ...s.cardTitle, marginBottom: 0 }}>CHRONOLOGIE</span>
            {editing && (
              <button style={s.btnOutline} onClick={() => setShowAddPeriod(v => !v)}>
                {showAddPeriod ? "Annuler" : "+ Ajouter une période"}
              </button>
            )}
          </div>

          {/* Éditeurs de périodes */}
          {editing && (
            <div style={{ marginBottom: "1rem" }}>
              {data.gantt.length === 0 && (
                <p style={{ fontSize: 13, color: C.muted, marginBottom: "0.5rem" }}>Aucune période. Ajoutez-en une ci-dessous.</p>
              )}
              {data.gantt.map(p => (
                <PeriodEditor
                  key={p.id}
                  period={p}
                  onChange={updated => updatePeriod(p.id, updated)}
                  onDelete={() => deletePeriod(p.id)}
                />
              ))}
            </div>
          )}

          {/* Diagramme Gantt */}
          <GanttChart items={data.gantt} />

          {/* Formulaire ajout */}
          {editing && showAddPeriod && (
            <AddPeriodForm onAdd={addPeriod} onCancel={() => setShowAddPeriod(false)} />
          )}
        </div>

        {/* LIENS */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ ...s.cardTitle, marginBottom: 0 }}>LIENS</span>
            {editing && (
              <button style={s.btnOutline} onClick={() => set("links", [...data.links, { label: "Autre", url: "" }])}>
                + Ajouter
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, }}>
            {data.links.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.coral, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {LINK_ICONS[l.label] || <i className="bx bx-link"></i>}
                </div>
                {editing ? (
                  <>
                    <select style={{ ...s.select, width: 110, flexShrink: 0 }} value={l.label} onChange={e => updateLink(i, "label", e.target.value)}>
                      {["GitHub", "Portfolio", "LinkedIn", "Twitter", "Autre"].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input style={s.input} value={l.url} placeholder="url..." onChange={e => updateLink(i, "url", e.target.value)} />
                    <button style={s.deleteBtn} onClick={() => deleteLink(i)}>×</button>
                  </>
                ) : (
                  <>
                    <a href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.coral, textDecoration: "none", fontWeight: 600 }}>{l.label}</a>
                    <span style={{ fontSize: 12, color: C.muted }}>{l.url}</span>
                  </>
                )}
              </div>
            ))}
            {data.links.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>Aucun lien ajouté.</span>}
          </div>
        </div>

      </div>
    </div>
  );
}