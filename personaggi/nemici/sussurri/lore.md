# Sussurri — L'Eco di Illyrium

**Sottotitolo:** *L'Eco di Illyrium*
**Tipo:** ENEMY
**Zona:** La Pianura dei Sussurri

---

Non sono creature. Sono echi del luogo stesso.

Nessun corpo. Presenza pura. Visibili come distorsione termica verticale — calore sull'asfalto — che si muove e si avvicina. L'unico momento in cui hanno forma: durante la carica, la distorsione si stringe e appare solo una bocca aperta che urla, senza il resto del viso.

Prima che arrivino: il vento si spezza. Le foglie smettono di frusciare. Rimane un sibilo basso come pressione nelle orecchie, in aumento.

Puniscono lo stare fermi. Il bersaglio immobile viene ingaggiato per primo. Non toccano gli ostacoli — scorrono tra di essi.

Non scompaiono. Esplodono.

---

## Palette HEX ufficiale

*Intenzionalmente desaturata, quasi monocromatica.*

| Zona | Hex |
|---|---|
| Corpo fumo scuro | `#252525` |
| Fumo medio | `#505050` |
| Tendrili fumo | `#808080` |
| Volti cenere | `#B8B8B8` |
| Occhi (glow bianco) | `#F0F0F0` |
| Carta / ambiente BG | `#F0EDE4` |
| Ombre sfondo | `#D0CCC4` |
| Glow esplosione (morte) | `#FFFFFF` |

**Identità visiva:** `#252525` + `#808080` + `#F0EDE4` (contrasto nero-su-bianco, nessun colore caldo)

---

## Meccaniche chiave

- **In movimento = invincibile** — niente da colpire
- **Durante la carica = vulnerabile** — finestra stretta, telegraph obbligatorio (distortion shader)
- **Chiamata per nome** — voce di qualcuno che conosci; se ti fermi ad ascoltare, sei già perso
- **Cono sonoro** — stordimento + danni; post-urlo il bersaglio smette di pensare
- **AoE death explosion** — onda indiscriminata; chain kill possibile
- **vs Zeryth:** pausa tattica congela la carica, estende la finestra
- **vs Damian Fase 3:** l'ombra li colpisce ignorando la meccanica di movimento

*Lore e design completo: `docs/lore/nemici/sussurri.md`*
