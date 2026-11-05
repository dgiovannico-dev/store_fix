import type { Locale } from "@/i18n";

export type TourStepCopy = { title: string; description: string };

const it: Record<string, TourStepCopy> = {
  "hq.welcome": {
    title: "Benvenuto in FacilityFlow HQ",
    description:
      "Questa è la console della rete (punti vendita e fornitori). A sinistra trovi il menu principale; in alto breadcrumb e notifiche; in basso nel menu laterale «Tutorial interattivo» e «Spiega questa pagina». Puoi rilanciare il giro in qualsiasi momento. FacilityFlow è il System of Record: stato ticket, SLA e costi vivono qui — non su WhatsApp o fogli Excel.",
  },
  "hq.shell.nav": {
    title: "Menu delle sezioni",
    description:
      "Ogni voce apre un’area operativa: Dashboard, Ticket, Store, Fornitori, Asset, Contratti, Calendario, Costi, Wallboard, RFQ e Impostazioni. Segui l’ordine del menu: è lo stesso percorso di questo tutorial. Clicca una voce quando vuoi approfondire fuori dal giro guidato.",
  },
  "hq.shell.help": {
    title: "Aiuto sempre a portata",
    description:
      "Da qui riavvii il tutorial completo o usi «Spiega questa pagina» per il solo capitolo della schermata attuale. Utile in demo commerciale o quando un collega nuovo entra in un’area specifica. Scorciatoia: tasto ? (fuori dai campi di testo).",
  },
  "hq.shell.trust": {
    title: "Fiducia e conformità",
    description:
      "Questa riga ricorda che i dati restano self-host / UE, con audit e AI solo in assist + conferma umana. È il messaggio da mostrare a DPO e direzione IT quando chiedono «dove stanno i dati?» — senza SaaS a pagamento nel path critico.",
  },
  "hq.onboarding": {
    title: "Checklist di avvio rete",
    description:
      "Prima di usare la dashboard operativa completa la checklist (o «Salta per ora»): store, fornitori, SLA e invito store manager. Finché la rete non è pronta, FacilityFlow ti riporta qui se apri la dashboard — è voluto, non un errore. Il tutorial prodotto (questo giro) è diverso dalla checklist: spiega i flussi, non sostituisce il setup.",
  },
  "hq.dashboard": {
    title: "Dashboard operativa",
    description:
      "Qui hai la fotografia della giornata: ticket aperti, SLA superati (breach), a rischio, MTTR grezzo e costi del periodo. Serve al Facility Manager per capire dove intervenire prima di aprire le liste. Se la rete è appena avviata e non ci sono dati, usa il CTA per un ticket di prova.",
  },
  "hq.dashboard.kpi": {
    title: "Indicatori KPI",
    description:
      "«Aperti» = ticket ancora in lavorazione; «SLA superati» = breach già registrati; «A rischio» = vicini alla scadenza. I costi aggregati usano importi effettivi (o stimati) dei ticket chiusi/verificati nel periodo. Non sono solo numeri: ti dicono dove aprire la coda ticket.",
  },
  "hq.dashboard.byStore": {
    title: "Dettaglio per punto vendita",
    description:
      "La tabella spezza i KPI per store: quale PV genera più ticket o costi. Confrontala con il chargeback finance per il riparto franchise. Stato vuoto = rete ancora senza volume operativo.",
  },
  "hq.tickets": {
    title: "Lista ticket — triage",
    description:
      "Coda operativa quotidiana dell’HQ: apri, filtra, assegna fornitori, monitora lo SLA. «Nuovo ticket» serve per aperture manuali HQ; di solito gli store usano Segnala. Tutto ciò che non passa da qui resta fuori dal SoR.",
  },
  "hq.tickets.filters": {
    title: "Filtri di triage",
    description:
      "Filtra per stato, priorità, punto vendita, fornitore e rischio SLA (in ritardo / in scadenza). Premi Filtra dopo le scelte; Reimposta toglie i criteri. I badge SLA in tabella dicono subito se sei in tempo o in breach.",
  },
  "hq.tickets.table": {
    title: "Tabella ticket",
    description:
      "Ogni riga: categoria, store, priorità, stato, vendor e SLA. Le icone a destra aprono dettaglio o azioni rapide. Nel dettaglio trovi tab (panoramica, lavoro, costi, timeline), assegnazione, costi e assist AI — sempre con conferma umana prima di scrivere sul SoR.",
  },
  "hq.tickets.newCta": {
    title: "Apri un ticket da HQ",
    description:
      "Usa questo pulsante quando l’HQ apre un intervento per conto dello store (es. chiamata telefonica). Preferisci comunque che lo store segnali da app: così ownership e foto restano sul PV corretto.",
  },
  "hq.tickets.new": {
    title: "Form nuovo ticket",
    description:
      "Compila store, descrizione, categoria, priorità e asset se noto. All’invio nasce il ticket in stato aperto e parte lo SLA secondo le policy del tenant. Allegati (foto) aiutano il vendor senza passare da chat esterne.",
  },
  "hq.tickets.detail": {
    title: "Dentro un ticket",
    description:
      "Apri una riga per lavorare il caso: assegna o cambia vendor, aggiorna stato, registra costi stimati/effettivi, invita SM/vendor, usa il playbook se c’è breach, chiedi un riassunto AI (sola lettura finché non confermi). La timeline è la prova per audit e dispute.",
  },
  "hq.stores": {
    title: "Punti vendita",
    description:
      "Anagrafica dei PV: crea, modifica, archivia. Su ogni store puoi impostare webhook/ntfy per avvisare il punto vendita quando nasce o cambia un ticket — senza WhatsApp Business a pagamento. Lo store manager vede solo i ticket del suo PV.",
  },
  "hq.stores.actions": {
    title: "Crea o importa store",
    description:
      "Il form crea un PV singolo (nome, città, indirizzo, canali push). «Import CSV» carica il pilota 15 store in blocco. Completa anagrafica prima di invitare gli store manager: altrimenti non sanno a quale PV associarsi.",
  },
  "hq.vendors": {
    title: "Fornitori",
    description:
      "Elenco vendor del tenant: email, mestieri (frigo, HVAC, casse…) e copertura store. La copertura guida i suggerimenti di assegnazione. Senza vendor coperto, il triage HQ rallenta e si torna a telefonate sparse.",
  },
  "hq.vendors.scorecard": {
    title: "Scorecard fornitori",
    description:
      "Confronta MTTR, rispetto SLA e costi tra vendor nel periodo. Usala in review trimestrali o prima di rinnovare un contratto. Non è un marketplace: resti tu a decidere; i numeri evitano discussioni «a sensazione».",
  },
  "hq.assets": {
    title: "Asset / impianti",
    description:
      "Registro leggero (banchi frigo, HVAC, porte…). Collega un asset al ticket per sapere cosa si è rotto e quanti interventi ha subito. Non è un CMMS con magazzino pezzi: resta sul wedge retail intake + ticket + costi.",
  },
  "hq.contracts": {
    title: "Contratti di manutenzione",
    description:
      "Contratti con i fornitori (periodo, fee, note) collegati al calendario PM. Filtra in scadenza vs tutti. Archiviarne uno non cancella lo storico ticket: serve a chiudere il ciclo commerciale senza perdere traccia operativa.",
  },
  "hq.contracts.performance": {
    title: "Contratto vs misurato",
    description:
      "Confronta visite PM attese e completate (finestra tipica 90 giorni). Se «dovute» >> «fatte», hai un gap da escalation col vendor o da ricalibrazione del piano. Meglio di un foglio Excel aggiornato a mano.",
  },
  "hq.calendar": {
    title: "Calendario preventive (PM)",
    description:
      "Visite programmate stile Google Calendar. Clicca uno slot per creare una visita ancorata; clicca un evento per completarlo, annullarlo o aprire il ticket collegato. Le ricorrenze espandono le visite automaticamente.",
  },
  "hq.calendar.views": {
    title: "Giorno, settimana, mese",
    description:
      "Cambia vista in alto: Giorno (colonna oraria), Settimana o Mese. Usa Giorno per densità operativa, Mese per pianificazione rete. Agenda/elenco resta utile per scadenze senza griglia.",
  },
  "hq.rfq": {
    title: "RFQ — richieste di preventivo",
    description:
      "Confronta più fornitori senza marketplace esterno: crei una RFQ, inviti i vendor, ricevono dal portale, tu fai award e puoi aggiornare il ticket col costo stimato. Nessun escrow né pagamento in piattaforma.",
  },
  "hq.rfq.new": {
    title: "Crea una RFQ",
    description:
      "Titolo, dettaglio, vendor invitati e opz. ticket collegato. Invia: i fornitori rispondono dal portale. Award = scegli l’offerta vincente; il costo stimato può entrare nel ticket senza ricopiare email.",
  },
  "hq.chargeback": {
    title: "Chargeback costi per PV",
    description:
      "Riparto costi stimati ed effettivi per punto vendita (default 30 giorni). Esporta CSV per contabilità o riparto franchise. Ideale per viewer finance e HQ — un’unica fonte invece di fogli sparsi.",
  },
  "hq.chargeback.share": {
    title: "Condividi col CFO",
    description:
      "Invia il riepilogo chargeback per email (link + sintesi) al referente finance. Evita allegati Excel versionati. L’export CSV resta disponibile a fianco per chi lavora offline.",
  },
  "hq.wallboard": {
    title: "Wallboard / modalità TV",
    description:
      "Vista a tutto schermo di ticket aperti e in breach, refresh automatico ogni 30 secondi. Ideale su monitor in HQ o magazzino: nessuno aggiorna la pagina a mano durante il briefing.",
  },
  "hq.wallboard.qr": {
    title: "QR verso i ticket",
    description:
      "Inquadra il QR dal telefono per aprire la lista ticket in app (utile in sala operativa). Stesso SoR, niente URL dettati a voce. Se il QR non compare subito, attendi un attimo il render.",
  },
  "hq.settings": {
    title: "Lingua e formato",
    description:
      "Lingua UI (IT/EN), valuta e formato date del tenant. Email ed etichette seguono queste preferenze. Da qui passi a Membri (inviti) e Audit (log) per chiudere il cerchio admin.",
  },
  "hq.settings.members": {
    title: "Membri e inviti",
    description:
      "Invita store manager, staff e vendor con il ruolo giusto. Lo scope store limita cosa vede lo SM; il vendor vede solo ciò che gli assegni. Disattiva membership invece di «cancellare» utenti: resta traccia audit.",
  },
  "hq.settings.audit": {
    title: "Audit e export DPO",
    description:
      "Eventi append-only su membership/ruoli (owner/admin). Esporta JSON o CSV per il DPO. Non sostituisce log infrastruttura: è la prova di «chi ha cambiato i permessi» nel prodotto.",
  },
  "hq.ai": {
    title: "Assistenza AI",
    description:
      "Suggerisce categoria, priorità, riassunti e bozze — non scrive da sola sul ticket. Default: vLLM locale OpenAI-compatible. «Test connessione» verifica il modello. Conferma sempre prima di applicare.",
  },
  "hq.flussoA": {
    title: "Flusso A — guasto → verifica",
    description:
      "1) Store segnala. 2) HQ fa triage, priorità/SLA e vendor. 3) Vendor lavora dal portale e segna done. 4) Store verifica. Se lo SLA scade → breach + playbook di rilancio. Tutto tracciato in FacilityFlow: sostituisce la chat sparsa su WhatsApp.",
  },
  "store.welcome": {
    title: "App punto vendita",
    description:
      "Interfaccia telefono in negozio. In basso quattro tab: Ticket, Segnala, Nuovo e Lingua. In alto notifiche e Aiuto per questo tutorial. Non serve un PC in ufficio per aprire un guasto.",
  },
  "store.shell.nav": {
    title: "Tab principali",
    description:
      "Ticket = coda del tuo PV. Segnala = intake guidato. Nuovo = form completo. Lingua = preferenze. Resta su queste tab: non hai accesso alla dashboard di tutta la rete.",
  },
  "store.tickets": {
    title: "I ticket del tuo store",
    description:
      "Vedi solo i ticket del tuo punto vendita: aperti, in corso, da verificare. Quando il vendor marca completato, entra qui per confermare che l’impianto funziona (o rifiuta con motivo).",
  },
  "store.verify": {
    title: "Verifica di chiusura",
    description:
      "Dopo il done del vendor, tocca a te: Verifica OK chiude il ciclo; Rifiuta riapre il lavoro con motivo. Senza verifica il ticket non è davvero chiuso nel SoR — non basta un «ok» su WhatsApp.",
  },
  "store.segnala": {
    title: "Segnala un guasto",
    description:
      "Flusso passo-passo tipo chat: conferma store, descrivi, categoria/priorità, foto. In pochi tap crei il ticket nel SoR invece di un messaggio che si perde. Preferisci questa via in corsia.",
  },
  "store.new": {
    title: "Form nuovo ticket",
    description:
      "Alternativa a Segnala: tutti i campi in una pagina. Usa questa via se preferisci compilare tutto insieme. L’HQ riceve il ticket e parte lo SLA secondo le policy.",
  },
  "store.locale": {
    title: "Lingua e preferenze",
    description:
      "IT/EN e formati data/valuta per le etichette che vedi. SLA e permessi restano quelli dell’HQ. Se cambi lingua a metà turno, le etichette si aggiornano al prossimo refresh.",
  },
  "store.flussoA": {
    title: "Dopo la segnalazione",
    description:
      "Tu segnali → HQ assegna fornitore → fornitore interviene e chiude → tu verifichi. Se qualcosa non torna, rifiuti e il lavoro riparte. Lo storico ufficiale è in questi ticket, non in chat esterne.",
  },
  "vendor.welcome": {
    title: "Portale fornitore",
    description:
      "Vedi solo ciò che l’HQ ti ha assegnato: ticket e RFQ. Niente dashboard di rete. Usa Aiuto in alto per rivedere questo tutorial prima di un intervento.",
  },
  "vendor.shell.nav": {
    title: "Navigazione vendor",
    description:
      "Inbox = ticket da lavorare. RFQ = preventivi richiesti dall’HQ. Passa da Inbox a RFQ senza uscire dall’app telefono; i dettagli si aprono dalla lista.",
  },
  "vendor.inbox": {
    title: "Inbox interventi",
    description:
      "Elenco ticket assegnati a te. Aprine uno per descrizione, store, priorità e SLA. Aggiorna stato, note e report di chiusura. Quando segni done, lo store dovrà verificare.",
  },
  "vendor.ticket.work": {
    title: "Lavorare un ticket",
    description:
      "Apri → passa In corso quando parti → completa con report se richiesto → Done. Rispetta lo SLA a schermo: un ritardo genera breach lato HQ. Senza done + verify il ticket resta aperto nel SoR.",
  },
  "vendor.rfq": {
    title: "RFQ — i tuoi preventivi",
    description:
      "Quando l’HQ chiede un preventivo a più fornitori, compare qui. Apri, inserisci importo e note, invia. Se vinci l’award, di solito arriva anche il ticket in Inbox.",
  },
  "vendor.flussoA": {
    title: "Il tuo pezzo del Flusso A",
    description:
      "HQ assegna → tu lavori e fai done → store verifica. Non chiudere «a voce»: senza stati in app il SoR resta inconsistente e lo SLA continua a correre.",
  },
};

