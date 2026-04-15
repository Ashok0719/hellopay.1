'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, Zap, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (userId === '7200520719' && password === 'happynewyear2005') {
      localStorage.setItem('admin_auth', 'true');
      router.push('/');
    } else {
      setError('Invalid Access Token or Identity Signature');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <img
              src="https://hellopay-userweb.vercel.app/hellopay-logo.png"
              alt="HelloPay"
              className="h-14 w-auto object-contain"
            />
          </motion.div>
          <p className="text-slate-500 text-sm font-black uppercase tracking-[0.3em]">Administrator Authentication</p>
        </div>

        <div className="bg-[#030712]/80 backdrop-blur-3xl border border-white/5 p-10 lg:p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Registry ID</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="text" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter ID"
                    className="w-full bg-slate-900/40 border border-white/5 rounded-3xl py-5 pl-16 pr-6 text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all font-medium placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Access Signature</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full bg-slate-900/40 border border-white/5 rounded-3xl py-5 pl-16 pr-6 text-white text-sm focus:outline-none focus:border-blue-500/40 transition-all font-medium placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold italic"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-[0.2em] py-5 rounded-3xl shadow-[0_20px_40px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Decrypting...</span>
                </div>
              ) : (
                <>
                  <span>Initialize Link</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
          Secure Neural Interface v4.0.2
        </p>
      </motion.div>
    </div>
  );
}
