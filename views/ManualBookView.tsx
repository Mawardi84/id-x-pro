import React, { useState } from 'react';
import { BookOpen, ChevronRight, Monitor, PaintBucket, Nfc, Printer, Shield, Database, PenTool, Layout, FileText, Cpu } from 'lucide-react';
import { Card, cn } from '../components/UIComponents';

const MANUAL_CHAPTERS = [
    {
        id: 'intro',
        title: 'Pengenalan Sistem',
        icon: Monitor,
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang di ID-X Pro</h2>
                    <p className="text-slate-400 leading-relaxed">
                        ID-X Pro adalah platform manajemen identitas terpadu yang dirancang untuk instansi modern. 
                        Sistem ini menggabungkan desain kartu ID profesional, pencetakan massal, dan teknologi keamanan digital (NFC & QR) dalam satu alur kerja yang mulus.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyan-950/20 p-4 rounded-lg border border-cyan-500/20">
                        <h3 className="font-bold text-cyan-400 mb-2">Fitur Utama</h3>
                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                            <li>Manajemen Data Pegawai Terpusat</li>
                            <li>Studio Desain Kartu (Drag & Drop)</li>
                            <li>Integrasi NFC & QR Code</li>
                            <li>Pencetakan Massal Presisi</li>
                            <li>Audit Keamanan & Log Aktivitas</li>
                        </ul>
                    </div>
                    <div className="bg-purple-950/20 p-4 rounded-lg border border-purple-500/20">
                        <h3 className="font-bold text-purple-400 mb-2">Persyaratan Sistem</h3>
                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                            <li>Browser Modern (Chrome/Edge disarankan)</li>
                            <li>Koneksi Internet (Untuk AI & Aset)</li>
                            <li>Printer ID Card (CR-80) atau Laser A4</li>
                            <li>Perangkat Pembaca/Penulis NFC (Opsional)</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'employees',
        title: 'Manajemen Pegawai',
        icon: Database,
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Mengelola Data Pegawai</h2>
                    <p className="text-slate-400 mb-4">
                        Menu <strong>Pegawai</strong> adalah pusat database Anda. Di sini Anda dapat menambah, mengubah, atau menghapus data pemegang kartu.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-cyan-500">
                        <h3 className="font-bold text-white flex items-center gap-2"><Cpu size={16} className="text-cyan-400"/> Fitur AI Autofill</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Saat menambah pegawai baru, gunakan tombol <strong>"Isi Otomatis AI"</strong>. 
                            Cukup ketik kata kunci seperti "Satpam" atau "Programmer Senior", dan AI akan membuatkan profil fiktif lengkap dengan nama, jabatan, dan ID untuk keperluan demo/testing.
                        </p>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <h3 className="font-bold text-white mb-2">Langkah Menambah Pegawai Manual:</h3>
                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                            <li>Klik tombol <strong>"Tambah Pegawai"</strong> di pojok kanan atas.</li>
                            <li>Isi Nama Lengkap, NIP/ID, Jabatan, dan Departemen.</li>
                            <li>Unggah Foto Profil (Disarankan rasio 1:1 atau persegi).</li>
                            <li>Tentukan Status Kepegawaian (Aktif/Tidak Aktif).</li>
                            <li>Klik <strong>Simpan Data</strong>.</li>
                        </ol>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'design',
        title: 'Studio Desain',
        icon: PaintBucket,
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Studio Desain Kartu</h2>
                    <p className="text-slate-400 mb-4">
                        Buat desain kartu yang menakjubkan dengan editor visual kami. Anda dapat mengatur sisi Depan dan Belakang kartu secara terpisah.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 border-slate-700 bg-slate-900/50">
                        <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><Layout size={16}/> Lapisan & Elemen</h3>
                        <p className="text-xs text-slate-400 mb-3">Gunakan toolbar kiri untuk menambahkan:</p>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li className="flex items-center gap-2"><PenTool size={14} className="text-slate-500"/> <strong>Teks:</strong> Statis atau Dinamis.</li>
                            <li className="flex items-center gap-2"><Layout size={14} className="text-slate-500"/> <strong>Bentuk:</strong> Kotak, Garis, Background.</li>
                            <li className="flex items-center gap-2"><FileText size={14} className="text-slate-500"/> <strong>QR Code:</strong> Dapat dikustomisasi gayanya.</li>
                        </ul>
                    </Card>

                    <Card className="p-4 border-slate-700 bg-slate-900/50">
                        <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2"><Database size={16}/> Data Binding (Penting!)</h3>
                        <p className="text-xs text-slate-400 mb-3">Agar satu desain bisa dipakai untuk semua pegawai:</p>
                        <div className="text-sm text-slate-300">
                            Pilih elemen teks/gambar, lalu pada panel properti kanan, ubah <strong>"Sumber Data"</strong> menjadi:
                            <ul className="list-disc list-inside mt-2 text-cyan-200">
                                <li>Nama Lengkap</li>
                                <li>Jabatan / ID</li>
                                <li>Foto Pegawai</li>
                                <li>QR Code (berisi Link Profil)</li>
                            </ul>
                        </div>
                    </Card>
                </div>
            </div>
        )
    },
    {
        id: 'nfc',
        title: 'NFC & Keamanan',
        icon: Nfc,
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Enkoder NFC & Keamanan</h2>
                    <p className="text-slate-400 mb-4">
                        ID-X Pro mendukung penulisan data ke kartu pintar (Smart Card) atau stiker NFC (NTAG215) untuk verifikasi digital.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                        <h3 className="font-bold text-yellow-500 mb-2">Cara Menulis NFC</h3>
                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                            <li>Pastikan Anda menggunakan perangkat Android dengan NFC aktif atau PC dengan USB NFC Writer.</li>
                            <li>Buka menu <strong>Penulis NFC</strong>.</li>
                            <li>Pilih nama pegawai dari daftar dropdown.</li>
                            <li>Klik tombol <strong>"Tulis Data ke Kartu"</strong>.</li>
                            <li>Tempelkan kartu kosong ke pembaca.</li>
                            <li>Sistem akan menulis URL Profil unik terenkripsi ke dalam chip.</li>
                        </ol>
                    </div>

                     <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                        <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2"><Shield size={16}/> Audit Keamanan</h3>
                        <p className="text-sm text-slate-300">
                            Setiap aktivitas penting (Login, Cetak, Tulis NFC, Ubah Data) dicatat dalam <strong>Jejak Audit</strong> yang tidak dapat dihapus. 
                            Admin dapat memantau menu "Keamanan Audit" untuk mendeteksi aktivitas mencurigakan.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'print',
        title: 'Pencetakan',
        icon: Printer,
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Panduan Pencetakan</h2>
                    <p className="text-slate-400 mb-4">
                        Sistem mendukung mode pencetakan CR-80 (Kartu PVC Langsung) atau Layout Kertas A4 (Untuk dipotong).
                    </p>
                </div>

                <div className="bg-slate-900 p-5 rounded-lg border border-slate-800">
                    <h3 className="font-bold text-white mb-3">Tips Pencetakan Terbaik</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-3">
                            <span className="bg-cyan-900/50 text-cyan-400 w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold">1</span>
                            <span><strong>Resolusi:</strong> Gunakan gambar aset berkualitas tinggi (PNG transparan) pada Desain Studio untuk hasil tajam.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-cyan-900/50 text-cyan-400 w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold">2</span>
                            <span><strong>Pengaturan Printer:</strong> Saat jendela print browser muncul, pastikan:
                                <ul className="list-disc list-inside ml-2 mt-1 text-slate-400">
                                    <li>Layout: Portrait/Landscape sesuai kebutuhan.</li>
                                    <li>Margins: None / Minimum.</li>
                                    <li><strong>Background Graphics: Checked/Centang</strong> (Sangat Penting agar warna muncul).</li>
                                </ul>
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-cyan-900/50 text-cyan-400 w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold">3</span>
                            <span><strong>Garis Potong:</strong> Gunakan opsi "Tampilkan Garis Potong" di menu pratinjau jika Anda mencetak di kertas A4 lalu memotongnya manual.</span>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
];

