export type TourAudience = "hq" | "store" | "vendor";

export type TourSide = "top" | "right" | "bottom" | "left";

export type TourStepDef = {
  id: string;
  /** CSS selector (`[data-tour=…]`). Se assente → popover centrato. */
  element?: string;
  title: string;
  description: string;
  /** Naviga qui prima di mostrare lo step (se diverso dalla route attuale). */
  route?: string;
  side?: TourSide;
  align?: "start" | "center" | "end";
};

/** Tutorial completo — copy operativo IT, ancore sui contenuti di pagina. */
export function stepsForAudience(audience: TourAudience): TourStepDef[] {
  if (audience === "store") return storeSteps();
  if (audience === "vendor") return vendorSteps();
  return hqSteps();
}

function hqSteps(): TourStepDef[] {
  return [
    {
      id: "hq.welcome",
      element: "[data-tour='shell.hq']",
      side: "right",
      title: "Benvenuto in FacilityFlow HQ",
      description:
        "Questa è la console della rete (punti vendita e fornitori). A sinistra trovi il menu principale; in alto breadcrumb, notifiche e, nel menu laterale in basso, «Tutorial interattivo» (icona Aiuto) e «Spiega questa pagina». Puoi rilanciare il giro in qualsiasi momento da lì. FacilityFlow è il System of Record: stato ticket, SLA e costi vivono qui — non su WhatsApp o fogli Excel.",
    },
    {
      id: "hq.onboarding",
      route: "/onboarding",
      element: "[data-tour='hq.onboarding']",
      side: "bottom",
      title: "Checklist di avvio rete",
      description:
        "Prima di usare la dashboard operativa completa la checklist (o «Salta per ora»): store, fornitori, SLA e invito store manager. Finché la rete non è pronta, FacilityFlow ti riporta qui se apri la dashboard — è voluto, non un errore.",
    },
    {
      id: "hq.dashboard",
      route: "/app/dashboard",
      element: "[data-tour='page.dashboard.root']",
      side: "bottom",
      title: "Dashboard operativa",
      description:
        "Qui hai la fotografia della giornata: quanti ticket sono aperti, quali hanno superato lo SLA (breach), quali sono a rischio, un MTTR grezzo e i costi del periodo. Serve al Facility Manager per capire dove intervenire prima di aprire le liste.",
    },
    {
      id: "hq.dashboard.kpi",
      route: "/app/dashboard",
      element: "[data-tour='page.dashboard.kpi']",
      side: "bottom",
      title: "Indicatori KPI",
      description:
        "Ogni card è cliccabile solo a livello informativo: «Aperti» sono i ticket ancora in lavorazione; «SLA superati» sono breach già registrati dal sistema; «A rischio» sono vicini alla scadenza. I costi aggregati usano gli importi effettivi (o stimati) dei ticket chiusi/verificati nel periodo selezionato.",
    },
    {
      id: "hq.dashboard.byStore",
      route: "/app/dashboard",
      element: "[data-tour='page.dashboard.byStore']",
      side: "top",
      title: "Dettaglio per punto vendita",
      description:
        "La tabella spezza i KPI per store: utile per vedere quale PV genera più ticket o costi. Se la rete è appena onboarding e non ci sono ancora dati, vedrai uno stato vuoto con il link per aprire un ticket di prova.",
    },
    {
      id: "hq.tickets",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.root']",
      side: "bottom",
      title: "Lista ticket — il cuore del triage",
      description:
        "Da qui l’HQ fa triage: apri i ticket, filtra, assegna fornitori, monitora lo SLA. È la coda operativa quotidiana. Il pulsante «Nuovo ticket» serve per aperture manuali HQ; di solito gli store usano Segnala o il form store.",
    },
    {
      id: "hq.tickets.filters",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.filters']",
      side: "bottom",
      title: "Filtri di triage",
      description:
        "Filtra per stato (aperto, assegnato, in corso…), priorità, punto vendita, fornitore e rischio SLA (in ritardo / in scadenza). Dopo aver scelto i valori, premi Filtra. «Reimposta» toglie tutti i criteri. I badge SLA in tabella ti dicono a colpo d’occhio se sei in tempo o in breach.",
    },
    {
      id: "hq.tickets.table",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.table']",
      side: "top",
      title: "Tabella ticket",
      description:
        "Ogni riga è un ticket: categoria, store, priorità, stato, vendor e SLA. Usa le icone a destra per aprire il dettaglio o le azioni rapide. Nel dettaglio trovi tab (panoramica, lavoro, costi, timeline), assegnazione vendor, costi e assist AI (riassunto / bozze) — sempre con conferma umana prima di scrivere sul SoR.",
    },
    {
      id: "hq.stores",
      route: "/app/stores",
      element: "[data-tour='page.stores.root']",
      side: "bottom",
      title: "Punti vendita",
      description:
        "Anagrafica dei PV della rete: crea, modifica, archivia. Puoi importare un CSV per il pilota 15 store. Su ogni store puoi impostare canali push (webhook/ntfy) per avvisare il punto vendita quando nasce o cambia un ticket — senza WhatsApp Business a pagamento.",
    },
    {
      id: "hq.vendors",
      route: "/app/vendors",
      element: "[data-tour='page.vendors.root']",
      side: "bottom",
      title: "Fornitori",
      description:
        "Elenco vendor del tenant: email di contatto, categorie coperte (frigo, HVAC, casse…) e collegamento agli store. La copertura guida i suggerimenti di assegnazione. Dalla scorecard vendor vedi MTTR, rispetto SLA e costi — utile per confrontare chi performa meglio.",
    },
    {
      id: "hq.assets",
      route: "/app/assets",
      element: "[data-tour='page.assets.root']",
      side: "bottom",
      title: "Asset / impianti",
      description:
        "Registro leggero degli asset (banchi frigo, unità HVAC, porte…). Collega un asset a un ticket per tracciare cosa si è rotto. Non è un CMMS con magazzino pezzi: resta sul wedge retail intake + ticket + costi.",
    },
    {
      id: "hq.contracts",
      route: "/app/contratti",
      element: "[data-tour='page.contracts.root']",
      side: "bottom",
      title: "Contratti di manutenzione",
      description:
        "Qui gestisci i contratti con i fornitori (periodo, fee, note). Si collegano al calendario PM per le visite programmate. In «Contratto vs misurato» confronti le visite attese con quelle effettivamente completate nel periodo.",
    },
    {
      id: "hq.calendar",
      route: "/app/calendario",
      element: "[data-tour='page.calendar.root']",
      side: "bottom",
      title: "Calendario preventive (PM)",
      description:
        "Vista stile Google Calendar: Giorno (colonna oraria), Settimana, Mese e Agenda. Clicca su uno slot per creare una visita ancorata al click; clicca un evento per completarlo, annullarlo o aprire un ticket collegato. Le ricorrenze (settimanale/mensile/…) espandono le visite automaticamente.",
    },
    {
      id: "hq.rfq",
      route: "/app/rfq",
      element: "[data-tour='page.rfq.root']",
      side: "bottom",
      title: "RFQ — richieste di preventivo",
      description:
        "Quando serve confrontare più fornitori senza marketplace esterno: crei una RFQ, inviti i vendor, loro rispondono dal portale, tu assegni (award) e puoi far nascere/aggiornare il ticket con il costo stimato. Nessun escrow né pagamento in piattaforma.",
    },
    {
      id: "hq.chargeback",
      route: "/app/finance/chargeback",
      element: "[data-tour='page.chargeback.root']",
      side: "bottom",
      title: "Chargeback costi per PV",
      description:
        "Riparto dei costi stimati ed effettivi aggregati per punto vendita nel periodo (default 30 giorni). Esporta CSV per la contabilità o il riparto franchise — senza fogli Excel sparsi. Ideale per viewer finance e HQ.",
    },
    {
      id: "hq.wallboard",
      route: "/app/wallboard",
      element: "[data-tour='hq.wallboard']",
      side: "bottom",
      title: "Wallboard / modalità TV",
      description:
        "Vista a tutto schermo dei ticket aperti e in breach, con aggiornamento automatico ogni 30 secondi. Utile su un monitor in HQ o in magazzino: nessuno deve aggiornare la pagina a mano.",
    },
    {
      id: "hq.settings",
      route: "/app/settings/locale",
      element: "[data-tour='page.settings.locale']",
      side: "bottom",
      title: "Lingua e formato",
      description:
        "Imposta lingua UI (IT/EN), valuta e formato date del tenant. Le email e le etichette seguono queste preferenze. Da Membri invita store manager e vendor; da Audit vedi le modifiche di configurazione sensibili.",
    },
    {
      id: "hq.ai",
      route: "/app/settings/ai",
      element: "[data-tour='hq.settings.ai']",
      side: "bottom",
      title: "Assistenza AI (locale o cloud)",
      description:
        "L’AI suggerisce categoria, priorità, riassunti e bozze messaggio — mai scrive da sola sul ticket. Di default usa il vLLM sul tuo PC (OpenAI-compatible). «Test connessione» verifica che il modello risponda. Conferma sempre tu prima di applicare un suggerimento.",
    },
    {
      id: "hq.flussoA",
      title: "Flusso A — dal guasto alla verifica",
      description:
        "1) Lo store segnala (Segnala o nuovo ticket). 2) L’HQ fa triage, assegna priorità/SLA e il vendor. 3) Il vendor lavora dal portale e segna done. 4) Lo store verifica la chiusura. Se lo SLA scade, il sistema registra il breach e puoi usare il playbook di rilancio. Tutto resta tracciato in FacilityFlow: è questo che sostituisce la chat sparsa su WhatsApp.",
    },
  ];
}

