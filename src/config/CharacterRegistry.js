import { Aetherion } from '../characters/Aetherion.js'
import { Korvan }    from '../characters/Korvan.js'
import { Mira }      from '../characters/Mira.js'
import { Damian }    from '../characters/Damian.js'
import { Silas }     from '../characters/Silas.js'
import { Zeryth }    from '../characters/Zeryth.js'
import { Veyra }     from '../characters/Veyra.js'

export const CHARACTER_REGISTRY = [
  {
    id: 'aetherion',
    name: 'AETHERION',
    tagline: 'Melee AOE — alto rischio',
    playstyle: 'Burst di area con self-damage. Strike rapidi a contatto, cono che dissolve i proiettili nemici, burst da 4 secondi che consuma HP ma rebate su ogni kill. HP visibile come barra principale.',
    classRef: Aetherion,
    abilities: {
      LMB: 'Paint Strike — melee 8 dmg, range 25px, CD 300ms',
      RMB: 'Dissolve (hold) — cono 80px ±30°, scioglie proiettili, blocca movimento, CD 4000ms',
      Q:   'Crack/Burst — AOE raggio 60px, 15 dmg/s, self-damage 6 HP/s per 4s; kill = −1s self-damage',
      F:   'Spezza Metallo — AOE 30 dmg su tile METAL adiacente + 3 schegge a cono 15 dmg, CD 6000ms',
    },
    unlockedByDefault: true,
    unlockHint: null,
    accentColor: '#E07828',
    cardImage: 'personaggi/giocabili/aetherion/card.jpg',
  },
  {
    id: 'korvan',
    name: 'KORVAN',
    tagline: 'Tank intercettore — difensivo',
    playstyle: 'Tank con mantella nera e doppia ascia. Si interpone fisicamente tra i nemici e gli alleati. Alone nero potenzia le asce in combattimento. Prioritizza i nemici che minacciano direttamente il team.',
    classRef: Korvan,
    abilities: {
      LMB: 'Doppia ascia — attacco melee con alone nero',
      RMB: 'Intercetta — si interpone fisicamente, assorbe danni al posto di Aetherion',
      Q:   'Alone Combat — alone nero si attiva, potenzia le asce',
      F:   'Ritiro — esce dal campo dopo l\'intervento',
    },
    unlockedByDefault: true,
    unlockHint: null,
    accentColor: '#8a7a6a',
    cardImage: 'personaggi/giocabili/korvan/card.jpg',
  },
  {
    id: 'mira',
    name: 'MIRA',
    tagline: 'Alchimia ambientale — Sintesi Somatica',
    playstyle: 'Manipolazione del terreno tramite trasmutazione alchemica. Ogni abilità richiede materiale disponibile nella stanza. Limitata dalla temperatura dei tatuaggi e dall\'integrità dei guanti. Guanti rotti + fallimento = Rebound fisico.',
    classRef: Mira,
    abilities: {
      LMB: 'Difesa — muro istantaneo o cupola (materiale solido richiesto)',
      RMB: 'Attacco terreno — sabbie mobili (rallenta) o lance di pietra/metallo (danno)',
      Q:   'Riarmo al volo — rimodella oggetto metallico in lancia o scudo (raggio 40px)',
      F:   'Reazione Metamorfica — cambia consistenza superficie (solido → gelatinoso, pietra → fragile)',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#cc8844',
    cardImage: 'personaggi/giocabili/mira/card.jpg',
  },
  {
    id: 'damian',
    name: 'DAMIAN',
    tagline: 'Cambion a fasi — corruzione crescente',
    playstyle: 'Combattente ibrido umano/demone con 6 fasi progressive. La corruzione sale con i danni ricevuti e non scende mai. In Fase 3 l\'ombra attacca da sola. La riserva demoniaca si esaurisce fino allo stato Traumatico.',
    classRef: Damian,
    abilities: {
      LMB: 'Pugno — 15 dmg base, scala fino a 75 dmg in Fase 3, CD 350ms',
      RMB: 'Abilità secondaria per fase — vuoto (Base), Colpo pesante 30 dmg (F1), Shadow Parry (F2), Shadow Lash 40 dmg (F3+)',
      Q:   'Shadow auto-attacco (Fase 2+) — 20 dmg ogni 2s, raggio ricerca 80px',
      F:   'Scala di fase (riserva > 20) — avanza a Fase 1/2/3; ignorato in Fase 3 e Berserk',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#cc5577',
    cardImage: 'personaggi/giocabili/damian/card.jpg',
  },
  {
    id: 'silas',
    name: 'SILAS',
    tagline: 'Ombra del Korvo Nero — eliminazione silenziosa',
    playstyle: 'Stealth nelle zone d\'ombra con sistema temperatura sangue. Pugnalata potenziata in ombra, Backstab dopo Shadow Fusion. A temperatura 0: velocità dimezzata, tutti i poteri disabilitati, prossimo colpo fatale.',
    classRef: Silas,
    abilities: {
      LMB: 'Pugnalata — 12 dmg (18 in ombra); Backstab 36 dmg dopo Shadow Fusion',
      RMB: 'Shadow Bind — immobilizza nemico 2s, −15 temp, raggio 50px, CD 1500ms (solo in ombra)',
      Q:   'Shadow Teleport — max 80px in direzione facing, −25 temp (solo in ombra)',
      F:   'Shadow Fusion — invisibilità toggle, drain −5 temp/s; si chiude al primo attacco (Backstab)',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#4499ee',
    cardImage: 'personaggi/giocabili/silas/card.jpg',
  },
  {
    id: 'zeryth',
    name: 'ZERYTH',
    tagline: 'Erede dei Vettori del Tempo — Broken Second',
    playstyle: 'Sistema di Integrità Corporea al posto degli HP standard: rigenera in movimento (4/s) e da fermo (12/s), ma si blocca su tile LIGHT. Blood Weapons si pagano con l\'integrità. Sotto il 20%: velocità dimezzata.',
    classRef: Zeryth,
    abilities: {
      LMB: 'Strike fisico — 20 dmg, reach 30px, CD 300ms',
      RMB: 'Blood Weapons — tap: proiettile sangue 25 dmg (−8 integrità); hold >400ms: Spada di sangue slash 40 dmg',
      Q:   'Broken Second (SPACE) — pausa tattica, rallenta il mondo all\'8%',
      F:   'Riservato — non ancora implementato',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#7799cc',
    cardImage: 'personaggi/giocabili/zeryth/card.jpg',
  },
  {
    id: 'veyra',
    name: 'VEYRA',
    tagline: 'Ranged + scouting — controllo del campo a distanza',
    playstyle: 'Arco caricabile con focus come risorsa. I corvi esploratori rallentano i nemici nell\'area e ampliano il campo visivo. Dash breve che attiva la visione dal corvo. Bassa HP, alta mobilità informativa — non prima linea.',
    classRef: Veyra,
    abilities: {
      LMB: 'Arco Caricabile — hold 0–1500ms; dmg 15–45, focus cost 0–25, lifetime 1.2s',
      RMB: 'Corvo Attaccante — 22 dmg diretto + AOE 35px (13 dmg), focus 30, CD 1800ms',
      Q:   'Corvo Esploratore — spawn scout raggio 100px, rallenta nemici −45%, durata 8s, max 2, CD 3000ms',
      F:   'Dash + Visione del Corvo — dash 72px; se scout attivo: camera shift 1500ms, CD 2500ms',
    },
    unlockedByDefault: false,
    unlockHint: 'Criterio di sblocco da definire',
    accentColor: '#556677',
    cardImage: 'personaggi/giocabili/veyra/card.jpg',
  },
]

export const getCharacter = (id) => CHARACTER_REGISTRY.find(c => c.id === id)
