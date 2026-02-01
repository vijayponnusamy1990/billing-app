
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Owner } from '../types';
import { resolveTenant } from '../api/tenantApi';

interface TenantContextType {
    tenant: Owner | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    error: null,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<Owner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const domain = window.location.hostname;
                console.log("Resolving tenant for domain:", domain);
                const data = await resolveTenant(domain);
                setTenant(data);
                console.log("Tenant resolved:", data);

                // Dynamically update document title
                if (data.company_title) {
                    document.title = data.company_title;
                }

                // Dynamically update favicon if logo is available (optional)
                if (data.logo_url) {
                    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                    if (link) link.href = data.logo_url;
                }

            } catch (err) {
                console.error("Error resolving tenant:", err);
                setError("Failed to load tenant configuration");
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Loading Application...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-4">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Configuration Error</h1>
                    <p className="text-slate-500">{error}</p>
                    <p className="text-xs text-slate-400 mt-4">Please contact support.</p>
                </div>
            </div>
        );
    }

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
};
