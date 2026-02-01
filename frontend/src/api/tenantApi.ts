import { Owner } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const resolveTenant = async (domain: string): Promise<Owner> => {
    const response = await fetch(`${API_URL}/tenant/resolve?domain=${domain}`);
    if (!response.ok) {
        throw new Error('Failed to resolve tenant');
    }
    return response.json();
};
