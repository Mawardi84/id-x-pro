import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, LayoutTemplate, PaintBucket, Printer, Nfc, ShieldCheck, Building2, CreditCard, History, UserCog, LogOut, Lock, Siren, BookOpen, Menu, X } from 'lucide-react';
import { cn, Button } from './components/UIComponents';
import { Member, InstitutionConfig, CardTemplate, IssuanceLog, SystemUser, AuditLogEntry } from './types';
import { EmployeeManager } from './views/EmployeeManager';
import { DesignEditor } from './views/DesignEditor';
import { AccountManager } from './views/AccountManager';
import { DashboardView, PrintView, TemplatesView, SettingsView, NFCView, VerifyView, HistoryView, SecurityView } from './views/OperationalViews';
import { ManualBookView } from './views/ManualBookView';
import { LoginView } from './views/LoginView';
import { api } from './services/backend';

export default function App() {
    // Auth & Security State
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
    const [isSessionLocked, setIsSessionLocked] = useState(false);
    
    // Global Data State (Fetched from Backend)
    const [members, setMembers] = useState<Member[]>([]);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [templates, setTemplates] = useState<CardTemplate[]>([]);
    const [config, setConfig] = useState<InstitutionConfig | null>(null);
    const [issuanceLogs, setIssuanceLogs] = useState<IssuanceLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // View State
    const [view, setView] = useState('dashboard');
    const [isDesignLocked, setIsDesignLocked] = useState(false);
    const [printQueue, setPrintQueue] = useState<Member[] | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Design State
    const [frontJson, setFrontJson] = useState<any>(null);
    const [backJson, setBackJson] = useState<any>(null);
    const [bgFront, setBgFront] = useState('#ffffff');
    const [bgBack, setBgBack] = useState('#ffffff');
    const [editorKey, setEditorKey] = useState(0);

    // Activity Monitor
    const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        loadBackendData();
    }, []);

    const loadBackendData = async () => {
        setLoading(true);
        try {
            // Promise.all is fast, but if one fails, we catch it.
            const [fetchedMembers, fetchedUsers, fetchedTemplates, fetchedConfig, fetchedAudit, fetchedIssuance] = await Promise.all([
                api.members.getAll(),
                api.users.getAll(),
                api.templates.getAll(),
                api.config.get(),
                api.logs.getAudit(),
                api.logs.getIssuance()
            ]);

            setMembers(fetchedMembers || []);
            setUsers(fetchedUsers || []);
            setTemplates(fetchedTemplates || []);
            setConfig(fetchedConfig); // Config might be null if fetch fails, but default is usually provided by API
            setAuditLogs(fetchedAudit || []);
            setIssuanceLogs(fetchedIssuance || []);

            // Load default template if available - Defensive Check Added
            if (Array.isArray(fetchedTemplates) && fetchedTemplates.length > 0) {
                 const def = fetchedTemplates[0];
                 setFrontJson(def?.layout?.front?.json);
                 setBackJson(def?.layout?.back?.json);
                 setBgFront(def?.layout?.front?.background || '#ffffff');
                 setBgBack(def?.layout?.back?.background || '#ffffff');
            }
        } catch (error) {
            console.error("Backend Error:", error);
            // Even if backend fails, we try to load defaults so app isn't blank
            if (!config) {
                 const defaultConfig = await api.config.get(); // Try get default again
                 setConfig(defaultConfig);
            }
        } finally {
            setLoading(false);
        }
    };

    const resetActivityTimer = () => {
        if (!currentUser || isSessionLocked) return;
        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        activityTimerRef.current = setTimeout(() => {
            if (currentUser) setIsSessionLocked(true);
        }, 5 * 60 * 1000); 
    };

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        const handler = () => resetActivityTimer();
        events.forEach(e => window.addEventListener(e, handler));
        resetActivityTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, handler));
            if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        };
    }, [currentUser, isSessionLocked]);

    // --- ACTIONS HANDLERS (Calling Backend) ---

    const handleAddAuditLog = async (action: AuditLogEntry['action'], details: string, severity: AuditLogEntry['severity'] = 'INFO') => {
        if (!currentUser) return;
        const newLog: AuditLogEntry = {
            id: Date.now().toString() + Math.random(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            action, details, severity, ipAddress: '192.168.1.10'
        };
        await api.logs.addAudit(newLog);
        setAuditLogs(await api.logs.getAudit()); // Refresh logs
    };

    const handleLogin = (user: SystemUser) => {
        setCurrentUser(user);
        setIsSessionLocked(false);
        setView('dashboard');
        
        // Audit is handled inside LoginView usually, but we can do it here too safely
        const newLog: AuditLogEntry = {
            id: Date.now().toString(), timestamp: new Date().toISOString(),
            userId: user.id, username: user.username, role: user.role,
            action: 'LOGIN', details: 'User logged in successfully', severity: 'INFO'
        };
        api.logs.addAudit(newLog).then(() => {
             api.logs.getAudit().then(setAuditLogs);
        });
    };

    const handleLogout = () => {
        handleAddAuditLog('LOGOUT', 'User logged out');
        setCurrentUser(null);
        setView('dashboard');
    };

    const handleUnlock = (password: string) => {
        if (currentUser && password === currentUser.password) {
            setIsSessionLocked(false);
            resetActivityTimer();
        } else {
            alert("Password Salah!");
        }
    };

    // Data Updates
    const handleUpdateMembers = async (newMembers: Member[]) => {
        await api.members.bulkUpdate(newMembers);
        setMembers(newMembers);
        handleAddAuditLog('UPDATE_MEMBER', 'Member list updated');
    };

    const handleSaveConfig = async (newConfig: InstitutionConfig) => {
        // OPTIMISTIC UPDATE: Update UI immediately for real-time feedback
        setConfig(newConfig);
        
        // Sync to backend in background (fire and forget/catch)
        // We do NOT await here to avoid UI lag on sliders/inputs
        api.config.update(newConfig).catch(err => console.error("Config sync failed:", err));
        
        // Optional: We can debounce audit logs here to prevent spamming, 
        // but for now we skip the audit log on high-frequency config updates 
        // to keep the system performant.
    };

    const handleUpdateUsers = async (newUsers: SystemUser[]) => {
        for(const u of newUsers) { await api.users.save(u); }
        setUsers(newUsers); 
    };

    const handleImportTemplate = async (tpl: CardTemplate) => {
        await api.templates.save(tpl);
        setTemplates(await api.templates.getAll());
        alert("Template Berhasil Diimpor & Disimpan!");
        handleAddAuditLog('UPDATE_CONFIG', `Imported template: ${tpl.name}`);
    };
    
    const handleDeleteTemplate = async (id: string) => {
        if(confirm("Hapus permanen?")) {
            await api.templates.delete(id);
            setTemplates(await api.templates.getAll());
            handleAddAuditLog('UPDATE_CONFIG', `Deleted template ID: ${id}`, 'WARNING');
        }
    };

    const handleLoadTemplate = (t: CardTemplate) => {
        // Validation check
        if (!t.layout || !t.layout.front || !t.layout.back) {
             alert("Format templat tidak valid atau rusak.");
             return;
        }

        // 1. Load Layout & JSON Data
        setFrontJson(t.layout.front.json);
        setBackJson(t.layout.back.json);
        setBgFront(t.layout.front.background);
        setBgBack(t.layout.back.background);

        // 2. Load Template Config Overrides (Patterns, Watermarks, etc.)
        if (t.config && config) {
            setConfig({ ...config, ...t.config });
        }

        // 3. Reset Editor State & Navigate
        setEditorKey(Date.now()); // Forces DesignEditor to remount/reset
        setIsDesignLocked(false);
        setView('design');
        handleAddAuditLog('UPDATE_CONFIG', `Loaded template: ${t.name}`);
        setIsMobileMenuOpen(false); // Close menu on mobile after selection
    };

    const handleLogIssuance = async (log: IssuanceLog) => {
        await api.logs.addIssuance(log);
        setIssuanceLogs(await api.logs.getIssuance());
        handleAddAuditLog(log.status === 'ISSUED' ? 'NFC_WRITE' : (log.status === 'SCANNED' ? 'NFC_WRITE' : 'PRINT'), log.status === 'SCANNED' ? `Verified member: ${log.memberName}` : `Action on member: ${log.memberName}`);
    };

    const handleSinglePrint = (member: Member) => {
        setPrintQueue([member]);
        setView('print');
    };

    // --- RENDER ---
    
    if (loading || !config) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono">INITIALIZING SYSTEM BACKEND...</div>;

    if (!currentUser) return <LoginView users={users} onLogin={handleLogin} />;

    if (isSessionLocked) {
         return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="relative z-10 bg-slate-900 border border-red-900/50 p-10 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full">
                    <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 animate-pulse"><Lock size={40} className="text-red-500"/></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Sesi Terkunci</h2>
                    <div className="space-y-4">
                        <div className="text-left"><label className="text-xs font-bold text-slate-500">PENGGUNA</label><div className="text-lg font-mono text-cyan-400 font-bold">{currentUser.fullName}</div></div>
                        <input type="password" className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" placeholder="Kata Sandi" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(e.currentTarget.value); }} />
                        <Button className="w-full bg-red-600 hover:bg-red-500" onClick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; handleUnlock(input.value); }}>Buka Kunci</Button>
                        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white underline">Atau Log Out</button>
                    </div>
                </div>
            </div>
        )
    }

    const canAccessSettings = ['SUPER_ADMIN', 'ADMIN_INSTANSI'].includes(currentUser.role);
    const canAccessSecurity = ['SUPER_ADMIN'].includes(currentUser.role);
    const canEditMembers = ['SUPER_ADMIN', 'ADMIN_INSTANSI', 'OPERATOR'].includes(currentUser.role);

    return (
        <div className="flex bg-[#020617] text-cyan-50 min-h-screen font-sans selection:bg-cyan-500/30 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 w-64 bg-[#0b1221] border-r border-cyan-900/30 flex flex-col z-50 transition-transform duration-300 transform lg:translate-x-0 overflow-hidden",
                isMobileMenuOpen ? "translate-x-0 shadow-2xl shadow-cyan-900/50" : "-translate-x-full"
            )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                <div className="h-16 flex items-center px-6 border-b border-cyan-900/30 gap-3 relative z-10 justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/50 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]"><CreditCard className="text-cyan-400 h-5 w-5"/></div>
                        <div><span className="font-bold font-display text-lg tracking-widest text-white">ID-<span className="text-cyan-400">X</span></span><div className="text-[9px] text-cyan-600 font-mono tracking-wide">SYSTEM V2.0</div></div>
                    </div>
                    <button className="lg:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
                </div>
                <div className="px-6 py-4 border-b border-cyan-900/20 mb-2">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pengguna</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="font-bold text-sm text-cyan-100 truncate">{currentUser.fullName}</span></div>
                    <div className="text-[10px] text-cyan-600 font-mono mt-0.5 bg-cyan-950/50 px-2 py-0.5 rounded w-fit">{currentUser.role}</div>
                </div>
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', allowed: true },
                        { id: 'employees', icon: Users, label: 'Pegawai', allowed: true },
                        { id: 'print', icon: Printer, label: 'Cetak Massal', allowed: true },
                        { id: 'nfc', icon: Nfc, label: 'Penulis NFC', allowed: true },
                        { id: 'verify', icon: ShieldCheck, label: 'Verifikasi ID', allowed: true },
                        { id: 'templates', icon: LayoutTemplate, label: 'Templat', allowed: canEditMembers },
                        { id: 'design', icon: PaintBucket, label: 'Studio Desain', allowed: canEditMembers },
                        { id: 'manual', icon: BookOpen, label: 'Panduan', allowed: true },
                        { id: 'history', icon: History, label: 'Riwayat Log', allowed: true },
                        { id: 'accounts', icon: UserCog, label: 'Kontrol Akses', allowed: canAccessSettings },
                        { id: 'settings', icon: Building2, label: 'Pengaturan', allowed: canAccessSettings },
                        { id: 'security', icon: Siren, label: 'Keamanan Audit', allowed: canAccessSecurity },
                    ].filter(i => i.allowed).map((item) => (
                        <button key={item.id} onClick={() => { if (item.id === 'print') setPrintQueue(null); setView(item.id); setIsMobileMenuOpen(false); }} className={cn("flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all font-medium text-sm border border-transparent text-left", view === item.id ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden group" : "text-slate-400 hover:bg-white/5 hover:text-cyan-200")}>
                            {view === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>}
                            <item.icon size={18} className={cn(view === item.id ? "text-cyan-400" : "opacity-70")}/> {item.label}
                        </button>
                    ))}
                    <div className="mt-8 pt-4 border-t border-cyan-900/30">
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-all font-medium text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300"><LogOut size={18} />Akhiri Sesi</button>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#020617] to-[#020617]">
                {/* Mobile Header Toggle */}
                <div className="lg:hidden h-14 border-b border-cyan-900/30 flex items-center px-4 bg-[#0b1221] justify-between z-30">
                     <button onClick={() => setIsMobileMenuOpen(true)} className="text-cyan-400"><Menu size={24}/></button>
                     <span className="font-bold font-display text-white">ID-X PRO</span>
                     <div className="w-6"></div> 
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {view === 'dashboard' && <DashboardView members={members} templates={templates} setView={setView} />}
                    {view === 'employees' && <EmployeeManager members={members} setMembers={handleUpdateMembers} onPrint={handleSinglePrint} onPrintSelected={(m) => { setPrintQueue(m); setView('print'); }} />}
                    {view === 'accounts' && <AccountManager users={users} setUsers={(u) => { setUsers(u); u.forEach(user => api.users.save(user)); }} />}
                    {view === 'templates' && <TemplatesView templates={templates} onLoadTemplate={handleLoadTemplate} onImportTemplate={handleImportTemplate} onDeleteTemplate={handleDeleteTemplate} setView={setView} />}
                    {view === 'design' && <DesignEditor key={editorKey} frontJson={frontJson} setFrontJson={setFrontJson} backJson={backJson} setBackJson={setBackJson} bgFront={bgFront} setBgFront={setBgFront} bgBack={bgBack} setBgBack={setBgBack} templates={templates} setTemplates={async (t) => { if(t && t.length > 0) { await api.templates.save(t[t.length-1]); setTemplates(t); } }} config={config} setConfig={handleSaveConfig} isLocked={isDesignLocked} setIsLocked={setIsDesignLocked} />}
                    {view === 'print' && <PrintView members={printQueue || members} templates={templates} frontJson={frontJson} backJson={backJson} bgFront={bgFront} bgBack={bgBack} config={config} setView={setView} onLogIssuance={handleLogIssuance} />}
                    {view === 'nfc' && <NFCView members={members} onPrint={handleSinglePrint} onLogIssuance={handleLogIssuance} />}
                    {view === 'verify' && <VerifyView members={members} onLogIssuance={handleLogIssuance} />}
                    {view === 'history' && <HistoryView logs={issuanceLogs} />}
                    {view === 'settings' && 
                        <SettingsView 
                            config={config} 
                            setConfig={handleSaveConfig} 
                            members={members} 
                            templates={templates} 
                            currentUser={currentUser}
                            onUpdateUser={async (updatedUser: SystemUser) => {
                                await api.users.save(updatedUser);
                                setCurrentUser(updatedUser);
                                setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                                handleAddAuditLog('UPDATE_CONFIG', 'Admin profile/credentials updated');
                            }}
                        />
                    }
                    {view === 'security' && <SecurityView auditLogs={auditLogs} />}
                    {view === 'manual' && <ManualBookView />}
                </div>
            </main>
        </div>
    );
}