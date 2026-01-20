import axiosClient from "./axiosClient";

export interface DailySales {
    date: string;
    invoice_count: number;
    total_sales: number;
}

export interface ProductSales {
    product_name: string;
    category: string;
    total_qty: number;
    total_amount: number;
}

export async function getDailySales() {
    const res = await axiosClient.get<DailySales[]>("/reports/daily-sales");
    return res.data;
}

export async function getProductSales() {
    const res = await axiosClient.get<ProductSales[]>("/reports/product-sales");
    return res.data;
}
