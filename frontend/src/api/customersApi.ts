import api from "./axiosClient";

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    billing_city?: string;
    // Add other fields as needed for display
    gstin?: string;
    email?: string;
}

export interface CustomerCreate {
    name: string;
    phone?: string;
    billing_line1?: string;
    billing_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;
    shipping_line1?: string;
    shipping_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_zip?: string;
    gstin?: string;
    email?: string;
    refer_by?: string;
}

export interface CustomerUpdate {
    name?: string;
    phone?: string;
    billing_line1?: string;
    billing_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;
    shipping_line1?: string;
    shipping_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_zip?: string;
    gstin?: string;
    email?: string;
    refer_by?: string;
}

export const getCustomers = async (skip: number = 0, limit: number = 20, q: string = ""): Promise<Customer[]> => {
    const params = { skip, limit, q };
    const response = await api.get<Customer[]>("/customers/", { params });
    return response.data; // Note: Ensure this matches API response (List[CustomerOut])
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
    const response = await api.get<Customer[]>("/customers/search", { params: { q: query } });
    return response.data;
};

export const createCustomer = async (data: CustomerCreate): Promise<Customer> => {
    const response = await api.post<Customer>("/customers/", data);
    return response.data;
};

export const getCustomer = async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
};

export const updateCustomer = async (id: number, data: CustomerUpdate): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
};

export const getCustomerInvoices = async (id: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/customers/${id}/invoices`);
    return response.data;
};
