'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Zap, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Activity, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Monitor, 
  Plus, 
  Save, 
  Trash2, 
  ShieldCheck, 
  ChevronRight, 
  UserPlus, 
  LayoutGrid, 
  Minus, 
  Check, 
  RefreshCw, 
  Cpu,
  Clock,
  ArrowRightLeft,
  Database,
  Pin,
  Star,
  Gift,
  Copy
} from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

const api = axios.create({
  baseURL: typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api/admin'
    : (process.env.NEXT_PUBLIC_API_URL 
        ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api/admin') 
           ? process.env.NEXT_PUBLIC_API_URL 
           : (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') 
              ? `${process.env.NEXT_PUBLIC_API_URL}/admin` 
              : `${process.env.NEXT_PUBLIC_API_URL}/api/admin`))
        : 'https://hellopay-neural-api.onrender.com/api/admin'),
});

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stagedCount, setStagedCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/login');
    }
  }, [router]);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [statsRes, configRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/config')
      ]);
      setStats(statsRes.data);
      if (configRes.data) {
         const plans = (configRes.data.stockPlans || []).map((p: any) => ({
           ...p, isActive: p.isActive !== undefined ? p.isActive : true
         }));
         setConfig({ ...configRes.data, stockPlans: plans });
      } else {
         // Handle empty response gracefully
         setConfig({ stockPlans: [], globalCashbackPercent: 4 });
      }
    } catch (err) {
      console.error('Initial data fetch failed');
      // Prevent UI crash on data failure by providing functional defaults
      setConfig({ stockPlans: [], globalCashbackPercent: 4 });
    } finally {
      setIsLoading(false);
    }
  };

  const [paymentAlerts, setPaymentAlerts] = useState<any[]>([]);

  const dismissAlert = (id: string) => {
    setPaymentAlerts(prev => prev.filter(a => a.id !== id));
  };

  // =============================================================
  // 🔊 ADMIN ALARM ENGINE — Max-volume 5-second repeating alarm
  // =============================================================
  const playAdminAlarm = (durationSeconds = 5) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Compressor: maximizes perceived loudness without distortion
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -6;
      compressor.knee.value     = 0;
      compressor.ratio.value    = 20;
      compressor.attack.value   = 0.001;
      compressor.release.value  = 0.1;
      compressor.connect(ctx.destination);

      const beepEvery  = 0.4;  // one complete beep every 400ms
      const beepOn     = 0.25; // beep tone for 250ms
      const totalBeeps = Math.floor(durationSeconds / beepEvery);

      for (let i = 0; i < totalBeeps; i++) {
        const t = ctx.currentTime + i * beepEvery;
        
        // Alternate HIGH (1047Hz) and MID (880Hz) for urgent alarm feel
        const freq = i % 2 === 0 ? 1047 : 880;

        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(compressor);

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        // Sharp attack, hold, fast release
        gain.gain.setValueAtTime(0,    t);
        gain.gain.linearRampToValueAtTime(1.0, t + 0.01);
        gain.gain.setValueAtTime(1.0,  t + beepOn - 0.03);
        gain.gain.linearRampToValueAtTime(0,   t + beepOn);

        osc.start(t);
        osc.stop(t + beepOn);
      }
    } catch (e) {
      // Fallback: loop MP3 for duration
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 1.0;
        audio.loop   = true;
        audio.play().catch(() => {});
        setTimeout(() => { audio.pause(); audio.currentTime = 0; }, durationSeconds * 1000);
      } catch (e2) {}
    }
  };

  useEffect(() => {
    fetchData();
    const socketUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.split('/api')[0] 
      : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : 'https://hellopay-neural-api.onrender.com');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10
    });

    socket.on('userStatusChanged', (data) => {
      console.log('[NEURAL] Signal Received: Identity Status Update', data);
      fetchData(true); 
    });

    socket.on('new_payment_submitted', (data) => {
      console.log('[NEURAL] Alarm Signal: New Manual Payment Proof Submitted', data);
      
      // 🔊 LOUD 5-Second Repeating Alarm
      playAdminAlarm(5);
      
      // Notification Alert
      if (Notification.permission === 'granted') {
         new Notification('🚨 NEURAL ALARM: New Payment Proof', { body: `Amount: ₹${data.amount} | UTR: ${data.utr}` });
      }
      
      fetchData(true);
      if (activeTab === 'verification') {
        const event = new CustomEvent('refresh_verification');
        window.dispatchEvent(event);
      }
    });

    // 🔔 Payment Session Alert — user entered payment section
    socket.on('new_payment_session', (data) => {
      console.log('[NEURAL] 🔔 Payment Session Initiated:', data);
      
      // 🔊 LOUD 5-Second Repeating Alarm
      playAdminAlarm(5);

      // Add to alert stack
      const alertId = `ps_${Date.now()}`;
      setPaymentAlerts(prev => [{ id: alertId, ...data, ts: new Date() }, ...prev.slice(0, 4)]);

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setPaymentAlerts(prev => prev.filter(a => a.id !== alertId));
      }, 8000);

      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('⚡ Payment Session Started', { 
          body: `${data.userName} is paying ₹${data.amount} — Monitor now!`,
          icon: '/favicon.ico'
        });
      }
    });

    // Request Notification Permissions
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
       Notification.requestPermission();
    }

    socket.on('userDeleted', (data) => {
      console.log('[NEURAL] Signal Received: Entity Terminated', data);
      fetchData(true);
    });

    socket.on('configUpdated', () => {
      console.log('[NEURAL] Signal Received: Global Parameters Updated');
      fetchData(true);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleGlobalPush = async () => {
    setIsSaving(true);
    try {
      await api.put('/config', config);
      setStagedCount(0);
      alert('Neural Core Synchronized Successfully');
    } catch (err) {
      alert('Propagation Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = async (newConfig: any) => {
    setConfig(newConfig);
    setStagedCount(prev => prev + 1);
    
    // Instant Neural Sync: Auto-save to backend
    try {
      await api.put('/config', newConfig);
      setStagedCount(0);
    } catch (err) {
      console.error('Auto-sync failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 overflow-hidden flex">

      {/* ⚡ Payment Session Alert Stack */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{maxWidth: '380px'}}>
        <AnimatePresence>
          {paymentAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.85 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto relative overflow-hidden cursor-pointer"
              onClick={() => { setActiveTab('verification'); dismissAlert(alert.id); }}
            >
              {/* Glow border */}
              <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-amber-400/60 via-orange-500/40 to-red-500/30 blur-[2px]" />
              <div className="relative bg-gradient-to-br from-slate-900 to-[#0a0a1a] rounded-[28px] p-5 shadow-2xl border border-amber-500/20 overflow-hidden">
                {/* Animated background pulse */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] animate-pulse" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-ping absolute" />
                      <div className="w-3 h-3 bg-amber-400 rounded-full relative" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400">Live Payment Alert</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                    className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all text-xs font-black"
                  >✕</button>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-amber-400 italic shrink-0">
                      {alert.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-black text-base leading-none tracking-tight">{alert.userName}</p>
                      <p className="text-slate-400 text-[10px] font-medium mt-1">Entered payment checkout</p>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Amount Due</p>
                      <p className="text-3xl font-black italic text-white tracking-tighter">₹{alert.amount}</p>
                    </div>
                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mb-0.5">Type</p>
                      <p className="text-[10px] font-black text-amber-300 uppercase">
                        {alert.type === 'stock_buy' ? '📦 Stock Buy' : '💳 Recharge'}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-2xl text-center transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">⚡ Click to Monitor Payment</span>
                  </div>

                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-2 text-center">
                    Auto-dismisses in 8s • {new Date(alert.ts).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed bottom-8 right-8 z-[100] w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-slate-900 active:scale-90 transition-all"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <XCircle size={28} /> : <LayoutGrid size={28} />}
      </button>

      {/* Sidebar - Transition for mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#030712] border-r border-white/5 flex flex-col p-8 shadow-2xl transition-transform duration-500 lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
           <div className="flex items-center gap-4 mb-20 px-8">
              <div className="w-14 h-14 bg-blue-600 rounded-[20px] shadow-[0_20px_40px_rgba(37,99,235,0.4)] flex items-center justify-center">
                 <Zap size={28} className="text-white fill-white" />
              </div>
              <div>
                 <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">HelloPay</h1>
                 <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1 block">Admin Registry</span>
              </div>
           </div>

        <nav className="flex-1 space-y-3">
          <SidebarLink icon={<LayoutDashboard size={20}/>} label="Neural Dash" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<Users size={20}/>} label="Entity Registry" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<Database size={20}/>} label="Stock Management" active={activeTab === 'stocks'} onClick={() => { setActiveTab('stocks'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<Zap size={20}/>} label="Splitup Processor" active={activeTab === 'splitup'} onClick={() => { setActiveTab('splitup'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<LayoutGrid size={20}/>} label="Asset Manager" active={activeTab === 'assets'} onClick={() => { setActiveTab('assets'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<ShieldCheck size={20}/>} label="Payment Verification" active={activeTab === 'verification'} onClick={() => { setActiveTab('verification'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<Gift size={20}/>} label="Gift Signals" active={activeTab === 'gift-codes'} onClick={() => { setActiveTab('gift-codes'); setIsSidebarOpen(false); }} />
          <SidebarLink icon={<Settings size={20}/>} label="Admin Limits" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="mt-auto">
          <SidebarLink 
            icon={<LogOut size={20}/>} 
            label="Terminate" 
            active={false} 
            onClick={() => {
              if(confirm('Terminate Current Session?')) {
                localStorage.removeItem('admin_auth');
                router.push('/login');
              }
            }} 
          />
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - No margin-left needed when sidebar is static/flex */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto max-h-screen custom-scrollbar relative overflow-x-hidden">
        <div className="flex justify-between items-center mb-16 relative z-10">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
            <input 
              type="text" 
              placeholder="Query Node..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 lg:py-5 pl-16 pr-8 bg-slate-900/40 border border-white/5 rounded-[32px] text-sm focus:outline-none focus:border-blue-500/40 transition-all font-medium" 
            />
          </div>

          <div className="flex items-center gap-8">

            <motion.button 
              animate={stagedCount > 0 ? { scale: [1, 1.05, 1], boxShadow: '0 0 30px rgba(37,99,235,0.4)' } : {}}
              onClick={handleGlobalPush}
              disabled={isSaving || !config}
              className="flex items-center gap-4 px-12 py-5 bg-blue-600 rounded-[32px] text-white font-black text-[12px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all relative"
            >
              <Save size={18}/> {isSaving ? 'PUBLISHING...' : `Push Final Sync`}
              {stagedCount > 0 && (
                 <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-[11px] font-black italic border-2 border-[#020617] animate-bounce shadow-2xl">
                   {stagedCount}
                 </div>
              )}
            </motion.button>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xs text-white">DP</div>
          </div>
        </div>

        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
              <RefreshCw className="text-blue-500 animate-spin" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 animate-pulse">Establishing Signal...</p>
           </div>
        ) : (
          <div className="relative z-10">
            <AnimatePresence mode="wait">
               {activeTab === 'dashboard' && <DashboardView key="dash" stats={stats} />}
               {activeTab === 'users' && <UserRegistry key="users" searchQuery={searchQuery} />}
               {activeTab === 'stocks' && <StockRegistry key="stocks" searchQuery={searchQuery} />}
               {activeTab === 'splitup' && <SplitupRegistry key="splitup" searchQuery={searchQuery} />}
               {activeTab === 'assets' && <AssetManager key="assets" config={config} setConfig={handleConfigChange} />}
               {activeTab === 'verification' && <PaymentVerificationView key="verification" searchQuery={searchQuery} />}
               {activeTab === 'gift-codes' && <GiftCodeManager key="gift-codes" searchQuery={searchQuery} />}
               {activeTab === 'settings' && <OperationsCenter key="settings" config={config} setConfig={handleConfigChange} />}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Dashboard View ---
function DashboardView({ stats }: any) {
  const chartData = stats?.dailyStats || [{ name: '00:00', val: 400 }, { name: '12:00', val: 900 }, { name: '23:59', val: 950 }];
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
        <StatCard label="Live Entities" value={stats?.totalUsers || '0'} icon={<Users size={24}/>} color="blue" />
        <StatCard label="Network Flow" value={`₹${stats?.totalTransferred?.toLocaleString() || '0'}`} icon={<CreditCard size={24}/>} color="amber" />
        <StatCard label="Neural Profit" value={`₹${stats?.totalAdminProfit?.toLocaleString() || '0'}`} icon={<Zap size={24}/>} color="emerald" />
        <StatCard label="Released Yield" value={`₹${stats?.totalCashbackGiven?.toLocaleString() || '0'}`} icon={<Plus size={24}/>} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-[#030712] border border-white/5 rounded-[40px] lg:rounded-[56px] p-6 lg:p-12 h-[400px] lg:h-[500px]">
          <h3 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter mb-8 lg:mb-12">Throughput</h3>
          <ResponsiveContainer width="100%" height="80%">
             <AreaChart data={chartData}><Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#1e3a8a22" strokeWidth={5} /></AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#030712] border border-white/5 rounded-[56px] p-10 flex flex-col h-[500px]">
           <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10 pb-8 border-b border-white/5 flex items-center gap-4"><Terminal size={24}/> Neural Logs</h3>
           <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide font-mono text-[11px]">
              <LogItem type="success" msg="Signal: AUTH_NODE_X92" timestamp="LIVE" />
              <LogItem type="info" msg="Connecting Liquidity_SYNC..." timestamp="LIVE" />
              <LogItem type="warning" msg="Manual Override ACTIVE" timestamp="LIVE" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserRegistry({ searchQuery }: { searchQuery: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try { const { data } = await api.get('/users'); setUsers(data); } catch (err) {}
    };
    fetchUsers();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkAction = async (action: 'delete' | 'block' | 'unblock') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Terminate ${selectedIds.length} Identity Nodes? This action is IRREVERSIBLE.`)) return;
    
    try {
      await api.post('/users/bulk-action', { ids: selectedIds, action });
      alert(`Bulk ${action} successful`);
      setSelectedIds([]);
      // Refresh list
      const { data } = await api.get('/users'); setUsers(data);
    } catch (err) {
      alert('Bulk action failed');
    }
  };
  const handleBlock = async (id: string, isBlocked: boolean) => {
    // Neural Flash Update: Flip status instantly
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: !isBlocked } : u));
    
    try { 
      await api.put(`/user/${id}/block`); 
    } catch (err) {
      console.error('[NEURAL] Sync Error - Rolling back lockdown');
      // Revert if API fails
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: isBlocked } : u));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Initiating Neural Termination for ${name}. Proceed?`)) return;
    
    // Neural Flash Update: Purge from vision instantly
    const backup = [...users];
    setUsers(prev => prev.filter(u => u._id !== id));
    
    try {
      await api.delete(`/user/${id}`);
    } catch (err) {
      console.error('[NEURAL] Purge Blocked - Restoring Entity');
      setUsers(backup);
      alert('Termination Failed. Check Node connectivity.');
    }
  };

  const handleEditBalance = async (id: string, currentBalance: number) => {
    const newAmount = prompt(`Neural Override: Input New Balance for Node (₹)`, currentBalance.toString());
    if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
      try {
        const { data } = await api.put(`/user/${id}/balance`, { amount: parseFloat(newAmount) });
        setUsers(prev => prev.map(u => u._id === id ? { ...u, walletBalance: data.walletBalance } : u));
      } catch (err: any) {
        alert(err.response?.data?.message || 'Neural Injection Failed');
      }
    }
  };

  const handleAddBalance = async (id: string, currentBalance: number) => {
    const addAmount = prompt(`Neural Injection: Input Amount to ADD to Node (₹)`);
    if (addAmount !== null && !isNaN(parseFloat(addAmount))) {
      const addVal = parseFloat(addAmount);
      
      // Neural Flash Update: Credit balance instantly
      setUsers(prev => prev.map(u => u._id === id ? { ...u, walletBalance: u.walletBalance + addVal } : u));

      try {
        await api.put(`/user/${id}/balance`, { amount: currentBalance + addVal });
      } catch (err: any) {
        console.error('[NEURAL] Credit Injection Failed - Reverting Flow');
        setUsers(prev => prev.map(u => u._id === id ? { ...u, walletBalance: u.walletBalance - addVal } : u));
        alert(err.response?.data?.message || 'Neural Injection Failed');
      }
    }
  };

  const handleForceResplit = async (id: string, name: string) => {
    if (!confirm(`Force a Neural Resplit for ${name}? This regroups their wallet into random unified parts.`)) return;
    try {
      const res = await api.post(`/user/${id}/resplit`);
      alert(`Success: ${res.data.message}`);
    } catch (err) {
      alert('Neural Resplit Failed.');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
    (u.userIdNumber?.toString().includes(searchQuery) || false)
  );

  const Badge = ({ label, val, color }: any) => {
    const colors: any = { indigo: 'bg-indigo-500/10 text-indigo-400', amber: 'bg-amber-500/10 text-amber-500', blue: 'bg-blue-500/10 text-blue-400', emerald: 'bg-emerald-500/10 text-emerald-400', red: 'bg-red-500/10 text-red-400', slate: 'bg-white/5 text-slate-500' };
    return <div className={`px-4 py-2 rounded-xl flex flex-col border border-white/5 ${colors[color] || colors.slate}`}>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</span>
      <span className="text-[11px] font-black tabular-nums truncate">{val}</span>
    </div>;
  };

  const ActionBtn = ({ icon, color, onClick, title }: any) => {
    const colors: any = { blue: 'bg-blue-600 shadow-blue-500/20', amber: 'bg-orange-500 shadow-orange-500/20', emerald: 'bg-emerald-500 shadow-emerald-500/20', red: 'bg-rose-600 shadow-rose-500/20', slate: 'bg-slate-800 text-slate-400' };
    return <button onClick={onClick} title={title} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all active:scale-75 hover:scale-110 shadow-xl ${colors[color] || colors.slate}`}>{icon}</button>;
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">Entity <span className="text-blue-600 italic">Registry</span> <span className="text-sm font-mono text-slate-500 opacity-50 ml-4 font-normal not-italic tracking-widest">({users.length} NODES)</span></h2>
        
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 bg-slate-900 border border-blue-500/30 p-4 rounded-[32px] shadow-2xl shadow-blue-500/20">
            <span className="text-[10px] font-black uppercase tracking-widest px-4 text-blue-400">{selectedIds.length} Selected</span>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <button onClick={() => bulkAction('block')} className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all">Block Items</button>
            <button onClick={() => bulkAction('unblock')} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Unblock</button>
            <button onClick={() => bulkAction('delete')} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Terminate</button>
          </motion.div>
        )}

        <button onClick={toggleSelectAll} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
          {selectedIds.length === filteredUsers.length ? 'Deselect All' : 'Select All Filtered'}
        </button>
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div key={user._id} className={`bg-[#030712] border p-5 rounded-3xl flex flex-col xl:flex-row items-start xl:items-center justify-between shadow-2xl group transition-all gap-5 relative overflow-hidden ${selectedIds.includes(user._id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/5 hover:border-blue-500/20'}`}>
             
             {/* Multi-Select Checkbox */}
             <div 
                onClick={() => toggleSelect(user._id)} 
                className={`w-10 h-10 rounded-xl border-4 flex items-center justify-center cursor-pointer transition-all shrink-0 ${selectedIds.includes(user._id) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-white/10 text-transparent hover:border-blue-500 hover:text-white/10'}`}
             >
                <Check size={24} />
             </div>

             {/* Profile Zone */}
             <div className="flex items-center gap-6 min-w-[280px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl italic uppercase shadow-inner ${user.isBlocked ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-blue-500'}`}>{user.name ? user.name[0] : '?'}</div>
                <div>
                   <h4 className={`text-xl font-black italic tracking-tighter transition-all ${user.isBlocked ? 'text-red-500 underline decoration-red-500/50' : 'text-white'}`}>{user.name}</h4>
                   <div className="flex items-center gap-3 mt-1.5">
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-slate-600 uppercase tracking-widest">ID_{user.userIdNumber}</div>
                      <div className={`px-3 py-1 border rounded-lg text-[10px] font-mono uppercase tracking-widest ${user.phone?.startsWith('GUEST_') ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                         {user.phone?.startsWith('GUEST_') ? 'GUEST' : 'REGISTERED'}
                      </div>
                   </div>
                </div>
             </div>

             {/* Meta Zone */}
             <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <Badge label="REF CODE" val={user.referralCode || 'N/A'} color="indigo" />
                <Badge label="EARNINGS" val={`₹${user.referralEarnings || 0}`} color="amber" />
                <Badge label="UPI VPA" val={user.upiId || 'NOT_SET'} color="blue" />
                <Badge label="SECURITY (PIN)" val={user.pin || 'NOT_SET'} color={user.pin ? 'emerald' : 'red'} />
             </div>

             {/* Performance Zone */}
             <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                <div onClick={() => {
                   const val = prompt(`Referral % for ${user.name}:`, user.referralPercent || 4);
                   if (val && !isNaN(parseFloat(val))) api.put(`/users/${user._id}/percents`, { referralPercent: parseFloat(val) }).then(fetchUsers);
                }} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">REF: {user.referralPercent || 4}%</div>
                <div onClick={() => {
                   const val = prompt(`Profit % for ${user.name}:`, user.profitPercent || 8);
                   if (val && !isNaN(parseFloat(val))) api.put(`/users/${user._id}/percents`, { profitPercent: parseFloat(val) }).then(fetchUsers);
                }} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase cursor-pointer hover:bg-emerald-600 hover:text-white transition-all">PROF: {user.profitPercent || 8}%</div>
             </div>

             {/* Action Zone - Fixed Alignment */}
             <div className="flex items-center gap-8 pl-8 border-l border-white/5 h-20">
                <div className="flex flex-col items-end min-w-[120px] cursor-pointer group/vault" onClick={() => handleEditBalance(user._id, user.walletBalance)}>
                   <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.3em] mb-1">Digital Vault</span>
                   <div className="flex items-center gap-3">
                      <span className={`text-4xl font-black italic tabular-nums ${user.isBlocked ? 'text-red-400' : 'text-white'}`}>₹{user.walletBalance.toLocaleString()}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                   <ActionBtn icon={<Plus size={20}/>} color="blue" title="Add Credits" onClick={() => handleAddBalance(user._id, user.walletBalance)} />
                   <ActionBtn icon={<Cpu size={20}/>} color="amber" title="Neural Resplit" onClick={() => handleForceResplit(user._id, user.name)} />
                   <ActionBtn icon={user.isBlocked ? <ShieldCheck size={24}/> : <XCircle size={24}/>} color={user.isBlocked ? 'emerald' : 'red'} title="Lock/Unlock" onClick={() => handleBlock(user._id, !!user.isBlocked)} />
                   <button onClick={() => handleDelete(user._id, user.name)} className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center outline-none border border-white/5"><Trash2 size={20}/></button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// --- Asset Manager ---
function AssetManager({ config, setConfig }: any) {
  const addPlan = () => {
    const amount = prompt('Input Neural Asset Amount (₹)');
    if (amount && !isNaN(parseInt(amount))) {
      const amtNum = parseInt(amount);
      const newPlan = { amount: amtNum, code: `SIG${amtNum}`, isDefault: false, isActive: true };
      const currentPlans = config?.stockPlans || [];
      setConfig({ ...config, stockPlans: [...currentPlans, newPlan] });
    }
  };
  const setPlanActive = (idx: number, status: boolean, e: any) => {
    e.stopPropagation();
    const newPlans = [...(config?.stockPlans || [])]; 
    if (newPlans[idx]) {
      newPlans[idx] = { ...newPlans[idx], isActive: status };
      setConfig({ ...config, stockPlans: newPlans });
    }
  };
  const removePlan = (idx: number, e: any) => {
    e.stopPropagation();
    const newPlans = (config?.stockPlans || []).filter((_: any, i: number) => i !== idx);
    setConfig({ ...config, stockPlans: newPlans });
  };
  const initializeSystemStock = async () => {
    const amountStr = prompt('Input System Stock Initialization Amount (₹) (Must be multiple of 100)');
    if (amountStr && !isNaN(parseInt(amountStr))) {
      const amount = parseInt(amountStr);
      try {
        await api.post('/stocks', { amount });
        alert('System Stock Initialized successfully!');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to initialize stock. Did you set your UPI ID in User App?');
      }
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
         <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Asset <span className="text-blue-500">Commander</span></h2>
         <div className="flex gap-4">
           <button onClick={initializeSystemStock} className="px-12 py-5 bg-emerald-600 border border-emerald-500/20 rounded-[32px] text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all font-mono shadow-lg shadow-emerald-500/20">Init Stock</button>
           <button onClick={addPlan} className="px-12 py-5 bg-white/5 border border-white/10 rounded-[32px] text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all font-mono">Inject Proposal</button>
         </div>
      </div>
      <div className="grid grid-cols-4 gap-10">
        {config?.stockPlans?.map((plan: any, i: number) => (
          <div key={i} className={`group relative p-10 rounded-[56px] border transition-all duration-700 ${plan.isActive ? 'bg-[#030712] border-indigo-600 shadow-indigo-500/10 shadow-2xl' : 'bg-slate-900/40 border-white/5 opacity-40 grayscale'}`}>
             <button 
                onClick={(e) => removePlan(i, e)} 
                className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95 z-20"
             >
                <Trash2 size={20} />
             </button>
             <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center italic font-black text-4xl mb-8 ${plan.isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-white/5 text-slate-800'}`}>₹</div>
             <h4 className={`text-4xl font-black italic tabular-nums mb-8 ${plan.isActive ? 'text-white' : 'text-slate-600'}`}>₹{plan.amount}</h4>
             <div className="flex gap-4">
                <button onClick={(e) => setPlanActive(i, true, e)} className={`flex-1 h-14 rounded-2xl flex items-center justify-center transition-all ${plan.isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-400/20' : 'bg-white/5 text-slate-600 hover:bg-blue-500/20'}`}><Check size={24}/></button>
                <button onClick={(e) => setPlanActive(i, false, e)} className={`flex-1 h-14 rounded-2xl flex items-center justify-center transition-all ${!plan.isActive ? 'bg-red-600 text-white shadow-xl shadow-red-400/20' : 'bg-white/5 text-slate-600 hover:bg-red-500/20'}`}><Minus size={24}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Payment Verification View ---
function PaymentVerificationView({ searchQuery }: { searchQuery: string }) {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const backendUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
    ? 'http://localhost:5000' 
    : 'https://hellopay-neural-api.onrender.com';

  const fetchTxs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/transactions');
      // Include BOTH manual recharges and stock rotations
      setTxs(data.filter((t: any) => 
        t.status === 'PENDING' || 
        t.status === 'PENDING_VERIFICATION' || 
        t.status === 'PENDING_PAYMENT' ||
        (t.type === 'add_money' && t.screenshotUrl) ||
        (t.type === 'buy_stock' && t.screenshotUrl)
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Failed to fetch transactions');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const socket = io(backendUrl);
    fetchTxs();
    
    socket.on('new_payment_submitted', () => {
      console.log('[NEURAL] New Proof Signal - Refreshing Verification Hub');
      fetchTxs(true);
    });

    const refreshHandler = () => fetchTxs(true);
    window.addEventListener('refresh_verification', refreshHandler);

    return () => { 
      socket.disconnect(); 
      window.removeEventListener('refresh_verification', refreshHandler);
    };
  }, []);

  const [actionId, setActionId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'SUCCESS' | 'FAILED') => {
    setActionId(id);
    try {
      if (action === 'SUCCESS') {
        await api.post(`/payments/approve/${id}`);
      } else {
        const reason = prompt('Specify Rejection Logic Parameter:');
        await api.post(`/payments/reject/${id}`, { reason });
      }
      fetchTxs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Neural Override Failed');
    } finally {
      setActionId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} neural records?`)) return;
    try {
      await api.post('/transactions/bulk-action', { ids: selectedIds, action: 'delete' });
      fetchTxs();
      setSelectedIds([]);
    } catch (err) {
      alert('Neural Bulk Deletion Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Purge this record from matrix?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTxs();
    } catch (err) {
      alert('Purge Sequence Failed');
    }
  };

  const filteredTxs = txs.filter(tx => 
    tx.buyerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.sellerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.utr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <RefreshCw className="text-blue-500 animate-spin" size={48} />
       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Syncing Verification Hub...</p>
    </div>
  );

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Neural Domain Resolver: Priority to Env > Local > Hardcoded Fallback
    const apiBase = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')) || 
                    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                      ? 'http://localhost:5000' 
                      : 'https://hellopay-neural-api.onrender.com');
    
    const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    const pathStr = String(path);
    const p = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    const cleanPath = p.replace(/\\/g, '/'); // Fix Windows-style slashes
    return `${base}${cleanPath}`;
  };

  return (
    <div className="space-y-12">
       <div className="flex justify-between items-center bg-slate-900/40 p-8 rounded-[40px] border border-white/5">
          <div className="flex items-center gap-10">
            <div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Payment <span className="text-blue-600">Verification</span></h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
                <Activity size={14} className="text-emerald-500 animate-pulse" /> Auto-Verify Engine Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             {selectedIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="px-8 py-4 bg-red-600/20 text-red-500 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-xl"
                >
                  <Trash2 size={16} /> Delete Selected ({selectedIds.length})
                </button>
             )}
             <button onClick={() => fetchTxs()} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400">
                <RefreshCw size={20} />
             </button>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {filteredTxs.map((tx) => (
          <div key={tx._id} className={`group bg-[#030712] border rounded-[48px] overflow-hidden shadow-2xl flex flex-col xl:flex-row h-auto xl:h-[450px] transition-all relative ${tx.status === 'PENDING_VERIFICATION' ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-white/5'}`}>
            
            {/* Multi-Select Overlay */}
            <div 
              onClick={() => toggleSelect(tx._id)}
              className={`absolute top-8 left-8 z-[100] w-12 h-12 rounded-2xl border-4 cursor-pointer flex items-center justify-center transition-all ${selectedIds.includes(tx._id) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-white/20 text-transparent hover:border-blue-500 hover:text-white/20'}`}
            >
               <Check size={28} />
            </div>

            {/* Individual Delete */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(tx._id); }}
              className="absolute top-8 right-8 z-50 p-3 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
               <Trash2 size={16} />
            </button>

            {/* Screenshot Area */}
            <div className={`w-full xl:w-[380px] h-[300px] xl:h-full bg-slate-950 flex flex-col items-center justify-center border-r border-white/5 relative group shrink-0 ${selectedIds.includes(tx._id) ? 'opacity-40' : ''}`}>
                {(tx.screenshot || tx.screenshotUrl) ? (
                  <img 
                    src={getImageUrl(tx.screenshot || tx.screenshotUrl)} 
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-all duration-500" 
                    alt="Proof" 
                  />
               ) : (
                  <div className="text-slate-700 italic font-black uppercase tracking-widest text-xs">Awaiting Signal Image</div>
               )}
               <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black text-white italic uppercase tracking-[0.2em] shadow-2xl">Signal Capture</div>
               {(tx.screenshot || tx.screenshotUrl) && (
                 <a 
                   href={getImageUrl(tx.screenshot || tx.screenshotUrl)} 
                   target="_blank" 
                   rel="noreferrer"
                   className="absolute bottom-6 bg-blue-600/20 hover:bg-blue-600 p-3 rounded-xl border border-blue-500/30 opacity-0 group-hover:opacity-100 transition-all"
                 >
                   <Search size={18} />
                 </a>
               )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
               <div>
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            tx.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                          }`}>
                            {tx.status?.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">ID: {tx.transactionId || String(tx._id).slice(-8)}</span>
                       </div>
                       <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                          {tx.type === 'add_money' ? 'Wallet Recharge' : 'Node Purchase'} {tx.stockId?.stockId && <span className="text-amber-500">[{tx.stockId.stockId}]</span>}
                          <span className="text-blue-500">₹{tx.amount?.toLocaleString()}</span>
                       </h3>
                       {tx.isOcrVerified && (
                          <div className="mt-2 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">AI OCR MATCH 100% CONFIDENCE</span>
                          </div>
                       )}
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Timestamp</p>
                       <p className="text-xs font-mono text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit Seller (User A)</p>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">S</div>
                          <div className="truncate">
                             <p className="text-sm font-black text-white truncate">{tx.sellerId?.name || 'Admin Hub'}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-mono text-slate-600">ID: {tx.sellerId?.userIdNumber || '******'}</p>
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold">PIN: {tx.sellerId?.pin || '????'}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit Buyer (User B)</p>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xs">B</div>
                          <div className="truncate">
                             <p className="text-sm font-black text-white truncate">{tx.buyerId?.name || 'Anonymous'}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-mono text-slate-600">ID: {tx.buyerId?.userIdNumber || '******'}</p>
                                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-bold">PIN: {tx.buyerId?.pin || '????'}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Signal Reference (UTR)</p>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Pin size={16} />
                           </div>
                           <p className="text-sm font-black text-amber-400 font-mono tracking-tight">{tx.utr || 'NOT_SUBMITTED'}</p>
                        </div>
                     </div>
                 </div>

                  {/* Feature: APK Metadata Tracking (Rule 6) */}
                  <div className="flex items-center gap-4 mb-6">
                     <div className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${tx.deviceId ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                           {tx.deviceId ? `APK LINKED [${tx.deviceId.slice(0, 8)}]` : 'WEB SOURCE'}
                        </span>
                     </div>
                     {tx.ipAddress && (
                        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                           <Activity size={12} className="text-slate-500" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IP: {tx.ipAddress}</span>
                        </div>
                     )}
                     {tx.description?.includes('APK Auto-SMS') && (
                        <div className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                           <Zap size={12} className="text-emerald-500" />
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">AUTO SIGNAL DETECTED</span>
                        </div>
                     )}
                  </div>
               </div>

                {['PENDING', 'PENDING_VERIFICATION', 'PENDING_PAYMENT'].includes(tx.status) ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAction(tx._id, 'SUCCESS')}
                      disabled={actionId === tx._id}
                      className="flex-[2] h-16 bg-emerald-600 rounded-2xl flex items-center justify-center gap-3 text-white font-black italic uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all shadow-emerald-500/10 disabled:opacity-50"
                    >
                      {actionId === tx._id ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                      Approve Signal
                    </button>
                    <button 
                      onClick={() => handleAction(tx._id, 'FAILED')}
                      disabled={actionId === tx._id}
                      className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-red-500 font-black italic uppercase text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                      {actionId === tx._id ? <RefreshCw className="animate-spin" size={18} /> : <XCircle size={18} />}
                      Reject Signal
                    </button>
                  </div>
                ) : (
                  <div className="py-6 px-10 bg-white/5 rounded-[32px] border border-white/5 text-center flex flex-col justify-center w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-2">Neural Processed</p>
                    <div className={`text-2xl font-black italic uppercase tracking-tighter ${tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
                       Signal {tx.status}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}
        {filteredTxs.length === 0 && (
           <div className="py-40 text-center bg-slate-900/40 rounded-[56px] border-2 border-dashed border-white/5">
              <Activity size={48} className="mx-auto text-slate-800 mb-6" />
              <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-700 italic">No neural verification tasks in buffer</p>
           </div>
        )}
      </div>
    </div>
  );
}

function SignalField({ label, val, expected, match, color }: any) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-4">
       <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-slate-600 mb-1 tracking-widest">{label}</span>
          <span className={`text-[12px] font-black italic ${color ? color : (match === true ? 'text-emerald-500' : match === false ? 'text-rose-500' : 'text-white')}`}>{val}</span>
       </div>
       {expected && (
          <div className="text-right">
             <span className="text-[9px] font-black uppercase text-slate-600 mb-1 tracking-widest">Expected</span>
             <span className="text-[11px] font-mono text-slate-400">{expected}</span>
          </div>
       )}
    </div>
  );
}
// --- Operations Center ---
function OperationsCenter({ config, setConfig }: any) {
  if (!config) return null;
  return (
    <div className="bg-[#030712] border border-white/5 rounded-[56px] p-20 shadow-2xl relative overflow-hidden">
       <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white mb-20 leading-tight">System <span className="text-blue-500">Params</span></h2>
       <div className="grid grid-cols-3 gap-8 mb-20">
         <div className="p-10 lg:p-12 bg-black/40 border border-white/5 rounded-[56px] shadow-inner">
            <div className="flex justify-between items-end mb-10">
               <div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Yield Matrix (%)</span><div className="text-4xl lg:text-5xl font-black text-white italic tabular-nums">{config.globalCashbackPercent || 0}%</div></div>
            </div>
            <input type="range" min="0" max="30" step="1" value={config.globalCashbackPercent || 0} onChange={(e) => setConfig({...config, globalCashbackPercent: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
         </div>
         <div className="p-10 lg:p-12 bg-black/40 border border-white/5 rounded-[56px] shadow-inner">
            <div className="flex justify-between items-end mb-10">
               <div><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Stock Profit (%)</span><div className="text-4xl lg:text-5xl font-black text-emerald-400 italic tabular-nums">{config.profitPercentage || 0}%</div></div>
            </div>
            <input type="range" min="1" max="50" step="1" value={config.profitPercentage || 0} onChange={(e) => setConfig({...config, profitPercentage: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
         </div>
         <div className="p-10 lg:p-12 bg-black/40 border border-white/5 rounded-[56px] shadow-inner">
            <div className="flex justify-between items-end mb-10">
               <div><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Ref Comm (%)</span><div className="text-4xl lg:text-5xl font-black text-indigo-400 italic tabular-nums">{config.referralCommissionPercent || 0}%</div></div>
            </div>
            <input type="range" min="0" max="25" step="1" value={config.referralCommissionPercent || 0} onChange={(e) => setConfig({...config, referralCommissionPercent: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
         </div>
       </div>

       {/* New Row for Bonus Controls */}
       <div className="grid grid-cols-2 gap-8 mb-20">
          <div className="p-10 lg:p-12 bg-black/40 border border-white/5 rounded-[56px] shadow-inner">
             <div className="flex justify-between items-end mb-10">
                <div><span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block">Welcome Bonus (₹)</span><div className="text-4xl lg:text-5xl font-black text-yellow-500 italic tabular-nums">₹{config.referralBonus || 100}</div></div>
             </div>
             <input type="range" min="0" max="1000" step="10" value={config.referralBonus || 100} onChange={(e) => setConfig({...config, referralBonus: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
          </div>
          <div className="p-10 lg:p-12 bg-black/40 border border-white/5 rounded-[56px] shadow-inner">
             <div className="flex justify-between items-end mb-10 text-right">
                <div className="w-full"><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">Min Deposit to Unlock Bonus</span><div className="text-4xl lg:text-5xl font-black text-blue-400 italic tabular-nums">₹{config.minDeposit || 100}</div></div>
             </div>
             <input type="range" min="0" max="500" step="10" value={config.minDeposit || 100} onChange={(e) => setConfig({...config, minDeposit: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
       </div>
       <div className="grid grid-cols-4 gap-8">
          <OpToggle label="Profit" active={config.adminProfitEnabled} onChange={() => setConfig({...config, adminProfitEnabled: !config.adminProfitEnabled})} />
          <OpToggle label="Sign" active={config.adminExtraEnabled} onChange={() => setConfig({...config, adminExtraEnabled: !config.adminExtraEnabled})} />
          <OpToggle label="In" active={config.depositEnabled} onChange={() => setConfig({...config, depositEnabled: !config.depositEnabled})} />
          <OpToggle label="Out" active={config.withdrawalEnabled} onChange={() => setConfig({...config, withdrawalEnabled: !config.withdrawalEnabled})} />
       </div>
    </div>
  );
}

// Helpers
function SidebarLink({ icon, label, active, onClick }: any) {
  return <button onClick={onClick} className={`w-full flex items-center gap-6 px-8 py-5 rounded-[24px] transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:bg-white/5'}`}>{icon} <span className="text-[13px] font-black uppercase tracking-[0.2em] italic transition-colors group-hover:text-white">{label}</span></button>;
}
function StatCard({ label, value, icon, color }: any) {
  const colors: any = { blue: 'border-blue-500/20 bg-blue-500/[0.03] text-blue-400', amber: 'border-amber-500/20 bg-amber-500/[0.03] text-amber-400', emerald: 'border-emerald-500/20 bg-emerald-500/[0.03] text-emerald-400', purple: 'border-purple-500/20 bg-purple-500/[0.03] text-purple-400' };
  return <div className={`p-10 rounded-[56px] border ${colors[color]} hover:scale-105 transition-all cursor-pointer shadow-2xl`}><div className="flex flex-col gap-10"> <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform shadow-inner">{icon}</div> <div className="space-y-1"> <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 leading-none">{label}</p> <h4 className="text-4xl font-black italic text-white leading-none mt-4 tabular-nums">{value}</h4> </div> </div> </div>;
}
function LogItem({ type, msg, timestamp }: any) {
  const col = type === 'success' ? 'text-emerald-500' : 'text-blue-500';
  return <div className="flex gap-4"><span className="text-[9px] text-slate-700 pt-0.5">[{timestamp}]</span><p className={`text-[10px] font-black ${col} italic tracking-tight`}>{msg}</p></div>;
}
function OpToggle({ label, active, onChange }: any) {
  return <button onClick={onChange} className="flex flex-col items-center justify-center p-10 bg-[#030712] border border-white/5 rounded-[56px] gap-8 hover:border-blue-500/30 transition-all flex-1 shadow-2xl group"> <span className="text-[11px] font-black uppercase text-slate-600 group-hover:text-slate-400 tracking-[0.3em]">{label}</span> <div className={`w-20 h-10 rounded-full p-1.5 transition-all flex ${active ? 'bg-blue-600 justify-end shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-800 justify-start'}`}><div className="w-7 h-7 bg-white rounded-full shadow-2xl" /></div> </button>;
}

function StockRegistry({ searchQuery }: { searchQuery: string }) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stocks/list');
      setStocks(data);
    } catch (err) {
      console.error('Neural Signal Extraction Failure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const socketUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000' : 'https://hellopay-neural-api.onrender.com';
    const socket = io(socketUrl);
    socket.on('stock_update', fetchStocks);
    return () => { socket.disconnect(); };
  }, []);

  const handleTogglePin = async (id: string) => {
    try {
      await api.put(`/stocks/${id}/pin`);
      setStocks(prev => prev.map(s => s._id === id ? { ...s, isPinned: !s.isPinned } : s));
    } catch (err) {
      alert('Neural Pin Sequence Failed');
    }
  };

  const handleDeleteStock = async (id: string, name: string) => {
    if (confirm(`Terminate Neural Node ${name}? This action is irreversible.`)) {
      try {
        await api.delete(`/stocks/${id}`);
        setStocks(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        alert('Neural Node Termination Failed');
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(s => s._id));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Terminate ${selectedIds.length} Neural Nodes?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/stocks/${id}`)));
      alert('Purge Sequence Complete');
      setSelectedIds([]);
      fetchStocks();
    } catch (err) {
      alert('Neural Bulk Purge Failed');
    }
  };

  const filtered = stocks.filter(s => 
    s.stockId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ownerId?.userIdNumber?.toString().includes(searchQuery)
  ).sort((a,b) => {
    const q = searchQuery.toLowerCase();
    // Prioritize exact Stock ID match
    const aMatch = a.stockId.toLowerCase() === q;
    const bMatch = b.stockId.toLowerCase() === q;
    if (aMatch && !bMatch) return -1;
    if (bMatch && !aMatch) return 1;
    
    // Then partial ID match
    const aPartial = a.stockId.toLowerCase().includes(q);
    const bPartial = b.stockId.toLowerCase().includes(q);
    if (aPartial && !bPartial) return -1;
    if (bPartial && !aPartial) return 1;

    return 0;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="flex justify-between items-end">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Stock <span className="text-amber-500">Inventory</span></h2>
        
        <div className="flex items-center gap-6">
           {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="px-8 py-3 bg-red-600/20 text-red-500 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-xl"
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
           )}
           <button onClick={toggleSelectAll} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-400">
             {selectedIds.length === filtered.length ? 'Deselect All' : 'Select All'}
           </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((stock) => (
          <div key={stock._id} className={`bg-[#030712] border p-6 rounded-[32px] flex items-center justify-between transition-all relative ${stock.isPinned ? 'border-amber-500/30' : 'border-white/5'} ${selectedIds.includes(stock._id) ? 'ring-2 ring-amber-500/40 border-amber-500/50' : ''}`}>
             
             {/* Multi-Select */}
             <div 
                onClick={() => toggleSelect(stock._id)}
                className={`w-12 h-12 rounded-2xl border-4 flex items-center justify-center cursor-pointer transition-all shrink-0 ${selectedIds.includes(stock._id) ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-900 border-white/10 text-transparent hover:border-amber-500 hover:text-white/10'}`}
             >
                <Check size={28} />
             </div>

             <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl italic uppercase ${stock.isPinned ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-blue-500'}`}>
                   {stock.isPinned ? <Star size={24} fill="currentColor" /> : <Database size={24} />}
                </div>
                <div>
                   <h4 className="text-xl font-black italic tracking-tighter text-white uppercase">{stock.stockId}</h4>
                   <div className="flex items-center gap-3 mt-2">
                      <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">OWNER: {stock.ownerId?.name} (ID_{stock.ownerId?.userIdNumber})</div>
                      <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-500 uppercase tracking-widest">PIN: {stock.ownerId?.pin || '????'}</div>
                      <div className={`px-4 py-1.5 border rounded-full text-[10px] font-mono uppercase tracking-widest ${
                        stock.status === 'SOLD' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                        stock.status === 'LOCKED' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                         STATUS: {stock.status} {stock.status === 'LOCKED' && `(BY ${stock.selectedBy?.name || 'USER'})`}
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-12">
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black uppercase text-slate-600 mb-1 tracking-widest">Digital Value</span>
                   <span className={`text-4xl font-black italic tabular-nums ${stock.isPinned ? 'text-amber-500' : 'text-blue-500'}`}>₹{stock.amount.toLocaleString()}</span>
                </div>
                <div className="flex gap-4 border-l border-white/5 pl-10 h-20 items-center">
                  <button 
                    onClick={() => handleTogglePin(stock._id)}
                    className={`p-5 rounded-2xl transition-all active:scale-90 ${stock.isPinned ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                    <Pin size={20} className={stock.isPinned ? 'rotate-0' : '-rotate-45'} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStock(stock._id, stock.stockId)}
                    className="p-5 bg-slate-800 text-slate-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 border border-white/5"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
             </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-20 text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 italic">No neural stocks detected in matrix</div>
        )}
      </div>
    </motion.div>
  );
}

function SplitupRegistry({ searchQuery }: { searchQuery: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [splitInputs, setSplitInputs] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    const fetchUsers = async () => {
      try { const { data } = await api.get('/users'); setUsers(data); } catch (err) {}
    };
    fetchUsers();
  }, []);

  const handleOverrideSplits = async (id: string, name: string) => {
    const input = splitInputs[id];
    if (!input) return alert('Enter split amounts separated by comma.');
    
    const splits = input.split(',').map(s => s.trim()).filter(Boolean);
    if (splits.some(s => isNaN(Number(s)))) return alert('Please enter only numbers separated by comma.');

    if (!confirm(`Are you sure you want to completely override the virtual stocks for ${name} into ${splits.length} parts?`)) return;

    try {
      const res = await api.post(`/user/${id}/override-splits`, { splits });
      alert(res.data.message);
      setSplitInputs(prev => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Neural Protocol Breakdown: Split manual override failed.');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
    (u.userIdNumber?.toString().includes(searchQuery) || false)
  );

  return (
    <div className="space-y-10">
      <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Manual <span className="text-emerald-500">Splitup Processor</span></h2>
      <div className="bg-[#030712] border border-emerald-500/10 p-6 rounded-[32px] text-emerald-400 text-sm font-mono tracking-widest shadow-lg shadow-emerald-500/5">
         INFO: Enter target numeric denominations separated by commas (e.g. 500,500,200). The total sum must not exceed the node's tradable balance.
      </div>
      <div className="space-y-6">
        {filteredUsers.map((user) => (
          <div key={user._id} className="bg-slate-900/40 border border-white/5 p-10 rounded-[56px] flex items-center justify-between shadow-2xl group hover:border-emerald-500/30 transition-all">
             <div className="flex items-center gap-10">
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center font-black text-3xl italic uppercase ${user.isBlocked ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{user.name ? user.name[0] : '?'}</div>
                <div>
                   <h4 className={`text-2xl font-black italic transition-all ${user.isBlocked ? 'text-red-500' : 'text-white'}`}>{user.name}</h4>
                    <div className="flex items-center gap-3 mt-2">
                       <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID_{user.userIdNumber}</div>
                       <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-mono text-amber-500 uppercase tracking-widest">BALANCE: ₹{user.walletBalance.toLocaleString()}</div>
                    </div>
                </div>
             </div>
            <div className="flex items-center gap-6">
               <input 
                  type="text" 
                  placeholder="e.g. 500, 500, 1000"
                  value={splitInputs[user._id] || ''}
                  onChange={(e) => setSplitInputs({ ...splitInputs, [user._id]: e.target.value })}
                  className="w-56 py-3 px-6 bg-slate-900 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/40 text-emerald-400 font-mono transition-all"
               />
               <button 
                 onClick={() => handleOverrideSplits(user._id, user.name)}
                 className="px-8 py-3 h-[46px] bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-500 text-xs font-black uppercase tracking-widest border border-emerald-500/20"
               >
                 Execute Split
               </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function GiftCodeManager({ searchQuery }: { searchQuery: string }) {
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [amount, setAmount] = useState('100');
  const [usageLimit, setUsageLimit] = useState('1');

  const fetchGiftCodes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gift-codes');
      setGiftCodes(data.giftCodes);
    } catch (err) {
      console.error('Failed to fetch gift codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCodes();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/gift-codes/generate', { 
        amount: parseFloat(amount), 
        usageLimit: parseInt(usageLimit) 
      });
      fetchGiftCodes();
      alert('Neural Gift Signal Generated!');
    } catch (err) {
      alert('Generation Failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Purge this gift signal?')) return;
    try {
      await api.delete(`/gift-codes/${id}`);
      setGiftCodes(prev => prev.filter(gc => gc._id !== id));
    } catch (err) {
      alert('Purge Failed');
    }
  };

  const filtered = giftCodes.filter(gc => 
    gc.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">Gift <span className="text-purple-500">Signals</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Neural Voucher Generation Protocol</p>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-900/40 p-8 rounded-[48px] border border-white/5">
           <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Redeem Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-40 py-3 px-6 bg-slate-950 border border-white/10 rounded-2xl text-white font-black italic focus:border-purple-500 outline-none transition-all"
              />
           </div>
           <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Usage Limit</label>
              <input 
                type="number" 
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-24 py-3 px-6 bg-slate-950 border border-white/10 rounded-2xl text-white font-black italic focus:border-purple-500 outline-none transition-all"
              />
           </div>
           <button 
             onClick={handleGenerate}
             disabled={generating}
             className="px-10 py-5 bg-purple-600 rounded-[32px] text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-purple-500 active:scale-95 transition-all flex items-center gap-3 mt-auto"
           >
             {generating ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
             Inject Signal
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((gc) => (
          <div key={gc._id} className="bg-[#030712] border border-white/5 p-8 rounded-[48px] flex items-center justify-between group hover:border-purple-500/30 transition-all shadow-2xl">
             <div className="flex items-center gap-10">
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center font-black text-3xl italic uppercase ${gc.isActive ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/20' : 'bg-slate-800 text-slate-600'}`}>
                   {gc.isActive ? <Gift size={28} /> : <XCircle size={28} />}
                </div>
                <div>
                   <h4 className="text-3xl font-black italic tracking-tighter text-white uppercase font-mono">{gc.code}</h4>
                   <div className="flex items-center gap-4 mt-2">
                      <div className="px-5 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">VALUE: ₹{gc.amount}</div>
                      <div className="px-5 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-mono text-purple-400 uppercase tracking-widest">CAPACITY: {gc.timesUsed} / {gc.usageLimit}</div>
                      <div className="px-5 py-1.5 bg-slate-500/10 border border-slate-500/20 rounded-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">CREATED: {new Date(gc.createdAt).toLocaleDateString()}</div>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-end mr-6 border-r border-white/5 pr-10">
                   <span className="text-[10px] font-black uppercase text-slate-600 mb-1 tracking-widest italic">Signal Integrity</span>
                   <span className={`text-xs font-black uppercase tracking-widest ${gc.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {gc.isActive ? 'SYNCED' : 'EXPIRED'}
                   </span>
                </div>
                
                <button 
                  onClick={() => { navigator.clipboard.writeText(gc.code); alert('Signal Code Captured!'); }}
                  className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Copy size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(gc._id)}
                  className="w-14 h-14 bg-slate-800 text-slate-500 rounded-2xl hover:bg-red-600 hover:text-white flex items-center justify-center border border-white/5 transition-all outline-none"
                >
                  <Trash2 size={20} />
                </button>
             </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="py-40 text-center bg-slate-900/40 rounded-[56px] border border-white/5 italic text-slate-600 font-black uppercase tracking-[0.4em] text-xs">No gift signals detected in frequency</div>
        )}
      </div>
    </div>
  );
}
