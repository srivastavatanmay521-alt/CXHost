import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Server, UserPlus } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { loadOrders, loadServers, loadUsers, saveOrders, saveServers, saveUsers, type OrderRecord } from '../lib/dashboardStore';

const OrderPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const selectedPlan = useMemo(
    () => config.pricing.plans.find(plan => plan.id === planId) ?? config.pricing.plans[0],
    [config.pricing.plans, planId],
  );

  const [email, setEmail] = useState('');
  const [serverName, setServerName] = useState(`${selectedPlan.title} Server`);
  const [paymentRef, setPaymentRef] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'complete'>('details');
  const [status, setStatus] = useState<string>('');
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  const createReference = () => `CX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const submitDetails = (event: FormEvent) => {
    event.preventDefault();

    if (!email) {
      setStatus('Add an email address to continue.');
      return;
    }

    if (selectedPlan.priceINR < config.payment.minimumOrderAmount) {
      setStatus(`This plan must be at least ₹${config.payment.minimumOrderAmount}. Update the price in the admin panel.`);
      return;
    }

    const order: OrderRecord = {
      id: createReference(),
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      email,
      paymentRef: paymentRef || createReference(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      amountINR: selectedPlan.priceINR,
      providerName: config.payment.providerName,
    };

    setCreatedOrder(order);
    saveOrders([order, ...loadOrders()]);
    setStep('payment');
    setStatus(`Payment request created for ₹${selectedPlan.priceINR}.`);
  };

  const confirmPayment = async () => {
    if (!createdOrder) return;

    if (config.payment.verificationUrl) {
      try {
        const query = new URLSearchParams({ orderId: createdOrder.id, paymentRef: createdOrder.paymentRef });
        const response = await fetch(`${config.payment.verificationUrl}?${query.toString()}`);
        const data = await response.json() as { paid?: boolean };
        if (!data.paid) {
          setStatus('Verification endpoint returned unpaid. Try again after the webhook updates.');
          return;
        }
      } catch {
        setStatus('Could not reach the verification endpoint. Using local demo confirmation.');
      }
    }

    const paidOrder: OrderRecord = { ...createdOrder, status: 'paid' };
    const orders = loadOrders().map(order => order.id === paidOrder.id ? paidOrder : order);
    saveOrders(orders);

    const users = loadUsers();
    if (!users.some(user => user.email === email)) {
      saveUsers([{ id: createReference(), email, loginMethod: 'manual', createdAt: new Date().toISOString() }, ...users]);
    }

    const servers = loadServers();
    const server = {
      id: createReference(),
      ownerEmail: email,
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      status: 'provisioning' as const,
      createdAt: new Date().toISOString(),
      nodeName: serverName || 'Default Node',
    };
    saveServers([server, ...servers]);
    setStep('complete');
    setStatus(`Payment confirmed. User and server "${serverName || selectedPlan.title}" created.`);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/background.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      <div className="container mx-auto px-4 py-20 pt-32 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <CreditCard className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold">{selectedPlan.title}</h1>
          <p className="text-gray-300 mt-3">Start from ₹{selectedPlan.priceINR} with automatic order tracking.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-400" /> Order details</h2>
            <form onSubmit={submitDetails} className="space-y-4">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Customer email" className="w-full rounded-lg bg-black/30 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500" />
              <input value={serverName} onChange={e => setServerName(e.target.value)} type="text" placeholder="Default server name" className="w-full rounded-lg bg-black/30 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500" />
              <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} type="text" placeholder="Payment reference / UTR (optional)" className="w-full rounded-lg bg-black/30 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg px-4 py-3 font-semibold">
                Create payment request
              </button>
            </form>

            <p className="mt-4 text-sm text-gray-400">
              Auto-identification needs your payment webhook/verification URL in config.js. This page is wired to check that endpoint when you confirm payment.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-blue-400" /> Payment flow</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-700 bg-black/20 p-4">
                <div className="text-sm text-gray-400">Provider</div>
                <div className="text-lg font-semibold">{config.payment.providerName}</div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-black/20 p-4">
                <div className="text-sm text-gray-400">Amount</div>
                <div className="text-lg font-semibold">₹{selectedPlan.priceINR}</div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-black/20 p-4">
                <div className="text-sm text-gray-400">Order status</div>
                <div className="text-lg font-semibold">{step}</div>
              </div>

              {createdOrder && (
                <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 space-y-2">
                  <div><span className="text-gray-300">Order ID:</span> {createdOrder.id}</div>
                  <div><span className="text-gray-300">Payment ref:</span> {createdOrder.paymentRef}</div>
                  <div><span className="text-gray-300">Customer:</span> {createdOrder.email}</div>
                </div>
              )}

              <button onClick={confirmPayment} disabled={!createdOrder} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors rounded-lg px-4 py-3 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Confirm payment and provision
              </button>

              <Link to="/login" className="block text-center text-blue-300 hover:text-blue-200">Need to sign in first? Open the login page.</Link>
            </div>
          </motion.div>
        </div>

        {status && <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-blue-100">{status}</div>}
      </div>
    </div>
  );
};

export default OrderPage;
