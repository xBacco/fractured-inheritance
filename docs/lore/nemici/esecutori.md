# Esecutori di Illyrium — Soldati del Vuoto

**Sottotitolo:** *Cessazione Funzionale*
**Ruolo nel codice:** `HunterCommon`
**Visual reference:** `personaggi/nemici/esecutore.jpg`

---

Non sono nati. Sono stati fatti.

Illyrium prende quello che la guerra lascia — prigionieri senza valore di scambio, caduti senza famiglia, qualcuno che ha firmato qualcosa senza leggere bene. Il processo dura tre giorni. Quello che entra esce in piedi. Quello che non esce è tutto il resto.

Si riconoscono subito. La postura è sbagliata, troppo dritta, come se qualcuno avesse misurato ogni articolazione invece di lasciarla crescere storta come cresce quella di tutti. Le uniformi grigio-acciaio sono identiche. Il sigillo di Illyrium non è dipinto sul petto — è inciso. Nella pelle. Non portano nomi. Portano numeri. Nei primi anni del programma qualcuno ha provato a dargliene uno. Hanno smesso quando hanno capito che non si giravano.

Non sentono il dolore come lo sente qualcuno che vuole smettere di sentirlo. Lo ignorano finché possono, poi smettono di usare quello che non funziona più e continuano. Quando cadono non gridano. Il corpo smette e basta.

I muscoli ricordano ancora come si tiene un'arma. Come si avanza in formazione. Come ci si muove nel buio senza fare rumore. Era già lì prima del processo, quella roba — Illyrium non sa ancora come toglierla. Ci sta lavorando.

Muoiono come si spegne una macchina. Il rapporto ufficiale chiama il momento "cessazione funzionale." Nessuno ha proposto un termine diverso.

Una cosa che nessun rapporto registra: nell'istante prima che il processo sia completo — un secondo, forse meno — qualcosa nel volto cambia.

Chi li costruisce dice che è residuo neurologico, scarica finale, niente.

Chi era nell'altra stanza in quel momento non è mai riuscito a spiegarlo bene.

---

## Aspetto

Altezza nella media, peso nella media. Niente fuori posto — è questo il problema.

Il cappotto militare è grigio-acciaio, lungo fino al ginocchio, chiuso con precisione. Non ha strappi. Non ha macchie. Non perché sia nuovo — perché viene tenuto così. Il petto è aperto: una sezione del cappotto e della camicia sono tagliate via con cura, esponendo il torace. Non è una ferita. È intenzionale. Il sigillo di Illyrium è inciso direttamente nella pelle — un ottagono con il numerale romano III al centro. Non è in rilievo come una cicatrice. È incavato, come intagliato nel legno. La pelle intorno è guarita.

Il viso è normale. Capelli corti o rasati, lineamenti regolari, nessuna espressione fissa. Gli occhi sono bianchi — l'iride è sparita, o è diventata della stessa tinta della sclera. Guardano comunque. Seguono comunque.

La postura è il dettaglio che non si riesce a ignorare. Dritta in modo sbagliato — non militare nel senso di qualcuno che ha imparato a stare sull'attenti, ma calibrata, come se ogni vertebra fosse stata posizionata singolarmente. Nessuno sta così. Neanche chi ci prova.

Le mani sono pulite. Le armi vengono tenute con la stessa cura del cappotto. Non le stringono. Le tengono.

Quando si muovono in gruppo non c'è comunicazione visibile. Nessun segnale, nessun gesto, nessun contatto visivo tra loro. Si ridistribuiscono, si affiancano, cambiano angolazione — senza parlare. Il coordinamento sembra già avvenuto altrove, prima.

Quando cadono, cadono dritti. Il corpo non cerca di attutire il colpo. Smette di stare in piedi e si appoggia al pavimento nel modo più diretto possibile.

Il numero di serie è sul collo, lato destro: EC seguito da due cifre. Stampigliato, non inciso. Come un codice di produzione.

---

## Meccaniche di gameplay

**Spec completa:** `docs/superpowers/specs/2026-05-19-esecutori-design.md`

- Sistema di degradazione funzionale: nessun flash al danno, tre soglie visive (un occhio si spegne a metà, sigillo si spegne al critico), collasso di colpo a zero
- Formazione a slot attorno al giocatore — il leader occupa sempre il fronte
- Ricalibrazione alla morte di un'unità (pausa 600-800ms, slot ridistribuiti)
- Morte silenziosa: nessun suono, nessun blood pool, corpo resta
- Connessione con Zeryth: lui è "L'Esecutore" singolo e spezzato; loro sono la versione di serie

**Varianti:** `EsecutoreComune` (grigio-acciaio `0x5a6070`) + `EsecutoreLeader` (grigio scuro `0x3a4050`, più grande, sigillo I, stats maggiorate)

### Palette HEX ufficiale — Esecutore Comune

| Zona | Hex |
|---|---|
| Pelle cadaverica (grigio-bluastro) | `#C0C4CC` |
| Ombre pelle | `#8890A0` |
| Occhi vuoti | `#D0D8E0` |
| Capelli corti | `#A0A8B0` |
| Trench coat (dominante) | `#606878` |
| Ombre cappotto | `#3A404A` |
| Cinghie tattiche | `#4A5040` |
| Cintura/fibbie | `#3A3A3A` |
| Stivali | `#282828` |
| Sigillo III (carne) | `#B0A0A0` |
| Sigillo III (rosso) | `#882222` |
| Numero di serie | `#882222` |

**Identità visiva:** `#606878` (cappotto) + `#C0C4CC` (pelle) + `#882222` (sigillo)

### Palette HEX ufficiale — Esecutore Leader

Variante del Comune — stesse proporzioni, differenze chiave:

| Zona | Hex | Differenza |
|---|---|---|
| Trench coat | `#3A4050` | Più scuro vs Comune `#606878` |
| Ombre cappotto | `#252A35` | |
| Pelle, cinghie, stivali | (identica al Comune) | |

**Stati visivi (degradazione):**

| Stato | HP | Occhi | Sigillo |
|---|---|---|---|
| Operativo | 100–71% | `#FFFFFF` (bianchi attivi) | `#882222` (luminoso) |
| Degrado | 70–41% | un occhio `#FFFFFF` + uno `#222222` | `#882222` |
| Critico | 40–1% | `#222222` (entrambi spenti) | `#333333` (senza energia) |
| Collasso | 0% | — | — |

**Identità visiva vs Comune:** `#3A4050` vs `#606878` (più scuro, stessa famiglia cromatica)
