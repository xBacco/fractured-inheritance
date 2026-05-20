# Fractured Inheritance — Design Spec
*Browser Roguelite | 2026-05-18*

---

## Concept

Il piano dimensionale su cui poggia questa struttura è fratturato: strati di realtà compressi l'uno sull'altro, sovrapposti senza logica apparente. Il sistema preferisce così. Chi manifesta il potere in modo non riconoscibile è un'aberrazione. Chi lo eredita è una minaccia.

Il giocatore è la minaccia.

Ogni run è un'incursione in un settore del piano: ambienti ostili, nemici da eliminare, potere da accumulare. Il piano non premia la sopravvivenza. Premia la distanza percorsa.

Il piano non si rigenera. Si ricompone.

---

## Personaggi

### Zeryth — Erede dei Vettori del Tempo

Non è nato. È stato creato nelle profondità di Illyrium, attraverso rituali precisi, da una stirpe artificiale concepita per condurre e distorcere flussi temporali e corporei. Ventissei anni apparenti, zero invecchiamento. 1,73m, 69kg. Capelli grigio-bianchi, occhi grigio chiaro con riflessi metallici, iridi leggermente fuori fuoco. Schiena dritta, mani in tasca, sguardo sempre annoiato. Prima di ogni scontro ripiega il cappotto, i guanti, gli strati esterni, con la cura di chi non ha nessuna fretta.

La cicatrice a X sulla schiena è l'unica cosa che non si chiude. Non sa perché. Non ne parla.

**Sistema: Integrità Corporea**
Niente barra salute. Il danno è leggibile visivamente: movimenti che si inceppano, sprite con lacerazioni, animazione compromessa sugli arti colpiti. Sotto soglia critica Zeryth inizia a zoppicare. La rigenerazione è passiva e costante — accelerata in ombra o da fermo. Muore quando l'integrità crolla a zero e la rigenerazione non riesce a compensare il danno in ingresso.

**Abilità:**
- **Strike fisico** — ravvicinato, rapidissimo, nessun costo
- **Proiettile di sangue** — attraversa tutti i nemici in linea retta, costa integrità corporea
- **Spada di sangue** — hold del tasto attacco: il sangue si condensa in una lama. Durata proporzionale all'integrità spesa. Swing ad arco su più nemici. In modalità tattica puoi posizionare il fendente prima di rilasciare il tempo
- **Distorsione locale** — rallenta un'area per pochi secondi, costa mana corporeo
- **Secondo Fratturato (modalità tattica)** — vedi sezione meccaniche core

Giocare Zeryth è giocare a un tempo diverso da quello del piano. Gli ostacoli non scompaiono, diventano lenti.

---

### Damian "Cross" — Cambion (ibrido umano/demone incubo)

1,88m, 93kg. Buzz cut nero corvino. Occhiali da sole con lenti specchiate, sempre indosso. Giacca di pelle nera oversize, camicia sbottonata nera, pantaloni attillati. Anelli su tutte le dita. Testa inclinata, sorriso beffardo. Voce bassa e ironica.

"La magia è per chi ha paura di sporcarsi le mani."

**Sistema: Riserva Demoniaca e Corruzione**
Niente barra salute. Ha una riserva demoniaca visibile come un marchio sulla fronte che pulsa. Subire danno forza la corruzione verso l'alto, spingendo verso fasi superiori anche senza input del giocatore. Il giocatore può scegliere di salire di fase, ma se prende troppo danno la Fase 3 si attiva da sola.

**Fasi — Croce dell'Incubo:**

| Fase | Aspetto | Effetto |
|---|---|---|
| Base | Anelli normali | Attacco corpo a corpo diretto |
| Fase 1 — Risveglio | Tirapugni dentati fumanti, occhi ambrati visibili | +danni fisici, riserva inizia a consumarsi |
| Fase 2 — Demone Minore | Pelle cerea, venature scure, occhi neri, ombra viva | Ombra para i colpi, +velocità |
| Fase 3 — Demone Incubo | Pelle tenebrosa, occhi come fessure ardenti, mani e piedi rossi, tirapugni fluttuanti | Forza x5, rigenerazione accelerata, ombra senziente che attacca da sola |
| Berserk | Tutto rosso/bordò, controlli instabili | Ombra attacca chiunque, inclusi oggetti utili |

