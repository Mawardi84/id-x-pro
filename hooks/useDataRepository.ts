import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/backend';
import { Member, SystemUser, CardTemplate, InstitutionConfig, IssuanceLog, AuditLogEntry } from '../types';

export const useDataRepository = () => {
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [templates, setTemplates] = useState<CardTemplate[]>([]);
    const [config, setConfig] = useState<InstitutionConfig | null>(null);
    const [issuanceLogs, setIssuanceLogs] = useState<IssuanceLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [m, u, t, c, a, i] = await Promise.all([
                api.members.getAll(),
                api.users.getAll(),
                api.templates.getAll(),
                api.config.get(),
                api.logs.getAudit(),
                api.logs.getIssuance()
            ]);

            setMembers(m || []);
            setUsers(u || []);
            setTemplates(t || []);
            setConfig(c);
            setAuditLogs(a || []);
            setIssuanceLogs(i || []);
        } catch (error) {
            console.error("Failed to load data", error);
            // Fallback config check
            if (!config) setConfig(await api.config.get());
        } finally {
            setLoading(false);
        }
    }, []); // Removed 'config' dependency to prevent infinite loops if config inside effect causes issues, though strictly should be handled by logic

    // Initial Load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // --- CRUD WRAPPERS ---

    const updateMembers = async (newMembers: Member[]) => {
        await api.members.bulkUpdate(newMembers);
        setMembers(newMembers);
    };

    const updateConfig = async (newConfig: InstitutionConfig) => {
        setConfig(newConfig); // Optimistic UI update
        try {
            await api.config.update(newConfig);
        } catch(e) { console.error("Config sync error", e); }
    };

    const saveTemplate = async (template: CardTemplate) => {
        await api.templates.save(template);
        setTemplates(await api.templates.getAll());
    };

    const deleteTemplate = async (id: string) => {
        await api.templates.delete(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    };

    const saveUser = async (user: SystemUser) => {
        await api.users.save(user);
        setUsers(prev => {
            const exists = prev.find(u => u.id === user.id);
            if (exists) return prev.map(u => u.id === user.id ? user : u);
            return [...prev, user];
        });
    };

    const deleteUser = async (id: string) => {
        await api.users.delete(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    }

    const addIssuanceLog = async (log: IssuanceLog) => {
        await api.logs.addIssuance(log);
        setIssuanceLogs(prev => [log, ...prev]);
    };

    const addAuditLog = async (log: AuditLogEntry) => {
        await api.logs.addAudit(log);
        setAuditLogs(prev => [log, ...prev]);
    };

    return {
        loading,
        members, setMembers: updateMembers, // Expose wrapper
        users, setUsers, saveUser, deleteUser,
        templates, setTemplates, saveTemplate, deleteTemplate,
        config, setConfig: updateConfig,
        issuanceLogs, addIssuanceLog,
        auditLogs, addAuditLog,
        refreshData
    };
};