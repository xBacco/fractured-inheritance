# Esecutori di Illyrium — Soldati del Vuoto

**Sottotitolo:** *Cessazione Funzionale*
**Tipo:** ENEMY
**Zona:** Illyrium e dintorni — forza d'ordine del sistema
**Ruolo nel codice:** `HunterCommon` / `EsecutoreLeader`

---

Non sono nati. Sono stati fatti.

Illyrium prende quello che la guerra lascia. Il processo dura tre giorni. Quello che entra esce in piedi. Il cappotto militare grigio-acciaio è identico per tutti. Il sigillo non è dipinto sul petto — è inciso nella pelle. Non portano nomi. Portano numeri.

Non sentono il dolore come lo sente qualcuno che vuole smettere di sentirlo. Lo ignorano finché possono, poi smettono di usare quello che non funziona più e continuano. Quando cadono non gridano. Il corpo smette e basta.

Il rapporto ufficiale chiama il momento "cessazione funzionale." Nessuno ha proposto un termine diverso.

Una cosa che nessun rapporto registra: nell'istante prima che il processo sia completo, qualcosa nel volto cambia.

---

## Palette HEX — Esecutore Comune

| Zona | Hex |
|---|---|
| Pelle cadaverica (grigio-bluastro) | `#C0C4CC` |
| Ombre pelle | `#8890A0` |
| Occhi vuoti | `#D0D8E0` |
| Capelli corti | `#A0A8B0` |
| Trench coat (dominante) | `#606878` |
| Ombre cappotto | `#3A404A` |
| Cinghie tattiche | `#4A5040` |
| Cintura / fibbie | `#3A3A3A` |
| Stivali | `#282828` |
| Sigillo III (carne) | `#B0A0A0` |
| Sigillo III (rosso) | `#882222` |
| Numero di serie | `#882222` |

**Identità visiva (Comune):** `#606878` (cappotto) + `#C0C4CC` (pelle) + `#882222` (sigillo)

**Esecutore Leader:** cappotto `#3A4050` (più scuro), resto identico al Comune.

---

## Stati visivi — Degradazione funzionale

| Stato | HP | Occhi | Sigillo |
|---|---|---|---|
| Operativo | 100–71% | `#FFFFFF` bianchi attivi | `#882222` luminoso |
| Degrado | 70–41% | un occhio `#FFFFFF` + uno `#222222` | `#882222` |
| Critico | 40–1% | `#222222` entrambi spenti | `#333333` senza energia |
| Collasso | 0% | — | — |

---

## Meccaniche chiave

- Degradazione funzionale: nessun flash al danno, tre soglie visive
- Formazione a slot — leader occupa sempre il fronte
- Ricalibrazione alla morte di un'unità (pausa 600-800ms, slot ridistribuiti)
- Morte silenziosa: nessun suono, nessun blood pool, corpo resta
- Connessione narrativa con Zeryth: lui è "L'Esecutore" singolo e spezzato; loro sono la versione di serie

*Lore e design completo: `docs/lore/nemici/esecutori.md` — spec: `docs/superpowers/specs/2026-05-19-esecutori-design.md`*
