export type NavLink = {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
};

const ICONS = {
  dashboard: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z",
  plus: "M12 4v16m8-8H4",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  messages: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  analytics: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  marketplace: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  services: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  contracts: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  disputes: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  workflows: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  reports: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  api: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  subscription: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  brandSafety: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  affiliate: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  gamification: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  moderation: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
};

export const BRAND_NAV: NavLink[] = [
  { name: "Tableau de bord", path: "/brand", icon: ICONS.dashboard },
  { name: "Créer une campagne", path: "/brand/campaigns/new", icon: ICONS.plus },
  { name: "Découverte (IA)", path: "/brand/discovery", icon: ICONS.search },
  { name: "Messagerie", path: "/messages", icon: ICONS.messages },
  { name: "Statistiques", path: "/analytics", icon: ICONS.analytics },
];

export const INFLUENCER_NAV: NavLink[] = [
  { name: "Tableau de bord", path: "/influencer", icon: ICONS.dashboard },
  { name: "Marketplace", path: "/influencer/campaigns", icon: ICONS.marketplace },
  { name: "Mes Prestations", path: "/influencer/services", icon: ICONS.services },
  { name: "Messagerie", path: "/messages", icon: ICONS.messages },
  { name: "Statistiques", path: "/analytics", icon: ICONS.analytics },
];

export const SHARED_NAV: NavLink[] = [
  { name: "Calendrier", path: "/calendar", icon: ICONS.calendar },
  { name: "Contrats", path: "/contracts", icon: ICONS.contracts },
  { name: "Litiges", path: "/disputes", icon: ICONS.disputes },
  { name: "Workflows", path: "/workflows", icon: ICONS.workflows },
  { name: "Rapports", path: "/reports", icon: ICONS.reports },
  { name: "API", path: "/api", icon: ICONS.api },
  { name: "Abonnement", path: "/subscription", icon: ICONS.subscription },
  { name: "Brand Safety", path: "/brand-safety", icon: ICONS.brandSafety },
  { name: "Affiliation", path: "/affiliate", icon: ICONS.affiliate },
  { name: "Gamification", path: "/gamification", icon: ICONS.gamification },
  { name: "Modération", path: "/moderation", icon: ICONS.moderation, adminOnly: true },
];

export function getDashboardNav(role: string, isAdmin = false): NavLink[] {
  const roleNav = role === "brand" ? BRAND_NAV : INFLUENCER_NAV;
  const shared = SHARED_NAV.filter((link) => !link.adminOnly || isAdmin);
  return [...roleNav, ...shared];
}

export function getCommandPaletteCommands(role: string, isAdmin = false) {
  const nav = getDashboardNav(role, isAdmin);
  return nav.map((link) => ({
    label: link.name,
    hint: link.path,
    path: link.path,
    group: link.adminOnly ? "Administration" : role === "brand" ? "Marque" : "Créateur",
  }));
}
