# Mira — Design Spec
*Fractured Inheritance | 2026-05-20*

---

## Identità

**Ruolo:** Secondaria, Korvo Nero | **Età:** 20 | **Altezza:** 1.60m
**Principio:** Scambio Equivalente — non si crea dal nulla, si rimodella ciò che c'è.

Mira non ha un arsenale. Ha il piano stesso. Ogni stanza è un laboratorio. Ogni materiale è una risorsa. Ogni errore ha un prezzo fisico.

---

## Sistema Risorse — Doppio Indicatore

### Temperatura Tatuaggi (0→100)

Le linee conduttrici sulle braccia si scaldano con ogni trasmutazione. Due fasi critiche:

| Soglia | Effetto |
|---|---|
| 0–79 | Normale |
| 80–99 | Costo temp +50% su ogni abilità |
| 100 | Lockout 2s. Cast forzato durante lockout = **Rebound** |

**Recupero:** −4/s passivo. Non si azzera automaticamente — richiede gestione attiva.

### Integrità Guanti (100→0)

I guanti sono il fusibile di Mira. Senza di loro, ogni trasmutazione colpisce il corpo.

- **Si degrada solo tramite Rebound** (−25 per evento)
- **Non si rigenera mai** (items futuri possono modificarlo)
- A 0: ogni cast è Rebound diretto

---

## Materiali dal Tile

| Tile | Materiale Mira | Usato da |
|---|---|---|
| FLOOR / CORRIDOR / SHADOW | EARTH | LMB, RMB |
| DESTRUCTIBLE | STONE | LMB, RMB, F |
| METAL | METAL | LMB, RMB, Q |
| BLOOD_POOL | LIQUID | LMB, RMB |

Se il tile sotto Mira non corrisponde a un materiale supportato dall'abilità → l'abilità è **silenziosa** (nessun effetto, nessun costo).

---

## Abilità — Sintesi Somatica

Mira attiva le trasmutazioni attraverso il cerchio sul palmo destro. Flash blu (`#3AAEFF`) ad ogni attivazione.

### LMB — Difesa (Muro)

Crea un muro sul tile adiacente nella direzione del cursore.

| Materiale | Muro | Durata | Costo Temp |
|---|---|---|---|
| EARTH | Terra | 1.5s | −6 |
| STONE | Pietra | 3s | −8 |
| METAL | Metallo (deflette proiettili) | 4s | −10 |
| LIQUID | Viscoso (slow nemici che attraversano) | 2s | −8 |

### RMB — Attacco Terreno

Trasforma il tile sotto un nemico (puntato dal cursore, 200px max range).

| Materiale | Effetto | Danno | Costo Temp |
|---|---|---|---|
| EARTH | Sabbie mobili (slow 50% per 2s) | — | −6 |
| STONE | Spike emergenti | 30 | −10 |
| METAL | Lancia piercing verso Mira | 35 | −10 |
| LIQUID | Acido (25 + 10 dmg/s per 2s) | 25+10 | −8 |

### Q — Riarmo al Volo (solo METAL)

Solo se il tile sotto Mira è METAL. Il tile viene **consumato** (diventa FLOOR per 8s).

- **Tap Q:** Lancio (40 dmg, 450px/s, direzione cursore)
- **Hold Q >300ms:** Scudo metallico (assorbe 1 colpo, dura 5s)

Silenzioso se non su METAL.

### F — Reazione Metamorfica (solo DESTRUCTIBLE)

Solo su tile DESTRUCTIBLE adiacente. Apre il tile permanentemente (come se fosse stato distrutto). Costo temp −15.

Silenzioso se non c'è DESTRUCTIBLE adiacente.

### E — Pozione Potenziata

*Stub — non implementato in questa versione.*

---

## Sistema Rebound

### Trigger

Due condizioni, indipendenti ma cumulabili:

| Condizione | Descrizione |
|---|---|
| Temperatura ≥ 100 + cast | Temperatura satura → guanti non bastano più. Il giocatore può scegliere di forzare (cast durante lockout) o arrivarci per accumulo accidentale |
| Guanti = 0 + qualsiasi cast | Nessun buffer → il corpo assorbe tutto direttamente |

### Sequenza Evento Rebound

