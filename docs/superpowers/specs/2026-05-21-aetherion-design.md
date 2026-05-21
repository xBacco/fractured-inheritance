# Aetherion — Design Tecnico

**Data:** 2026-05-21
**Stato:** Approvato — in attesa di implementation plan
**Personaggio:** Aetherion (Ethan) — protagonista principale, roguelite + story mode

---

## 1. Identità e ruolo

Aetherion è il **personaggio principale del gioco**, presente sia in modalità roguelite che come protagonista della Story Mode.

A differenza degli altri 5 PG (Mira, Damian, Silas, Zeryth, Korvan, Veyra), che sono "personaggi sperimentali" con sistemi-risorsa unici (temperatura, fasi, focus, ecc.), Aetherion è il **personaggio classico leggibile a colpo d'occhio**:

- **HP visibili** come barra principale (gli altri PG hanno HP nascosti dietro la loro risorsa peculiare)
- **Niente seconda risorsa narrativa** — lui è "puro", un teenager con un potere che esplode
- Le abilità lavorano su **cooldown standard**

La sua "particolarità" è il **Burst** stesso: un'abilità, non una risorsa parallela.

---

## 2. Filosofia di design

**Tagline gameplay:** *"Quattro secondi di pura devastazione ogni 19 secondi, e nel frattempo sei un ragazzino con le mani sporche di pittura che cerca di non morire."*

Aetherion rispecchia il lore in modo letterale:

| Concetto lore | Traduzione meccanica |
|---|---|
| "lago sotterraneo, fermo, stagnante" — non si può canalizzare per gradi | Stato Calma: abilità deboli ma controllabili (LMB/RMB/F) |
| "Quando spacca: divampa. Incessante" — non aspetta permesso | Burst Mode: 4s **fissi non annullabili**, AOE automatica, lockout altre abilità |
| "Nessuno gli ha mai insegnato come gestirlo" | Self-damage continuo durante il Burst (~24 HP totali) |
| "Le mani macchiate di pittura, non di sangue" — non addestrato | LMB melee debole, HP base 100 (meno di Korvan 200, più di Veyra 70) |
| "Dissoluzione di freccia magica" — manifestazione documentata | RMB Dissolve: counter-tool per proiettili nemici |
| "Piegare e spezzare metallo" — manifestazione documentata | F Spezza Metallo: interazione contestuale con tile METAL |
| "Si alimenta del nemico quando divampa" (inferito dal "trova qualcosa da bruciare") | Kill durante Burst → annulla 1s di self-damage |

---

## 3. Stats base

| Campo | Valore | Motivazione |
|---|---|---|
| HP max | 100 | Teenager non addestrato. Più fragile di Korvan (200), Damian (~150), più resistente di Veyra (70). |
| Speed | `PLAYER_SPEED` (default) | Né lento né veloce — base normale |
| Sprite placeholder | `Phaser.GameObjects.Rectangle` 14×26 | Pattern coerente con altri PG |
| Colore base | `0xE07828` (ember) | Palette scheda |
| Colore Burst | `0xFFB040` (burst) | Palette scheda |
| Hitbox | 14×26 | Stesso di Veyra (teenager non-tank) |

---

## 4. Abilità

### 4.1 LMB — Paint Strike

Attacco melee corto raggio con le mani macchiate di pittura.

| Parametro | Valore |
|---|---|
| Range | 25px (di fronte ad Aetherion) |
| Danno | 8 |
| Cooldown | 300ms |
| Costo | Nessuno |
| Visual | Rettangolo nero 12×6 davanti, durata 100ms |

**Comportamento:** premuto LMB → spawna hitbox 25×12 nella direzione `facing`, applica `enemy.takeDamage(8)` a ogni nemico nell'area, distrugge la hitbox dopo 100ms.

**Why:** "le mani macchiate di pittura, non di sangue" del lore. L'attacco base è simbolico, non efficace. Forza il giocatore a usare F/Q per il vero damage.

---

### 4.2 RMB — Dissolve (hold)

Cono di calore frontale che dissolve i proiettili nemici. Manifestazione lore: "dissoluzione di freccia magica".

