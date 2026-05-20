# Le Signore — Design Spec
*Fractured Inheritance | 2026-05-19*

---

## Identità

**Nome:** Le Signore
**Sottotitolo:** *Prima di Illyrium*
**Tipo:** Nemico mid-tier / mini-boss
**Classe:** `LeSignore extends BaseEnemy`

Creature antiche che abitano il piano fratturato da prima che Illyrium lo rivendicasse. Non riconoscono il sistema. Non reagiscono agli ordini. Cacciano perché è quello che fanno.

Appaiono da sole o in gruppi di 2-3. Non si coordinano — usano la stessa logica, e quella logica convergere naturalmente in qualcosa che sembra tattica.

---

## Aspetto visivo

**Struttura:** corpo umanoide snello, ali grandi sul dorso (separate dalle braccia), artigli lunghi su quattro dita per mano, gambe umane che diventano zampe di rapace dal ginocchio. Capelli lunghi scuri.

**Viso:** tratti affilati, belli e freddi. Iride oro bruciato, pupilla verticale viola scuro.

**Palette:**
- Corpo/ali: viola profondo `#1a0a22` → `#2a1230`
- Ossa ali / dettagli viola: `#5a2a6a` → `#7a3a8a`
- Dettagli oro: `#886600` (collare, bracciali, pattern busto) → `#ccaa00` (punte penne, punte artigli) → `#ffcc00` (gemma corona)
- Occhi: iride `#cc9900`, pupilla `#2a004a`

**Dettagli oro bruciato su:** corona sulla fronte con gemma, collare, bracciali ai polsi, pattern decorativo sul busto, punte delle penne alle ali, punte degli artigli.

**In-game (top-down):**
- Shadow sprite piccola sul pavimento (offset fisso sotto lo sprite)
- Depth layer superiore agli altri nemici
- Nessuna collisione con i muri (vola sopra)
- Colore sprite base: `0x3a1a4a`

**Prompt Grok (card art):**
> Fantasy card art. A harpy creature — elegant, predatory, ancient. Human female body with large dark wings on her back (wings separate from arms). Long sharp claws on human hands. Human legs transitioning into bird talons below the knee. Long dark hair. Facial features sharp and beautiful but cold, golden irises with vertical purple slit pupils. Small gold crown on forehead with a single gemstone, gold collar around neck, gold bracelets on wrists, gold-tipped feathers at wing edges, gold-tipped talons. Color palette: deep violet and black body, dark purple wings with gold accents only on details. Dark background, fractured dimensional plane aesthetic. Style: Yu-Gi-Oh card art influenced, dark fantasy, detailed illustration. Portrait orientation, full body visible.

---

## Stats base

| Parametro | Valore | Note |
|---|---|---|
| HP | 120 | Doppio di HunterCommon |
| Danno artigli | 15 | Per colpo (combo 2 hit) |
| Danno picchiata | 25 | Colpo singolo ad alta velocità |
| Danno battito d'ali | 10 | + knockback |
| Velocità patrol | 60 | Lenta, circolare |
| Velocità aggro rush | 200 | Carica iniziale |
| Velocità picchiata | 280 | Tuffo diagonale |
| Enraged speed mult | ×1.4 | Alla morte di una compagna |
| Enraged damage mult | ×1.3 | Alla morte di una compagna |

---

## State Machine

```
PATROL ──[entra nel cono visivo]──► AGGRO_RUSH
   ▲                                      │
   │                              [arriva a raggio]
   │                                      ▼
   │                                  EVALUATE (300ms)
   │                                 /    |    \
   │                   [fermo]      /  [vicino]  \  [in movimento]
   │                              ▼       ▼        ▼
   │                           DIVE    CLAW    WINGBEAT
   │                              \       |        /
   │                               \      |       /
   │                                ▼     ▼      ▼
   │                                  RECOVER
   │                               (400-800ms)
   └──────────────────────────────────────┘
   
   Qualsiasi stato ──[compagna muore]──► + flag ENRAGED (permanente)
```

**PATROL:** volo circolare lento attorno all'arena. Aggiorna continuamente il controllo del cono visivo.

**AGGRO_RUSH:** carica dritta verso il giocatore a velocità massima. Transita in EVALUATE quando arriva entro raggio di combattimento (~120px).

