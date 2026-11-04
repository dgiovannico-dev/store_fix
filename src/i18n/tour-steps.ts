import type { Locale } from "@/i18n";

export type TourStepCopy = { title: string; description: string };

const it: Record<string, TourStepCopy> = {
  "hq.welcome": {
    title: "Benvenuto in FacilityFlow HQ",
    description: "Questa è la console della rete (punti vendita e fornitori). A sinistra trovi il menu principale; in alto breadcrumb, notifiche e, nel menu laterale in basso, «Tutorial interattivo» (icona Aiuto) e «Spiega questa pagina». Puoi rilanciare il giro in qualsiasi momento da lì. FacilityFlow è il System of Record: stato ticket, SLA e costi vivono qui — non su WhatsApp o fogli Excel.",
  },
  "hq.onboarding": {
    title: "Checklist di avvio rete",
    description: "Prima di usare la dashboard operativa completa la checklist (o «Salta per ora»): store, fornitori, SLA e invito store manager. Finché la rete non è pronta, FacilityFlow ti riporta qui se apri la dashboard — è voluto, non un errore.",
  },
  "hq.dashboard": {
    title: "Dashboard operativa",
    description: "Qui hai la fotografia della giornata: quanti ticket sono aperti, quali hanno superato lo SLA (breach), quali sono a rischio, un MTTR grezzo e i costi del periodo. Serve al Facility Manager per capire dove intervenire prima di aprire le liste.",
  },
  "hq.dashboard.kpi": {
    title: "Indicatori KPI",
    description: "Ogni card è cliccabile solo a livello informativo: «Aperti» sono i ticket ancora in lavorazione; «SLA superati» sono breach già registrati dal sistema; «A rischio» sono vicini alla scadenza. I costi aggregati usano gli importi effettivi (o stimati) dei ticket chiusi/verificati nel periodo selezionato.",
  },
  "hq.dashboard.byStore": {
    title: "Dettaglio per punto vendita",
    description: "La tabella spezza i KPI per store: utile per vedere quale PV genera più ticket o costi. Se la rete è appena onboarding e non ci sono ancora dati, vedrai uno stato vuoto con il link per aprire un ticket di prova.",
  },
  "hq.tickets": {
    title: "Lista ticket — il cuore del triage",
    description: "Da qui l’HQ fa triage: apri i ticket, filtra, assegna fornitori, monitora lo SLA. È la coda operativa quotidiana. Il pulsante «Nuovo ticket» serve per aperture manuali HQ; di solito gli store usano Segnala o il form store.",
  },
  "hq.tickets.filters": {
    title: "Filtri di triage",
    description: "Filtra per stato (aperto, assegnato, in corso…), priorità, punto vendita, fornitore e rischio SLA (in ritardo / in scadenza). Dopo aver scelto i valori, premi Filtra. «Reimposta» toglie tutti i criteri. I badge SLA in tabella ti dicono a colpo d’occhio se sei in tempo o in breach.",
  },
  "hq.tickets.table": {
    title: "Tabella ticket",
    description: "Ogni riga è un ticket: categoria, store, priorità, stato, vendor e SLA. Usa le icone a destra per aprire il dettaglio o le azioni rapide. Nel dettaglio trovi tab (panoramica, lavoro, costi, timeline), assegnazione vendor, costi e assist AI (riassunto / bozze) — sempre con conferma umana prima di scrivere sul SoR.",
  },
  "hq.stores": {
    title: "Punti vendita",
    description: "Anagrafica dei PV della rete: crea, modifica, archivia. Puoi importare un CSV per il pilota 15 store. Su ogni store puoi impostare canali push (webhook/ntfy) per avvisare il punto vendita quando nasce o cambia un ticket — senza WhatsApp Business a pagamento.",
  },
  "hq.vendors": {
    title: "Fornitori",
    description: "Elenco vendor del tenant: email di contatto, categorie coperte (frigo, HVAC, casse…) e collegamento agli store. La copertura guida i suggerimenti di assegnazione. Dalla scorecard vendor vedi MTTR, rispetto SLA e costi — utile per confrontare chi performa meglio.",
  },
  "hq.assets": {
    title: "Asset / impianti",
    description: "Registro leggero degli asset (banchi frigo, unità HVAC, porte…). Collega un asset a un ticket per tracciare cosa si è rotto. Non è un CMMS con magazzino pezzi: resta sul wedge retail intake + ticket + costi.",
  },
  "hq.contracts": {
    title: "Contratti di manutenzione",
    description: "Qui gestisci i contratti con i fornitori (periodo, fee, note). Si collegano al calendario PM per le visite programmate. In «Contratto vs misurato» confronti le visite attese con quelle effettivamente completate nel periodo.",
  },
  "hq.calendar": {
    title: "Calendario preventive (PM)",
    description: "Vista stile Google Calendar: Giorno (colonna oraria), Settimana, Mese e Agenda. Clicca su uno slot per creare una visita ancorata al click; clicca un evento per completarlo, annullarlo o aprire un ticket collegato. Le ricorrenze (settimanale/mensile/…) espandono le visite automaticamente.",
  },
  "hq.rfq": {
    title: "RFQ — richieste di preventivo",
    description: "Quando serve confrontare più fornitori senza marketplace esterno: crei una RFQ, inviti i vendor, loro rispondono dal portale, tu assegni (award) e puoi far nascere/aggiornare il ticket con il costo stimato. Nessun escrow né pagamento in piattaforma.",
  },
  "hq.chargeback": {
    title: "Chargeback costi per PV",
    description: "Riparto dei costi stimati ed effettivi aggregati per punto vendita nel periodo (default 30 giorni). Esporta CSV per la contabilità o il riparto franchise — senza fogli Excel sparsi. Ideale per viewer finance e HQ.",
  },
  "hq.wallboard": {
    title: "Wallboard / modalità TV",
    description: "Vista a tutto schermo dei ticket aperti e in breach, con aggiornamento automatico ogni 30 secondi. Utile su un monitor in HQ o in magazzino: nessuno deve aggiornare la pagina a mano.",
  },
  "hq.settings": {
    title: "Lingua e formato",
    description: "Imposta lingua UI (IT/EN), valuta e formato date del tenant. Le email e le etichette seguono queste preferenze. Da Membri invita store manager e vendor; da Audit vedi le modifiche di configurazione sensibili.",
  },
  "hq.ai": {
    title: "Assistenza AI (locale o cloud)",
    description: "L’AI suggerisce categoria, priorità, riassunti e bozze messaggio — mai scrive da sola sul ticket. Di default usa il vLLM sul tuo PC (OpenAI-compatible). «Test connessione» verifica che il modello risponda. Conferma sempre tu prima di applicare un suggerimento.",
  },
  "hq.flussoA": {
    title: "Flusso A — dal guasto alla verifica",
    description: "1) Lo store segnala (Segnala o nuovo ticket). 2) L’HQ fa triage, assegna priorità/SLA e il vendor. 3) Il vendor lavora dal portale e segna done. 4) Lo store verifica la chiusura. Se lo SLA scade, il sistema registra il breach e puoi usare il playbook di rilancio. Tutto resta tracciato in FacilityFlow: è questo che sostituisce la chat sparsa su WhatsApp.",
  },
  "store.welcome": {
    title: "App punto vendita",
    description: "Interfaccia pensata per il telefono in negozio. In basso hai quattro tab: Ticket, Segnala, Nuovo ticket e Lingua. In alto trovi notifiche e «Aiuto» per rilanciare questo tutorial. Non serve un PC in ufficio per aprire un guasto.",
  },
  "store.tickets": {
    title: "I ticket del tuo store",
    description: "Vedi solo i ticket del tuo punto vendita: aperti, in corso, da verificare. Quando un vendor marca «completato», entra qui e conferma che l’impianto funziona di nuovo (verifica) oppure rifiuta con motivo — il ticket torna in lavorazione.",
  },
  "store.segnala": {
    title: "Segnala un guasto (intake)",
    description: "Flusso guidato passo-passo, simile a una chat: scegli o conferma lo store, descrivi il problema, eventuale categoria/priorità, allega foto se serve. In pochi tap crei un ticket nel SoR invece di un messaggio WhatsApp che poi si perde.",
  },
  "store.new": {
    title: "Form nuovo ticket",
    description: "Alternativa al flusso Segnala: tutti i campi in una pagina (descrizione, categoria, priorità, asset). Usa questa via se preferisci compilare tutto insieme. L’HQ riceve il ticket e parte lo SLA secondo le policy del tenant.",
  },
  "store.locale": {
    title: "Lingua e preferenze",
    description: "Se lavori in inglese o vuoi date/valuta diverse, aggiornale qui. Vale per le etichette che vedi sullo schermo; le regole SLA e i permessi restano quelli dell’HQ.",
  },
  "store.flussoA": {
    title: "Cosa succede dopo la segnalazione",
    description: "Tu segnali → l’HQ assegna un fornitore → il fornitore interviene e chiude → tu verifichi. Se qualcosa non torna, rifiuti la verifica e il lavoro riparte. Non cancellare la cronologia su chat esterne: lo storico ufficiale è in questi ticket.",
  },
  "vendor.welcome": {
    title: "Portale fornitore",
    description: "Qui vedi solo ciò che l’HQ ti ha assegnato: ticket da lavorare e richieste di preventivo (RFQ). Non hai accesso alla dashboard della rete intera. Usa «Aiuto» in alto per rivedere questo tutorial.",
  },
  "vendor.inbox": {
    title: "Inbox interventi",
    description: "Elenco dei ticket assegnati a te. Aprine uno per leggere descrizione, store, priorità e SLA. Aggiorna lo stato (in corso → completato), aggiungi note e report di chiusura. Quando segni done, lo store dovrà verificare.",
  },
  "vendor.rfq": {
    title: "RFQ — i tuoi preventivi",
    description: "Quando l’HQ chiede un preventivo a più fornitori, compare qui. Apri la richiesta, inserisci importo e note, invia. Se vinci l’award, tipicamente ti arriverà anche il ticket collegato in Inbox.",
  },
  "vendor.flussoA": {
    title: "Come lavorare un ticket",
    description: "Apri → conferma di aver preso in carico (passa in corso) → esegui l’intervento → completa con eventuale report. Rispetta lo SLA mostrato: un ritardo genera breach lato HQ. Non chiudere «a voce» su WhatsApp: senza done + verify il ticket resta aperto nel SoR.",
  },
};

