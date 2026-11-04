export type TourAudience = "hq" | "store" | "vendor";

export type TourStepDef = {
  element?: string;
  title: string;
  description: string;
  route?: string;
};

/** Capitoli completi per audience — selettori data-tour; skip se missing. */
export function stepsForAudience(audience: TourAudience): TourStepDef[] {
  if (audience === "store") {
    return [
      {
        element: "[data-tour='shell.phone']",
        title: "Navigazione store",
        description:
          "Dal telefono gestisci ticket, segnalazioni e preferenze. Tocca Avanti per il giro.",
      },
      {
        element: "[data-tour='nav.tickets']",
        title: "I tuoi ticket",
        description: "Elenco dei guasti aperti e chiusi del punto vendita.",
        route: "/app/tickets",
      },
      {
        element: "[data-tour='nav.segnala']",
        title: "Segnala",
        description: "Intake rapido stile chat per aprire un guasto in pochi tap.",
        route: "/app/segnala",
      },
      {
        element: "[data-tour='nav.newTicket']",
        title: "Nuovo ticket",
        description: "Form completo se preferisci i campi strutturati.",
        route: "/app/tickets/new",
      },
      {
        element: "[data-tour='nav.locale']",
        title: "Lingua e formato",
        description: "Imposta lingua e preferenze di data/valuta.",
        route: "/app/settings/locale",
      },
      {
        title: "Flusso A (store)",
        description:
          "Segnala → HQ assegna vendor → vendor completa → tu verifichi la chiusura. Il SoR è sempre FacilityFlow, non WhatsApp.",
      },
    ];
  }

  if (audience === "vendor") {
    return [
      {
        element: "[data-tour='shell.phone']",
        title: "Portale fornitore",
        description: "Qui vedi solo i ticket e le RFQ assegnati a te.",
      },
      {
        element: "[data-tour='nav.inbox']",
        title: "Inbox",
        description: "Ticket da accettare, lavorare e segnare come done.",
        route: "/vendor/inbox",
      },
      {
        element: "[data-tour='nav.rfq']",
        title: "RFQ",
        description: "Rispondi alle richieste di preventivo dell’HQ.",
        route: "/vendor/rfq",
      },
      {
        title: "Flusso A (vendor)",
        description:
          "Quando ricevi un ticket: aggiorna stato, completa l’intervento, lascia note. Lo store verificherà.",
      },
    ];
  }

  return [
    {
      element: "[data-tour='shell.hq']",
      title: "Shell HQ",
      description:
        "Sidebar per tutta la rete: dashboard, ticket, anagrafiche, calendario, RFQ e impostazioni.",
    },
    {
      element: "[data-tour='nav.dashboard']",
      title: "Dashboard",
      description: "KPI aperti, breach, costi per punto vendita.",
      route: "/app/dashboard",
    },
    {
      element: "[data-tour='nav.tickets']",
      title: "Ticket",
      description: "Triage, filtri SLA, dettaglio con tab e azioni.",
      route: "/app/tickets",
    },
    {
      element: "[data-tour='nav.stores']",
      title: "Punti vendita",
      description: "Anagrafica store, import CSV, canali push.",
      route: "/app/stores",
    },
    {
      element: "[data-tour='nav.vendors']",
      title: "Fornitori",
      description: "Vendor, copertura categorie e scorecard.",
      route: "/app/vendors",
    },
    {
      element: "[data-tour='nav.assets']",
      title: "Asset",
      description: "Registry impianti per store.",
      route: "/app/assets",
    },
    {
      element: "[data-tour='nav.contracts']",
      title: "Contratti",
      description: "Contratti vendor e collegamento al calendario PM.",
      route: "/app/contratti",
    },
    {
      element: "[data-tour='nav.calendar']",
      title: "Calendario PM",
      description: "Giorno / settimana / mese — visite preventive e ricorrenze.",
      route: "/app/calendario",
    },
    {
      element: "[data-tour='nav.rfq']",
      title: "RFQ",
      description: "Richieste preventivo multi-vendor e award.",
      route: "/app/rfq",
    },
    {
      element: "[data-tour='nav.locale']",
      title: "Impostazioni",
      description: "Lingua, membri, audit e assistenza AI.",
      route: "/app/settings/locale",
    },
    {
      title: "Flusso A end-to-end",
      description:
        "Store apre → HQ assegna → vendor lavora → store verifica. SLA e costi restano nel SoR. Usa Aiuto → Tutorial quando vuoi rivedere.",
    },
  ];
}

export function chapterForPath(
  audience: TourAudience,
  pathname: string,
): TourStepDef[] {
  const all = stepsForAudience(audience);
  const match = all.filter(
    (s) =>
      s.route &&
      (pathname === s.route || pathname.startsWith(`${s.route}/`)),
  );
  if (match.length > 0) return match;
  return all.slice(0, 2);
}