**Costo Fase 3:** Al rientro — stato traumatico, nessuna fase disponibile, movimenti lenti fino a recupero parziale della riserva. Contro magie di luce ogni limite si allarga.

Giocare Damian è scommettere su quanto lontano si vuole spingere, sapendo esattamente qual è il prezzo. E scegliere comunque.

---

### Mira — Alchimista di Korvo Nero

20 anni. Umana. Nata nel Quartiere degli Esiliati della Città Libera di Valdris. 1,60m, 50kg. Capelli rosso rame acceso, occhi verde smeraldo. Indossa sempre i goggles, la cintura dell'alchimista carica di fiale, e i guanti alchemici con i cerchi di trasmutazione incisi.

I tatuaggi sulle braccia e sui palmi non sono inchiostro. Sono cicatrici alchemiche — linee conduttrici che contengono tracce di metallo vivo, un circuito permanente che collega il suo nucleo energetico alle mani. Quando esagera, le linee si surriscaldano. Bruciano.

I guanti sono il suo fusibile. Se sbaglia una trasmutazione o accumula troppa energia, si bruciano loro prima delle sue mani. Senza guanti, un errore potrebbe costarle le dita.

**Principio fondante — Scambio Equivalente**
L'alchimia è la scienza di comprensione, scomposizione e ricomposizione della materia. Non è onnipotente. È impossibile creare qualcosa dal nulla. Per ottenere qualcosa serve qualcos'altro dello stesso valore. Gli alchimisti sono scienziati: non credono in nessun Dio o Creatore, rivelano i principi di creazione del mondo e perseguono la verità.

**Sistema: Calore Alchemico**
Niente barra salute. Mira ha un sistema a doppio indicatore visivo:
- **Temperatura dei tatuaggi** — le linee sulle braccia cambiano colore dal bianco al rosso acceso. Al massimo bruciano la pelle: penalità visiva e riduzione temporanea della precisione
- **Integrità dei guanti** — i guanti hanno durabilità. Se si rompono, ogni trasmutazione fallita causa Rebound diretto sul corpo (sanguinamento, perdita temporanea di un senso, svenimento)

Subire danno fisico non riduce una barra — riduce la sua capacità di muoversi e concentrarsi, rendendo le trasmutazioni più lente e meno precise.

**Abilità — Sintesi Somatica**
Batte le mani insieme per attivare la reazione (nessun cerchio necessario grazie ai guanti e ai tatuaggi).

- **Difesa:** tocca una superficie → muro istantaneo o cupola di protezione. Richiede materiale sotto i piedi
- **Attacco terreno:** trasforma il pavimento sotto i nemici in sabbie mobili o fa emergere lance di pietra/metallo
- **Riarmo al volo:** rimodella metallo disponibile (spada rotta, armatura, ringhiera) in lancia o scudo
- **Reazione Metamorfica:** sottomossa della Sintesi — non cambia forma, cambia consistenza o densità. Pavimento solido diventa gelatinoso, muro di pietra diventa fragile come vetro, aria compressa diventa parete solida temporanea
- **Pozioni potenziate:** trasmuta le fiale alla cintura rendendole instabili. Acqua → ghiaccio esplosivo al contatto. Olio → fiamma accelerata. Acido → vapore corrosivo

**Limiti:**
- Senza materiale disponibile non può fare nulla — in stanze spoglie è al minimo della potenza
- Deve toccare fisicamente ciò che trasmuta. Mani legate = senza poteri
- Trasmutare esseri viventi o materiali complessi richiede tempo e concentrazione
- Materiali alieni o sconosciuti richiedono analisi prima dell'uso — contro nemici con equipaggiamento mai visto, la prima reazione potrebbe fallire

**Rebound (Contraccolpo)**
Se forza la natura oltre i limiti dello scambio equivalente — ad esempio cerca di creare energia dal nulla o trasmuta qualcosa di valore superiore al materiale disponibile — il contraccolpo colpisce il suo corpo: sanguinamento, svenimento temporaneo, perdita di un senso per qualche secondo.

Giocare Mira è giocare con ciò che il piano ti dà. Ogni stanza è un laboratorio. Ogni materiale è una risorsa. Ogni errore ha un prezzo fisico.

---

### Silas — Vice dei Korvo Nero