const en: Record<string, TourStepCopy> = {
  "hq.welcome": {
    title: "Welcome to FacilityFlow HQ",
    description: "This is the network console (stores and vendors). On the left is the main menu; at the top breadcrumbs and notifications; at the bottom of the sidebar, Interactive tutorial (Help) and Explain this page. You can restart the tour anytime from there. FacilityFlow is the System of Record: ticket status, SLA and costs live here — not on WhatsApp or spreadsheets.",
  },
  "hq.onboarding": {
    title: "Network launch checklist",
    description: "Before using the full ops dashboard, complete the checklist (or Skip for now): stores, vendors, SLA and store-manager invite. Until the network is ready, FacilityFlow brings you back here if you open the dashboard — that is intentional, not a bug.",
  },
  "hq.dashboard": {
    title: "Operations dashboard",
    description: "Here is the day snapshot: how many tickets are open, which breached SLA, which are at risk, raw MTTR and period costs. Helps the Facility Manager decide where to act before opening lists.",
  },
  "hq.dashboard.kpi": {
    title: "KPI indicators",
    description: "Each card is informational: Open are tickets still in progress; SLA breached are already recorded; At risk are near deadline. Aggregated costs use actual (or estimated) amounts from closed/verified tickets in the selected period.",
  },
  "hq.dashboard.byStore": {
    title: "Breakdown by store",
    description: "The table splits KPIs by store — useful to see which site generates more tickets or costs. If onboarding just finished and there is no data yet, you will see an empty state with a link to open a sample ticket.",
  },
  "hq.tickets": {
    title: "Ticket list — triage hub",
    description: "HQ triage lives here: open tickets, filter, assign vendors, watch SLA. Daily ops queue. New ticket is for HQ-created jobs; stores usually use Report or the store form.",
  },
  "hq.tickets.filters": {
    title: "Triage filters",
    description: "Filter by status (open, assigned, in progress…), priority, store, vendor and SLA risk (overdue / due soon). After choosing values, press Filter. Reset clears all criteria. SLA badges in the table show at a glance if you are on time or breached.",
  },
  "hq.tickets.table": {
    title: "Tickets table",
    description: "Each row is a ticket: category, store, priority, status, vendor and SLA. Use the icons on the right for detail or quick actions. Detail has tabs (overview, work, costs, timeline), vendor assignment, costs and AI assist (summary / drafts) — always with human confirm before writing the SoR.",
  },
  "hq.stores": {
    title: "Stores",
    description: "Network store registry: create, edit, archive. You can import a CSV for a 15-store pilot. Per store you can set push channels (webhook/ntfy) so the site is notified when a ticket is created or changes — without paid WhatsApp Business.",
  },
  "hq.vendors": {
    title: "Vendors",
    description: "Tenant vendor list: contact email, covered trades (fridge, HVAC, POS…) and store links. Coverage drives assignment suggestions. The vendor scorecard shows MTTR, SLA hit rate and costs — useful to compare who performs better.",
  },
  "hq.assets": {
    title: "Assets / equipment",
    description: "Light asset register (fridge banks, HVAC units, doors…). Link an asset to a ticket to track what broke. This is not a full CMMS with parts stock: it stays on the retail wedge of intake + ticket + costs.",
  },
  "hq.contracts": {
    title: "Maintenance contracts",
    description: "Manage vendor contracts (period, fee, notes). They connect to the PM calendar for scheduled visits. Contract vs measured compares expected visits with those actually completed in the period.",
  },
  "hq.calendar": {
    title: "Preventive calendar (PM)",
    description: "Google Calendar–style view: Day (time column), Week, Month and Agenda. Click a slot to create a visit anchored to the click; click an event to complete, cancel or open a linked ticket. Recurrences (weekly/monthly/…) expand visits automatically.",
  },
  "hq.rfq": {
    title: "RFQ — quote requests",
    description: "When you need to compare several vendors without an external marketplace: create an RFQ, invite vendors, they reply from the portal, you award and can create/update the ticket with the estimated cost. No escrow or in-platform payments.",
  },
  "hq.chargeback": {
    title: "Cost chargeback by store",
    description: "Estimated and actual costs rolled up by store for the period (default 30 days). Export CSV for accounting or franchise allocation — no scattered spreadsheets. Ideal for finance viewers and HQ.",
  },
  "hq.wallboard": {
    title: "Wallboard / TV mode",
    description: "Full-screen view of open and breached tickets, auto-refreshing every 30 seconds. Useful on an HQ or warehouse monitor: nobody needs to refresh the page by hand.",
  },
  "hq.settings": {
    title: "Language and format",
    description: "Set UI language (IT/EN), currency and date format for the tenant. Emails and labels follow these preferences. From Members invite store managers and vendors; from Audit see sensitive configuration changes.",
  },
  "hq.ai": {
    title: "AI assistance (local or cloud)",
    description: "AI suggests category, priority, summaries and message drafts — it never writes the ticket alone. By default it uses vLLM on your PC (OpenAI-compatible). Test connection checks the model responds. Always confirm before applying a suggestion.",
  },
  "hq.flussoA": {
    title: "Flow A — from fault to verification",
    description: "1) Store reports (Report or new ticket). 2) HQ triages, sets priority/SLA and vendor. 3) Vendor works from the portal and marks done. 4) Store verifies closure. If SLA expires, the system records breach and you can use the relaunch playbook. Everything stays traced in FacilityFlow — that is what replaces scattered WhatsApp chat.",
  },
  "store.welcome": {
    title: "Store app",
    description: "Phone-first store UI. Bottom tabs: Tickets, Report, New ticket and Language. Top bar has notifications and Help to restart this tutorial. You do not need an office PC to open a fault.",
  },
  "store.tickets": {
    title: "Your store tickets",
    description: "You only see tickets for your store: open, in progress, to verify. When a vendor marks completed, come here and confirm the asset works again (verify) or reject with a reason — the ticket goes back to work.",
  },
  "store.segnala": {
    title: "Report a fault (intake)",
    description: "Guided step-by-step flow, chat-like: choose or confirm the store, describe the problem, optional category/priority, attach photos if needed. In a few taps you create a SoR ticket instead of a WhatsApp message that gets lost.",
  },
  "store.new": {
    title: "New ticket form",
    description: "Alternative to Report: all fields on one page (description, category, priority, asset). Use this if you prefer filling everything at once. HQ receives the ticket and SLA starts per tenant policy.",
  },
  "store.locale": {
    title: "Language and preferences",
    description: "If you work in English or want different dates/currency, update them here. It affects on-screen labels; SLA rules and permissions stay as set by HQ.",
  },
  "store.flussoA": {
    title: "What happens after you report",
    description: "You report → HQ assigns a vendor → vendor works and closes → you verify. If something is wrong, reject verification and work restarts. Do not rely on external chat history: the official record is these tickets.",
  },
  "vendor.welcome": {
    title: "Vendor portal",
    description: "You only see what HQ assigned: tickets to work and quote requests (RFQ). No full-network dashboard. Use Help at the top to replay this tutorial.",
  },
  "vendor.inbox": {
    title: "Work inbox",
    description: "List of tickets assigned to you. Open one to read description, store, priority and SLA. Update status (in progress → completed), add notes and close-out report. When you mark done, the store must verify.",
  },
  "vendor.rfq": {
    title: "RFQ — your quotes",
    description: "When HQ asks several vendors for a quote, it appears here. Open the request, enter amount and notes, submit. If you win the award, the linked ticket usually also lands in Inbox.",
  },
  "vendor.flussoA": {
    title: "How to work a ticket",
    description: "Open → take ownership (in progress) → do the work → complete with report if needed. Respect the shown SLA: delay creates a breach for HQ. Do not close verbally on WhatsApp: without done + verify the ticket stays open in the SoR.",
  },
};

const byLocale: Record<Locale, Record<string, TourStepCopy>> = { it, en };

export function tourStepCopyFor(locale: Locale): Record<string, TourStepCopy> {
  return byLocale[locale] ?? it;
}
