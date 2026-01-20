import axiosClient from "./axiosClient";
import { Product, ProductCreate } from "../types";

export async function getProducts() {
    const res = await axiosClient.get<Product[]>("/products/");
    return res.data;
}

export async function createProduct(data: ProductCreate) {
    const res = await axiosClient.post<Product>("/products/", data);
    return res.data;
}
