import axiosClient from "./axiosClient";
import { InvoiceCreate, Invoice } from "../types";

export async function createInvoice(data: InvoiceCreate) {
    const res = await axiosClient.post("/invoices/", data);
    return res.data;
}

export async function getInvoices(skip = 0, limit = 100) {
    const res = await axiosClient.get<Invoice[]>("/invoices/", { params: { skip, limit } });
    return res.data;
}

export async function getInvoice(id: number) {
    const res = await axiosClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
}
