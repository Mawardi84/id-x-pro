import React, { useState, useEffect, useRef } from 'react';
import { Users, Printer, ShieldCheck, Nfc, Plus, PaintBucket, ArrowUp, Building2, CheckCircle2, LayoutTemplate, Scan, Smartphone, Clock, XCircle, Upload, FileJson, Download, ArrowLeft, Image as ImageIcon, FileImage, History, Camera, StopCircle, Search, AlertTriangle, Palette, FileSignature, Scale, PenTool, Trash2, Copy, Save, FileText, Check, Activity, Cpu, Lock, Eye, Fingerprint, RefreshCcw, Info, Link, Globe, LockKeyhole, AlertOctagon, Terminal, Layers, UserCog, Key, Siren } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, Button, Label, Input, Select, Textarea, cn } from '../components/UIComponents';
import { Member, CardTemplate, InstitutionConfig, IssuanceLog, AuditLogEntry, SystemUser } from '../types';
import { CardBackground, QRCodeElement } from '../components/CardRenderers';

const CR80_WIDTH = 350;
const CR80_HEIGHT = 555;

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
        if (confirm("Mulai proses pencetakan? Sistem akan mencatat riwayat penerbitan untuk pegawai yang dipilih.")) {
            if (onLogIssuance) {
                members.forEach((m: Member) => {
                    const log: IssuanceLog = {
                        id: Date.now().toString() + Math.random(),
                        memberId: m.id,
                        memberName: m.fullName,
                        employeeId: m.employeeId,
                        issuedDate: new Date().toISOString(),
                        issuedBy: 'System Admin', 
                        type: 'NEW', 
                        status: 'PRINTED'
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
                position: 'absolute', left: obj.left, top: obj.top,
                width: obj.width * obj.scaleX, height: obj.height * obj.scaleY,
                transform: `rotate(${obj.angle}deg)`, transformOrigin: 'top left', zIndex: idx,
            };

            if (obj.type === 'i-text' || obj.type === 'textbox') {
                let text = obj.text;
                if (obj.dataField) {
                    if ((member as any)[obj.dataField]) {
                        text = (member as any)[obj.dataField];
                    } else if ((config as any)[obj.dataField]) {
                        text = (config as any)[obj.dataField];
                    }
                }
                return <div key={idx} style={{...style, fontSize: obj.fontSize, fontFamily: obj.fontFamily, color: obj.fill, fontWeight: obj.fontWeight, whiteSpace: 'pre-wrap', lineHeight: 1.2}}>{text}</div>;
            } else if (obj.type === 'image') {
                if (obj.dataField === 'photoUrl') return <img key={idx} src={member.photoUrl} style={{...style, objectFit: 'cover'}} alt="profile" />;
                else if (obj.dataField === 'qr_code') return <div key={idx} style={style}><QRCodeElement content={`https://id-forge.app/v/${member.employeeId}`} width={style.width as number} height={style.height as number} style={obj} /></div>;
                else return <img key={idx} src={obj.src} style={style} alt="static" />;
            } else if (obj.type === 'rect') return <div key={idx} style={{...style, backgroundColor: obj.fill, borderRadius: `${obj.rx || 0}px`}}></div>;
            else if (obj.type === 'path') return <div key={idx} style={style}><svg width={obj.width} height={obj.height} viewBox={`0 0 ${obj.width} ${obj.height}`}><path d={obj.path} fill={obj.fill} /></svg></div>;
            return null;
        });
    };

    const handleExport = async (id: string, name: string, type: 'png' | 'jpeg') => {
        const node = document.getElementById(`card-export-${id}`);
        if (!node) return;
        setExporting(id);
        
        // Pixel Ratio 4 ensures roughly 400 DPI equivalent relative to screen size.
        const options = { quality: 1.0, pixelRatio: 4, backgroundColor: '#ffffff' };
        
        try {
            const dataUrl = type === 'png' ? await toPng(node, options) : await toJpeg(node, options);
            const link = document.createElement('a');
            link.download = `${name.replace(/\s+/g, '_')}_${type === 'png' ? 'HD' : 'HQ'}.${type}`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export failed', error);
            alert('Gagal mengekspor gambar. Silakan coba lagi.');
        } finally {
            setExporting(null);
        }
    }

    return (
        <div className="p-8 h-screen flex flex-col">
            <div className="no-print flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {setView && <Button variant="outline" onClick={() => setView('employees')}><ArrowLeft size={16} className="mr-2"/> Kembali</Button>}
                    <h1 className="text-2xl font-bold font-display text-white">Pratinjau Cetak (2 Sisi)</h1>
                </div>
                <div className="flex gap-4 items-center bg-cyan-950/50 p-2 rounded-xl border border-cyan-900/50">
                    <label className="flex items-center gap-2 text-sm px-2 cursor-pointer text-cyan-300"><input type="checkbox" checked={showCutLines} onChange={e => setShowCutLines(e.target.checked)} className="accent-cyan-600" />Tampilkan Garis Potong</label>
                    <Button onClick={handlePrintProcess} className="bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 text-black font-bold"><Printer size={18} className="mr-2"/> Cetak Sekarang</Button>
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
                                        <Button size="sm" variant="outline" disabled={exporting === member.id} onClick={() => handleExport(member.id, member.fullName, 'png')} className="h-8 border-slate-300 text-slate-600 hover:text-cyan-600 hover:border-cyan-500">
                                            <ImageIcon size={14} className="mr-1"/> {exporting === member.id ? '...' : 'PNG (HD)'}
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={exporting === member.id} onClick={() => handleExport(member.id, member.fullName, 'jpeg')} className="h-8 border-slate-300 text-slate-600 hover:text-cyan-600 hover:border-cyan-500">
                                            <FileImage size={14} className="mr-1"/> {exporting === member.id ? '...' : 'JPG (HD)'}
                                        </Button>
                                    </div>
                                </div>
                                <div id={`card-export-${member.id}`} className={cn("card-pair-wrapper flex gap-4 bg-white", showCutLines && "border border-dashed border-gray-400 p-2")}>
                                    <div className="relative overflow-hidden bg-white border border-gray-200 shadow-sm print:shadow-none" style={{ width: CR80_WIDTH, height: CR80_HEIGHT, backgroundColor: activeBgFront }}><CardBackground config={config} />{renderLayer(activeFrontJson, member, false)}</div>
                                    <div className="relative overflow-hidden bg-white border border-gray-200 shadow-sm print:shadow-none" style={{ width: CR80_WIDTH, height: CR80_HEIGHT, backgroundColor: activeBgBack }}><CardBackground config={config} isBack />{renderLayer(activeBackJson, member, true)}</div>
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
                const hasLayout = json.layout && json.layout.front && json.layout.back;
                
                if (hasLayout) {
                     setImportCandidate({
                         ...json,
                         id: json.id || `tpl_${Date.now()}`,
                         name: json.name || file.name.replace('.json', '').replace(/_/g, ' '),
                         category: ['OFFICIAL', 'CORPORATE', 'EVENT', 'CUSTOM'].includes(json.category) ? json.category : 'CUSTOM',
                         description: json.description || 'Templat diimpor dari file JSON.'
                     });
                } else {
                    alert("Format JSON tidak valid. Pastikan file berisi layout 'front' dan 'back'.");
                }
            } catch (err) {
                alert("Gagal membaca file JSON.");
            }
        };
        reader.readAsText(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Fix: Robust check for files to prevent 'reading 0 of undefined'
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
        e.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current += 1;
        // Fix: Added optional chaining and checks to prevent undefined access if dataTransfer is null
        if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false); dragCounter.current = 0;
        
        // Fix: Robust check for files to prevent 'reading 0 of undefined'
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
             const file = e.dataTransfer.files[0];
             processFile(file);
        }
    };

    const confirmImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (importCandidate) {
            onImportTemplate(importCandidate);
            setImportCandidate(null);
        }
    };

    const handleExport = (tpl: CardTemplate) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tpl, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${tpl.name.replace(/\s+/g, '_').toLowerCase()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    const filteredTemplates = templates
        .filter((t: any) => filter === 'ALL' || t.category === filter)
        .filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()));

    const renderMiniWireframe = (tpl: CardTemplate) => {
        const scale = 0.25;
        const objects = tpl.layout?.front?.json?.objects || [];
        return (
            <div className="relative w-24 h-36 bg-white shadow-lg transform group-hover:scale-105 transition-transform origin-bottom overflow-hidden border border-gray-200" 
                 style={{backgroundColor: tpl.layout?.front?.background || '#fff'}}>
                {objects.map((obj: any, i: number) => {
                    const style: React.CSSProperties = {
                        position: 'absolute',
                        left: (obj.left || 0) * scale, top: (obj.top || 0) * scale,
                        width: ((obj.width || 0) * (obj.scaleX || 1)) * scale,
                        height: ((obj.height || 0) * (obj.scaleY || 1)) * scale,
                        backgroundColor: obj.fill || '#ccc', borderRadius: (obj.rx || 0) * scale,
                    };
                    if (obj.type === 'i-text' || obj.type === 'textbox') return <div key={i} style={{...style, height: Math.max(4, (obj.fontSize || 12) * scale), backgroundColor: '#94a3b8', opacity: 0.7}}/>;
                    else if (obj.type === 'image') return <div key={i} style={{...style, backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1'}}/>;
                    else if (obj.type === 'rect') return <div key={i} style={style}/>;
                    else if (obj.type === 'path') return <div key={i} style={{...style, backgroundColor: obj.fill}}/>;
                    return null;
                })}
            </div>
        );
    };

    return (
        <div 
            className={cn("p-8 h-full flex flex-col relative transition-colors", isDragging ? "bg-cyan-900/40" : "")}
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-cyan-950/80 backdrop-blur-sm border-4 border-dashed border-cyan-500 rounded-xl m-4 pointer-events-none">
                    <div className="text-center animate-bounce">
                        <Upload size={64} className="mx-auto text-cyan-400 mb-4"/>
                        <h2 className="text-3xl font-bold text-white">Letakkan Templat Disini</h2>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">Galeri Templat</h1>
                    <p className="text-cyan-600/70">Pilih desain dasar atau impor desain Anda sendiri (Mendukung Drag & Drop).</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload size={16} className="mr-2"/> Impor JSON</Button>
                    <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} />
                    <Button onClick={() => setView('design')}><Plus size={16} className="mr-2"/> Buat Baru</Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-cyan-950/30 p-2 rounded-xl border border-cyan-900/50">
                <div className="flex gap-2 overflow-x-auto pb-0 px-2">
                    {['ALL', 'OFFICIAL', 'CORPORATE', 'CUSTOM'].map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap", filter === cat ? "bg-cyan-600 border-cyan-600 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-cyan-800/50 text-cyan-400 hover:border-cyan-500 hover:text-cyan-200")}>{cat}</button>
                    ))}
                </div>
                <div className="relative w-full md:w-64 px-2">
                    <Search className="absolute left-5 top-2.5 text-cyan-600" size={14}/>
                    <Input placeholder="Cari..." className="h-9 pl-9 text-xs border-cyan-800 bg-black/40" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {filteredTemplates.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-cyan-700 bg-cyan-950/10 rounded-xl border border-dashed border-cyan-900/50 p-12">
                    <LayoutTemplate size={48} className="mb-4 opacity-50"/>
                    <h3 className="text-lg font-bold">Templat tidak ditemukan</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20">
                    {filteredTemplates.map((tpl: any) => (
                         <Card key={tpl.id} className="overflow-hidden border-cyan-900/50 hover:border-cyan-400 transition-all group relative flex flex-col h-full bg-[#0b1221] cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]" onClick={() => onLoadTemplate(tpl)}>
                            <div className="h-48 bg-black flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1221] via-transparent to-transparent opacity-50"/>
                                {renderMiniWireframe(tpl)}
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm gap-2 z-10">
                                    <Button size="sm" className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold" onClick={(e) => { e.stopPropagation(); onLoadTemplate(tpl); }}>MUAT DESAIN</Button>
                                </div>
                                {tpl.category === 'OFFICIAL' && <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 z-20"><CheckCircle2 size={10}/> RESMI</div>}
                                {tpl.category === 'CUSTOM' && <div className="absolute top-2 right-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-20">CUSTOM</div>}
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-cyan-50 truncate group-hover:text-cyan-300" title={tpl.name}>{tpl.name}</h3>
                                    <div className="text-xs text-cyan-600 mt-1 uppercase tracking-wider font-semibold">{tpl.category}</div>
                                </div>
                                <div className="flex justify-end items-center gap-1 mt-4 pt-3 border-t border-cyan-900/30 relative z-20">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-cyan-600 hover:text-cyan-300" onClick={(e) => {e.stopPropagation(); handleExport(tpl);}} title="Ekspor JSON"><Download size={14}/></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-cyan-600 hover:text-red-400" onClick={(e) => {
                                        e.stopPropagation(); 
                                        if (onDeleteTemplate) {
                                            onDeleteTemplate(tpl.id);
                                        } else {
                                            alert("Fungsi hapus tidak terhubung");
                                        }
                                    }} title="Hapus"><Trash2 size={14}/></Button>
                                </div>
                            </div>
                         </Card>
                    ))}
                </div>
            )}

            {importCandidate && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
                    <Card className="w-full max-w-md bg-black border-cyan-500/50 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse"></div>
                        <form onSubmit={confirmImport} className="p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/30"><FileText size={20}/></div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Impor Templat</h2>
                                    <p className="text-xs text-cyan-500">Tinjau detail sebelum mengimpor.</p>
                                </div>
                            </div>
                            <div className="space-y-3 p-4 bg-cyan-950/20 rounded-lg border border-cyan-900/50">
                                <div className="space-y-1"><Label className="text-xs">Nama Templat</Label><Input value={importCandidate.name} onChange={e => setImportCandidate({...importCandidate, name: e.target.value})} required className="font-bold bg-black border-cyan-800"/></div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Kategori</Label>
                                    <Select value={importCandidate.category} onChange={e => setImportCandidate({...importCandidate, category: e.target.value as any})} className="bg-black border-cyan-800">
                                        <option value="CUSTOM">Custom</option><option value="OFFICIAL">Official</option><option value="CORPORATE">Corporate</option><option value="EVENT">Event</option>
                                    </Select>
                                </div>
                                <div className="space-y-1"><Label className="text-xs">Deskripsi</Label><Textarea value={importCandidate.description || ''} onChange={e => setImportCandidate({...importCandidate, description: e.target.value})} rows={2} className="text-xs bg-black border-cyan-800" placeholder="Deskripsi opsional..."/></div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button type="button" variant="ghost" onClick={() => setImportCandidate(null)}>Batal</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-500 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]"><Check size={16} className="mr-2"/> Konfirmasi Impor</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export const SettingsView = ({ config, setConfig, members, templates, currentUser, onUpdateUser }: { config: InstitutionConfig, setConfig: (c: InstitutionConfig) => void, members?: Member[], templates?: CardTemplate[], currentUser?: SystemUser, onUpdateUser?: (u: SystemUser) => void }) => {
    // Helper to upload images for global settings
    const handleUpload = (field: keyof InstitutionConfig, file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            setConfig({ ...config, [field]: e.target?.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        // In a real app, this would persist to backend
        alert("Konfigurasi Berhasil Disimpan!");
    };

    // Calculate unique departments
    const uniqueDepartments = Array.from(new Set(members?.map(m => m.department) || []));

    const handleDepartmentTemplateChange = (dept: string, templateId: string) => {
        const newMapping = { ...(config.departmentTemplates || {}) };
        if (templateId === "") {
            delete newMapping[dept]; // Remove mapping if "Default" is selected
        } else {
            newMapping[dept] = templateId;
        }
        setConfig({ ...config, departmentTemplates: newMapping });
    };
    
    // Profile Update Logic
    const [profileForm, setProfileForm] = useState({ 
        fullName: currentUser?.fullName || '',
        username: currentUser?.username || '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if(!currentUser || !onUpdateUser) return;
        
        if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
            alert("Konfirmasi kata sandi tidak cocok!");
            return;
        }

        const updatedUser: SystemUser = {
            ...currentUser,
            fullName: profileForm.fullName,
            username: profileForm.username,
            password: profileForm.newPassword ? profileForm.newPassword : currentUser.password
        };

        onUpdateUser(updatedUser);
        alert("Profil Admin Berhasil Diperbarui!");
        setProfileForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    };

    return (
        <div className="p-8 h-full overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
                    <Building2 className="text-cyan-400"/> Konfigurasi Sistem
                </h1>
                <Button className="bg-green-600 hover:bg-green-500 text-black font-bold" onClick={handleSave}>
                    <Save size={16} className="mr-2"/> Simpan Perubahan
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 pb-10">
                {/* 1. Identity & Branding */}
                <Card className="p-6 space-y-5 border-cyan-500/20">
                    <h3 className="font-bold border-b border-cyan-900/30 pb-3 mb-2 flex items-center gap-2 text-cyan-300">
                        <FileSignature size={18}/> Identitas Instansi
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Nama Utama</Label>
                            <Input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} placeholder="cth. KEMENTERIAN TEKNOLOGI"/>
                        </div>
                        <div className="space-y-1">
                            <Label>Nama Sekunder / Subjudul</Label>
                            <Input value={config.secondaryName} onChange={e => setConfig({...config, secondaryName: e.target.value})} placeholder="cth. REPUBLIK INDONESIA"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Warna Identitas</Label>
                            <div className="flex gap-2">
                                <Input type="color" className="w-10 p-0.5 h-9 cursor-pointer border-cyan-800" value={config.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} />
                                <Input value={config.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} className="font-mono text-cyan-300 uppercase"/>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Masa Berlaku Kartu</Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" value={config.validityYears} onChange={e => setConfig({...config, validityYears: parseInt(e.target.value)})} className="w-20"/>
                                <span className="text-sm text-cyan-600">Tahun</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <Label>Alamat Resmi</Label>
                        <Textarea value={config.address} onChange={e => setConfig({...config, address: e.target.value})} className="bg-black/30 text-xs" rows={2}/>
                    </div>

                    <div className="space-y-1">
                        <Label>Tanda Tangan Digital (Global)</Label>
                        <div className="flex gap-2 items-center">
                            {config.digitalSignatureUrl ? (
                                <div className="h-10 w-24 bg-white/10 rounded flex items-center justify-center p-1 border border-cyan-900">
                                    <img src={config.digitalSignatureUrl} alt="Sig" className="max-h-full max-w-full"/>
                                </div>
                            ) : <div className="h-10 w-24 bg-black/20 rounded border border-dashed border-cyan-900/50 flex items-center justify-center text-xs text-cyan-800">No Sig</div>}
                            <div className="flex-1">
                                <input type="file" id="sig-upload" className="hidden" accept="image/*" onChange={(e) => handleUpload('digitalSignatureUrl', e.target.files?.[0])}/>
                                <Button size="sm" variant="outline" className="w-full" onClick={() => document.getElementById('sig-upload')?.click()}>
                                    <Upload size={14} className="mr-2"/> Unggah PNG
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="space-y-8">
                    
                     {/* 0. Admin Profile Settings (New) */}
                     {currentUser && (
                        <Card className="p-6 space-y-5 border-purple-500/20 bg-purple-950/10">
                            <h3 className="font-bold border-b border-purple-900/30 pb-3 mb-2 flex items-center gap-2 text-purple-300">
                                <UserCog size={18}/> Pengaturan Profil Admin
                            </h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Nama Lengkap</Label>
                                        <Input value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} className="bg-slate-900/50 border-purple-900/30 focus:border-purple-500/50"/>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Username Login</Label>
                                        <Input value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} className="bg-slate-900/50 border-purple-900/30 focus:border-purple-500/50"/>
                                    </div>
                                </div>
                                
                                <div className="space-y-1 pt-2 border-t border-purple-900/20">
                                    <Label className="flex items-center gap-2"><Key size={12}/> Ubah Kata Sandi (Opsional)</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input type="password" placeholder="Password Baru" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} className="bg-slate-900/50 border-purple-900/30"/>
                                        <Input type="password" placeholder="Konfirmasi Password" value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})} className="bg-slate-900/50 border-purple-900/30"/>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" size="sm" variant="secondary" className="bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30">Update Profil Saya</Button>
                                </div>
                            </form>
                        </Card>
                     )}

                     {/* Department Mapping Section */}
                     <Card className="p-6 space-y-5 border-cyan-500/20">
                        <h3 className="font-bold border-b border-cyan-900/30 pb-3 mb-2 flex items-center gap-2 text-cyan-300">
                            <Layers size={18}/> Pemetaan Templat Departemen
                        </h3>
                        <p className="text-xs text-slate-400">Hubungkan departemen dengan desain khusus. Saat mencetak, sistem otomatis menggunakan templat ini.</p>
                        
                        <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-cyan-900/30">
                            {uniqueDepartments.length === 0 && <p className="text-xs text-slate-500 italic">Belum ada data departemen dari pegawai.</p>}
                            
                            {uniqueDepartments.map(dept => (
                                <div key={dept} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 w-1/3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                        <span className="text-sm font-bold text-slate-300 truncate" title={dept}>{dept}</span>
                                    </div>
                                    <Select 
                                        className="flex-1 h-8 text-xs bg-slate-900 border-slate-700"
                                        value={config.departmentTemplates?.[dept] || ""}
                                        onChange={(e) => handleDepartmentTemplateChange(dept, e.target.value)}
                                    >
                                        <option value="">-- Gunakan Desain Default --</option>
                                        {templates?.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </Select>
                                </div>
                            ))}
                        </div>
                     </Card>

                     {/* 2. Visual Security (Watermark & Pattern) */}
                     <Card className="p-6 space-y-5 border-cyan-500/20">
                        <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3 mb-2">
                             <h3 className="font-bold flex items-center gap-2 text-blue-300">
                                <ShieldCheck size={18}/> Pola Keamanan
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-cyan-700">Aktifkan</span>
                                <input type="checkbox" checked={config.enablePattern} onChange={e => setConfig({...config, enablePattern: e.target.checked})} className="w-4 h-4 accent-blue-500"/>
                            </div>
                        </div>

                        <div className={cn("space-y-4 transition-opacity", !config.enablePattern && "opacity-50 pointer-events-none")}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Teks Mikro</Label>
                                    <Input value={config.patternText} onChange={e => setConfig({...config, patternText: e.target.value})} className="h-8 text-xs font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Tata Letak</Label>
                                    <Select value={config.patternLayout} onChange={e => setConfig({...config, patternLayout: e.target.value as any})} className="h-8 text-xs">
                                        <option value="GRID">Grid Horizontal</option>
                                        <option value="BRICK">Bata Horizontal</option>
                                        <option value="V_GRID">Grid Vertikal</option>
                                        <option value="V_BRICK">Bata Vertikal</option>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1 text-cyan-400">Warna</Label>
                                    <div className="flex gap-2">
                                        <Input type="color" className="w-8 h-8 p-0.5" value={config.patternColor} onChange={e => setConfig({...config, patternColor: e.target.value})}/>
                                        <Input value={config.patternColor} onChange={e => setConfig({...config, patternColor: e.target.value})} className="h-8 text-xs uppercase"/>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-cyan-400"><span>Opasitas</span><span>{Math.round(config.patternOpacity * 100)}%</span></div>
                                    <input type="range" min="0.05" max="0.5" step="0.01" className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none" value={config.patternOpacity} onChange={e => setConfig({...config, patternOpacity: parseFloat(e.target.value)})}/>
                                </div>
                            </div>
                        </div>
                     </Card>
                </div>
            </div>

            {/* 3. Legal & Disclaimer */}
            <Card className="p-6 space-y-4 border-cyan-500/20">
                <h3 className="font-bold border-b border-cyan-900/30 pb-2 mb-2 flex items-center gap-2 text-cyan-300">
                    <Scale size={18}/> Legal & Disclaimer
                </h3>
                <div className="space-y-2">
                    <Label>Teks Belakang Kartu Default</Label>
                    <Textarea rows={5} value={config.disclaimer} onChange={e => setConfig({...config, disclaimer: e.target.value})} className="font-mono text-xs text-cyan-100/80 bg-black/40"/>
                    <p className="text-[10px] text-cyan-600">Teks ini akan muncul di bagian belakang semua kartu secara default kecuali diganti oleh templat.</p>
                </div>
            </Card>
        </div>
    );
};

