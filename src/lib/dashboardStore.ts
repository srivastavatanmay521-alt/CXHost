const ORDERS_KEY = 'cx-hosting-orders';
const USERS_KEY = 'cx-hosting-users';
const SERVERS_KEY = 'cx-hosting-servers';
const SESSION_KEY = 'cx-hosting-session';
const ANNOUNCEMENTS_KEY = 'cx-hosting-announcements';
const DISCOUNTS_KEY = 'cx-hosting-discounts';
const TICKETS_KEY = 'cx-hosting-tickets';
const ADMIN_LOG_KEY = 'cx-hosting-admin-log';

export type OrderRecord = {
  id: string;
  planId: string;
  planTitle: string;
  email: string;
  paymentRef: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  amountINR: number;
  providerName: string;
  discountCode?: string;
  discountedAmount?: number;
};

export type UserRecord = {
  id: string;
  email: string;
  loginMethod: 'manual' | 'discord';
  createdAt: string;
};

export type ServerRecord = {
  id: string;
  ownerEmail: string;
  planId: string;
  planTitle: string;
  status: 'active' | 'provisioning' | 'suspended';
  createdAt: string;
  nodeName: string;
};

export type AdminAnnouncement = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: 'update' | 'maintenance' | 'feature' | 'incident';
  date: string;
  pinned: boolean;
  badge: string;
  published: boolean;
};

export type DiscountCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  planIds: string[] | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  description: string;
};

export type TicketMessage = {
  id: string;
  from: 'user' | 'admin';
  text: string;
  createdAt: string;
};

export type TicketCategory = 'technical' | 'billing' | 'general' | 'other';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export type Ticket = {
  id: string;
  email: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type AdminActivity = {
  id: string;
  action: string;
  timestamp: string;
};

const readArray = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

const writeArray = <T,>(key: string, value: T[]) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadOrders = () => readArray<OrderRecord>(ORDERS_KEY);
export const saveOrders = (orders: OrderRecord[]) => writeArray(ORDERS_KEY, orders);

export const loadUsers = () => readArray<UserRecord>(USERS_KEY);
export const saveUsers = (users: UserRecord[]) => writeArray(USERS_KEY, users);

export const loadServers = () => readArray<ServerRecord>(SERVERS_KEY);
export const saveServers = (servers: ServerRecord[]) => writeArray(SERVERS_KEY, servers);

export const loadAnnouncements = () => readArray<AdminAnnouncement>(ANNOUNCEMENTS_KEY);
export const saveAnnouncements = (items: AdminAnnouncement[]) => writeArray(ANNOUNCEMENTS_KEY, items);

export const loadDiscounts = () => readArray<DiscountCode>(DISCOUNTS_KEY);
export const saveDiscounts = (codes: DiscountCode[]) => writeArray(DISCOUNTS_KEY, codes);

export const loadTickets = () => readArray<Ticket>(TICKETS_KEY);
export const saveTickets = (tickets: Ticket[]) => writeArray(TICKETS_KEY, tickets);

export const loadAdminLog = () => readArray<AdminActivity>(ADMIN_LOG_KEY);
export const logAdminActivity = (action: string) => {
  const log = loadAdminLog();
  const entry: AdminActivity = { id: uid(), action, timestamp: new Date().toISOString() };
  writeArray(ADMIN_LOG_KEY, [entry, ...log].slice(0, 50));
};

export const validateDiscountCode = (
  code: string,
  planId: string,
  priceINR: number,
): { valid: boolean; discount: DiscountCode | null; finalPrice: number; message: string } => {
  const codes = loadDiscounts();
  const found = codes.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!found) return { valid: false, discount: null, finalPrice: priceINR, message: 'Invalid code.' };
  if (!found.isActive) return { valid: false, discount: null, finalPrice: priceINR, message: 'Code is inactive.' };
  if (found.expiresAt && new Date(found.expiresAt) < new Date())
    return { valid: false, discount: null, finalPrice: priceINR, message: 'Code has expired.' };
  if (found.maxUses !== null && found.usedCount >= found.maxUses)
    return { valid: false, discount: null, finalPrice: priceINR, message: 'Code usage limit reached.' };
  if (found.planIds !== null && !found.planIds.includes(planId))
    return { valid: false, discount: null, finalPrice: priceINR, message: 'Code not valid for this plan.' };

  const finalPrice =
    found.type === 'percentage'
      ? Math.max(0, priceINR - (priceINR * found.value) / 100)
      : Math.max(0, priceINR - found.value);

  return { valid: true, discount: found, finalPrice, message: `Code applied! You save ${found.type === 'percentage' ? `${found.value}%` : `₹${found.value}`}.` };
};

export const loadSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as { email: string; loginMethod: 'manual' | 'discord' }) : null;
  } catch {
    return null;
  }
};
export const saveSession = (session: { email: string; loginMethod: 'manual' | 'discord' }) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};
export const clearSession = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
};

export const uid = () => Math.random().toString(36).slice(2, 10);
