import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Option {
    id: number;
    label: string;
    subLabel?: string;
    detail?: string;
    original: any;
}

interface Props {
    options: Option[];
    onSelect: (option: Option) => void;
    placeholder?: string;
    className?: string;
}

export default function Autocomplete({ options, onSelect, placeholder = "Search...", className = "" }: Props) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = query.trim() === ""
        ? []
        : options.filter(opt =>
            opt.label.toLowerCase().includes(query.toLowerCase()) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 10);

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
            setSelectedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            handleSelect(filteredOptions[selectedIndex]);
            e.preventDefault();
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (option: Option) => {
        onSelect(option);
        setQuery("");
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                    type="text"
                    className="input-field pl-10"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                    {filteredOptions.map((opt, index) => (
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
        </div>
    );
}
