# Esecutori di Illyrium — Design Spec
*Fractured Inheritance | 2026-05-19*

---

## Identità

**Nome:** Esecutori di Illyrium
**Sottotitolo:** *Cessazione Funzionale*
**Tipo:** Nemico base
**Classi:** `EsecutoreComune extends BaseEnemy`, `EsecutoreLeader extends EsecutoreComune`
**Stato attuale nel codice:** `HunterCommon` (da sostituire)

---

## Varianti

### EsecutoreComune

- **Colore sprite:** `0x5a6070` (grigio-acciaio)
- **Dimensioni:** 18×18px (invariate)
- **Dettagli visivi:** sigillo III sul petto, numero serie EC sul collo, occhi bianchi
- **HP interni (nascosti):** 60
- **Danno:** 10
- **Velocità:** 90

### EsecutoreLeader

- **Colore sprite:** `0x3a4050` (grigio più scuro)
- **Dimensioni:** 22×22px (scala ~20% maggiore)
- **Dettagli visivi:** sigillo I sul petto con bordo ottagonale marcato, striscia orizzontale di rango sul petto, occhi bianchi
- **HP interni (nascosti):** 108 (+80%)
- **Danno:** 15 (+50%)
- **Velocità:** 85 (leggermente più lento, più pesante)

---

## Sistema di degradazione funzionale

Nessuna barra HP visibile. Nessun flash al danno. Il danno si accumula internamente. Tre soglie visive che raccontano il malfunzionamento:

| Stato | Comune (HP%) | Leader (HP%) | Effetto visivo |
|---|---|---|---|
| Operativo | 100–51% | 100–71% | Occhi bianchi attivi `0xffffff`, sigillo luminoso |
| Degrado | 50–21% | 70–41% | Un occhio si spegne `0x222222`, sigillo invariato |
| Critico | 20–1% | 40–1% | Sigillo perde colore ed energia `0x333333` |
| Collasso | 0% | 0% | Cade di colpo — nessun suono, nessun blood pool, corpo resta |

La transizione tra stati è istantanea (non graduale). Nessuna animazione di dolore in nessuno stato. Continuano ad avanzare e attaccare invariati fino al collasso.

---

## Sistema di formazione (slot)

Gli slot si calcolano attorno al giocatore in base al numero di unità attive. Il leader occupa sempre lo slot **fronte**.

| Unità attive | Slot |
|---|---|
| 1 | fronte |
| 2 | fronte + fianco sinistro |
| 3 | fronte + fianco sx + fianco dx |
| 4 | fronte + fianco sx + fianco dx + retro |

**Avanzata:** le unità mantengono il loro slot mentre si avvicinano. I comuni non superano mai il leader finché lui non attacca.

**Ricalibrazione alla morte di un'unità:**
- Con leader vivo: 600ms di pausa (tutte le unità si fermano, nessun attacco), poi slot ridistribuiti
- Senza leader: 800ms di pausa, slot ridistribuiti, movimento meno sincronizzato (intervallo attacco +200ms per le unità rimaste)

---

## Morte

- Corpo resta dove cade — non si dissolve
- Nessun suono di morte
- Nessun blood pool — Zeryth non può assorbirli, rendendo gli Esecutori uno scontro che non si ricarica
- Se muore il leader: le compagne entrano in stato "senza comando" (flag `leaderless = true`)

---

## Interazioni con i personaggi

Valide per tutti i personaggi giocabili una volta implementati:

- **Zeryth — Pausa tattica:** congela tutte le unità inclusa la ricalibrazione. Nessun blood pool da assorbire.
- **Damian — Fase 3:** knockback funziona normalmente. In stato Critico non vengono spostati (corpo quasi spento, non reagisce agli impulsi).
- **Mira:** può trasmutare le armi che portano (materiale metallico) se a terra dopo il collasso.
- **Silas:** invisibilità in ombra interrompe il cono di rilevamento. La formazione non si aggiorna finché non rientrano nel campo visivo.

---

## Implementazione — file da creare/modificare

| File | Azione |
|---|---|
| `src/enemies/EsecutoreComune.js` | Nuova classe — sostituisce `HunterCommon` |
| `src/enemies/EsecutoreLeader.js` | Estende `EsecutoreComune`, stats e visual differenti |
| `src/enemies/BaseEnemy.js` | Rimuovere flash bianco da `takeDamage()`, rendere `_die()` override-able (nessun blood pool di default) |
| `src/systems/FormationSystem.js` | Gestione slot, ricalibrazione, stato `leaderless` |
| `src/scenes/GameScene.js` | Sostituire spawn `HunterCommon` con `EsecutoreComune` + `EsecutoreLeader` |

---

## Aperto / Da definire

- Quante unità per stanza (min/max)?
- Il leader spawna sempre o solo da un certo piano in poi?
- Suono di ricalibrazione (silenzio assoluto, o un click meccanico)?