| Parametro | Valore |
|---|---|
| Range | Cono 80px frontale, half-angle ±30° |
| Effetto | Dissolve `scene.enemyProjectiles` che entrano nel cono |
| Durata max hold | 2000ms |
| Movimento | **Bloccato** mentre held (`body.setVelocity(0, 0)`) |
| Cooldown | 4000ms dal release |
| Costo | Nessuno (ma costa tempo/posizionamento) |
| Visual | Cono triangolare semi-trasparente `0xFFB040` alpha 0.35 |

**Comportamento:**
1. RMB premuto → entra in stato "dissolving", spawna visual cono nella direzione `facing`
2. Ogni frame durante hold: itera `enemyProjectiles`, per ciascun proiettile nel cono → `proj.destroy()`
3. RMB rilasciato OR `_dissolveMs >= 2000` → termina, avvia cooldown
4. Durante il dissolving il movimento è bloccato

**Edge case:** se `facing` cambia mentre held (es. WASD non locked), il cono ruota? **Decisione:** sì, ruota. Il giocatore può "scansionare". Ma il movimento è 0 — solo il `facing` cambia.

**Why:** rispecchia letteralmente la manifestazione lore. Counter-tool puro, anti-Esecutori (proiettili) e anti-Sussurri (urlo a cono).

---

### 4.3 Q — Crack (Burst trigger, signature)

Aetherion "spacca il lago". Entra in **Burst Mode** per durata fissa.

| Parametro | Valore |
|---|---|
| Durata Burst | 4000ms **fissi, non annullabile** |
| AOE raggio | 60px dalla cicatrice (centrato su Aetherion) |
| AOE damage | 15 dmg/sec ai nemici nel raggio (tick ogni 100ms = 1.5 dmg/tick) |
| Self-damage | 6 HP/sec (24 HP totali se nessun kill) |
| Kill rebate | Ogni nemico ucciso durante Burst → `_selfDamageOffsetMs += 1000` (annulla 1s di self-damage) |
| Lockout | LMB, RMB, F disabilitati durante Burst |
| Movimento | Libero |
| Cooldown | 15000ms dopo fine Burst |
| Visual Aetherion | `fillColor = 0xFFB040`, `setAlpha(0.95)`, pulse scale ±0.1 |
| Visual AOE | Cerchio `Graphics` raggio 60 alpha 0.20, ring esterno `0xFFF0C0` alpha 0.6 |

**Comportamento:**
1. Q `JustDown` AND `_burstCd <= 0` AND `!_burstActive` → entra in Burst
2. Set `_burstActive = true`, `_burstMs = 4000`, `_selfDamageOffsetMs = 0`
3. Ogni tick durante Burst:
   - `_burstMs -= delta`
   - Calcola self-damage: se `_selfDamageOffsetMs > 0` → `_selfDamageOffsetMs -= delta`, no HP loss; altrimenti `hp -= 6 * (delta/1000)`
   - AOE: itera `scene.enemies`, per ciascuno con `distance < 60` → `enemy.takeDamage(15 * delta/1000)`
4. Quando Burst inflicts kill: `_selfDamageOffsetMs += 1000` (max 4000)
5. `_burstMs <= 0` → exit Burst, set `_burstCd = 15000`, restore color
6. Durante Burst: LMB/RMB/F `return` immediatamente

**Tracking del kill rebate:** la classe ascolta `scene.events.on('enemy_killed', ...)` e se è in Burst, fa il rebate. Listener registrato in `constructor`, rimosso in `destroy`.

**Why:** core fantasy. Cooldown lungo + lockout altre abilità rende il Burst un **momento**, non spam. Il rebate kill premia il timing (entrare in branco, non in vuoto), coerente col lore "spacca → divampa → si alimenta".

---

### 4.4 F — Spezza Metallo (contestuale)

Su tile `METAL` adiacente: distrugge il metallo, AOE + schegge proiettili. Manifestazione lore: "piegare e spezzare metallo".