25 anni. Nordico, nato nelle Lande del Nord, concepito nell'Abisso di Khol. Da parte di madre ha ereditato la vista nel buio. 1,82m, 75kg. Capelli nero carbone, lisci e spesso disordinati. Occhi grigio tempesta, iridi chiarissime quasi bianche. Pelle pallida, quasi esangue. Maschera che copre il viso. Tatuaggi rituali. Sempre accovacciato o appoggiato ai muri, sempre in penombra. Parla pochissimo, comunica quasi solo a gesti. È inquietante.

**Sistema: Sangue Congelato**
Niente barra salute. Silas ha un indicatore di **temperatura del sangue** — rappresentato visivamente come un gradiente bluastro sull'outline del personaggio. Ogni uso della Tessitura d'Ombra abbassa la temperatura. Al massimo del gelo: movimenti rallentati, poteri disabilitati, vulnerabilità totale. Si riscalda stando in penombra o in zone d'ombra.

Subire danno fisico diretto è più letale che per gli altri: Silas non può parare colpi pesanti. La sua difesa è non essere dove il colpo arriva.

**Abilità — Tessitura d'Ombra:**
- **Fusione con l'ombra** — in qualsiasi zona shadow diventa invisibile ai nemici. I cacciatori lo ignorano finché non si muove o attacca
- **Teletrasporto d'ombra** — se due zone shadow sono connesse (non interrotte da luce) si sposta istantaneamente dall'una all'altra. Costa temperatura del sangue
- **Ombra vincolante** — proietta la propria ombra su un nemico per immobilizzarlo per qualche secondo. Costa temperatura del sangue
- **Afferrare con l'ombra** — usa l'ombra come arto: raccoglie oggetti a distanza, attiva trappole, sposta elementi della mappa senza avvicinarsi

**Limiti:**
- Tutti i poteri funzionano solo dove c'è ombra. In zona di luce piena è un combattente nordico senza abilità speciali
- Non può trasportare nessuno con sé nel teletrasporto
- Non può creare luce, non può curare, non può parare colpi fisici pesanti

**Sinergia con la mappa:**
Silas è il personaggio che trae più vantaggio dalla mappa. Zone shadow lo potenziano, corridoi stretti sono suoi alleati, il Paladino (porta luce con sé) è il nemico più pericoloso. Distruggere le fonti di luce è una strategia valida.

Giocare Silas è giocare nell'ombra che gli altri non vedono.

---

## Meccaniche Core

### Movimento
WASD per muoversi liberamente. Il personaggio attacca in base alla direzione del movimento o all'ultimo input direzionale. Niente puntamento con il mouse in tempo reale — tutto da tastiera.

### Camera
Zoom in/out libero con rotella del mouse. La camera segue il personaggio. In modalità tattica il mouse si sblocca: puoi scorrere la mappa, passare su nemici/oggetti/terreno per leggerne i dettagli, pianificare prima di riprendere.

### Modalità Tattica (Secondo Fratturato / Sospensione)
Tasto dedicato (es. Spazio). Il gioco rallenta drasticamente — non si ferma del tutto, si scompone. I movimenti nemici diventano leggibili, le traiettorie prevedibili.

- **Zeryth:** costa Mana Corporeo. Esaurito il mana, uscita forzata con debuff temporaneo (corpo stressato, movimenti rallentati).
- **Damian:** non può usare la modalità tattica in Fase 3.

Il punteggio finale registra i secondi totali in modalità tattica. Meno la usi, più alto il moltiplicatore finale.

### Fazioni nemiche

**Ordini Religiosi** — presidiano il piano, mandato di purificazione. Vogliono che il potere torni controllabile. Non ufficialmente: hanno paura.

**Cacciatori** — professionisti. Studiano i bersagli, imparano i pattern, arrivano preparati. Il problema è che Zeryth, Damian e Mira non hanno pattern nel senso in cui i cacciatori sono addestrati a leggerli.

**Creature dei Piani Intermedi** — nessuna fazione, nessuna distinzione tra bersagli e spettatori. Trattano i due ereditieri esattamente come trattano tutto il resto.

**Tipi di nemici base:**

| Nemico | Comportamento |
|---|---|
| Cacciatore comune | Corpo a corpo, aggressivo, poco strategico |
| Arciere sacro | Distanza, evita il corpo a corpo, cerca la luce |
| Paladino | Lento, resistente, porta una fonte di luce con sé |
| Esorcista | Blocca temporaneamente i poteri del giocatore se colpisce |

