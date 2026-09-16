"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "US", name: "United States", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "CA", name: "Canada", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AU", name: "Australia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "DE", name: "Germany", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", name: "France", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "JP", name: "Japan", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "CN", name: "China", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "RU", name: "Russia", dial: "+7", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "IT", name: "Italy", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "ES", name: "Spain", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "PL", name: "Poland", dial: "+48", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "GR", name: "Greece", dial: "+30", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
];

function findCountryForPhone(value: string): (typeof COUNTRIES)[0] | null {
  if (!value) return null;
  const cleaned = value.replace(/\s/g, "");
  for (const c of COUNTRIES) {
    if (cleaned.startsWith(c.dial)) return c;
  }
  return null;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  id,
  required,
  placeholder,
  className,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const detected = useMemo(() => findCountryForPhone(value), [value]);
  const [selectedCountry, setSelectedCountry] = useState(
    detected ?? COUNTRIES[0]
  );

  const effectiveCountry = detected ?? selectedCountry;

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  function extractLocalNumber(fullValue: string, country: (typeof COUNTRIES)[0]): string {
    if (!fullValue) return "";
    const cleaned = fullValue.replace(/\s/g, "");
    if (cleaned.startsWith(country.dial)) {
      return cleaned.slice(country.dial.length);
    }
    const digits = cleaned.replace(/[^0-9]/g, "");
    return digits.startsWith(country.dial.replace("+", ""))
      ? digits.slice(country.dial.length)
      : digits;
  }

  function handleCountrySelect(c: (typeof COUNTRIES)[0]) {
    const local = extractLocalNumber(value, c);
    setSelectedCountry(c);
    setIsOpen(false);
    setSearch("");
    onChange(local ? `${c.dial} ${local}` : c.dial + " ");
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9\s]/g, "");
    onChange(`${effectiveCountry.dial} ${digits}`.trim());
  }

  const localNumber = extractLocalNumber(value, effectiveCountry);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="flex rounded border border-[#252525] bg-[#000000] transition focus-within:border-[#D4AF37]">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 border-r border-[#252525] px-3 py-3 text-sm text-[#F5F3ED] transition hover:bg-[#111] shrink-0"
        >
          <span className="text-base leading-none">{effectiveCountry.flag}</span>
          <span className="text-xs text-[#A1A1A1] font-mono">{effectiveCountry.dial}</span>
          <ChevronDown size={12} className="text-[#A1A1A1]" />
        </button>

        {/* Phone number input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={handleLocalChange}
          required={required}
          placeholder={placeholder ?? selectedCountry.dial + " XXXXX XXXXX"}
          className="w-full bg-transparent px-4 py-3 text-sm text-[#F5F3ED] outline-none placeholder:text-[#555]"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-hidden rounded border border-[#252525] bg-[#0A0A0A] shadow-xl shadow-black/50">
          {/* Search */}
          <div className="border-b border-[#252525] p-2">
            <div className="flex items-center gap-2 rounded bg-[#111] px-3 py-2">
              <Search size={13} className="text-[#A1A1A1] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full bg-transparent text-sm text-[#F5F3ED] outline-none placeholder:text-[#555]"
              />
            </div>
          </div>

          {/* Country list */}
          <div className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-[#A1A1A1]">No countries found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-[#1A1A1A] ${
                    effectiveCountry.code === c.code
                      ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "text-[#F5F3ED]"
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 text-left text-xs">{c.name}</span>
                  <span className="font-mono text-xs text-[#A1A1A1]">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