| Parametro | Valore |
|---|---|
| Trigger | F `JustDown` + esiste un tile `METAL` in una delle 4 celle adiacenti (NSEW) |
| Tile effect | Tile `METAL` → `FLOOR` per 8s, poi ripristina (pattern Mira Q) |
| AOE | Raggio 40px attorno al tile spezzato, 30 dmg one-shot |
| Schegge | 3 proiettili a cono ±25° in direzione `facing`, 15 dmg ciascuno, speed 320 |
| Vita schegge | Distrutte dopo 600ms o on hit |
| Cooldown | 6000ms |
| Costo | Nessuno (richiede tile METAL = costo posizionale) |
| Visual | Flash `0xFFB040` sul tile (200ms), poi rettangolo nero "crepa" (`0x0a0808`) per 8s |

**Comportamento:**
1. F `JustDown` AND `_fCd <= 0` AND non in Burst → cerca tile METAL adiacente (priorità: davanti `facing` > laterale > dietro)
2. Se trovato:
   - `scene.grid[ty][tx] = TILE.FLOOR`
   - Schedule restore dopo 8s (se ancora FLOOR)
   - AOE damage 30 a nemici entro 40px dal centro del tile
   - Spawna 3 rettangoli `8×3` `0xaab0b8` (schegge metallo) a cono frontale
   - Aggiunge schegge a `this.projectiles` (collision con enemies già setup in GameScene)
3. `_fCd = 6000`

**Why:** rispecchia manifestazione lore. Coerente con pattern Mira F (DESTRUCTIBLE) ma più aggressivo (damage diretto + proiettili).

---

## 5. Stati e transizioni

```
        ┌─────────┐
        │  CALMA  │ ◄────────┐
        └────┬────┘          │
             │ Q (cd=0)      │
             ▼               │
        ┌─────────┐          │
        │  BURST  │ ─────────┘
        │  (4s)   │   exit dopo 4s, CD 15s
        └─────────┘
```

| Stato | Movimento | LMB | RMB | Q | F |
|---|---|---|---|---|---|
| CALMA | sì | Paint Strike | Dissolve hold | → BURST (se cd=0) | Spezza Metallo |
| CALMA + dissolving | **bloccato** | disabilitato | mantieni hold | disabilitato | disabilitato |
| BURST | sì | **lockato** | **lockato** | **lockato** | **lockato** |

**Movimento bloccato durante Dissolve hold:** il giocatore deve fermarsi per dissolvere. Trade-off chiaro.

**Tutte le abilità lockate in Burst:** coerente lore "nessun controllo".

---

## 6. Effetti di stato in ingresso

Aetherion può essere bersaglio di `applyRoot(duration)`, `applyDisorient(duration)` (vedi Anghiato, AlberoRichiusa, Sussurro).

| Stato | Comportamento |
|---|---|
| Rooted | `body.setVelocity(0, 0)` in `handleMovement`. Abilità ancora attivabili. |
| Disorient | Controlli WASD invertiti (pattern Mira/Veyra) per durata effetto. |

Durante Burst: rooted/disorient ignorati? **Decisione:** rooted **ignorato** (il Burst è "incessante", supera root). Disorient **rispettato** (movimento è ancora del giocatore). Coerente lore.

---

## 7. HUD

| Elemento | Posizione | Stile |
|---|---|---|
| Barra HP | Bottom-left (20, height-40) | Larghezza 80, altezza 6, colore ember `0xE07828`. Scala con `hp/HP_MAX`. Sotto 30% → flash rosso `0xFF2200` pulsante. |
| Indicatore Burst CD | Sotto barra HP (20, height-28) | Cerchio piccolo (8px) cicatrice stellare: vuoto durante CD, riempimento ember `0xE07828` quando carico, pulsa `0xFFB040` quando Burst attivo. Testo "Q" affianco. |
| Visual cicatrice | Sul rettangolo del player | Piccolo punto `0xFFB040` 2×2 al centro del rettangolo (sempre visibile, è la cicatrice). Durante Burst → diventa 4×4 e pulsa. |

**Niente seconda risorsa**: a differenza degli altri 5 PG, Aetherion ha solo HP visibile.

---

## 8. Death

Quando `hp <= 0`:
1. `this.alive = false`
2. Distruggi: `_hpBar`, `_burstIndicator`, `_dissolveCone` se attivo, `_burstAuraGfx` se in Burst
3. Rimuovi listener: `scene.events.off('enemy_killed', this._onEnemyKilled)`
4. `scene.scene.start('GameOverScene', { score: scene.scoreSystem?.getScore() ?? 0 })`

