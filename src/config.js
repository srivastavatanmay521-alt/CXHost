export const configStorageKey = 'cx-hosting-site-config-v4';

export const defaultSiteConfig = {
  branding: {
    name: 'CX HOSTING',
    shortName: 'CX Host',
    logo: '',
    tagline:
      'Blazing-fast, affordable hosting for Discord bots, Minecraft servers, Lavalink nodes, and VPS. Powered by enterprise hardware — starting at just ₹30/month.',
    supportEmail: 'support@cxhosting.in',
  },
  navigation: {
    services: [
      { name: 'Bot', label: 'Discord Bots', href: '/discord' },
      { name: 'Server', label: 'Minecraft', href: '/minecraft' },
      { name: 'Music', label: 'Lavalink', href: '/lavalink' },
      { name: 'Globe', label: 'VPS Hosting', href: '/vps' },
    ],
    more: [
      { name: 'BarChart', label: 'Status', href: '/status' },
      { name: 'Megaphone', label: 'Announcements', href: '/announcements' },
      { name: 'Info', label: 'About', href: '/about' },
      { name: 'HelpingHand', label: 'Support', href: '/support' },
      { name: 'FileText', label: 'Terms', href: '/tos' },
      { name: 'Shield', label: 'Privacy', href: '/privacy' },
    ],
  },
  auth: {
    allowManualLogin: true,
    allowDiscordLogin: true,
    discordClientId: '',
    discordClientSecret: '',
    discordBotToken: '',
    discordRedirectUri: 'https://yourdomain.com/auth/discord/callback',
    manualLoginRedirect: '/order',
  },
  payment: {
    providerName: 'UPI',
    currency: 'INR',
    symbol: '₹',
    minimumOrderAmount: 30,
    webhookUrl: '',
    verificationUrl: '',
    autoCreateUser: true,
    autoProvisionServer: true,
  },
  admin: {
    password: 'CXHost#2025',
    title: 'CX Hosting — Admin Panel',
  },
  pricing: {
    plans: [
      {
        id: 'lavalink-starter',
        service: 'lavalink',
        title: 'Lavalink Starter',
        description: 'Run your own Lavalink audio node for Discord music bots.',
        image: '/discord.jpeg',
        priceINR: 49,
        route: '/order/lavalink-starter',
        buttonText: 'Start Now',
        popular: false,
        features: ['512 MB RAM', '1 vCPU', '5 GB SSD', 'Java Pre-installed', 'Low Latency Network'],
      },
      {
        id: 'lavalink-pro',
        service: 'lavalink',
        title: 'Lavalink Pro',
        description: 'Handle multiple servers and high-volume audio streaming.',
        image: '/discord.jpeg',
        priceINR: 99,
        route: '/order/lavalink-pro',
        buttonText: 'Go Pro',
        popular: true,
        features: ['1 GB RAM', '2 vCPU', '10 GB SSD', 'Java Pre-installed', 'Priority Routing'],
      },
    ],
  },
  status: {
    overall: 'All Systems Operational',
    services: [
      { name: 'Discord Bot Network', description: 'Bot hosting nodes across all regions', status: 'Operational' },
      { name: 'Minecraft Cluster', description: 'Game server nodes and network', status: 'Operational' },
      { name: 'Lavalink Network', description: 'Audio node infrastructure', status: 'Operational' },
      { name: 'VPS Infrastructure', description: 'Virtual private server fleet', status: 'Operational' },
      { name: 'Control Panel', description: 'Customer portal and admin panel', status: 'Operational' },
      { name: 'Payment Gateway', description: 'UPI and payment processing', status: 'Operational' },
    ],
    incidents: [],
  },
  support: {
    ticketUrl: 'https://discord.gg/yourserver',
    docsUrl: 'https://docs.cxhosting.in',
    faq: [
      {
        question: 'How do I place an order?',
        answer:
          'Click "Order Now" on any plan, log in with your Discord or email account, and complete payment via UPI. Your server is provisioned automatically after confirmation.',
      },
      {
        question: 'How fast is provisioning after payment?',
        answer:
          'Servers are provisioned within 60 seconds of payment webhook confirmation. If you experience a delay beyond 5 minutes, open a support ticket.',
      },
      {
        question: 'Do you offer a money-back guarantee?',
        answer:
          'Yes — new customers get a 7-day money-back guarantee on all hosting plans, no questions asked.',
      },
      {
        question: 'Can I upgrade my plan later?',
        answer:
          'Absolutely. You can upgrade at any time from your client portal. Upgrades are prorated for the remainder of your billing cycle.',
      },
      {
        question: 'Which payment methods are accepted?',
        answer:
          'We accept all UPI apps (Google Pay, PhonePe, Paytm, BHIM, etc.). More payment methods are coming soon.',
      },
    ],
  },
};
