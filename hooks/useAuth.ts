import { useState, useEffect, useRef, useCallback } from 'react';
import { SystemUser } from '../types';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
    const [isSessionLocked, setIsSessionLocked] = useState(false);
    const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetActivityTimer = useCallback(() => {
        if (!currentUser || isSessionLocked) return;
        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        
        // Auto lock after 5 minutes of inactivity
        activityTimerRef.current = setTimeout(() => {
            if (currentUser) setIsSessionLocked(true);
        }, 5 * 60 * 1000); 
    }, [currentUser, isSessionLocked]);

    // Setup Activity Listeners
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        const handler = () => resetActivityTimer();
        
        if (currentUser && !isSessionLocked) {
            events.forEach(e => window.addEventListener(e, handler));
            resetActivityTimer(); // Start timer
        }

        return () => {
            events.forEach(e => window.removeEventListener(e, handler));
            if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        };
    }, [currentUser, isSessionLocked, resetActivityTimer]);

    const login = (user: SystemUser) => {
        setCurrentUser(user);
        setIsSessionLocked(false);
    };

    const logout = () => {
        setCurrentUser(null);
        setIsSessionLocked(false);
        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };

    const unlock = (password: string): boolean => {
        if (currentUser && password === currentUser.password) {
            setIsSessionLocked(false);
            resetActivityTimer();
            return true;
        }
        return false;
    };

    return {
        currentUser,
        isSessionLocked,
        login,
        logout,
        unlock
    };
};