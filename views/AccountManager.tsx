import React, { useState } from 'react';
import { Plus, Edit, Trash2, Shield, UserCog, CheckCircle2, XCircle, Key, Search } from 'lucide-react';
import { Button, Card, Input, Label, Select, cn } from '../components/UIComponents';
import { SystemUser, UserRole } from '../types';

interface AccountManagerProps {
    users: SystemUser[];
    setUsers: (users: SystemUser[]) => void;
}

export const AccountManager = ({ users, setUsers }: AccountManagerProps) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [search, setSearch] = useState('');

    const openForm = (user?: SystemUser) => {
        setEditingUser(user || null);
        setIsFormOpen(true);
    };

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const newUser: SystemUser = {
            id: editingUser ? editingUser.id : Date.now().toString(),
            fullName: formData.get('fullName') as string,
            username: formData.get('username') as string,
            role: formData.get('role') as UserRole,
            status: formData.get('status') as 'ACTIVE' | 'INACTIVE',
            lastLogin: editingUser?.lastLogin || '-'
        };

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? newUser : u));
        } else {
            setUsers([...users, newUser]);
        }
        setIsFormOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Hapus pengguna ini? Akses mereka akan dicabut.')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const filteredUsers = users.filter(u => 
        u.fullName.toLowerCase().includes(search.toLowerCase()) || 
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Akun Pengguna</h1>
                    <p className="text-slate-400">Kelola administrator sistem dan operator.</p>
                </div>
                <Button onClick={() => openForm()}>
                    <Plus size={16} className="mr-2"/> Tambah Pengguna
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                <Search size={16} className="text-slate-500 ml-2"/>
                <Input 
                    placeholder="Cari pengguna..." 
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 flex-1 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Info Pengguna</th>
                                <th className="p-4">Peran</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Login Terakhir</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                                <UserCog className="text-slate-400" size={20}/>
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200">{user.fullName}</div>
                                                <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 w-fit",
                                            user.role === 'SUPER_ADMIN' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : 
                                            user.role === 'ADMIN_INSTANSI' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                            "bg-slate-700/30 text-slate-400 border-slate-600/30"
                                        )}>
                                            <Shield size={10}/> {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                         <div className="flex items-center gap-2">
                                            {user.status === 'ACTIVE' ? <CheckCircle2 size={14} className="text-green-500"/> : <XCircle size={14} className="text-red-500"/>}
                                            <span className={cn("text-xs font-medium", user.status === 'ACTIVE' ? "text-green-400" : "text-red-400")}>{user.status}</span>
                                         </div>
                                    </td>
                                    <td className="p-4 text-slate-400 text-xs">
                                        {user.lastLogin}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="icon" variant="ghost" title="Ubah" onClick={() => openForm(user)}>
                                                <Edit size={16} className="text-blue-400"/>
                                            </Button>
                                            <Button size="icon" variant="ghost" title="Hapus" onClick={() => handleDelete(user.id)}>
                                                <Trash2 size={16} className="text-red-400"/>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-slate-950 border-slate-800">
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <UserCog className="text-blue-500"/> 
                                {editingUser ? 'Ubah Pengguna' : 'Pengguna Baru'}
                            </h2>
                            
                            <div className="space-y-2">
                                <Label>Nama Lengkap</Label>
                                <Input name="fullName" defaultValue={editingUser?.fullName} required placeholder="cth. Budi Santoso"/>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Nama Pengguna</Label>
                                <Input name="username" defaultValue={editingUser?.username} required placeholder="cth. admin_utama"/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Akses Peran</Label>
                                    <Select name="role" defaultValue={editingUser?.role || 'OPERATOR'}>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                        <option value="ADMIN_INSTANSI">Admin Instansi</option>
                                        <option value="OPERATOR">Operator</option>
                                        <option value="VIEWER">Peninjau</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status Akun</Label>
                                    <Select name="status" defaultValue={editingUser?.status || 'ACTIVE'}>
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="INACTIVE">Ditangguhkan</option>
                                    </Select>
                                </div>
                            </div>

                            {!editingUser && (
                                <div className="space-y-2">
                                    <Label>Kata Sandi</Label>
                                    <Input type="password" placeholder="••••••••" disabled className="bg-slate-900/50 cursor-not-allowed"/>
                                    <p className="text-[10px] text-slate-500">Kata sandi default adalah '123456' untuk pengguna baru.</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
                                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
                                <Button type="submit">Simpan Pengguna</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}