Pattern identico agli altri PG.

---

## 9. Architettura tecnica

**File da creare:** `src/characters/Aetherion.js`

**Estende:** `BaseCharacter` (eredita movement, WASD, mouse input setup, camera follow, zoom)

**Modifiche a file esistenti:**
- `src/scenes/GameScene.js`: cambiare `new Veyra(...)` → `new Aetherion(...)` (riga 31)
- `personaggi/giocabili/aetherion/scheda.html`: aggiornare sezione "Note Implementative" (rimuovere "meccaniche da definire"), aggiornare "Modalità Roguelite: Disponibile", aggiungere sezione abilità

**Modulo puro opzionale** (pattern Mira/Silas): se le formule del Burst diventano complesse, estraili in `src/characters/AetherionBurst.js` con funzioni pure testabili. Per ora le formule sono semplici (lineari), quindi probabilmente inline. **Decisione finale durante implementazione.**

**Eventi:**
- Emette `player_attacked` su LMB/RMB-dissolve-trigger/F/Burst-AOE-tick (per AlberoRichiusa chain) — pattern Mira
- Ascolta `enemy_killed` durante Burst per kill rebate

**Collision:**
- `this.projectiles = scene.physics.add.group()` per schegge F → GameScene già fa overlap con enemies
- AOE Burst e Paint Strike NON usano proiettili — iterano `scene.enemies` direttamente (pattern Korvan)

---

## 10. Bilanciamento — ipotesi iniziali

Da validare playing-feel:

| Scenario | Aspettativa |
|---|---|
| Stanza vuota | Aetherion debole (LMB damage scarso, no risorsa offensive) |
| Stanza con 1-2 nemici | Paint Strike + F per damage; Burst overkill |
| Stanza con 4+ nemici (Esecutori/Skrav) | Burst conveniente: rebate ricuce il self-damage, AOE devastante |
| Stanza con proiettili nemici (Sussurri sparso) | Dissolve essenziale; Burst da risparmiare |
| Tile METAL adiacente + nemici raggruppati | F = pick perfetto (AOE + schegge) |

**Punti di tensione voluti:**
- 15s CD del Burst è lungo: il giocatore deve sopravvivere con abilità deboli tra un Burst e l'altro
- 24 HP self-damage è ~24% HP totali: significativo
- Movimento bloccato durante Dissolve: rischio di trovarsi accerchiato

**Numeri da rivedere dopo playtest:**
- Burst damage (15/s): potrebbe essere troppo basso vs nemici tank (200 HP Esecutori? Mira faceva ~30 dmg con RMB liquid)
- Dissolve range cono: 80px è poco se i Sussurri sparano da lontano (range 120 nello spec Sussurro)

---

## 11. Implementazione: tasks suggerite (per writing-plans)

1. `Aetherion.js` scheletro: constructor, HP, sprite, HUD setup (barra HP + burst indicator), update loop, destroy
2. `Aetherion.js` LMB Paint Strike: hitbox, damage, CD, visual
3. `Aetherion.js` F Spezza Metallo: tile detection, AOE damage, schegge proiettili, restore timer
4. `Aetherion.js` RMB Dissolve: cono visual, hold logic, proiettili enemies dissolution, movement lock
5. `Aetherion.js` Q Burst: state machine, AOE damage tick, self-damage, kill rebate listener, lockout
6. `Aetherion.js` applyRoot/applyDisorient (handleMovement override)
7. `Aetherion.js` death + cleanup
8. `GameScene.js`: swap Veyra → Aetherion come player attivo
9. `personaggi/giocabili/aetherion/scheda.html`: aggiornamento sezioni
10. Test: modulo puro Burst formula (se estratto)

---

## 12. Open questions / da decidere in implementazione

- **Estrarre `AetherionBurst.js`?** Decidere dopo aver scritto il Burst inline — se le formule restano semplici, no. Se diventano un blocco non leggibile, sì.
- **Visual del cono Dissolve**: triangolo Graphics o sprite? Probabilmente Graphics (no asset richiesto).
- **Audio**: non in scope. Tutti gli altri PG sono muti per ora.

---

**Approvato dall'utente il 2026-05-21.**