export const NFCView = ({ members, onPrint, onLogIssuance }: { members: Member[], onPrint?: (m: Member) => void, onLogIssuance?: (l: IssuanceLog) => void }) => {
    const [status, setStatus] = useState<string>('Diam');
    const [selectedId, setSelectedId] = useState<string>('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Derive the target member
    const targetMember = members.find(m => m.id === selectedId);

    const handleSuccess = (member: Member, method: 'REAL' | 'SIMULATION') => {
        // 1. Show Visual Feedback
        setStatus(method === 'REAL' ? 'Sukses! Data Ditulis.' : 'Sukses! Data Ditulis (Simulasi).');
        setShowSuccessModal(true);

        // 2. Log Entry
        if (onLogIssuance) {
             const log: IssuanceLog = {
                id: Date.now().toString(),
                memberId: member.id,
                memberName: member.fullName,
                employeeId: member.employeeId,
                issuedDate: new Date().toISOString(),
                issuedBy: 'System Admin', 
                type: 'NEW', 
                status: 'ISSUED' // Used for NFC Issuance
            };
            onLogIssuance(log);
        }

        // 3. Reset after delay
        setTimeout(() => {
            setShowSuccessModal(false);
            setSelectedId(''); // Clear selection to ready next card
            setStatus('Diam');
            setIsSimulating(false);
        }, 2000);
    }

    const handleWrite = async () => {
        if (!targetMember) return;
        
        if ('NDEFReader' in window) {
            try {
                setStatus('Memindai... Tempelkan Tag NFC');
                // @ts-ignore
                const ndef = new window.NDEFReader();
                await ndef.write({
                    records: [{ recordType: "url", data: `https://id-forge.app/v/${targetMember.employeeId}` }]
                });
                handleSuccess(targetMember, 'REAL');
            } catch (error) {
                setStatus(`Gagal: ${error}`);
            }
        } else {
             // Fallback for simulation/testing on non-supported devices
             setIsSimulating(true);
             setStatus('Mode Simulasi: Mendekatkan kartu...');
             setTimeout(() => {
                 setStatus('Mode Simulasi: Menulis Data...');
                 setTimeout(() => {
                     handleSuccess(targetMember, 'SIMULATION');
                 }, 1500);
             }, 1000);
        }
    };

    return (
        <div className="p-8 h-full relative overflow-y-auto">
            <h1 className="text-2xl font-bold font-display mb-6 flex items-center gap-2 text-white"><Nfc className="text-yellow-400"/> Enkoder NFC</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg flex items-start gap-3">
                    <Info className="text-blue-400 shrink-0 mt-0.5" size={20}/>
                    <div>
                        <h4 className="text-blue-400 font-bold text-sm">Sudah Terlanjur Cetak?</h4>
                        <p className="text-blue-200/70 text-xs mt-1">
                            Gunakan <strong>Stiker NFC (NTAG215)</strong>. Tempelkan di belakang kartu yang sudah dicetak, lalu tulis data seperti biasa.
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20}/>
                    <div>
                        <h4 className="text-yellow-400 font-bold text-sm">Persyaratan Perangkat</h4>
                        <p className="text-yellow-200/70 text-xs mt-1">Web NFC butuh Chrome (Android) & HTTPS. Gunakan tombol di bawah untuk simulasi di PC.</p>
                    </div>
                </div>
            </div>

            <Card className="max-w-xl mx-auto p-8 text-center space-y-6 bg-cyan-950/20 border-cyan-500/30">
                <div className={cn("w-24 h-24 rounded-full mx-auto flex items-center justify-center border transition-all duration-500", isSimulating ? "bg-green-900/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]" : "bg-cyan-900/20 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] animate-pulse")}>
                    <Smartphone size={48} className={cn("transition-colors", isSimulating ? "text-green-400" : "text-cyan-400")}/>
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Tempel untuk Menulis</h3>
                    <p className="text-cyan-500">Pilih pegawai dan tempelkan kartu mereka untuk menulis data.</p>
                </div>
                
                <div className="max-w-xs mx-auto text-left">
                    <Label>Pilih Pegawai</Label>
                    <Select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="mt-1">
                        <option value="">-- Pilih --</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </Select>
                </div>
                
                {/* Data Preview */}
                {targetMember && (
                    <div className="bg-black/40 border border-cyan-900/50 p-3 rounded-lg flex items-center gap-3 text-left animate-in fade-in slide-in-from-top-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                            <Link size={14}/>
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-[10px] text-cyan-600 uppercase font-bold">Data yang akan ditulis (URL)</div>
                            <div className="text-xs font-mono text-cyan-100 truncate">https://id-forge.app/v/{targetMember.employeeId}</div>
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <Button size="lg" disabled={!selectedId || isSimulating} onClick={handleWrite} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                        <Nfc className="mr-2"/> {isSimulating ? 'Memproses...' : 'Tulis Data ke Kartu'}
                    </Button>
                    <p className={cn("mt-4 text-sm font-mono transition-colors", status.includes('Sukses') ? "text-green-400" : "text-cyan-400")}>{status}</p>
                </div>
            </Card>

            {/* Feature Explanation Grid */}
            <h3 className="text-lg font-bold text-white mt-10 mb-4 flex items-center gap-2"><Cpu size={18} className="text-cyan-400"/> Kapabilitas NFC ID-X</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <Card className="p-4 bg-cyan-950/10 border-cyan-800/30">
                    <div className="bg-purple-900/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3 border border-purple-500/30">
                        <Globe size={20} className="text-purple-400"/>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Tautan Digital Pintar</h4>
                    <p className="text-xs text-cyan-400/70 leading-relaxed">
                        Chip diprogram dengan URL unik profil pegawai. Saat kartu di-scan, HP otomatis membuka halaman profil tanpa perlu aplikasi.
                    </p>
                </Card>
                <Card className="p-4 bg-cyan-950/10 border-cyan-800/30">
                    <div className="bg-green-900/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3 border border-green-500/30">
                        <LockKeyhole size={20} className="text-green-400"/>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Verifikasi Anti-Palsu</h4>
                    <p className="text-xs text-cyan-400/70 leading-relaxed">
                        Mencegah pemalsuan fisik. Kartu palsu tidak akan memiliki chip yang mengarah ke server valid milik instansi Anda.
                    </p>
                </Card>
                <Card className="p-4 bg-cyan-950/10 border-cyan-800/30">
                    <div className="bg-blue-900/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3 border border-blue-500/30">
                        <Smartphone size={20} className="text-blue-400"/>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Kompatibilitas Luas</h4>
                    <p className="text-xs text-cyan-400/70 leading-relaxed">
                        Menggunakan standar NDEF (NTAG215) yang didukung oleh hampir semua smartphone Android & iPhone modern secara native.
                    </p>
                </Card>
            </div>

            {/* Success Modal Overlay */}
            {showSuccessModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-green-500 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(34,197,94,0.3)] transform scale-100 animate-in zoom-in-95">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                            <Check size={40} className="text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Berhasil!</h2>
                        <p className="text-slate-400">Data NFC telah ditulis ke kartu.</p>
                    </div>
                </div>
            )}
        </div>
    )
};

