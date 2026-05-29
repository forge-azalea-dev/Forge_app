import { useRef, useState, useEffect } from "react";
import { STACK_CATEGORIES, STACK_PRESETS, CATEGORY_LABELS } from "@/lib/database/stack-presets";
import type { StackCategory } from "@/lib/database/stack-presets";

interface StackSelectorProps {
  value: Record<StackCategory, string[]>;
  onChange: (value: Record<StackCategory, string[]>) => void;
}

export function StackSelector({ value, onChange }: StackSelectorProps) {
  const [openCategory, setOpenCategory] = useState<StackCategory | null>(null);
  const [customMode, setCustomMode] = useState<StackCategory | null>(null);
  const [customInput, setCustomInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openCategory) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
        setCustomMode(null);
        setCustomInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openCategory]);

  function removeItem(cat: StackCategory, item: string) {
    onChange({ ...value, [cat]: value[cat].filter(v => v !== item) });
  }

  function addItem(cat: StackCategory, item: string) {
    if (!item.trim() || value[cat].includes(item.trim())) return;
    onChange({ ...value, [cat]: [...value[cat], item.trim()] });
  }

  function handlePresetClick(cat: StackCategory, item: string) {
    addItem(cat, item);
    setOpenCategory(null);
  }

  function handleCustomSubmit(cat: StackCategory) {
    if (customInput.trim()) {
      addItem(cat, customInput.trim());
    }
    setCustomMode(null);
    setCustomInput("");
    setOpenCategory(null);
  }

  function toggleDropdown(cat: StackCategory) {
    if (openCategory === cat) {
      setOpenCategory(null);
      setCustomMode(null);
      setCustomInput("");
    } else {
      setOpenCategory(cat);
      setCustomMode(null);
      setCustomInput("");
    }
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {STACK_CATEGORIES.map(cat => {
        const available = STACK_PRESETS[cat].filter(p => !value[cat].includes(p));
        const isOpen = openCategory === cat;
        const isCustom = customMode === cat;

        return (
          <div key={cat} className="space-y-1.5">
            <div className="font-mono text-[10px] text-[#666666] uppercase tracking-wider">
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="relative flex flex-wrap items-center gap-1.5">
              {value[cat].map(item => (
                <span
                  key={item}
                  className="inline-flex items-center bg-[#1A1A1A] border border-[rgba(139,0,0,0.3)] text-[#F0F0F0] text-xs px-2 py-1 rounded font-mono"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeItem(cat, item)}
                    className="ml-1.5 text-[#666] hover:text-[#C41E3A]"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown(cat)}
                  className="inline-flex items-center gap-1 bg-transparent border border-dashed border-[rgba(139,0,0,0.25)] text-[#666666] text-xs px-2 py-1 rounded font-mono hover:border-[rgba(139,0,0,0.5)] hover:text-[#F0F0F0] transition-colors"
                >
                  +
                </button>

                {isOpen && (
                  <div className="absolute z-50 mt-1 rounded border border-[rgba(139,0,0,0.25)] bg-[#111111] py-1 shadow-lg min-w-[160px]">
                    {available.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(cat, preset)}
                        className="block w-full px-3 py-1.5 text-left font-mono text-xs text-[#F0F0F0] hover:bg-[rgba(139,0,0,0.15)]"
                      >
                        {preset}
                      </button>
                    ))}

                    {isCustom ? (
                      <div className="px-3 py-1.5 border-t border-[rgba(139,0,0,0.15)] mt-1 flex gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={customInput}
                          onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCustomSubmit(cat);
                            } else if (e.key === "Escape") {
                              setCustomMode(null);
                              setCustomInput("");
                            }
                          }}
                          placeholder="Custom..."
                          className="flex-1 bg-[#1A1A1A] border border-[rgba(139,0,0,0.25)] rounded px-2 py-0.5 text-[#F0F0F0] text-xs font-mono focus:outline-none focus:border-[#C41E3A] min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomSubmit(cat)}
                          className="text-xs font-mono text-[#C41E3A] hover:text-[#F0F0F0] px-1"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCustomMode(cat)}
                        className="block w-full px-3 py-1.5 text-left font-mono text-xs text-[#666666] hover:bg-[rgba(139,0,0,0.15)] border-t border-[rgba(139,0,0,0.15)] mt-1"
                      >
                        Custom...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
