# 🎨 CHESS KINGDOM: Guia d'Integració d'Assets

Aquest document detalla on dipositar els fitxers gràfics i quines especificacions tècniques han de complir per al "Tractament NanoBanana".

## 📏 Especificacions Generals
- **Perspectiva:** Isomètrica real (True Isometric).
- **Format:** PNG-24 (Transparència) o WebP.
- **Resolució Base (Tile):** 256x256px (per a pantalles Retina, es mostrarà a 128px visuals).
- **Alineació:** - Centre Horitzontal.
  - Base de l'edifici = Bottom del Canvas.
- **Ombres:** Incloure ombra semitransparent (negre 30%) a la base de l'asset.

---

## 📂 Directori: `/public/assets/kingdom/`

### 1. Terreny (`/terrain`)
Les rajoles que formen el terra.
- **Mida:** Exactament 256x256px.
- **Nomenclatura:** `tile_base.png`, `tile_highlight.png`.
- **Subcarpetes:** `/grass`, `/snow`, `/lava`.

### 2. Edificis (`/buildings`)
Els elements construïbles. Han de "sobresortir" de la casella cap amunt.
- **Mida Canvas:** Pot ser més alt (ex: 256x512px) per encabir torres altes, però l'amplada base ha de coincidir amb el grid.
- **Subcarpetes:**
  - `/economy`: `gold_mine_lv1.png`, `mana_nexus_lv1.png`.
  - `/defense`: `rook_tower_lv1.png`.
  
### 3. Obstacles (`/obstacles`)
Elements que l'usuari ha de netejar.
- **Arxius:** `rock_sm.png`, `tree_oak.png`.

### 4. NPCs (`/npcs`)
Si fem servir CSS Sprites o GIFs/WebP animats.
- **Arxius:** `peon_idle.gif`, `king_walk.webp`.

---

## 🛠️ Com provar-ho?
1. Deixa el fitxer a la carpeta corresponent.
2. Obre el fitxer de configuració `lib/kingdom-assets.ts` (que crearà l'enginyer).
3. Afegeix el nom del fitxer al mapa d'assets.
4. Refresca el navegador.
