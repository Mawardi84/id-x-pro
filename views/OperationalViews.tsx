import React, { useState, useEffect, useRef } from 'react';
import { Users, Printer, ShieldCheck, Nfc, Plus, PaintBucket, ArrowUp, Building2, CheckCircle2, LayoutTemplate, Scan, Smartphone, Clock, XCircle, Upload, FileJson, Download, ArrowLeft, Image as ImageIcon, FileImage, History, Camera, StopCircle, Search, AlertTriangle, Palette, FileSignature, Scale, PenTool, Trash2, Copy, Save, FileText, Check, Activity, Cpu, Lock, Eye, Fingerprint, RefreshCcw, Info, Link, Globe, LockKeyhole, AlertOctagon, Terminal, Layers, UserCog, Key, Siren, Shield } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, Button, Label, Input, Select, Textarea, cn } from '../components/UIComponents';
import { Member, CardTemplate, InstitutionConfig, IssuanceLog, AuditLogEntry, SystemUser } from '../types';
import { CardBackground, QRCodeElement, SecurityOverlay } from '../components/CardRenderers';

const CR80_WIDTH = 350;
const CR80_HEIGHT = 555;

const stringToColor = (str: string) => {
    if (!str) return '#666666';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

const getSmartColor = (role: string, dept: string, type: 'ROLE' | 'DEPT') => {
    return stringToColor(type === 'ROLE' ? role : dept);
}

export const DashboardView = ({ members, templates, setView }: { members: Member[], templates: CardTemplate[], setView: (v: any) => void }) => (
    <div className="p-8 h-full overflow-y-auto">
        <div className="flex items-end justify-between mb-8">
            <div>
                 <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">ID-X PRO</h1>
                 <p className="text-cyan-600/80 font-mono tracking-widest text-xs uppercase">Sistem Identitas Masa Depan</p>
            </div>
            <div className="flex items-center gap-2 text-cyan-500/50 text-xs font-mono">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span>
                SISTEM ONLINE
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 border-l-4 border-l-cyan-500 bg-cyan-950/20"><div className="flex justify-between items-center mb-4"><Users className="text-cyan-400"/><span className="text-2xl font-bold text-white">{members?.length || 0}</span></div><div className="text-cyan-600 text-sm font-bold uppercase tracking-wider">Total Pegawai</div></Card>
            <Card className="p-6 border-l-4 border-l-purple-500 bg-purple-950/20"><div className="flex justify-between items-center mb-4"><Printer className="text-purple-400"/><span className="text-2xl font-bold text-white">{templates?.length || 0}</span></div><div className="text-purple-400 text-sm font-bold uppercase tracking-wider">Templat</div></Card>
            <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-950/20"><div className="flex justify-between items-center mb-4"><Activity className="text-blue-400"/><span className="text-2xl font-bold text-white">98%</span></div><div className="text-blue-400 text-sm font-bold uppercase tracking-wider">Kesehatan</div></Card>
            <Card className="p-6 border-l-4 border-l-green-500 bg-green-950/20"><div className="flex justify-between items-center mb-4"><Nfc className="text-green-400"/><span className="text-2xl font-bold text-white">Siap</span></div><div className="text-green-400 text-sm font-bold uppercase tracking-wider">Enkoder</div></Card>
        </div>
        
        <h2 className="text-xl font-bold mt-12 mb-6 flex items-center gap-2 text-cyan-100"><Cpu className="text-cyan-500"/> Operasi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-32 flex-col gap-3 border-cyan-900/50 hover:border-cyan-400 hover:bg-cyan-950/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all group" onClick={() => setView('employees')}>
                <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors"><Plus size={24} className="text-cyan-400 group-hover:scale-110 transition-transform"/></div>
                <span className="text-cyan-100 font-bold">Pegawai Baru</span>
            </Button>
            <Button variant="outline" className="h-32 flex-col gap-3 border-cyan-900/50 hover:border-pink-400 hover:bg-pink-950/20 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all group" onClick={() => setView('design')}>
                <div className="w-12 h-12 rounded-full bg-pink-900/30 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors"><PaintBucket size={24} className="text-pink-400 group-hover:scale-110 transition-transform"/></div>
                <span className="text-pink-100 font-bold">Desain Kartu</span>
            </Button>
            <Button variant="outline" className="h-32 flex-col gap-3 border-cyan-900/50 hover:border-green-400 hover:bg-green-950/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all group" onClick={() => setView('print')}>
                <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center group-hover:bg-green-500/20 transition-colors"><Printer size={24} className="text-green-400 group-hover:scale-110 transition-transform"/></div>
                <span className="text-green-100 font-bold">Cetak Massal</span>
            </Button>
            <Button variant="outline" className="h-32 flex-col gap-3 border-cyan-900/50 hover:border-yellow-400 hover:bg-yellow-950/20 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all group" onClick={() => setView('verify')}>
                <div className="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors"><ShieldCheck size={24} className="text-yellow-400 group-hover:scale-110 transition-transform"/></div>
                <span className="text-yellow-100 font-bold">Verifikasi ID</span>
            </Button>
        </div>
    </div>
);

export const PrintView = ({ members, templates, frontJson, backJson, bgFront, bgBack, config, setView, onLogIssuance }: any) => {
    const [showCutLines, setShowCutLines] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);

    const handlePrintProcess = () => {
        if (confirm("Mulai proses pencetakan?")) {
            if (onLogIssuance) {
                members.forEach((m: Member) => {
                    const log: IssuanceLog = {
                        id: Date.now().toString() + Math.random(), memberId: m.id, memberName: m.fullName, employeeId: m.employeeId, issuedDate: new Date().toISOString(), issuedBy: 'System Admin', type: 'NEW', status: 'PRINTED'
                    };
                    onLogIssuance(log);
                });
            }
            setTimeout(() => window.print(), 500);
        }
    };

    const renderLayer = (json: any, member: Member, isBack: boolean) => {
        if (!json || !json.objects) return null;
        return json.objects.map((obj: any, idx: number) => {
            const style: React.CSSProperties = {
                position: 'absolute', left: obj.left, top: obj.top, width: obj.width * obj.scaleX, height: obj.height * obj.scaleY, transform: `rotate(${obj.angle}deg)`, transformOrigin: 'top left', zIndex: idx,
            };
            let finalColor = obj.fill;
            if (obj.smartType === 'ROLE_COLOR') finalColor = getSmartColor(member.role, member.department, 'ROLE');
            else if (obj.smartType === 'DEPT_COLOR') finalColor = getSmartColor(member.role, member.department, 'DEPT');

            if (obj.type === 'i-text' || obj.type === 'textbox') {
                let text = obj.text;
                if (obj.dataField) {
                    if ((member as any)[obj.dataField]) text = (member as any)[obj.dataField];
                    else if ((config as any)[obj.dataField]) text = (config as any)[obj.dataField];
                }
                if (obj.smartType === 'UV_TEXT') return <div key={idx} style={{...style, zIndex: 50}}><SecurityOverlay text={member.employeeId || 'SECURE'} width={300} height={50} /></div>;
                return <div key={idx} style={{...style, fontSize: obj.fontSize, fontFamily: obj.fontFamily, color: finalColor, fontWeight: obj.fontWeight, whiteSpace: 'pre-wrap', lineHeight: 1.2}}>{text}</div>;
            } else if (obj.type === 'image') {
                if (obj.dataField === 'photoUrl') return <img key={idx} src={member.photoUrl} style={{...style, objectFit: 'cover'}} alt="profile" />;
                else if (obj.dataField === 'qr_code') return <div key={idx} style={style}><QRCodeElement content={`https://id-forge.app/v/${member.employeeId}`} width={Number(style.width) || 100} height={Number(style.height) || 100} style={obj} /></div>;
                else return <img key={idx} src={obj.src} style={style} alt="static" />;
            } else if (obj.type === 'rect') return <div key={idx} style={{...style, backgroundColor: finalColor, borderRadius: `${obj.rx || 0}px`}}></div>;
            else if (obj.type === 'circle') return <div key={idx} style={{...style, backgroundColor: finalColor, borderRadius: '50%'}}></div>;
            else if (obj.type === 'path') return <div key={idx} style={style}><svg width={obj.width} height={obj.height} viewBox={`0 0 ${obj.width} ${obj.height}`}><path d={obj.path} fill={finalColor} /></svg></div>;
            return null;
        });
    };

    const handleExport = async (id: string, name: string, type: 'png' | 'jpeg') => {
        const node = document.getElementById(`card-export-${id}`);
        if (!node) return;
        setExporting(id);
        const options = { quality: 1.0, pixelRatio: 4, backgroundColor: '#ffffff' };
        try {
            const dataUrl = type === 'png' ? await toPng(node, options) : await toJpeg(node, options);
            const link = document.createElement('a');
            link.download = `${name.replace(/\s+/g, '_')}_${type === 'png' ? 'HD' : 'HQ'}.${type}`;
            link.href = dataUrl;
            link.click();
        } catch (error) { alert('Gagal mengekspor gambar.'); } finally { setExporting(null); }
    }

    return (
        <div className="p-8 h-screen flex flex-col">
            <div className="no-print flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {setView && <Button variant="outline" onClick={() => setView('employees')}><ArrowLeft size={16} className="mr-2"/> Kembali</Button>}
                    <h1 className="text-2xl font-bold font-display text-white">Pratinjau Cetak</h1>
                </div>
                <div className="flex gap-4 items-center bg-cyan-950/50 p-2 rounded-xl border border-cyan-900/50">
                    <label className="flex items-center gap-2 text-sm px-2 cursor-pointer text-cyan-300"><input type="checkbox" checked={showCutLines} onChange={e => setShowCutLines(e.target.checked)} className="accent-cyan-600" />Tampilkan Garis Potong</label>
                    <Button onClick={handlePrintProcess} className="bg-cyan-600 hover:bg-cyan-500 shadow-lg text-black font-bold"><Printer size={18} className="mr-2"/> Cetak Sekarang</Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-black/40 text-slate-900 p-8 rounded-xl shadow-inner border border-cyan-900/30">
                <div className="print-container grid grid-cols-1 gap-12 w-full max-w-[210mm] mx-auto bg-white p-8 min-h-[297mm]">
                    {members.map((member: Member) => {
                        const deptTemplateId = config.departmentTemplates?.[member.department];
                        const specificTemplate = deptTemplateId ? templates.find((t: CardTemplate) => t.id === deptTemplateId) : null;
                        const activeFrontJson = specificTemplate ? specificTemplate.layout.front.json : frontJson;
                        const activeBackJson = specificTemplate ? specificTemplate.layout.back.json : backJson;
                        const activeBgFront = specificTemplate ? specificTemplate.layout.front.background : bgFront;
                        const activeBgBack = specificTemplate ? specificTemplate.layout.back.background : bgBack;

                        return (
                            <div key={member.id} className="mb-8 break-inside-avoid">
                                <div className="no-print flex items-center justify-between mb-2">
                                    <div className="flex gap-8 font-bold text-slate-400 text-sm">
                                        <div style={{width: CR80_WIDTH}} className="text-center flex justify-between">
                                            <span>SISI DEPAN</span>
                                            {specificTemplate && <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded">Tpl: {member.department}</span>}
                                        </div>
                                        <div style={{width: CR80_WIDTH}} className="text-center">SISI BELAKANG</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" disabled={exporting === member.id} onClick={() => handleExport(member.id, member.fullName, 'png')} className="h-8 border-slate-300 text-slate-600 hover:text-cyan-600"><ImageIcon size={14} className="mr-1"/> PNG</Button>
                                    </div>
                                </div>
                                <div id={`card-export-${member.id}`} className={cn("card-pair-wrapper flex gap-4 bg-white", showCutLines && "border border-dashed border-gray-400 p-2")}>
                                    <div className="relative overflow-hidden bg-white border border-gray-200" style={{ width: CR80_WIDTH, height: CR80_HEIGHT, backgroundColor: activeBgFront }}>
                                        <CardBackground config={config} seedString={member.department} />
                                        {renderLayer(activeFrontJson, member, false)}
                                    </div>
                                    <div className="relative overflow-hidden bg-white border border-gray-200" style={{ width: CR80_WIDTH, height: CR80_HEIGHT, backgroundColor: activeBgBack }}>
                                        <CardBackground config={config} isBack seedString={member.department} />
                                        {renderLayer(activeBackJson, member, true)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const TemplatesView = ({ templates, onLoadTemplate, onImportTemplate, onDeleteTemplate, setView }: any) => {
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [importCandidate, setImportCandidate] = useState<CardTemplate | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (json.layout) {
                     setImportCandidate({ ...json, id: json.id || `tpl_${Date.now()}`, name: json.name || file.name.replace('.json', '') });
                } else {
                    alert("Format JSON tidak valid.");
                }
            } catch (err) { alert("Gagal membaca file JSON."); }
        };
        reader.readAsText(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) processFile(files[0]);
        e.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current += 1; setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current -= 1; if (dragCounter.current === 0) setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0;
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
    };

    const confirmImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (importCandidate) { onImportTemplate(importCandidate); setImportCandidate(null); }
    };

    const filteredTemplates = templates.filter((t: any) => (filter === 'ALL' || t.category === filter) && t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={cn("p-8 h-full flex flex-col relative transition-colors", isDragging ? "bg-cyan-900/40" : "")} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
            {isDragging && <div className="absolute inset-0 z-50 flex items-center justify-center bg-cyan-950/80 backdrop-blur-sm border-4 border-dashed border-cyan-500 rounded-xl m-4 pointer-events-none"><div className="text-center animate-bounce"><Upload size={64} className="mx-auto text-cyan-400 mb-4"/><h2 className="text-3xl font-bold text-white">Letakkan Templat Disini</h2></div></div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div><h1 className="text-2xl font-bold font-display text-white">Galeri Templat</h1><p className="text-cyan-600/70">Pilih desain dasar atau impor desain Anda sendiri.</p></div>
                <div className="flex gap-2"><Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload size={16} className="mr-2"/> Impor JSON</Button><input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} /><Button onClick={() => setView('design')}><Plus size={16} className="mr-2"/> Buat Baru</Button></div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-cyan-950/30 p-2 rounded-xl border border-cyan-900/50">
                <div className="flex gap-2 overflow-x-auto pb-0 px-2">{['ALL', 'OFFICIAL', 'CORPORATE', 'CUSTOM'].map(cat => (<button key={cat} onClick={() => setFilter(cat)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap", filter === cat ? "bg-cyan-600 border-cyan-600 text-black" : "border-cyan-800/50 text-cyan-400")}>{cat}</button>))}</div>
                <div className="relative w-full md:w-64 px-2"><Search className="absolute left-5 top-2.5 text-cyan-600" size={14}/><Input placeholder="Cari..." className="h-9 pl-9 text-xs border-cyan-800 bg-black/40" value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20">
                {filteredTemplates.map((tpl: any) => (
                        <Card key={tpl.id} className="overflow-hidden border-cyan-900/50 hover:border-cyan-400 transition-all group relative flex flex-col h-full bg-[#0b1221] cursor-pointer" onClick={() => onLoadTemplate(tpl)}>
                        <div className="h-48 bg-black flex items-center justify-center relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-t from-[#0b1221] to-transparent opacity-50"/>
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm gap-2 z-10"><Button size="sm" className="bg-cyan-500 text-black font-bold" onClick={(e) => { e.stopPropagation(); onLoadTemplate(tpl); }}>MUAT DESAIN</Button></div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div><h3 className="font-bold text-cyan-50 truncate" title={tpl.name}>{tpl.name}</h3><div className="text-xs text-cyan-600 mt-1 uppercase tracking-wider font-semibold">{tpl.category}</div></div>
                            <div className="flex justify-end items-center gap-1 mt-4 pt-3 border-t border-cyan-900/30 relative z-20"><Button size="icon" variant="ghost" className="h-7 w-7 text-cyan-600 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDeleteTemplate && onDeleteTemplate(tpl.id); }} title="Hapus"><Trash2 size={14}/></Button></div>
                        </div>
                        </Card>
                ))}
            </div>

            {importCandidate && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
                    <Card className="w-full max-w-md bg-black border-cyan-500/50 relative overflow-hidden shadow-lg"><form onSubmit={confirmImport} className="p-6 space-y-4"><h2 className="text-xl font-bold text-white">Impor Templat</h2><Input value={importCandidate.name} onChange={e => setImportCandidate({...importCandidate, name: e.target.value})} required className="font-bold bg-black border-cyan-800"/><Button type="submit" className="w-full bg-green-600">Konfirmasi</Button></form></Card>
                </div>
            )}
        </div>
    );
};

export const SettingsView = ({ config, setConfig, currentUser, onUpdateUser }: any) => {
    const [localConfig, setLocalConfig] = useState<InstitutionConfig>(config);
    const [userForm, setUserForm] = useState({ password: '', fullName: currentUser?.fullName || '' });
    
    useEffect(() => setLocalConfig(config), [config]);

    const handleChange = (key: keyof InstitutionConfig, value: any) => {
        setLocalConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setConfig(localConfig);
        alert("Pengaturan sistem disimpan!");
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (onUpdateUser && currentUser) {
            const updated = { ...currentUser, fullName: userForm.fullName };
            if (userForm.password) updated.password = userForm.password;
            onUpdateUser(updated);
            alert("Profil admin diperbarui.");
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto flex flex-col">
             <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2"><Building2 className="text-cyan-400"/> Konfigurasi Sistem</h1>
                <Button className="bg-green-600 hover:bg-green-500 text-black font-bold" onClick={handleSave}><Save size={16} className="mr-2"/> Simpan Perubahan</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Identitas Instansi</h3>
                        <div className="space-y-2"><Label>Nama Instansi (Baris 1)</Label><Input value={localConfig.name} onChange={e => handleChange('name', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Sub-Nama (Baris 2)</Label><Input value={localConfig.secondaryName} onChange={e => handleChange('secondaryName', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Alamat Lengkap</Label><Textarea value={localConfig.address} onChange={e => handleChange('address', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Logo URL</Label><Input value={localConfig.logoUrl} onChange={e => handleChange('logoUrl', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Warna Utama</Label><div className="flex gap-2"><Input type="color" value={localConfig.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} className="w-12 p-0"/><Input value={localConfig.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} /></div></div>
                        </div>
                    </Card>

                    {currentUser && (
                        <Card className="p-6 space-y-4 border-blue-900/30">
                            <h3 className="font-bold text-blue-400 border-b border-blue-900/30 pb-2 flex items-center gap-2"><UserCog size={16}/> Profil Admin ({currentUser.username})</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} /></div>
                                <div className="space-y-2"><Label>Ganti Password (Opsional)</Label><Input type="password" placeholder="Biarkan kosong jika tidak diubah" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>
                                <Button type="submit" variant="secondary" size="sm" className="w-full">Perbarui Profil</Button>
                            </form>
                        </Card>
                    )}
                </div>

                <Card className="p-6 space-y-4 h-fit">
                    <h3 className="font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Keamanan Cetak (Micro-text)</h3>
                    <div className="flex items-center justify-between"><Label>Watermark Logo</Label><input type="checkbox" checked={localConfig.enableWatermark} onChange={e => handleChange('enableWatermark', e.target.checked)} className="accent-cyan-600 w-5 h-5"/></div>
                    <div className="space-y-2"><Label>Opasitas Watermark ({localConfig.watermarkOpacity})</Label><input type="range" min="0.01" max="0.2" step="0.01" value={localConfig.watermarkOpacity} onChange={e => handleChange('watermarkOpacity', parseFloat(e.target.value))} className="w-full accent-cyan-500"/></div>
                    
                    <div className="border-t border-cyan-900/30 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-2"><Label>Pola Micro-text Latar</Label><input type="checkbox" checked={localConfig.enablePattern} onChange={e => handleChange('enablePattern', e.target.checked)} className="accent-cyan-600 w-5 h-5"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Teks Pola</Label><Input value={localConfig.patternText} onChange={e => handleChange('patternText', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Layout</Label><Select value={localConfig.patternLayout} onChange={e => handleChange('patternLayout', e.target.value as any)}><option value="GRID">Grid</option><option value="BRICK">Bata (Brick)</option><option value="V_GRID">Vertikal Grid</option></Select></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export const NFCView = ({ members, onPrint, onLogIssuance }: any) => (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
        <Nfc size={64} className="text-cyan-500 mb-4 animate-pulse"/>
        <h1 className="text-3xl font-bold text-white mb-2">Penulis NFC</h1>
        <p className="text-slate-400 max-w-md">Fitur ini memungkinkan penulisan data profil terenkripsi ke kartu Smart Card atau stiker NFC.</p>
        <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800 text-sm text-slate-500">
            Hubungkan perangkat NFC Reader/Writer USB untuk memulai.
        </div>
    </div>
);
export const VerifyView = ({ members, onLogIssuance }: any) => (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
        <ShieldCheck size={64} className="text-green-500 mb-4"/>
        <h1 className="text-3xl font-bold text-white mb-2">Verifikasi Keaslian</h1>
        <p className="text-slate-400 max-w-md">Pindai QR Code pada kartu untuk memverifikasi data pegawai secara real-time dari database pusat.</p>
        <Button className="mt-6 bg-green-600 hover:bg-green-500"><Scan size={18} className="mr-2"/> Mulai Pemindai Kamera</Button>
    </div>
);
export const HistoryView = ({ logs }: any) => (
    <div className="p-8 h-full">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><History className="text-cyan-400"/> Riwayat Aktivitas</h1>
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-500 uppercase font-bold"><tr><th className="p-4">Waktu</th><th className="p-4">Aksi</th><th className="p-4">Pengguna</th></tr></thead>
                <tbody><tr><td colSpan={3} className="p-8 text-center italic">Belum ada catatan aktivitas sistem.</td></tr></tbody>
            </table>
        </div>
    </div>
);
export const SecurityView = ({ auditLogs }: any) => (
    <div className="p-8 h-full">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Shield className="text-red-400"/> Audit Keamanan</h1>
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-8 text-center text-slate-500">Log keamanan sistem akan muncul di sini.</div>
        </div>
    </div>
);
