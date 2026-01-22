import React, { useState } from 'react';
import { CreditCard, Lock, User, Scan, ArrowRight, Fingerprint, ShieldCheck, Cpu, Zap, Activity, Shield, Eye, UserCog } from 'lucide-react';
import { Button, Input, Label, cn } from '../components/UIComponents';
import { SystemUser } from '../types';

interface LoginViewProps {
    users: SystemUser[];
    onLogin: (user: SystemUser) => void;
}

export const LoginView = ({ users, onLogin }: LoginViewProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        setTimeout(() => {
            const validUser = users.find(u => u.username === username && u.password === password && u.status === 'ACTIVE');
            
            if (validUser) {
                setLoading(false);
                onLogin(validUser);
            } else {
                setLoading(false);
                setError('AKSES DITOLAK: Kredensial Tidak Valid atau Akun Dinonaktifkan');
            }
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex bg-[#020617] text-cyan-50 overflow-hidden font-sans selection:bg-cyan-500/30 relative">
            
            {/* --- GLOBAL BACKGROUND GRID --- */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            
            {/* --- LEFT SIDE: HOLOGRAPHIC PROJECTION ZONE --- */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center perspective-1000 overflow-hidden border-r border-cyan-900/30 bg-black/20 backdrop-blur-sm">
                
                {/* Hologram Floor Emitter */}
                <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-cyan-500/20 blur-[60px] rounded-[100%] animate-pulse"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[300px] bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent blur-xl pointer-events-none"></div>

                {/* THE FLOATING CARD */}
                <div className="relative group animate-float z-10">
                    {/* Card Container */}
                    <div 
                        className="w-[380px] h-[240px] rounded-2xl relative border border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden backdrop-blur-md bg-cyan-950/10 transition-transform duration-500 transform rotate-y-12 rotate-x-6 group-hover:rotate-y-0 group-hover:rotate-x-0"
                    >
                        {/* Internal Grid Texture */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                        
                        {/* Scan Line Laser */}
                        <div className="absolute w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] top-0 animate-scan-laser opacity-70"></div>

                        {/* Card Content */}
                        <div className="p-6 flex flex-col justify-between h-full relative z-20">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg border border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                        <Cpu size={20} className="text-cyan-400"/>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-cyan-300 tracking-[0.2em] font-display">ID-X</div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                                            <div className="text-[8px] text-cyan-600 font-mono uppercase">SECURE LEVEL 5</div>
                                        </div>
                                    </div>
                                </div>
                                <Fingerprint className="text-cyan-500/20" size={48} />
                            </div>

                            {/* Middle Chip & Photo Placeholder */}
                            <div className="flex items-center gap-4 mt-2 pl-1">
                                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200/60 to-amber-600/60 border border-amber-400/40 shadow-sm relative overflow-hidden backdrop-blur-sm"></div>
                                <div className="space-y-1.5 opacity-60">
                                    <div className="h-1.5 w-24 bg-cyan-400/20 rounded-full"></div>
                                    <div className="h-1.5 w-16 bg-cyan-400/20 rounded-full"></div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-4 flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-cyan-700 uppercase tracking-widest mb-1">Kode Identitas</div>
                                    <div className="text-lg font-mono text-cyan-100/90 tracking-[0.15em] drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                        8842 1092 3341
                                    </div>
                                </div>
                                <div className="text-cyan-500/30">
                                    <Activity size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floor Reflection */}
                    <div className="absolute -bottom-16 left-8 right-8 h-4 bg-cyan-500/10 blur-xl rounded-[100%] transform scale-x-75 animate-pulse"></div>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN FORM --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-20 overflow-y-auto">
                <div className="w-full max-w-md space-y-6 relative">
                    
                    {/* Background Glow for Form */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-cyan-500/5 blur-3xl rounded-full pointer-events-none"></div>

                    {/* Header */}
                    <div className="text-center space-y-2 relative">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-950 to-black border border-cyan-800 text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)] group hover:border-cyan-500 transition-colors">
                            <CreditCard size={28} className="group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <h2 className="text-3xl font-display font-bold tracking-tight text-white drop-shadow-md">
                            Akses Sistem
                        </h2>
                        <p className="text-cyan-600/70 text-sm font-mono tracking-wide">
                            AUTENTIKASI DIPERLUKAN
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="backdrop-blur-sm bg-black/20 border border-cyan-500/10 rounded-2xl p-8 shadow-2xl relative">
                         {/* Decorative Corner Lines */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/40 rounded-tl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/40 rounded-br-lg"></div>

                        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-cyan-300/80 text-xs uppercase tracking-widest font-bold ml-1">ID Operator</Label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-700 group-focus-within:text-cyan-400 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <Input 
                                            id="username"
                                            placeholder="Masukkan ID sistem" 
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10 bg-[#020617]/60 border-cyan-900/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 h-11 text-cyan-100 placeholder:text-cyan-900/40 transition-all rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-cyan-300/80 text-xs uppercase tracking-widest font-bold ml-1">Kata Sandi</Label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-700 group-focus-within:text-cyan-400 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <Input 
                                            id="password"
                                            type="password" 
                                            placeholder="••••••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 bg-[#020617]/60 border-cyan-900/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 h-11 text-cyan-100 placeholder:text-cyan-900/40 transition-all rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-lg flex items-center gap-3 text-red-400 text-xs font-mono animate-in slide-in-from-top-2">
                                    <ShieldCheck size={14} /> {error}
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className={cn(
                                    "w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-black font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] rounded-lg mt-2 relative overflow-hidden group border border-cyan-400/50",
                                    loading && "opacity-70 cursor-wait grayscale"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                {loading ? (
                                    <span className="flex items-center gap-2"><Scan className="animate-spin" size={16}/> MEMVERIFIKASI...</span>
                                ) : (
                                    <span className="flex items-center gap-2">MULAI SESI <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/></span>
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="pt-2 text-center flex flex-col items-center gap-2">
                         <div className="flex items-center gap-2 text-cyan-800 text-[10px] font-mono uppercase tracking-widest">
                            <Zap size={10} />
                            <span>Ditenagai oleh ID-X AI</span>
                         </div>
                    </div>
                </div>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .rotate-y-12 { transform: rotateY(12deg); }
                .rotate-x-6 { transform: rotateX(6deg); }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotateY(12deg) rotateX(6deg); }
                    50% { transform: translateY(-20px) rotateY(8deg) rotateX(4deg); }
                }
                .animate-float { animation: float 7s ease-in-out infinite; }

                @keyframes scan-laser {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                .animate-scan-laser { animation: scan-laser 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
            `}</style>
        </div>
    );
};