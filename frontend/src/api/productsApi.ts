import axiosClient from "./axiosClient";
import { Product, ProductCreate } from "../types";

export async function getProducts(params: { skip?: number; limit?: number; q?: string } = {}) {
    const res = await axiosClient.get<Product[]>("/products/", { params });
    return res.data;
}

export async function createProduct(data: ProductCreate) {
    const res = await axiosClient.post<Product>("/products/", data);
    return res.data;
}

export async function updateProduct(id: number, data: Partial<ProductCreate>) {
    const res = await axiosClient.put<Product>(`/products/${id}`, data);
    return res.data;
}