function storeSteps(): TourStepDef[] {
  return [
    {
      id: "store.welcome",
      element: "[data-tour='shell.phone']",
      side: "top",
      title: "App punto vendita",
      description:
        "Interfaccia pensata per il telefono in negozio. In basso hai quattro tab: Ticket, Segnala, Nuovo ticket e Lingua. In alto trovi notifiche e «Aiuto» per rilanciare questo tutorial. Non serve un PC in ufficio per aprire un guasto.",
    },
    {
      id: "store.tickets",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.root']",
      side: "bottom",
      title: "I ticket del tuo store",
      description:
        "Vedi solo i ticket del tuo punto vendita: aperti, in corso, da verificare. Quando un vendor marca «completato», entra qui e conferma che l’impianto funziona di nuovo (verifica) oppure rifiuta con motivo — il ticket torna in lavorazione.",
    },
    {
      id: "store.segnala",
      route: "/app/segnala",
      element: "[data-tour='page.segnala.root']",
      side: "bottom",
      title: "Segnala un guasto (intake)",
      description:
        "Flusso guidato passo-passo, simile a una chat: scegli o conferma lo store, descrivi il problema, eventuale categoria/priorità, allega foto se serve. In pochi tap crei un ticket nel SoR invece di un messaggio WhatsApp che poi si perde.",
    },
    {
      id: "store.new",
      route: "/app/tickets/new",
      element: "[data-tour='page.tickets.new']",
      side: "bottom",
      title: "Form nuovo ticket",
      description:
        "Alternativa al flusso Segnala: tutti i campi in una pagina (descrizione, categoria, priorità, asset). Usa questa via se preferisci compilare tutto insieme. L’HQ riceve il ticket e parte lo SLA secondo le policy del tenant.",
    },
    {
      id: "store.locale",
      route: "/app/settings/locale",
      element: "[data-tour='page.settings.locale']",
      side: "bottom",
      title: "Lingua e preferenze",
      description:
        "Se lavori in inglese o vuoi date/valuta diverse, aggiornale qui. Vale per le etichette che vedi sullo schermo; le regole SLA e i permessi restano quelli dell’HQ.",
    },
    {
      id: "store.flussoA",
      title: "Cosa succede dopo la segnalazione",
      description:
        "Tu segnali → l’HQ assegna un fornitore → il fornitore interviene e chiude → tu verifichi. Se qualcosa non torna, rifiuti la verifica e il lavoro riparte. Non cancellare la cronologia su chat esterne: lo storico ufficiale è in questi ticket.",
    },
  ];
}

