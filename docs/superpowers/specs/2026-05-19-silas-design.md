# Silas — Design Spec
*Fractured Inheritance | 2026-05-19*

---

## Sistema Vitale — Sangue Congelato

**Temperatura (0–100, 100 = caldo/pieno)**

| Evento | Delta temperatura |
|---|---|
| Colpo ricevuto | −20 |
| Shadow Bind (RMB) | −15 |
| Shadow Teleport (Q) | −25 |
| Shadow Fusion attiva (F) | −5/s |
| In zona d'ombra (passivo) | +8/s |
| Fuori dall'ombra (passivo) | +3/s |

**A temperatura 0 (max gelo):**
- Velocità dimezzata (`speedMultiplier = 0.5`)
- Tutti i poteri ombra disabilitati
- Prossimo colpo = morte (`alive = false` → GameOverScene)

Silas non muore per il freddo — muore se è congelato e prende un colpo. L'unica difesa è recuperare temperatura in ombra prima di essere esposto.

---

## Zone d'ombra

`GameScene.isInShadow(tileX, tileY)` ritorna `true` se:

1. `grid[tileY][tileX] === TILE.SHADOW`
2. `grid[tileY][tileX] === TILE.CORRIDOR`
3. Almeno uno dei 4 vicini ortogonali è `TILE.WALL`

`FloorBuilder._placeFeatures` aggiunge 2–3 patch SHADOW (1×2 o 2×1) per stanza, posizionate randomicamente nel corpo della stanza escludendo il centro e gli angoli già gestiti.

`Silas` controlla il proprio stato ogni frame:
```javascript
const tileX = Math.floor(this.x / TILE_SIZE)
const tileY = Math.floor(this.y / TILE_SIZE)
this._inShadow = scene.isInShadow(tileX, tileY)
```

---

## Logica pura — SilasTemp.js

Estratta per permettere unit test senza dipendenze Phaser:

```javascript
export const TEMP_MAX = 100
export const TEMP_MIN = 0
export const TEMP_DRAIN_BIND     = 15
export const TEMP_DRAIN_TELEPORT = 25
export const TEMP_DRAIN_FUSION   = 5   // per secondo
export const TEMP_DRAIN_HIT      = 20
export const TEMP_REGEN_SHADOW   = 8   // per secondo
export const TEMP_REGEN_BASE     = 3   // per secondo

export function tempRegen(inShadow, delta) {
  const rate = inShadow ? TEMP_REGEN_SHADOW : TEMP_REGEN_BASE
  return rate * (delta / 1000)
}

export function isFrozen(temp) { return temp <= TEMP_MIN }
export function speedMultiplier(temp) { return temp <= TEMP_MIN ? 0.5 : 1.0 }
export function powersEnabled(temp) { return temp > TEMP_MIN }
```

---

## Controlli

| Tasto | Condizione | Azione |
|---|---|---|
| LMB | Sempre | Pugnalata — base 12 dmg, +50% se `_inShadow` |
| LMB | Dopo Shadow Fusion | **Backstab** — 36 dmg (×3), consuma Fusion |
| RMB | `_inShadow && powersEnabled` | Shadow Bind — immobilizza nemico 2s, −15 temp |
| RMB | Bound target + LMB | ×2 dmg sul nemico immobilizzato |
| Q | `_inShadow && powersEnabled` | Shadow Teleport — −25 temp |
| F | `_inShadow && powersEnabled` | Shadow Fusion toggle |
| SPACE | Sempre | Pausa tattica (TacticalPause) |

---

## Shadow Bind (RMB in ombra)

Cerca il nemico più vicino entro 50px. Se trovato:
- Imposta `enemy._bound = true`, `enemy._boundTimer = 2000`
- Il nemico smette di muoversi finché `_bound = true`
- Costa 15 temperatura
- Cooldown 1.5s

Il nemico gestisce il proprio bound timer nel suo `update()` — Silas non deve tracciarlo.

---

## Shadow Teleport (Q in ombra)

1. Calcola la direzione `(facingX, facingY)`
2. Itera tile nella direzione, passo 1 tile alla volta, fino a 80px
3. Se incontra `TILE.LIGHT` → abilità fallisce silenziosamente, nessun costo
4. Se trova tile in shadow (`isInShadow`) → teletrasporta (setPosition)
5. Costa 25 temperatura

