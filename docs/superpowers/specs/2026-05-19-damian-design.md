# Damian "Cross" — Design Spec
*Fractured Inheritance | 2026-05-19*

---

## Prerequisito: Nuovo Layout di Controlli (tutti i personaggi)

Il layout di default sostituisce J/K con un sistema mouse + tasti vicini a WASD.

| Tasto | Azione globale |
|---|---|
| WASD | Movimento + facing direction |
| LMB | Attacco primario (direzione WASD) |
| RMB | Attacco secondario / abilità (alcune mouse-aimable) |
| Q | Abilità 1 (character-specific) |
| E | Interagisci / raccogli (non implementato ora) |
| R | Abilità 2 (character-specific) |
| F | Abilità 3 / trasformazione (character-specific) |
| SPACE | Pausa tattica |
| Scroll | Zoom |

Tutti i tasti sono rimappabili tramite il sistema KeyBindings esistente. Le azioni `attack` e `blood` di Zeryth vengono rinominate rispettivamente in `primary` e `secondary` per essere condivise tra i personaggi.

**Zeryth con il nuovo layout:**
- LMB (`primary`) = Strike fisico (direzione WASD)
- RMB (`secondary`) = Blood: tap = proiettile (mouse-aimable), hold = spada (direzione WASD)
- Q (`ability1`) = Distorsione locale
- SPACE = Secondo Fratturato

---

## Damian "Cross" — Cambion (ibrido umano/demone incubo)

### Sistema: Riserva Demoniaca

Niente HP. Due indicatori sovrapposti:

**Corruzione (0–100)**
- Sale ogni volta che Damian subisce danno (1 punto ogni ~2 HP di danno ricevuto)
- Non scende mai da sola — scende solo stando fermi (1/s)
- Ogni soglia superata scala automaticamente la fase se la fase attuale è inferiore
- Soglie: 25 → Fase 1, 55 → Fase 2, 80 → Fase 3

**Riserva (0–100)**
- Parte piena, si consuma stando in Fase 1+
- Drain per fase: Fase 1 = 2/s, Fase 2 = 5/s, Fase 3 = 12/s
- Se si azzera in Fase 3 → stato Traumatico (non passa per fasi intermedie)
- In stato Traumatico si rigenera lentamente; raggiunto 30 → sblocca di nuovo le fasi

Damian muore solo se subisce danno in stato Traumatico con riserva = 0.

---

### Fasi

| Fase | Trigger | Colore Rectangle | Effetti |
|---|---|---|---|
| Base | Inizio run | `0x222233` grigio scuro | Attacco normale, piena pausa tattica |
| Fase 1 — Risveglio | Corruzione > 25 o F | `0x886600` ambrato | +30% danni, riserva drena a 2/s |
| Fase 2 — Demone Minore | Corruzione > 55 o F | `0x440066` viola scuro | Danno ridotto 25%, +20% velocità, shadow rectangle attivo |
| Fase 3 — Demone Incubo | Corruzione > 80 o F | `0x880022` rosso scuro | ×5 forza, lifesteal (ogni uccisione recupera 10 riserva), shadow attacca autonomamente ogni 2s, pausa tattica disabilitata |
| Berserk | Riserva < 10 in Fase 3 | `0xff0000` rosso pieno | Direzione attacchi deviata ±30° rispetto al facing, shadow attacca bersagli casuali |
| Traumatico | Riserva = 0 in Fase 3+ | `0x555566` grigio pallido | Velocità dimezzata, nessuna fase disponibile, riserva rigenera lentamente |

**Regole di transizione:**
- F scala di una fase se riserva > 20; ignorato in Fase 3 e Berserk
- La corruzione sale con ogni `takeDamage`, non scende mai
- Uscita da Fase 3 per riserva esaurita → diretto in Traumatico
- Non esiste discesa manuale di fase

---

### Controlli

| Tasto | Base | Fase 1 | Fase 2 | Fase 3 | Berserk |
|---|---|---|---|---|---|
| LMB | Pugno 15 dmg | Pugno potenziato 20 dmg | Pugno + push 22 dmg | Pugno devastante 75 dmg | Pugno 75 dmg, direzione ±30° random |
| RMB | — | Colpo pesante 30 dmg (cooldown 1.5s) | Shadow parry — assorbe il prossimo colpo in arrivo (finestra 3s, poi scade) | Shadow lash — proiettile verso cursore 40 dmg | Shadow lash direzione random |
| F | Scala fase | Scala fase | Scala fase | Ignorato | Ignorato |
| SPACE | Pausa tattica | Pausa tattica | Pausa tattica | Disabilitata | Disabilitata |

Il **shadow lash** (RMB Fase 3) è l'unica abilità mouse-aimable di Damian.

---

### Visual (Rectangle placeholder — sprite reali in seguito)

**Damian:** Rectangle `20×28`, colore cambia per fase come da tabella.

**Shadow:** Rectangle `18×26`, colore `0x220033`, alpha `0.5`
- Appare da Fase 2 in su
- Fase 2: segue Damian con lag ~120ms (interpolazione posizione)
- Fase 3: ogni 2s si stacca, lerp veloce verso il nemico più vicino in raggio 80px, infligge 20 dmg, lerp lento di ritorno
- Berserk: stesso comportamento ma bersaglio casuale

**Indicatore corruzione:** Rectangle `6×6` sopra Damian, colore scala da `0x444444` (0%) a `0xff2200` (100%).

**Indicatore riserva:** Rectangle `6×6` affiancato, colore scala da `0x6600aa` (piena) a `0x110022` (vuota). Lampeggia quando < 20%.

**Stato traumatico:** colore rectangle `0x555566` + overlay bianco semi-trasparente che lampeggia lentamente finché riserva < 30.

---

### Note implementative

- `Damian` estende `BaseCharacter` come `Zeryth`
- Lo stato della fase e la logica di transizione vivono interamente in `Damian.js`
- La shadow è un GameObject separato gestito da Damian, non da GameScene
- `rebindActions` da implementare per LMB/RMB/F (pattern identico a Zeryth)
- GameScene dovrà registrare sia i click del mouse che i nuovi tasti per tutti i personaggi
