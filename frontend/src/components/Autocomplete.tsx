import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

export interface Option {
    id: number;
    label: string;
    subLabel?: string;
    detail?: string;
    original: any;
}

interface Props {
    options?: Option[];
    onSelect: (option: Option) => void;
    placeholder?: string;
    className?: string;
    asyncSearch?: (query: string) => Promise<Option[]>;
    value?: string;
    onChange?: (val: string) => void;
    dropdownPosition?: 'top' | 'bottom';
}

export default function Autocomplete({
    options = [],
    onSelect,
    placeholder = "Search...",
    className = "",
    asyncSearch,
    value,
    onChange,
    dropdownPosition = 'bottom'
}: Props) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [asyncOptions, setAsyncOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        if (value !== undefined) {
            setQuery(value);
        }
    }, [value]);

    useEffect(() => {
        if (!asyncSearch) return;

        const timeoutId = setTimeout(async () => {
            if (query.trim().length >= 3) {
                setLoading(true);
                try {
                    const results = await asyncSearch(query);
                    setAsyncOptions(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setAsyncOptions([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, asyncSearch]);

    // Use either asyncOptions (if asyncSearch provided) or filtered options from props
    const getFilteredOptions = () => {
        if (asyncSearch) return asyncOptions;

        return query.trim() === ""
            ? []
            : options.filter(opt =>
                opt.label.toLowerCase().includes(query.toLowerCase()) ||
                (opt.subLabel && opt.subLabel.toLowerCase().includes(query.toLowerCase()))
            ).slice(0, 10);
    };

    const displayOptions = getFilteredOptions();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            setSelectedIndex(prev => (prev < displayOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            handleSelect(displayOptions[selectedIndex]);
            e.preventDefault();
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (option: Option) => {
        onSelect(option);
        // If controlled, onChange handles state; else local setQuery
        if (!onChange) setQuery(option.label); // Usually we might want to clear or set label.

        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (onChange) onChange(val);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </div>
                <input
                    type="text"
                    className="input-field pl-10"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {isOpen && displayOptions.length > 0 && query.length > 0 && (
                <div className={`absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
                    }`}>
                    {displayOptions.map((opt, index) => (
                        <div
                            key={opt.id}
                            className={`px-4 py-3 cursor-pointer flex flex-col border-b border-slate-50 last:border-0 ${index === selectedIndex ? "bg-blue-50" : "hover:bg-slate-50"
                                }`}
                            onClick={() => handleSelect(opt)}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-800">{opt.label}</span>
                                {opt.detail && <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{opt.detail}</span>}
                            </div>
                            {opt.subLabel && <span className="text-xs text-slate-500 mt-0.5">{opt.subLabel}</span>}
                        </div>
                    ))}
                </div>
            )}

            {isOpen && asyncSearch && !loading && displayOptions.length === 0 && query.length >= 3 && (
                <div className={`absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl p-3 text-center text-sm text-slate-400 ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'}`}>
                    No results found. New customer?
                </div>
            )}
        </div>
    );
}
