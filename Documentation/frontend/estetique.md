# Esthétique de l’application

## DEFINITION
L’esthétique de **GATEWAY** repose sur une approche minimaliste et douce, centrée sur la lisibilité et la cohérence visuelle.  
Les couleurs, les espacements et les typographies sont pensés pour créer une expérience fluide, professionnelle et accueillante.

---

## PALETTE DE COULEURS

| Élément | Couleur | Rôle |
|----------|----------|------|
| **Coral** | `#FC8865` | Couleur principale, utilisée pour les boutons et accents |
| **Coral Light** | `#FCDCD3` | Couleur secondaire, utilisée pour les fonds doux |
| **Coral Dark** | `#C56D53` | Variante pour les icônes et hover |
| **Snow** | `#FCF8F7` | Fond général clair |
| **Border** | `#E8E4E3` | Délimitation des cartes et sections |
| **Muted** | `#575352` | Texte secondaire |
| **Black** | `#1F1C1B` | Texte principal |
| **White** | `#FFFFFF` | Contraste et éléments neutres |

---

## TYPOGRAPHIE

- **Police principale** : *DM Sans*   
  - Style : DM Sans est une police de caractères sans empattement conçue pour être lisible, même à des tailles de texte plus petites. 
            Elle est idéale pour les titres et le corps de texte, offrant clarté et style
- **Hiérarchie visuelle** :
  - Titres : gras, espacés, majuscules
  - Sous-titres : semi-bold, couleur `muted`
  - Corps : régulier, couleur `black`
- **Taille de base** : 13–15px selon le contexte

---

## STRUCTURE VISUELLE

### Layout global
- Marges généreuses et centrage vertical
- Alignement horizontal des sections principales
- Largeur maximale : 780–1200px selon la page

### Cartes et blocs
- Fond blanc ou snow
- Bordure fine (`1px` ou `3px`) couleur `border`
- Coins arrondis (`border-radius: 8px`)
- Ombres légères ou absentes pour garder la sobriété

---

## COMPOSANTS VISUELS

### Boutons
- **btn** : fond coral, texte blanc  
- **btnOutline** : fond transparent, bordure coral  
- **btnGhost** : fond transparent, bordure `border`, texte `muted`  
- **Hover** : transition douce, inversion des couleurs

### Inputs / Selects
- Bordure coral, fond blanc
- Coins arrondis
- Focus : bordure accentuée coral

### Tags
- Fond coral, texte blanc, arrondi
- Taille compacte, typographie semi-bold

---

## THÈME LIGHT / DARK

- **Light** : fond snow, texte black, bordures claires  
- **Dark** : fond black, texte snow, bordures atténuées  
- Gestion via `ThemeContext