function vendorSteps(): TourStepDef[] {
  return [
    {
      id: "vendor.welcome",
      element: "[data-tour='shell.phone']",
      side: "top",
      title: "Portale fornitore",
      description:
        "Qui vedi solo ciò che l’HQ ti ha assegnato: ticket da lavorare e richieste di preventivo (RFQ). Non hai accesso alla dashboard della rete intera. Usa «Aiuto» in alto per rivedere questo tutorial.",
    },
    {
      id: "vendor.inbox",
      route: "/vendor/inbox",
      element: "[data-tour='page.vendor.inbox']",
      side: "bottom",
      title: "Inbox interventi",
      description:
        "Elenco dei ticket assegnati a te. Aprine uno per leggere descrizione, store, priorità e SLA. Aggiorna lo stato (in corso → completato), aggiungi note e report di chiusura. Quando segni done, lo store dovrà verificare.",
    },
    {
      id: "vendor.rfq",
      route: "/vendor/rfq",
      element: "[data-tour='page.vendor.rfq']",
      side: "bottom",
      title: "RFQ — i tuoi preventivi",
      description:
        "Quando l’HQ chiede un preventivo a più fornitori, compare qui. Apri la richiesta, inserisci importo e note, invia. Se vinci l’award, tipicamente ti arriverà anche il ticket collegato in Inbox.",
    },
    {
      id: "vendor.flussoA",
      title: "Come lavorare un ticket",
      description:
        "Apri → conferma di aver preso in carico (passa in corso) → esegui l’intervento → completa con eventuale report. Rispetta lo SLA mostrato: un ritardo genera breach lato HQ. Non chiudere «a voce» su WhatsApp: senza done + verify il ticket resta aperto nel SoR.",
    },
  ];
}

/** Capitolo «Spiega questa pagina»: step della route corrente + contesto vicino. */
export function chapterForPath(
  audience: TourAudience,
  pathname: string,
): TourStepDef[] {
  const all = stepsForAudience(audience);
  const onPage = all.filter(
    (s) =>
      s.route &&
      (pathname === s.route || pathname.startsWith(`${s.route}/`)),
  );
  if (onPage.length > 0) return onPage;
  const welcome = all.find((s) => s.id.endsWith(".welcome"));
  return welcome ? [welcome] : all.slice(0, 1);
}
