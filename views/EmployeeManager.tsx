import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Sparkles, Eye, Upload, X, User, Printer, Camera, Download, FileSpreadsheet } from 'lucide-react';
import { Member } from '../types';
import { Button, Card, Input, Label, cn } from '../components/UIComponents';
import { generateIdCardProfile } from '../services/geminiService';
import { api } from '../services/backend';

interface EmployeeManagerProps {
    members: Member[];
    setMembers: (members: Member[]) => void;
    onPrint?: (member: Member) => void;
    onPrintSelected?: (members: Member[]) => void;
}

export const EmployeeManager = ({ members, setMembers, onPrint, onPrintSelected }: EmployeeManagerProps) => {
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [viewingMember, setViewingMember] = useState<Member | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    
    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // Photo Upload & Camera State
    const [previewPhoto, setPreviewPhoto] = useState<string>('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const openForm = (member?: Member) => {
        setEditingMember(member || null);
        setPreviewPhoto(member?.photoUrl || '');
        setIsMemberFormOpen(true);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- CAMERA LOGIC ---
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Gagal mengakses kamera. Pastikan izin diberikan.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setPreviewPhoto(dataUrl);
                stopCamera();
            }
        }
    };

    useEffect(() => {
        return () => { if (streamRef.current) stopCamera(); };
    }, []);

    const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const finalPhotoUrl = previewPhoto || 'https://via.placeholder.com/150';

        const newMember: Member = {
            id: editingMember ? editingMember.id : Date.now().toString(),
            fullName: formData.get('fullName') as string,
            role: formData.get('role') as string,
            department: formData.get('department') as string,
            employeeId: formData.get('employeeId') as string,
            employmentType: 'PNS',
            status: (formData.get('status') as any) || 'ACTIVE',
            approvalStatus: 'APPROVED',
            joinedDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date().toISOString().split('T')[0],
            photoUrl: finalPhotoUrl,
            scanHistory: editingMember?.scanHistory || []
        };

        // Call Backend API
        await api.members.save(newMember);
        
        // Update Local State for UI
        if (editingMember) {
            setMembers(members.map(m => m.id === editingMember.id ? newMember : m));
        } else {
            setMembers([...members, newMember]);
        }
        
        setIsMemberFormOpen(false);
        setEditingMember(null);
        setPreviewPhoto('');
    };

    const handleDeleteMember = async (id: string) => {
        if(confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
            await api.members.delete(id);
            setMembers(members.filter(m => m.id !== id));
            if (selectedIds.has(id)) {
                const newSet = new Set(selectedIds);
                newSet.delete(id);
                setSelectedIds(newSet);
            }
        }
    };

    const handleGenerateProfile = async () => {
        const keyword = prompt("Masukkan jabatan atau industri (cth: 'Akuntan Senior' atau 'Satpam'):");
        if(!keyword) return;

        setAiLoading(true);
        try {
            const profile = await generateIdCardProfile(keyword);
            if(profile) {
                const randomId = Math.floor(100000 + Math.random() * 900000);
                const form = document.getElementById('employeeForm') as HTMLFormElement;
                if(form) {
                    (form.elements.namedItem('fullName') as HTMLInputElement).value = profile.fullName;
                    (form.elements.namedItem('role') as HTMLInputElement).value = profile.role;
                    (form.elements.namedItem('department') as HTMLInputElement).value = profile.department;
                    (form.elements.namedItem('employeeId') as HTMLInputElement).value = `EMP-${randomId}`;
                }
            }
        } catch (e) {
            alert("Gagal membuat profil. Coba lagi.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Nama Lengkap", "NIP/ID", "Jabatan", "Departemen", "Status", "Bergabung"];
        const rows = members.map(m => [
            m.id, `"${m.fullName}"`, `"${m.employeeId}"`, `"${m.role}"`, `"${m.department}"`, m.status, m.joinedDate
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "data_pegawai_idx.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === members.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(members.map(m => m.id)));
    };

    const handleBatchPrint = () => {
        if (!onPrintSelected) return;
        const selectedMembers = members.filter(m => selectedIds.has(m.id));
        onPrintSelected(selectedMembers);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Manajemen Pegawai</h1>
                    <p className="text-slate-400">Kelola data pegawai dan kartu mereka.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportCSV} className="border-green-500/50 text-green-400 hover:bg-green-900/20"><FileSpreadsheet size={16} className="mr-2"/> Ekspor CSV</Button>
                    {selectedIds.size > 0 && onPrintSelected && (
                         <Button variant="secondary" onClick={handleBatchPrint} className="animate-in fade-in slide-in-from-right-4 border border-blue-500/50 bg-blue-900/20 text-blue-200 hover:bg-blue-900/40"><Printer size={16} className="mr-2"/> Cetak Terpilih ({selectedIds.size})</Button>
                    )}
                    <Button onClick={() => openForm()}><Plus size={16} className="mr-2"/> Tambah Pegawai</Button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 flex-1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 w-12 text-center"><input type="checkbox" checked={members.length > 0 && selectedIds.size === members.length} onChange={toggleAll} className="w-4 h-4 accent-blue-600 rounded cursor-pointer"/></th>
                                <th className="p-4 w-20">FOTO</th>
                                <th className="p-4">NAMA</th>
                                <th className="p-4">NIP/NRP</th>
                                <th className="p-4">JABATAN</th>
                                <th className="p-4">STATUS</th>
                                <th className="p-4 text-right">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {members.map(member => (
                                <tr key={member.id} className={cn("transition-colors", selectedIds.has(member.id) ? "bg-blue-900/10 hover:bg-blue-900/20" : "hover:bg-slate-800/50")}>
                                    <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.has(member.id)} onChange={() => toggleSelection(member.id)} className="w-4 h-4 accent-blue-600 rounded cursor-pointer"/></td>
                                    <td className="p-4"><img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700"/></td>
                                    <td className="p-4"><div className="font-bold text-slate-200">{member.fullName}</div></td>
                                    <td className="p-4"><div className="font-mono text-slate-400">{member.employeeId}</div></td>
                                    <td className="p-4"><div className="text-slate-200 font-medium">{member.role}</div><div className="text-xs text-slate-500">{member.department}</div></td>
                                    <td className="p-4"><span className={cn("px-2 py-1 rounded-full text-xs font-bold", member.status === 'ACTIVE' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{member.status}</span></td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="icon" variant="ghost" title="Lihat Detail" onClick={() => setViewingMember(member)}><Eye size={16} className="text-slate-300"/></Button>
                                            <Button size="icon" variant="ghost" title="Ubah Data" onClick={() => openForm(member)}><Edit size={16} className="text-blue-400"/></Button>
                                            <Button size="icon" variant="ghost" title="Hapus" onClick={() => handleDeleteMember(member.id)}><Trash2 size={16} className="text-red-400"/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewingMember && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-slate-950 border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                        <div className="p-6 relative pt-12 flex flex-col items-center">
                            <button onClick={() => setViewingMember(null)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 rounded-full p-1"><X size={20}/></button>
                            <div className="w-24 h-24 rounded-full border-4 border-slate-950 shadow-xl overflow-hidden bg-slate-800 mb-4"><img src={viewingMember.photoUrl} alt={viewingMember.fullName} className="w-full h-full object-cover"/></div>
                            <h2 className="text-2xl font-bold text-white text-center">{viewingMember.fullName}</h2>
                            <p className="text-blue-400 font-medium mb-1">{viewingMember.role}</p>
                            <p className="text-slate-500 text-sm mb-6">{viewingMember.department}</p>
                            <div className="w-full space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-800 mb-6">
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400 text-sm">NIP/NRP</span><span className="font-mono text-white">{viewingMember.employeeId}</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400 text-sm">Status</span><span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", viewingMember.status === 'ACTIVE' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>{viewingMember.status}</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400 text-sm">Bergabung</span><span className="text-white text-sm">{viewingMember.joinedDate}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400 text-sm">Masa Berlaku</span><span className="text-white text-sm">{viewingMember.expiryDate}</span></div>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12" onClick={() => { if (onPrint) onPrint(viewingMember); }}><Printer className="mr-2" size={18} /> Cetak ID Card</Button>
                        </div>
                    </Card>
                </div>
            )}

            {isMemberFormOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg bg-slate-950 border-slate-800 relative max-h-[90vh] overflow-y-auto">
                        <form id="employeeForm" onSubmit={handleSaveMember} className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{editingMember ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}</h2>
                                <Button type="button" variant="outline" size="sm" onClick={handleGenerateProfile} disabled={aiLoading} className="border-purple-500 text-purple-400 hover:bg-purple-500/10"><Sparkles size={14} className="mr-2"/>{aiLoading ? 'Membuat...' : 'Isi Otomatis AI'}</Button>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800">
                                <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center relative group">
                                    {previewPhoto ? <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover"/> : <User className="text-slate-500" />}
                                </div>
                                <div className="flex-1">
                                    <Label className="mb-2 block">Foto Profil</Label>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="default" size="sm" onClick={startCamera}><Camera size={14} className="mr-2"/> Kamera</Button>
                                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}><Upload size={14} className="mr-2"/> Unggah</Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewPhoto('')} className="text-red-400">Hapus</Button>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
                                    <input type="hidden" name="photoUrl" value={previewPhoto} />
                                </div>
                            </div>
                            {isCameraOpen && (
                                <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
                                    <div className="relative w-full max-w-lg aspect-video bg-black border-2 border-cyan-500 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <Button type="button" variant="ghost" onClick={stopCamera} className="text-red-400 border border-red-900 hover:bg-red-900/20">Batal</Button>
                                        <Button type="button" size="lg" onClick={capturePhoto} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8"><Camera size={20} className="mr-2"/> Ambil Foto</Button>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nama Lengkap</Label><Input name="fullName" defaultValue={editingMember?.fullName} required placeholder="Nama Lengkap"/></div>
                                <div className="space-y-2"><Label>NIP / NRP / ID</Label><Input name="employeeId" defaultValue={editingMember?.employeeId} required placeholder="Nomor Induk"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Jabatan</Label><Input name="role" defaultValue={editingMember?.role} required placeholder="Jabatan"/></div>
                                <div className="space-y-2"><Label>Departemen / Divisi</Label><Input name="department" defaultValue={editingMember?.department} required placeholder="Unit Kerja"/></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Status Kepegawaian</Label>
                                <select name="status" defaultValue={editingMember?.status || 'ACTIVE'} className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                                    <option value="ACTIVE">AKTIF</option><option value="INACTIVE">TIDAK AKTIF</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6 border-t border-slate-800 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsMemberFormOpen(false)}>Batal</Button>
                                <Button type="submit">Simpan Data</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}