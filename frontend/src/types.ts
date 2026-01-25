export enum Unit {
    SQFT = "SQFT",
    PIECE = "PIECE"
}

export enum Category {
    PLYWOOD = "PLYWOOD",
    GLASS = "GLASS",
    HARDWARE = "HARDWARE"
}

export interface Product {
    id: number;
    name: string;
    category: Category;
    base_unit: Unit;
    alt_unit?: Unit;
    sqft_per_piece?: number;
    price_per_sqft?: number;
    price_per_piece?: number;
    stock_qty: number;
    hsn_code?: string;
    thickness?: string;
    dimension?: string;
    gst_rate?: number;
}

export interface ProductCreate {
    name: string;
    category: Category;
    base_unit: Unit;
    alt_unit?: Unit;
    sqft_per_piece?: number;
    price_per_sqft?: number;
    price_per_piece?: number;
    stock_qty: number;
    thickness?: string;
    dimension?: string;
    gst_rate?: number;
    hsn_code?: string;
}

export interface InvoiceItemCreate {
    product_id: number;
    description?: string;
    quantity: number;
    unit: Unit;
    length_ft?: number;
    width_ft?: number;
    area_sqft?: number;
    thickness?: string;
    dimension?: string;
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    gstin?: string;
}

export interface InvoiceCreate {
    customer_id?: number;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_gstin?: string;
    date?: string; // ISO date string
    invoice_no: string;
    items: InvoiceItemCreate[];
    notes?: string;
}

export interface InvoiceItem {
    id: number;
    product_id: number;
    description?: string;
    quantity: number;
    unit: Unit;
    rate: number;
    taxable_amount: number;
    length_ft?: number;
    width_ft?: number;
    area_sqft?: number;
    thickness?: string;
    dimension?: string;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
}

export interface Invoice {
    id: number;
    invoice_no: string;
    date: string;
    customer?: Customer;
    total_taxable: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    grand_total: number;
    round_off: number;
    items: InvoiceItem[];
}