const en: Record<string, TourStepCopy> = {
  "hq.welcome": {
    title: "Welcome to FacilityFlow HQ",
    description:
      "Network console for stores and vendors. Left: main menu. Top: breadcrumbs and notifications. Bottom of the sidebar: Interactive tutorial and Explain this page — restart anytime. FacilityFlow is the System of Record: ticket status, SLA and costs live here — not on WhatsApp or spreadsheets.",
  },
  "hq.shell.nav": {
    title: "Section menu",
    description:
      "Each item opens an ops area: Dashboard, Tickets, Stores, Vendors, Assets, Contracts, Calendar, Costs, Wallboard, RFQ and Settings. The menu order matches this tour. Click any item to dive in outside the guided path.",
  },
  "hq.shell.help": {
    title: "Help at hand",
    description:
      "Restart the full tutorial or use Explain this page for the current screen only — handy in demos or for new teammates. Shortcut: ? key (outside text fields).",
  },
  "hq.shell.trust": {
    title: "Trust and compliance",
    description:
      "Reminds stakeholders that data stays self-host / EU, with audit and AI assist + human confirm only. Show this to DPO and IT when they ask where data lives — no paid SaaS on the critical path.",
  },
  "hq.onboarding": {
    title: "Network launch checklist",
    description:
      "Before the full ops dashboard, complete the checklist (or Skip for now): stores, vendors, SLA and store-manager invite. Until ready, opening the dashboard brings you back here — intentional. This product tour explains flows; it does not replace setup.",
  },
  "hq.dashboard": {
    title: "Operations dashboard",
    description:
      "Day snapshot: open tickets, SLA breaches, at-risk, raw MTTR and period costs. Helps the Facility Manager decide where to act before opening lists. Empty network? Use the CTA for a sample ticket.",
  },
  "hq.dashboard.kpi": {
    title: "KPI indicators",
    description:
      "Open = still in progress; SLA breached = already recorded; At risk = near deadline. Aggregated costs use actual (or estimated) amounts from closed/verified tickets. Use them to decide which queue to open next.",
  },
  "hq.dashboard.byStore": {
    title: "Breakdown by store",
    description:
      "KPIs split by store — which site generates more tickets or costs. Compare with finance chargeback for franchise allocation. Empty = not enough ops volume yet.",
  },
  "hq.tickets": {
    title: "Ticket list — triage",
    description:
      "HQ daily queue: open, filter, assign vendors, watch SLA. New ticket is for HQ-created jobs; stores usually use Report. Anything outside this list is outside the SoR.",
  },
  "hq.tickets.filters": {
    title: "Triage filters",
    description:
      "Filter by status, priority, store, vendor and SLA risk (overdue / due soon). Press Filter after choices; Reset clears criteria. SLA badges show on-time vs breach at a glance.",
  },
  "hq.tickets.table": {
    title: "Tickets table",
    description:
      "Each row: category, store, priority, status, vendor and SLA. Icons open detail or quick actions. Detail has tabs (overview, work, costs, timeline), assignment, costs and AI assist — always with human confirm before writing the SoR.",
  },
  "hq.tickets.newCta": {
    title: "Open a ticket from HQ",
    description:
      "Use when HQ opens work on behalf of a store (e.g. phone call). Prefer store self-report so ownership and photos stay on the right site.",
  },
  "hq.tickets.new": {
    title: "New ticket form",
    description:
      "Fill store, description, category, priority and asset if known. Submit creates an open ticket and starts SLA per tenant policy. Attachments help the vendor without external chat.",
  },
  "hq.tickets.detail": {
    title: "Inside a ticket",
    description:
      "Open a row to work the case: assign vendor, update status, record costs, invite SM/vendor, use breach playbook, ask AI for a read-only summary until you confirm. Timeline is audit evidence.",
  },
  "hq.stores": {
    title: "Stores",
    description:
      "Store registry: create, edit, archive. Per store set webhook/ntfy so the site is notified on ticket changes — without paid WhatsApp Business. Store managers only see their site’s tickets.",
  },
  "hq.stores.actions": {
    title: "Create or import stores",
    description:
      "The form adds one site (name, city, address, push channels). Import CSV loads a 15-store pilot in bulk. Finish the registry before inviting store managers.",
  },
  "hq.vendors": {
    title: "Vendors",
    description:
      "Tenant vendor list: email, trades (fridge, HVAC, POS…) and store coverage. Coverage drives assignment suggestions. Without covered vendors, triage falls back to scattered calls.",
  },
  "hq.vendors.scorecard": {
    title: "Vendor scorecard",
    description:
      "Compare MTTR, SLA hit rate and costs across vendors. Use in quarterly reviews or before renewing a contract. Not a marketplace — you decide; numbers beat gut feel.",
  },
  "hq.assets": {
    title: "Assets / equipment",
    description:
      "Light register (fridge banks, HVAC, doors…). Link an asset to a ticket to track what broke. Not a full CMMS with parts stock — stays on retail intake + ticket + costs.",
  },
  "hq.contracts": {
    title: "Maintenance contracts",
    description:
      "Vendor contracts (period, fee, notes) tied to the PM calendar. Filter expiring vs all. Archiving does not erase ticket history — closes the commercial cycle without losing ops trace.",
  },
  "hq.contracts.performance": {
    title: "Contract vs measured",
    description:
      "Compare expected vs completed PM visits (typical 90-day window). If due >> done, escalate the vendor or recalibrate the plan — better than a hand-updated spreadsheet.",
  },
  "hq.calendar": {
    title: "Preventive calendar (PM)",
    description:
      "Google Calendar–style scheduled visits. Click a slot to create; click an event to complete, cancel or open a linked ticket. Recurrences expand visits automatically.",
  },
  "hq.calendar.views": {
    title: "Day, week, month",
    description:
      "Switch views up top: Day (time column), Week or Month. Day for ops density, Month for network planning. Agenda helps with deadlines without a grid.",
  },
  "hq.rfq": {
    title: "RFQ — quote requests",
    description:
      "Compare vendors without an external marketplace: create an RFQ, invite vendors, they reply in the portal, you award and can update the ticket with estimated cost. No escrow or in-app payments.",
  },
  "hq.rfq.new": {
    title: "Create an RFQ",
    description:
      "Title, details, invited vendors and optional linked ticket. Submit; vendors reply in the portal. Award picks the winner; estimated cost can land on the ticket without copying emails.",
  },
  "hq.chargeback": {
    title: "Cost chargeback by store",
    description:
      "Estimated and actual costs by store (default 30 days). Export CSV for accounting or franchise allocation — one source instead of scattered sheets.",
  },
  "hq.chargeback.share": {
    title: "Share with CFO",
    description:
      "Email the chargeback summary (link + digest) to finance. Avoid versioned Excel attachments. CSV export stays available alongside for offline work.",
  },
  "hq.wallboard": {
    title: "Wallboard / TV mode",
    description:
      "Full-screen open and breached tickets, auto-refresh every 30 seconds. Ideal on an HQ or warehouse monitor — no manual refresh in briefings.",
  },
  "hq.wallboard.qr": {
    title: "QR to tickets",
    description:
      "Scan to open the ticket list on a phone (ops room). Same SoR, no URLs dictated aloud. If the QR is missing briefly, wait for render.",
  },
  "hq.settings": {
    title: "Language and format",
    description:
      "UI language (IT/EN), currency and date format. Emails and labels follow these prefs. From here go to Members (invites) and Audit (log) to finish admin setup.",
  },
  "hq.settings.members": {
    title: "Members and invites",
    description:
      "Invite store managers, staff and vendors with the right role. Store scope limits what SM sees; vendors only see assignments. Disable membership instead of deleting — keeps audit trail.",
  },
  "hq.settings.audit": {
    title: "Audit and DPO export",
    description:
      "Append-only events on membership/roles (owner/admin). Export JSON or CSV for the DPO. Complements infra logs: proves who changed permissions in-product.",
  },
  "hq.ai": {
    title: "AI assistance",
    description:
      "Suggests category, priority, summaries and drafts — never writes the ticket alone. Default: local OpenAI-compatible vLLM. Test connection checks the model. Always confirm before applying.",
  },
  "hq.flussoA": {
    title: "Flow A — fault to verify",
    description:
      "1) Store reports. 2) HQ triages priority/SLA and vendor. 3) Vendor works in portal and marks done. 4) Store verifies. SLA expiry → breach + relaunch playbook. Traced in FacilityFlow — replaces scattered WhatsApp.",
  },
  "store.welcome": {
    title: "Store app",
    description:
      "Phone-first UI. Bottom tabs: Tickets, Report, New, Language. Top: notifications and Help for this tour. No office PC needed to open a fault.",
  },
  "store.shell.nav": {
    title: "Main tabs",
    description:
      "Tickets = your site queue. Report = guided intake. New = full form. Language = prefs. Stay on these tabs — no full-network dashboard.",
  },
  "store.tickets": {
    title: "Your store tickets",
    description:
      "Only your site’s tickets: open, in progress, to verify. When a vendor marks completed, confirm the asset works again (or reject with a reason).",
  },
  "store.verify": {
    title: "Closure verification",
    description:
      "After vendor done: Verify OK closes the loop; Reject reopens work with a reason. Without verify the ticket is not truly closed in the SoR — a WhatsApp “ok” is not enough.",
  },
  "store.segnala": {
    title: "Report a fault",
    description:
      "Chat-like steps: confirm store, describe, category/priority, photos. A few taps create a SoR ticket instead of a lost message. Prefer this on the shop floor.",
  },
  "store.new": {
    title: "New ticket form",
    description:
      "Alternative to Report: all fields on one page. Use if you prefer filling everything at once. HQ receives the ticket and SLA starts per policy.",
  },
  "store.locale": {
    title: "Language and preferences",
    description:
      "IT/EN and date/currency formats for on-screen labels. SLA and permissions stay as set by HQ. Language changes apply on next refresh.",
  },
  "store.flussoA": {
    title: "After you report",
    description:
      "You report → HQ assigns vendor → vendor works and closes → you verify. If wrong, reject and work restarts. Official history is these tickets, not external chat.",
  },
  "vendor.welcome": {
    title: "Vendor portal",
    description:
      "Only what HQ assigned: tickets and RFQs. No network dashboard. Use Help to replay this tutorial before a job.",
  },
  "vendor.shell.nav": {
    title: "Vendor navigation",
    description:
      "Inbox = tickets to work. RFQ = quotes HQ requested. Switch between them without leaving the phone app; open details from the list.",
  },
  "vendor.inbox": {
    title: "Work inbox",
    description:
      "Tickets assigned to you. Open one for description, store, priority and SLA. Update status, notes and close-out report. When you mark done, the store must verify.",
  },
  "vendor.ticket.work": {
    title: "Working a ticket",
    description:
      "Open → In progress when you start → complete with report if needed → Done. Respect on-screen SLA: delay creates a breach for HQ. Without done + verify the ticket stays open in the SoR.",
  },
  "vendor.rfq": {
    title: "RFQ — your quotes",
    description:
      "When HQ asks several vendors for a quote, it appears here. Open, enter amount and notes, submit. If you win, the linked ticket usually also lands in Inbox.",
  },
  "vendor.flussoA": {
    title: "Your part of Flow A",
    description:
      "HQ assigns → you work and mark done → store verifies. Do not close verbally: without in-app states the SoR is inconsistent and SLA keeps running.",
  },
};

const byLocale: Record<Locale, Record<string, TourStepCopy>> = { it, en };

export function tourStepCopyFor(locale: Locale): Record<string, TourStepCopy> {
  return byLocale[locale] ?? it;
}
