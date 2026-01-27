import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProducts, updateProduct } from "../api/productsApi";
import { Product, Category, Unit } from "../types";
import { ArrowLeft, Save } from "lucide-react";

import { useToast } from "../components/Toaster";

export default function ProductEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const products = await getProducts();
                const found = products.find(p => p.id === Number(id));
                if (found) {
                    setProduct(found);
                } else {
                    toast.error("Product not found");
                    navigate("/products");
                }
            } catch (e) {
                console.error(e);
                toast.error("Error loading product");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setSaving(true);
        try {
            await updateProduct(product.id, {
                name: product.name,
                category: product.category,
                base_unit: product.base_unit,
                stock_qty: product.stock_qty,
                price_per_piece: product.price_per_piece,
                thickness: product.thickness,
                dimension: product.dimension,
                gst_rate: product.gst_rate,
                hsn_code: product.hsn_code,
                low_stock_limit: product.low_stock_limit,
            });
            toast.success("Product updated successfully!");
            navigate("/products");
        } catch (e) {
            console.error(e);
            toast.error("Error updating product");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!product) {
        return <div className="p-8">Product not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/products" className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Inventory
                </Link>
            </div>

            <div className="card">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Product</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name</label>
                            <input
                                className="input-field"
                                value={product.name}
                                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                            <select
                                className="input-field"
                                value={product.category}
                                onChange={(e) => setProduct({ ...product, category: e.target.value as Category })}
                            >
                                {Object.values(Category).map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Thickness</label>
                            <input
                                className="input-field"
                                value={product.thickness || ''}
                                onChange={(e) => setProduct({ ...product, thickness: e.target.value })}
                                placeholder="Ex. 12mm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Dimension</label>
                            <input
                                className="input-field"
                                value={product.dimension || ''}
                                onChange={(e) => setProduct({ ...product, dimension: e.target.value })}
                                placeholder="Ex. 8x4"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Price per Piece (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={product.price_per_piece || ''}
                                onChange={(e) => setProduct({ ...product, price_per_piece: Number(e.target.value) })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">GST Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={product.gst_rate || ''}
                                onChange={(e) => setProduct({ ...product, gst_rate: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Quantity</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={product.stock_qty || ''}
                                onChange={(e) => setProduct({ ...product, stock_qty: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Low Stock Alert Limit</label>
                            <input
                                type="number"
                                className="input-field"
                                value={product.low_stock_limit ?? 0}
                                onChange={(e) => setProduct({ ...product, low_stock_limit: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">HSN Code</label>
                            <input
                                className="input-field"
                                value={product.hsn_code || ''}
                                onChange={(e) => setProduct({ ...product, hsn_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t border-slate-200">
                        <Link to="/products" className="btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