export const ManualBookView = () => {
    const [activeChapter, setActiveChapter] = useState(MANUAL_CHAPTERS[0].id);

    const activeContent = MANUAL_CHAPTERS.find(c => c.id === activeChapter)?.content;

    return (
        <div className="h-full flex flex-col md:flex-row bg-[#020617] overflow-hidden">
            {/* Sidebar TOC */}
            <div className="w-full md:w-64 bg-[#0b1221] border-r border-cyan-900/30 flex flex-col">
                <div className="p-6 border-b border-cyan-900/30">
                    <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-cyan-400"/> Manual Book
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Dokumentasi Pengguna v2.0</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {MANUAL_CHAPTERS.map((chapter) => (
                        <button
                            key={chapter.id}
                            onClick={() => setActiveChapter(chapter.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all group",
                                activeChapter === chapter.id 
                                    ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                                    : "text-slate-400 hover:bg-white/5 hover:text-cyan-200"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <chapter.icon size={16} className={cn(activeChapter === chapter.id ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-300")}/>
                                <span className="font-medium">{chapter.title}</span>
                            </div>
                            {activeChapter === chapter.id && <ChevronRight size={14} className="text-cyan-500"/>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="max-w-4xl mx-auto p-8 md:p-12">
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeContent}
                     </div>

                     <div className="mt-12 pt-8 border-t border-slate-800 text-center">
                        <p className="text-slate-500 text-xs">
                            Butuh bantuan lebih lanjut? Hubungi Tim IT Support Internal.
                            <br/>
                            ID-X Pro &copy; 2024 Kementerian Teknologi.
                        </p>
                     </div>
                </div>
            </div>
        </div>
    );
};