export const VerifyView = ({ members, onLogIssuance }: { members: Member[], onLogIssuance?: (l: IssuanceLog) => void }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<Member | null>(null);
    const [searchStatus, setSearchStatus] = useState<'IDLE' | 'FOUND' | 'NOT_FOUND'>('IDLE');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Initialize Scanner when active
    useEffect(() => {
        if (isCameraActive && !scannerRef.current) {
            // Prevent duplicate initialization
            const scanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );
            
            scanner.render(
                (decodedText) => {
                    handleScanSuccess(decodedText);
                    scanner.clear();
                    setIsCameraActive(false);
                    scannerRef.current = null;
                }, 
                (errorMessage) => {
                    // Ignore transient scanning errors
                }
            );
            scannerRef.current = scanner;
        }

        return () => {
             // Cleanup if component unmounts while scanning
             if (scannerRef.current) {
                 try {
                     scannerRef.current.clear().catch(e => console.log('Scanner clear error', e));
                 } catch(e) {}
             }
        };
    }, [isCameraActive]);

    const handleScanSuccess = (decodedText: string) => {
        // Assume format is https://id-forge.app/v/EMPLOYEE_ID
        // Extract ID or use full text if it's just the ID
        const parts = decodedText.split('/');
        const idFromUrl = parts[parts.length - 1];
        setQuery(idFromUrl);
        findMember(idFromUrl);
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        findMember(query);
    }

    const findMember = (q: string) => {
        const found = members.find(m => m.employeeId === q || m.id === q);
        
        if(found) {
            setResult(found);
            setSearchStatus('FOUND');
            if (onLogIssuance) {
                const log: IssuanceLog = {
                    id: Date.now().toString() + Math.random(),
                    memberId: found.id,
                    memberName: found.fullName,
                    employeeId: found.employeeId,
                    issuedDate: new Date().toISOString(),
                    issuedBy: 'System Scanner', 
                    type: 'VERIFICATION', 
                    status: 'SCANNED'
                };
                onLogIssuance(log);
            }
        } else {
            setResult(null);
            setSearchStatus('NOT_FOUND');
        }
    }

    const toggleCamera = () => {
        if (isCameraActive) {
            if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
            }
            setIsCameraActive(false);
        } else {
            setSearchStatus('IDLE');
            setResult(null);
            setIsCameraActive(true);
        }
    };

    return (
         <div className="p-8 h-full relative overflow-y-auto">
            <h1 className="text-2xl font-bold font-display mb-6 flex items-center gap-2 text-white"><ShieldCheck className="text-green-400"/> Verifikasi ID</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 h-fit border-cyan-900/50">
                    <div className="space-y-4">
                        {/* Camera/Scanner Area */}
                        {isCameraActive ? (
                            <div className="rounded-xl overflow-hidden bg-black relative border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                <div id="reader" className="w-full"></div>
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-red-900/80 text-white"
                                    onClick={toggleCamera}
                                >
                                    Tutup Kamera
                                </Button>
                            </div>
                        ) : (
                            <div className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-cyan-800 bg-cyan-950/10 hover:bg-cyan-900/20 transition-all" onClick={toggleCamera}>
                                <div className="text-center p-8">
                                    <Scan size={48} className="mx-auto text-cyan-600 mb-2 group-hover:text-cyan-400 transition-colors"/>
                                    <p className="text-cyan-500 font-bold">Ketuk untuk Scan QR Kamera</p>
                                    <p className="text-cyan-700 text-xs mt-1">(Real-Time Scanner)</p>
                                </div>
                            </div>
                        )}

                        <div className="relative flex items-center py-2">
                             <div className="flex-grow border-t border-cyan-900/50"></div>
                             <span className="flex-shrink-0 mx-4 text-cyan-700 text-xs">ATAU INPUT MANUAL</span>
                             <div className="flex-grow border-t border-cyan-900/50"></div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-2">
                            <Label>ID Pegawai / NIP</Label>
                            <div className="flex gap-2">
                                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="cth. 19900101..." className="font-mono"/>
                                <Button type="submit"><Search size={16}/></Button>
                            </div>
                        </form>
                    </div>
                </Card>
                
                {/* Result Display Logic */}
                {searchStatus === 'FOUND' && result && (
                     <Card className="p-6 bg-slate-900 border-cyan-500/50 animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none"></div>
                        <div className="flex gap-4 items-start relative z-10">
                            <img src={result.photoUrl} className="w-24 h-24 rounded-lg object-cover border-2 border-cyan-500/50 shadow-lg" alt="profile"/>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-xl font-bold text-white">{result.fullName}</h3>
                                <p className="text-cyan-400 font-medium font-mono tracking-wide">{result.role}</p>
                                <p className="text-slate-400 text-sm">{result.department}</p>
                                <div className="pt-2 flex gap-2">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-bold", result.status === 'ACTIVE' ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30")}>{result.status}</span>
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">{result.approvalStatus}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-cyan-900/30 grid grid-cols-2 gap-4">
                            <div><div className="text-xs text-slate-500">ID Pegawai</div><div className="font-mono text-sm text-cyan-200">{result.employeeId}</div></div>
                            <div><div className="text-xs text-slate-500">Berlaku Hingga</div><div className="font-mono text-sm text-cyan-200">{result.expiryDate}</div></div>
                            <div className="col-span-2"><div className="text-xs text-slate-500">Log Verifikasi Terakhir</div><div className="font-mono text-sm text-slate-300">{new Date().toLocaleString()}</div></div>
                        </div>
                        <div className="absolute bottom-2 right-2 text-cyan-900/20 animate-pulse">
                            <ShieldCheck size={120}/>
                        </div>
                     </Card>
                )}
                
                {searchStatus === 'NOT_FOUND' && (
                     <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-900/50 rounded-xl bg-red-950/10 animate-in fade-in">
                        <AlertOctagon size={48} className="text-red-500 mb-4"/>
                        <h3 className="text-xl font-bold text-red-400">Data Tidak Ditemukan</h3>
                        <p className="text-red-300/70 text-center max-w-xs mt-2">ID Pegawai <strong>"{query}"</strong> tidak terdaftar dalam database sistem aktif.</p>
                     </div>
                )}
                
                {searchStatus === 'IDLE' && (
                    <div className="flex flex-col items-center justify-center p-8 opacity-30">
                        <Terminal size={48} className="text-slate-500 mb-4"/>
                        <p className="text-slate-500 text-sm font-mono text-center">Menunggu input pemindaian...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const HistoryView = ({ logs }: { logs: IssuanceLog[] }) => {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold font-display mb-6 flex items-center gap-2 text-white"><History className="text-blue-400"/> Riwayat Aktivitas Kartu</h1>
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Waktu</th>
                                <th className="p-4">Pegawai</th>
                                <th className="p-4">Aksi</th>
                                <th className="p-4">Operator</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-slate-400">{new Date(log.issuedDate).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-200">{log.memberName}</div>
                                        <div className="text-xs text-slate-500">{log.employeeId}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold",
                                            log.type === 'NEW' ? "bg-blue-500/10 text-blue-400" : 
                                            log.type === 'VERIFICATION' ? "bg-yellow-500/10 text-yellow-400" : "bg-purple-500/10 text-purple-400"
                                        )}>{log.type}</span>
                                    </td>
                                    <td className="p-4 text-slate-300">{log.issuedBy}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "flex items-center gap-1.5 text-xs font-medium",
                                            log.status === 'ISSUED' ? "text-green-400" : 
                                            log.status === 'PRINTED' ? "text-cyan-400" : 
                                            log.status === 'SCANNED' ? "text-yellow-400" : "text-slate-400"
                                        )}>
                                            {log.status === 'ISSUED' && <CheckCircle2 size={12}/>}
                                            {log.status === 'PRINTED' && <Printer size={12}/>}
                                            {log.status === 'SCANNED' && <Scan size={12}/>}
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
};

