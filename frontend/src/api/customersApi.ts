import axiosClient from "./axiosClient";
import { Customer } from "../types";

export interface CustomerSearch extends Customer { }

export async function searchCustomers(query: string) {
    if (!query || query.length < 3) return [];
    const res = await axiosClient.get<Customer[]>("/customers/search", {
        params: { q: query }
    });
    return res.data;
}
