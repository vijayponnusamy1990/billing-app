export enum Unit {
    SQFT = "SQFT",
    PIECE = "PIECE"
}

export enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID"
}

export enum PaymentMode {
    CASH = "CASH",
    UPI = "UPI",
    CARD = "CARD",
    NET_BANKING = "NET_BANKING",
    CHEQUE = "CHEQUE"
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
    low_stock_limit?: number;
}

export interface ProductCreate {
    name: string;
    category: Category;
    base_unit: Unit;
    alt_unit?: Unit;
    sqft_per_piece?: number;
    price_per_sqft?: number;
    price_per_piece?: number;
    buying_price?: number;
    stock_qty: number;
    thickness?: string;
    dimension?: string;
    gst_rate?: number;
    hsn_code?: string;
    low_stock_limit?: number;
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
    manual_rate?: number; // Optional override
}

export interface Customer {
    id: number;
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
    refer_by?: string;
}

export interface InvoiceCreate {
    customer_id?: number;
    customer_name?: string;
    customer_phone?: string;
    customer_billing_line1?: string;
    customer_billing_line2?: string;
    customer_billing_city?: string;
    customer_billing_state?: string;
    customer_billing_zip?: string;
    customer_shipping_line1?: string;
    customer_shipping_line2?: string;
    customer_shipping_city?: string;
    customer_shipping_state?: string;
    customer_shipping_zip?: string;
    customer_gstin?: string;
    customer_refer_by?: string;
    date?: string; // ISO date string
    invoice_no: string;
    items: InvoiceItemCreate[];
    notes?: string;
    payment_status?: PaymentStatus;
    payment_mode?: PaymentMode;
}

export interface InvoiceItem {
    id: number;
    product_id: number;
    hsn_code?: string;
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
    cgst_rate: number;
    sgst_rate: number;
    igst_rate: number;
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
    payment_status: PaymentStatus;
    payment_mode?: PaymentMode;
    items: InvoiceItem[];
}

export interface Owner {
    id: number;
    name: string;
    company_title: string;
    logo_url?: string;
    domain?: string;
    email?: string;
    phone?: string;
    address?: string;
}