export const SecurityView = ({ auditLogs }: { auditLogs: AuditLogEntry[] }) => {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold font-display mb-6 flex items-center gap-2 text-white"><Siren className="text-red-500"/> Keamanan & Audit</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-4 bg-red-950/20 border-red-500/30">
                    <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Total Log</h3>
                    <div className="text-3xl font-bold text-white">{auditLogs.length}</div>
                </Card>
                <Card className="p-4 bg-yellow-950/20 border-yellow-500/30">
                    <h3 className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Peringatan</h3>
                    <div className="text-3xl font-bold text-white">{auditLogs.filter(l => l.severity === 'WARNING').length}</div>
                </Card>
                <Card className="p-4 bg-blue-950/20 border-blue-500/30">
                    <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Aktivitas Admin</h3>
                    <div className="text-3xl font-bold text-white">{auditLogs.filter(l => l.role === 'SUPER_ADMIN').length}</div>
                </Card>
            </div>

            <div className="bg-black border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">System Audit Trail</span>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {auditLogs.map(log => (
                        <div key={log.id} className="flex gap-4 p-2 hover:bg-white/5 rounded border-l-2 border-transparent hover:border-cyan-500 transition-all">
                            <span className="text-slate-500 w-36 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className={cn(
                                "w-20 shrink-0 font-bold",
                                log.severity === 'CRITICAL' ? "text-red-500" : 
                                log.severity === 'WARNING' ? "text-yellow-500" : "text-blue-400"
                            )}>[{log.severity}]</span>
                            <span className="text-purple-400 w-24 shrink-0 truncate" title={log.username}>{log.username}</span>
                            <span className="text-cyan-300 w-32 shrink-0">{log.action}</span>
                            <span className="text-slate-300 flex-1">{log.details}</span>
                            <span className="text-slate-600 hidden md:inline">{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                    ))}
                    {auditLogs.length === 0 && <div className="text-slate-600 text-center py-8">Belum ada log aktivitas tercatat.</div>}
                </div>
            </div>
        </div>
    )
};