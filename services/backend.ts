import { Member, InstitutionConfig, CardTemplate, SystemUser, IssuanceLog, AuditLogEntry, UserRole } from '../types';

// --- INITIAL SEED DATA (Database Default) ---
const DB_DEFAULTS = {
    CONFIG: {
        name: 'CABANG KEJAKSAAN NEGERI KOTA SEMARANG', secondaryName: '', logoUrl: 'https://cdn-icons-png.flaticon.com/512/9566/9566164.png',
        primaryColor: '#06b6d4', digitalSignatureUrl: '', address: 'Jl. Medan Merdeka Barat No. 12, Jakarta Pusat', disclaimer: '1. Kartu ini adalah milik Negara.\n2. Apabila menemukan kartu ini harap dikembalikan ke instansi terkait.\n3. Dilarang menyalahgunakan kartu ini.', regulations: '',
        validityYears: 5, enableWatermark: true, watermarkOpacity: 0.05, watermarkScale: 1.0, 
        enablePattern: true, patternText: 'RESMI', patternLayout: 'BRICK', patternColor: '#06b6d4', patternOpacity: 0.15, patternRotation: -25, patternSpacing: 5, patternFontSize: 8,
        departmentTemplates: {}
    } as InstitutionConfig,
    MEMBERS: [
        { id: 'm1', fullName: 'Budi Santoso', role: 'Staff Ahli', department: 'IT Dev', employeeId: '19900101202401', employmentType: 'PNS', status: 'ACTIVE', approvalStatus: 'APPROVED', joinedDate: '2024-01-01', expiryDate: '2029-01-01', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', scanHistory: [] },
        { id: 'm2', fullName: 'Siti Aminah', role: 'Sekretaris', department: 'Umum', employeeId: '19950505202402', employmentType: 'HONORER', status: 'ACTIVE', approvalStatus: 'APPROVED', joinedDate: '2024-02-01', expiryDate: '2025-02-01', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop', scanHistory: [] },
    ] as Member[],
    USERS: [
        { id: 'u1', username: 'admin', fullName: 'Super Administrator', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLogin: '2024-03-10 09:00', password: 'admin' },
        { id: 'u2', username: 'operator', fullName: 'Petugas Cetak', role: 'OPERATOR', status: 'ACTIVE', lastLogin: '2024-03-09 14:30', password: '123' },
    ] as SystemUser[],
    TEMPLATES: [
        {
            id: 'tpl_pns_01', name: 'Kartu Identitas PNS', category: 'OFFICIAL',
            layout: {
                front: { background: '#fefce8', elements: [], json: { version: "5.3.0", objects: [ { type: "rect", left: 0, top: 0, width: 350, height: 120, fill: "#b45309" }, { type: "i-text", left: 175, top: 30, originX: "center", text: "KARTU TANDA PENGENAL", fontSize: 18, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial" }, { type: "image", left: 100, top: 150, width: 150, height: 150, scaleX: 1, scaleY: 1, dataField: "photoUrl" }, { type: "i-text", left: 175, top: 320, originX: "center", text: "Nama Pegawai", fontSize: 18, fontWeight: "bold", fill: "#000000", dataField: "fullName" }, { type: "i-text", left: 175, top: 400, originX: "center", text: "JABATAN", fontSize: 16, fontWeight: "bold", fill: "#b45309", dataField: "role" }, { type: "image", left: 125, top: 440, width: 100, height: 100, scaleX: 1, scaleY: 1, dataField: "qr_code" } ] } },
                back: { background: '#fefce8', elements: [], json: { version: "5.3.0", objects: [ { type: "textbox", left: 40, top: 90, width: 270, fontSize: 12, fill: "#000000", text: "Card Disclaimer...", dataField: "disclaimer" } ] } }
            }
        }
    ] as CardTemplate[]
};

// --- LOCAL STORAGE WRAPPER (Simulates Database) ---
const STORAGE_KEYS = {
    CONFIG: 'idx_db_config',
    MEMBERS: 'idx_db_members',
    USERS: 'idx_db_users',
    TEMPLATES: 'idx_db_templates',
    AUDIT_LOGS: 'idx_db_audit_logs',
    ISSUANCE_LOGS: 'idx_db_issuance_logs'
};

const db = {
    get: (key: string, defaultVal: any) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultVal;
        } catch (e) { return defaultVal; }
    },
    set: (key: string, val: any) => {
        localStorage.setItem(key, JSON.stringify(val));
    }
};

// --- BACKEND API SERVICE ---
// In a real app, these methods would use fetch() to call a server.

export const api = {
    config: {
        get: async (): Promise<InstitutionConfig> => {
            return db.get(STORAGE_KEYS.CONFIG, DB_DEFAULTS.CONFIG);
        },
        update: async (config: InstitutionConfig): Promise<InstitutionConfig> => {
            db.set(STORAGE_KEYS.CONFIG, config);
            // Simulate network delay
            await new Promise(r => setTimeout(r, 200)); 
            return config;
        }
    },
    members: {
        getAll: async (): Promise<Member[]> => {
            return db.get(STORAGE_KEYS.MEMBERS, DB_DEFAULTS.MEMBERS);
        },
        save: async (member: Member): Promise<Member> => {
            const members = await api.members.getAll();
            const existingIndex = members.findIndex(m => m.id === member.id);
            let newMembers;
            if (existingIndex >= 0) {
                newMembers = members.map(m => m.id === member.id ? member : m);
            } else {
                newMembers = [...members, member];
            }
            db.set(STORAGE_KEYS.MEMBERS, newMembers);
            return member;
        },
        delete: async (id: string): Promise<void> => {
            const members = await api.members.getAll();
            db.set(STORAGE_KEYS.MEMBERS, members.filter(m => m.id !== id));
        },
        bulkUpdate: async (members: Member[]): Promise<void> => {
             db.set(STORAGE_KEYS.MEMBERS, members);
        }
    },
    templates: {
        getAll: async (): Promise<CardTemplate[]> => {
            return db.get(STORAGE_KEYS.TEMPLATES, DB_DEFAULTS.TEMPLATES);
        },
        save: async (template: CardTemplate): Promise<CardTemplate> => {
            const templates = await api.templates.getAll();
            const exists = templates.find(t => t.id === template.id);
            let newTemplates;
            if (exists) {
                newTemplates = templates.map(t => t.id === template.id ? template : t);
            } else {
                newTemplates = [...templates, template];
            }
            db.set(STORAGE_KEYS.TEMPLATES, newTemplates);
            return template;
        },
        delete: async (id: string): Promise<void> => {
            const templates = await api.templates.getAll();
            db.set(STORAGE_KEYS.TEMPLATES, templates.filter(t => t.id !== id));
        }
    },
    users: {
        getAll: async (): Promise<SystemUser[]> => {
            return db.get(STORAGE_KEYS.USERS, DB_DEFAULTS.USERS);
        },
        save: async (user: SystemUser): Promise<SystemUser> => {
            const users = await api.users.getAll();
            const exists = users.find(u => u.id === user.id);
            const newUsers = exists ? users.map(u => u.id === user.id ? user : u) : [...users, user];
            db.set(STORAGE_KEYS.USERS, newUsers);
            return user;
        },
        delete: async (id: string): Promise<void> => {
            const users = await api.users.getAll();
            db.set(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
        }
    },
    logs: {
        getAudit: async (): Promise<AuditLogEntry[]> => {
            return db.get(STORAGE_KEYS.AUDIT_LOGS, []);
        },
        addAudit: async (entry: AuditLogEntry): Promise<void> => {
            const logs = await api.logs.getAudit();
            db.set(STORAGE_KEYS.AUDIT_LOGS, [entry, ...logs].slice(0, 500)); // Keep last 500
        },
        getIssuance: async (): Promise<IssuanceLog[]> => {
            return db.get(STORAGE_KEYS.ISSUANCE_LOGS, []);
        },
        addIssuance: async (entry: IssuanceLog): Promise<void> => {
            const logs = await api.logs.getIssuance();
            db.set(STORAGE_KEYS.ISSUANCE_LOGS, [entry, ...logs].slice(0, 1000));
        }
    }
};
