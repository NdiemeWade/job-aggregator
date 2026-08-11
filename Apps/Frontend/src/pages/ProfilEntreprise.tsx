// IMPORTATION
import { useState } from "react";
import type { CSSProperties } from "react";
import "boxicons/css/boxicons.min.css";
import Navbar from "../components/Navbar";

// TYPES
type Offre = {
  titre: string;
  duree?: string;
  lieu?: string;
};

type Link = {
  label: string;
  url: string;
};

type Entreprise = {
  isOwner: boolean;
  initiales: string;
  name: string;
  siege: string;
  fondation: string;
  chiffre: string;
  salaries: string;
  description: string;
  offres: Offre[];
  links: Link[];
};

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
  blue: "#03779A",
  blueLight: "#D4F3FC",
  red: "#b91c1c",
  redLight: "#FEE2E2",
};

// s = style
const s: Record<string, CSSProperties> = {
  page: {
    backgroundColor: C.snow,
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
  },
  wrap: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "2rem 1rem",
    position: "relative",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.muted,
    display: "block",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: C.white,
  },
  infoBox: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "0.75rem 1rem",
    flex: 1,
  },
  editBtn: {
    position: "absolute",
    top: "2rem",
    right: "1rem",
    background: C.coral,
    color: C.white,
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
  },
  tag: {
    display: "inline-block",
    fontSize: 12,
    borderRadius: 6,
    padding: "2px 8px",
    marginLeft: 8,
  },
  btn: {
    background: C.coral,
    color: C.white,
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  btnGhost: {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
};

// DONNÉES MOCK
const ENTREPRISE: Entreprise = {
  isOwner: true,
  initiales: "",
  name: "",
  siege: "",
  fondation: "",
  chiffre: "",
  salaries: "",
  description: "",
  offres: [],
  links: [],
};

// PROPS
type FieldProps = {
  label?: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
};

function Field({ label, value, editing, onChange, multiline }: FieldProps) {
  return (
    <div style={{ marginBottom: "0.9rem" }}>
      {label && <span style={s.label}>{label}</span>}
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            style={{ ...s.input, resize: "vertical" }}
          />
        ) : (
          <input value={value} onChange={(e) => onChange(e.target.value)} style={s.input} />
        )
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{value}</div>
      )}
    </div>
  );
}

type StatBoxProps = {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
};

function StatBox({ label, value, editing, onChange }: StatBoxProps) {
  return (
    <div style={s.infoBox}>
      <span style={s.label}>{label}</span>
      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...s.input, marginTop: 4 }}
        />
      ) : (
        <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
      )}
    </div>
  );
}

export default function ProfilEntreprise() {
  const [data, setData] = useState<Entreprise>(ENTREPRISE);
  const [editing, setEditing] = useState<boolean>(false);

  const set = (field: keyof Entreprise, value: Entreprise[keyof Entreprise]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  return (
    <div style={s.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <div style={s.wrap}>
        <Navbar />

        {/* BTN edit */}
        {data.isOwner && (
          <button
            style={s.editBtn}
            onClick={() => setEditing((e) => !e)}
            title={editing ? "Sauvegarder" : "Modifier"}
          >
            {editing ? "✓" : <i className="bx bx-pen"></i>}
          </button>
        )}

        {/* OFFRES */}
        {data.offres.map((o, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            {editing ? (
              <input
                value={o.titre}
                onChange={(e) => {
                  const arr = [...data.offres];
                  arr[i] = { ...arr[i], titre: e.target.value };
                  set("offres", arr);
                }}
                style={s.input}
              />
            ) : (
              <div>{o.titre}</div>
            )}

            <span style={{ ...s.tag, background: C.blueLight, color: C.blue }}>
              {o.lieu}
            </span>

            {editing ? (
              <button
                style={{ ...s.btnGhost, fontSize: 12, color: C.red }}
                onClick={() => set("offres", data.offres.filter((_, j) => j !== i))}
              >
                Supprimer
              </button>
            ) : (
              <button style={s.btn}>Postuler</button>
            )}
          </div>
        ))}

        {/* CHAMPS PRINCIPAUX */}
        <Field
          label="Nom de l'entreprise"
          value={data.name}
          editing={editing}
          onChange={(v) => set("name", v)}
        />
        <Field
          label="Siège social"
          value={data.siege}
          editing={editing}
          onChange={(v) => set("siege", v)}
        />
        <Field
          label="Description"
          value={data.description}
          editing={editing}
          onChange={(v) => set("description", v)}
          multiline
        />

        {/* STAT BOXES */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <StatBox
            label="Fondation"
            value={data.fondation}
            editing={editing}
            onChange={(v) => set("fondation", v)}
          />
          <StatBox
            label="Chiffre d'affaires"
            value={data.chiffre}
            editing={editing}
            onChange={(v) => set("chiffre", v)}
          />
          <StatBox
            label="Salariés"
            value={data.salaries}
            editing={editing}
            onChange={(v) => set("salaries", v)}
          />
        </div>
      </div>
    </div>
  );
}