```javascript
_shadowTeleport(scene) {
  const stepX = this.facingX * TILE_SIZE
  const stepY = this.facingY * TILE_SIZE
  for (let dist = TILE_SIZE; dist <= 80; dist += TILE_SIZE) {
    const tx = Math.floor((this.x + this.facingX * dist) / TILE_SIZE)
    const ty = Math.floor((this.y + this.facingY * dist) / TILE_SIZE)
    if (scene.grid[ty]?.[tx] === TILE.LIGHT) return
    if (scene.isInShadow(tx, ty)) {
      this.body.reset(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2)
      this.temperature = Math.max(0, this.temperature - TEMP_DRAIN_TELEPORT)
      return
    }
  }
}
```

---

## Shadow Fusion (F toggle in ombra)

- `_fusionActive = true` → Silas è invisibile ai nemici
- Se esce dall'ombra: rimane "pronto" ma invisibilità sospesa finché non rientra
- Drena 5 temp/s mentre attivo
- Primo LMB in Fusion → Backstab (36 dmg), `_fusionActive = false`, `_hadFusion = false`
- `_hadFusion` flag: impostato a `true` quando Fusion si attiva, usato da `_punch` per rilevare il backstab

---

## Pugnalata (LMB)

```javascript
_punch(scene) {
  const reach = 28
  const inFusion = this._fusionActive || this._hadFusion
  let dmg = 12
  if (inFusion) { dmg = 36; this._fusionActive = false; this._hadFusion = false }
  else if (this._inShadow) { dmg = 18 }

  // flash visivo al punto di impatto
  const fx = scene.add.rectangle(
    this.x + this.facingX * reach, this.y + this.facingY * reach,
    10, 10, 0xaaaaff, 0.6
  ).setDepth(5)
  scene.time.delayedCall(100, () => { if (fx.active) fx.destroy() })

  scene.enemies.getChildren().forEach(enemy => {
    const dist = Phaser.Math.Distance.Between(
      this.x + this.facingX * reach, this.y + this.facingY * reach,
      enemy.x, enemy.y
    )
    if (dist < 25) {
      const finalDmg = enemy._bound ? dmg * 2 : dmg
      enemy.takeDamage(finalDmg)
    }
  })
}
```

---

## Visuale (Rectangle placeholder)

**Silas:** Rectangle 16×24, colore interpolato dalla temperatura:
- 100 (caldo): `0x0a0a1a`
- 50: `0x1a4488`
- 0 (gelo): `0x4488ff`

**Shadow Fusion attiva:** `this.setAlpha(Math.sin(scene.time.now * 0.005) * 0.35 + 0.45)` (pulsa tra 0.1 e 0.8)

**Indicatore temperatura:** Rectangle 6×6 a `(this.x, this.y - 20)`, stesso gradiente blu.

**Indicatore ombra:** Rectangle 4×4 a `(this.x + 10, this.y - 20)`, colore `0x003300` se `_inShadow`, `0x111111` altrimenti.

---

## Interazione con nemici — bound

I nemici (EsecutoreIllyrium, SkravAlpha, SkravMembro) devono:
1. Controllare `this._bound` nel proprio `update()`
2. Se `_bound = true`, saltare il movimento e il comportamento AI
3. Decrementare `this._boundTimer -= delta`; quando raggiunge 0, `this._bound = false`

Silas non traccia i timer dei bound — sono autogestiti dai nemici.

---

## File da creare / modificare

| File | Azione |
|---|---|
| `src/characters/SilasTemp.js` | **Creare** — logica temperatura pura (testabile) |
| `src/characters/Silas.js` | **Creare** — classe Silas estende BaseCharacter |
| `tests/characters/SilasTemp.test.js` | **Creare** — unit test logica temperatura |
| `src/map/FloorBuilder.js` | **Modificare** — aggiungere patch SHADOW sparse |
| `src/scenes/GameScene.js` | **Modificare** — `isInShadow()`, swap player a Silas |
| `src/enemies/EsecutoreIllyrium.js` | **Modificare** — gestione `_bound` |
| `src/enemies/SkravAlpha.js` | **Modificare** — gestione `_bound` |
| `src/enemies/SkravMembro.js` | **Modificare** — gestione `_bound` |

---

## Note implementative

- `Silas` estende `BaseCharacter` come Zeryth e Damian
- La Shadow Fusion interagisce con il colore/alpha del Rectangle, non con un sistema sprite
- `rebindActions` da implementare per F key (pattern identico a Damian)
- `temperature` non può scendere sotto 0 (`Math.max(0, ...)`) né salire sopra 100 (`Math.min(100, ...)`)
- I poteri (RMB, Q, F) non hanno cooldown oltre al costo in temperatura, salvo Shadow Bind (cd 1.5s)