---

## Mappa e Terreno

**Generazione procedurale** con algoritmo BSP (Binary Space Partitioning): divide lo spazio in rettangoli, crea stanze, le collega con corridoi. Ogni run ha una planimetria diversa ma sempre leggibile. Narrativamente: il piano si ricompone, non si rigenera.

**Tile types:**

| Tile | Effetto |
|---|---|
| Ombra / zona buia | Zeryth: rigenerazione accelerata, riduzione danni. Nemici: visibilità ridotta |
| Zona di luce | Cacciatori: +danni, +velocità. Rigenerazione bloccata per entrambi i personaggi |
| Corridoio stretto | Nemici non possono affiancarsi — vantaggio tattico |
| Altare | Spendi essenza per sbloccare abilità/oggetti in-run |
| Trappola | Danno a chiunque, incluso il giocatore. Zeryth può attivarla intenzionalmente |
| Muro distruttibile | Damian in Fase 3 può sfondarlo. Mira può indebolirlo con Reazione Metamorfica |
| Pozza di sangue | Lasciata da nemici eliminati — Zeryth può assorbirla per recuperare integrità |
| Superficie metallica | Mira può rimodellarla in arma o scudo al volo |
| Deposito materiali | Mira: +risorse disponibili per trasmutazioni. Zeryth: pozze di sangue garantite |
| Stanza spoglia | Svantaggia Mira (nessun materiale). Vantaggio per Zeryth e Damian |

**Struttura della run:** la mappa ha piani. Ogni piano è più difficile. Tra un piano e l'altro c'è una stanza di transizione: scegli tra 3 opzioni (oggetto, abilità, recupero).

---

## Progressione

### In-run: Essenza e Altari
Eliminare nemici e attraversare piani genera Essenza. Agli altari sparsi nella mappa la spendi per sbloccare abilità o oggetti per quella run. Ogni altare offre 3 opzioni tra quelle già sbloccate nella meta-progressione.

### Meta-progressione: Missioni
Tra una run e l'altra, una schermata hub mostra le missioni attive. Completare missioni sblocca nuovi oggetti e abilità che entrano nel pool degli altari delle run future.

Esempi di missioni:
- "Attraversa 3 piani senza usare la modalità tattica" → abilità passiva Zeryth
- "Elimina un Paladino in Fase 1 con Damian" → tirapugni potenziati
- "Sopravvivi 60 secondi in una zona di luce" → oggetto difensivo

All'inizio di ogni run puoi scegliere un oggetto di partenza tra quelli sbloccati.

### Classifica online
Punteggio = piani attraversati × moltiplicatore nemici eliminati × penalità modalità tattica.

Le run dei tre personaggi sono classificate separatamente (Zeryth / Damian / Mira). Il nome del personaggio compare in classifica.

---

## Stack Tecnico

| Componente | Scelta | Motivazione |
|---|---|---|
| Framework gioco | Phaser.js | Camera zoom nativa, tilemap, input, game loop |
| Mappa procedurale | BSP a runtime | Stanze diverse ogni run, nessun file esterno |
| Linguaggio | JavaScript | Niente setup complesso, gira diretto nel browser |
| Leaderboard backend | Supabase (free tier) | REST API semplice, niente server da gestire |
| Build/dev | Vite | Dev server veloce, bundle per produzione in un comando |
| Asset visivi | Pixel art procedurale + Canvas | Niente sprite sheet necessari nella fase iniziale |

**Note implementative:**
- Zoom camera: `this.cameras.main.zoom` con tween per smoothness
- Pausa tattica: `this.physics.world.pause()` + sblocco input mouse
- Proiettile penetrante: group overlap senza destroy on hit
- Spada di sangue: collider temporaneo con durata calcolata sull'integrità consumata
- Mappa BSP: generazione a runtime al caricamento di ogni piano

---

## Aperto / Da definire
- Numero massimo di piani per run
- Pool iniziale di oggetti/abilità disponibili prima delle missioni
- Sistema audio (musica ambientale, effetti sonori)
- Schermata di game over e visualizzazione punteggio
- Autenticazione per la classifica (nickname libero vs account)