**EVALUATE:** hover fermo per 300ms (o 0ms se ENRAGED). Sceglie l'attacco in base alla posizione del giocatore al momento della transizione.

**DIVE:** in top-down 2D — si allontana dal giocatore di ~60px (tween rapido all'indietro), poi carica dritta verso la posizione del giocatore *al momento del lancio* — target fisso, non insegue durante la corsa. Il wind-up all'indietro è il telegraph visivo. Se manca: RECOVER a terra per 800ms. Se colpisce: danno + knockback + RECOVER breve (200ms).

**WINGBEAT:** wind-up di 400ms (ali aperte al massimo, telegraph visivo), poi crea hitbox cono frontale attiva 200ms. Danno + knockback se colpisce. RECOVER 300ms.

**CLAW:** combo 2 hit rapidi. Primo colpo dopo 100ms, secondo dopo 250ms. RECOVER 300ms.

**RECOVER:** breve stun/pausa. Unica finestra di vulnerabilità prolungata (soprattutto dopo DIVE mancata).

---

## Campo visivo

Cono di rilevamento: **120° frontale, raggio 200px**.

```js
const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
const facingAngle = this.body.velocity.angle() // direzione di volo attuale
const diff = Phaser.Math.Angle.Wrap(angleToPlayer - facingAngle)
const inCone = Math.abs(diff) < Phaser.Math.DegToRad(60)
const inRange = dist < 200
if (inCone && inRange) → AGGRO_RUSH
```

---

## Coordinazione di gruppo (emergente)

Nessuna logica di gruppo esplicita. La coordinazione nasce dai trigger individuali:

- Durante DIVE di una Signora, il giocatore tende a fermarsi → le compagne leggono "giocatore fermo" → attivano DIVE o WINGBEAT simultaneamente
- Risultato naturale: una tuffa, l'altra spinge con il battito d'ali verso la traiettoria del tuffo

**Evento morte:** ogni istanza emette `scene.events.emit('signora_died')` nel metodo `_die()`. Le compagne vive ascoltano l'evento e attivano il flag `enraged`.

**Enrage visivo:** occhi passano da oro a rosso (`0xff2200`), brief flash bianco sullo sprite, velocità e danno aumentati per tutta la durata dello scontro.

**Ritiro alla morte di una compagna:** quando scatta ENRAGED, la Signora completa l'azione corrente, poi esegue un allontanamento rapido di ~80px (tween) prima di riprendere l'aggro. Dura 600ms — legge come rispetto, non come fuga.

---

## Morte

- Nessun blood pool (non è di Illyrium, il suo sangue non ha lo stesso peso)
- Le ali si ripiegano, caduta verticale
- Le compagne eseguono il ritiro-enrage sopra descritto
- Effetto visivo: brief dissolvenza viola prima che lo sprite scompaia

---

## Interazioni con i personaggi

**Zeryth — Pausa tattica:** congela la Signora a metà traiettoria durante DIVE → finestra di vulnerabilità estesa per tutta la durata della pausa. Il proiettile di sangue può colpirla durante il wind-up di WINGBEAT.

**Damian — Fase 3:** l'ombra senziente la colpisce normalmente. In ENRAGED, le Signore ignorano il knockback dell'ombra (troppo aggressive per essere spostate).

**Silas:** la Tessitura d'Ombra interrompe il cono visivo — in zona shadow Silas è invisibile al trigger di AGGRO_RUSH. Se attacca, rientra nel cono.

---

## Implementazione — file da creare/modificare

| File | Azione |
|---|---|
| `src/enemies/LeSignore.js` | Nuova classe con FSM completa |
| `src/enemies/BaseEnemy.js` | Aggiungere supporto shadow sprite (opzionale, può stare in LeSignore) |
| `src/scenes/GameScene.js` | Aggiungere spawn LeSignore, registrare evento `signora_died` |

---

## Aperto / Da definire

- Spawn: una Signora per stanza o trigger condizionale (piano X+)?
- Il ritiro alla morte di una compagna è interrompibile da un colpo del giocatore?
- Suono del battito d'ali (wind-up audio cue)
- Animazione volo in top-down (oscillazione leggera dello sprite?)