1. **Fall animation** — Mira si accascia (~200ms)
2. **Invincibilità** 400ms durante la caduta (i colpi non registrano)
3. **Rise** — si rialza in 800ms (stun totale ~1.2s)
4. **Vignette rossa** ai bordi dello schermo, fade-out in 1.5s
5. **Sanguinamento** — 10 dmg/s per 3s (30 danno totale)
6. **Guanti −25** integrità
7. **Temperatura −30** (il contraccolpo sfoga il calore accumulato)

### Aggravante — Guanti = 0

Quando i guanti sono già esauriti al momento del cast:

- Danno diretto **+40** invece del sanguinamento
- Stun prolungato a 1.0s (anziché 800ms)
- I guanti rimangono a 0 (non c'è ulteriore degradazione da applicare)

### Ciclo di Degradazione

| Evento | Guanti rimasti |
|---|---|
| Partenza | 100 |
| Dopo 1° Rebound | 75 |
| Dopo 2° Rebound | 50 |
| Dopo 3° Rebound | 25 |
| Dopo 4° Rebound | 0 — aggravante attiva |

---

## Visual

### Sprite

- **Placeholder:** Rectangle `0xD44E0A` (rame acceso)
- **Sprite reale:** `personaggi/giocabili/mira.jpg` — caricato in `BootScene.preload()`

### Palette HEX

| Zona | Hex |
|---|---|
| Pelle base | `#F2C4A0` |
| Ombre pelle | `#D9956B` |
| Labbra | `#C9685A` |
| Capelli (base) | `#D44E0A` |
| Capelli (highlight) | `#E8700F` |
| Capelli (ombre) | `#8A2C00` |
| Camicia | `#F0EDE6` |
| Gilet cuoio | `#7D4E28` |
| Cintura | `#3D2010` |
| Guanti | `#1E1510` |
| Goggles | `#5C4A30` |
| Fibbia metallo | `#888878` |
| Cerchio trasmutatorio (glow) | `#3AAEFF` → `#E8840A` → `#DD3311` |
| Cicatrici rame | `#C07035` |
| Core bianco-blu | `#B8E8FF` |

**Identità visiva:** `#D44E0A` + `#3AAEFF` + `#7D4E28`

### Feedback Visivo Risorse

| Risorsa | HUD | Sul personaggio |
|---|---|---|
| Temperatura | Barra (bianco→arancio→rosso) | Glow cerchio: `#3AAEFF`→`#E8840A`→`#DD3311` |
| Guanti | Barra (verde→grigio bruciato) | Guanti nello sprite: intatti→rovinati→strappati |

### Grok Prompt (Card Art)

> Fantasy card art. A young alchemist woman — practical, brilliant, dangerous. 20 years old, 1.60m. Copper-red hair with bright highlights (#D44E0A), emerald green eyes. Wearing aviation goggles pushed up on forehead, white shirt, brown leather vest (#7D4E28), dark belt with alchemy vials attached, dark gloves (one glove removed, exposing right palm with a glowing transmutation circle tattoo — electric blue glow #3AAEFF). Arms have burn-scar lines that double as conductors, faint copper metallic sheen in the scars (#C07035). Exile Mark tattoo on the upper back, partially visible. Background: dark alchemical laboratory, fractured dimensional plane aesthetic. Style: Yu-Gi-Oh card art influenced, dark fantasy, detailed illustration. Portrait orientation, full body visible.

---

## Files

| File | Contenuto |
|---|---|
| `src/characters/Mira.js` | Classe Phaser (sprite, input, render, HUD) |
| `src/characters/MiraAlchemy.js` | Logica pura: temperatura, guanti, Rebound (testabile in isolamento) |

Pattern: stesso approccio di `SilasTemp.js` / `Silas.js` e `DamianPhase.js` / `Damian.js`.

---

## Note di Integrazione

- `GameScene` usa `TileTypes` per determinare il materiale — `Mira.js` legge il tile sotto il cursore/Mira via `floorLayer.getTileAtWorldXY()`
- Il tile METAL consumato da Q viene temporaneamente sostituito con FLOOR via `floorLayer.putTileAt(FLOOR, x, y)` e ripristinato dopo 8s
- La meccanica DESTRUCTIBLE di F usa lo stesso sistema di `destroyTile` già presente nel gioco
- BaseEnemy non richiede modifiche per le abilità di Mira
