export type ServiceStatus =
  | 'Operational'
  | 'Degraded Performance'
  | 'Partial Outage'
  | 'Major Outage'
  | 'Under Maintenance';

export type PlanService = 'discord' | 'minecraft' | 'vps' | 'lavalink';

export interface PricingPlan {
  id: string;
  service: PlanService;
  title: string;
  description: string;
  image: string;
  priceINR: number;
  route: string;
  buttonText: string;
  popular: boolean;
  features: string[];
}

export interface StatusService {
  name: string;
  description: string;
  status: ServiceStatus;
}

export interface StatusIncidentUpdate {
  time: string;
  message: string;
}

export interface StatusIncident {
  date: string;
  title: string;
  status: string;
  updates: StatusIncidentUpdate[];
}

export interface NavItem {
  name: string;
  label?: string;
  href: string;
}

export interface SiteConfig {
  branding: {
    name: string;
    shortName: string;
    logo: string;
    tagline: string;
    supportEmail: string;
  };
  navigation: {
    services: NavItem[];
    more: NavItem[];
  };
  auth: {
    allowManualLogin: boolean;
    allowDiscordLogin: boolean;
    discordClientId: string;
    discordClientSecret: string;
    discordBotToken: string;
    discordRedirectUri: string;
    manualLoginRedirect: string;
  };
  payment: {
    providerName: string;
    currency: string;
    symbol: string;
    minimumOrderAmount: number;
    webhookUrl: string;
    verificationUrl: string;
    autoCreateUser: boolean;
    autoProvisionServer: boolean;
  };
  admin: {
    password: string;
    title: string;
  };
  pricing: {
    plans: PricingPlan[];
  };
  status: {
    overall: string;
    services: StatusService[];
    incidents: StatusIncident[];
  };
  support: {
    ticketUrl: string;
    docsUrl: string;
    faq: { question: string; answer: string }[];
  };
}

export const configStorageKey: string;
export const defaultSiteConfig: SiteConfig;
