"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function CustomSelect({ value, onChange, options, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none transition-all shadow-sm font-medium"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-55 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 origin-top transform transition-all duration-100 ease-out">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                option.value === value ? "text-indigo-650 bg-indigo-50/40 font-semibold" : "text-slate-700"
              }`}
            >
              <div>
                <span className="block">{option.label}</span>
                {option.sublabel && (
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{option.sublabel}</span>
                )}
              </div>
              {option.value === value && <Check className="w-4 h-4 text-indigo-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
