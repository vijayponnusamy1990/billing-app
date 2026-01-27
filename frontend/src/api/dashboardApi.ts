import axiosClient from "./axiosClient";
import { Product } from "../types";

export interface DashboardStats {
    total_products: number;
    low_stock_count: number;
    total_revenue: number;
    total_invoices: number;
}

export interface ProductStats {
    name: string;
    category: string;
    stock_qty: number;
    total_sold: number;
}

export interface CustomerStats {
    name: string;
    invoice_count: number;
    total_revenue: number;
}

export async function getDashboardStats(startDate?: string, endDate?: string) {
    const params = { start_date: startDate, end_date: endDate };
    const res = await axiosClient.get<DashboardStats>("/dashboard/stats", { params });
    return res.data;
}

export async function getLowStockProducts() {
    const res = await axiosClient.get<Product[]>("/dashboard/low-stock");
    return res.data;
}

export async function getTopProducts(startDate?: string, endDate?: string) {
    const params = { start_date: startDate, end_date: endDate };
    const res = await axiosClient.get<ProductStats[]>("/dashboard/top-products", { params });
    return res.data;
}

export async function getTopCustomers(startDate?: string, endDate?: string) {
    const params = { start_date: startDate, end_date: endDate };
    const res = await axiosClient.get<CustomerStats[]>("/dashboard/top-customers", { params });
    return res.data;
}

export async function getLeastProducts(startDate?: string, endDate?: string) {
    const params = { start_date: startDate, end_date: endDate };
    const res = await axiosClient.get<ProductStats[]>("/dashboard/least-products", { params });
    return res.data;
}
