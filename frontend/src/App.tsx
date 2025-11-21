import React, { useState, useEffect, useRef } from 'react';
import { Search, Moon, Sun, Check, Globe, X, Filter } from 'lucide-react';
import Plasma from "./components/Plasma";

// ------------------ Types ------------------
interface BackendResult {
  title: string;
  url: string;
  text: string;
  semantic_score: number;
  keyword_score: number;
  final_score: number;
}

interface SearchResponse {
  results: BackendResult[];
}

// ------------------ Theme Toggle ------------------
interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

const ThemeToggle = ({ isDarkMode, onToggle }: ThemeToggleProps) => (
  <button
    onClick={onToggle}
    className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md
               text-gray-800 dark:text-gray-200 
               hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors
               shadow-sm border border-gray-200/50 dark:border-gray-700/50"
    aria-label="Toggle theme"
  >
    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
  </button>
);

// ------------------ Domain Selector ------------------

interface DomainSelectorProps {
  availableDomains: string[];
  selectedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
  disabled: boolean;
}

const DomainSelector = ({ availableDomains, selectedDomains, onDomainsChange, disabled }: DomainSelectorProps) => {
  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      onDomainsChange(selectedDomains.filter(d => d !== domain));
    } else {
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Filter by Domain (Optional)
      </label>

      <div className="flex flex-wrap gap-2">
        {availableDomains.map((domain) => {
          const isSelected = selectedDomains.includes(domain);
          const displayName = domain.replace('https://www.', '').replace('https://', '');

          return (
            <button
              type="button"
              key={domain}
              disabled={disabled}
              onClick={() => toggleDomain(domain)}
              className={`
                flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${isSelected 
                  ? 'bg-blue-100/80 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200'
                  : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && <Check className="w-3 h-3" />}
              <span>{displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ------------------ Search Form (Glassmorphic & Collapsible) ------------------

interface SearchFormProps {
  onSearch: (query: string, domains: string[], useLLM: boolean, numResults: number) => void;
  isLoading: boolean;
  hasSearched: boolean;
  // NEW: Added these props to accept existing state values
  initialQuery?: string;
  initialDomains?: string[];
  initialNumResults?: number;
}

const AVAILABLE_DOMAINS = [
  'https://x.com',
  'https://www.threads.com',
  'https://www.tiktok.com',
  'https://www.reddit.com',
  'https://www.youtube.com',
  'https://www.instagram.com',
];

function SearchForm({ 
  onSearch, 
  isLoading, 
  hasSearched, 
  initialQuery = '', 
  initialDomains = [], 
  initialNumResults = 10 
}: SearchFormProps) {
  
  // Initialize state with props so the form "remembers" what was passed to it
  const [query, setQuery] = useState(initialQuery);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(initialDomains);
  const [numResults, setNumResults] = useState(initialNumResults);
  const [queryError, setQueryError] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [useLLM, setUseLLM] = useState(false);


  useEffect(() => {
    if (hasSearched) {
      setIsExpanded(false);
    }
  }, [hasSearched]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setQueryError("Please enter a search query.");
      return;
    }
    setQueryError('');
    onSearch(query, selectedDomains, useLLM, numResults);
  };

  // --- VIEW 1: COMPACT MODE (Sticky Top Bar) ---
  if (hasSearched && !isExpanded) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-6 px-4 animate-fadeIn">
        <div 
          onClick={() => setIsExpanded(true)}
          className="
            group cursor-pointer
            flex items-center justify-between gap-4
            w-full max-w-2xl
            backdrop-blur-xl bg-white/60 dark:bg-gray-800/60
            border border-white/40 dark:border-gray-700/40
            shadow-lg hover:shadow-xl
            rounded-full px-6 py-3
            transition-all duration-300 ease-out
          "
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex flex-col justify-center">
               <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
                 {query}
               </span>
               <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                 {selectedDomains.length > 0 ? `${selectedDomains.length} domains selected` : 'All domains'}
                 <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                 {numResults} results
               </span>
            </div>
          </div>
          
          <div className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-3 py-1 rounded-full group-hover:bg-blue-100/50 dark:group-hover:bg-blue-900/40 transition-colors">
            Edit
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: EXPANDED MODE (Initial or Overlay) ---
  const containerClasses = hasSearched 
    ? "fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-fadeIn" 
    : "w-full max-w-2xl mx-auto mb-10 relative z-10";

  const cardClasses = `
    w-full max-w-2xl
    backdrop-blur-xl bg-white/70 dark:bg-gray-800/60
    border border-white/50 dark:border-gray-700/50
    shadow-2xl rounded-3xl p-8 transition-all
    ${hasSearched ? "animate-scaleIn mx-4" : ""}
  `;

  return (
    <div className={containerClasses} onClick={(e) => {
      if (hasSearched && e.target === e.currentTarget) setIsExpanded(false);
    }}>
      <div className={cardClasses}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {hasSearched ? <Filter className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            {hasSearched ? "Refine Search" : "Start Searching"}
          </h2>
          {hasSearched && (
            <button 
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Query Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Query
            </label>
            <div className="relative group">
              <input
                type="text"
                value={query}
                autoFocus={hasSearched} 
                onChange={(e) => { setQuery(e.target.value); setQueryError(''); }}
                className="
                  w-full px-4 py-3 pl-12 rounded-xl border
                  bg-white/50 dark:bg-gray-700/50 
                  border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all placeholder-gray-500 dark:placeholder-gray-400
                "
                placeholder="What are you looking for?"
                disabled={isLoading}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
            </div>
            {queryError && <p className="text-sm text-red-500 mt-2">{queryError}</p>}
          </div>

          {/* Domain Selector */}
          <DomainSelector
            availableDomains={AVAILABLE_DOMAINS}
            selectedDomains={selectedDomains}
            onDomainsChange={setSelectedDomains}
            disabled={isLoading}
          />
{/* Smart Query Optimization (LLM Toggle) */}
<div className="flex items-center justify-between mt-5 mb-3">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Smart query optimization (LLM)
  </label>

  <button
    type="button"
    disabled={isLoading}
    onClick={() => setUseLLM(!useLLM)}
    className={`
      relative inline-flex items-center h-7 w-14 rounded-full 
      transition-all duration-300 
      ${useLLM 
        ? "bg-blue-600 shadow-lg shadow-blue-500/40" 
        : "bg-gray-300 dark:bg-gray-700"}
      ${isLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    <span
      className={`
        inline-block h-6 w-6 transform rounded-full bg-white shadow-md
        transition-all duration-300 
        ${useLLM ? "translate-x-7" : "translate-x-1"}
      `}
    />
  </button>
</div>

          {/* Num Results */}
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span>Results Count</span>
              <span className="font-mono bg-gray-100/50 dark:bg-gray-700/50 px-2 rounded text-blue-600 dark:text-blue-400">{numResults}</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={numResults}
              onChange={(e) => setNumResults(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer dark:bg-gray-700/50 accent-blue-600"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:bg-gray-400 disabled:shadow-none transition-all transform active:scale-[0.99]"
          >
            {isLoading ? (
               <span className="flex items-center justify-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Searching...
               </span>
            ) : (
              "Search Memory"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ------------------ Search Results ------------------

interface SearchResultsProps {
  results: SearchResponse;
}

const SearchResults = ({ results }: SearchResultsProps) => {
  if (!results?.results?.length)
    return (
      <div className="text-center py-20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No memories found matching your query.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {results.results.map((r, i) => (
        <div
          key={i}
          className="
            group
            backdrop-blur-xl bg-white/70 dark:bg-gray-800/60
            border border-white/50 dark:border-gray-700
            hover:border-blue-300 dark:hover:border-blue-700
            shadow-sm hover:shadow-md rounded-2xl p-6 transition-all duration-200
          "
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="truncate max-w-[300px]">{r.url}</span>
          </div>

          <a href={r.url} target="_blank" rel="noreferrer">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {r.title}
            </h3>
          </a>

          <p className="text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
            {r.text?.slice(0, 300) || "No preview available."}
          </p>
          
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-mono">
             <span>Semantic: {r.semantic_score?.toFixed(2)}</span>
             <span>Keyword: {r.keyword_score?.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ------------------ Plasma Logic Helpers ------------------

const LIGHT_PLASMA_COLOR = '#ff6b35';
const DARK_PLASMA_COLOR = '#2f1e56';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [
    parseInt(m[1], 16),
    parseInt(m[2], 16),
    parseInt(m[3], 16)
  ] : [255, 255, 255];
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const mixHexColors = (from: string, to: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
};

// ------------------ Main App ------------------

function App() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // NEW: State to store the current search parameters so they persist across form instances
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentDomains, setCurrentDomains] = useState<string[]>([]);
  const [currentNumResults, setCurrentNumResults] = useState(10);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeT, setThemeT] = useState(0);

  // Animate theme
  useEffect(() => {
    const from = themeT;
    const to = isDarkMode ? 1 : 0;
    const duration = 400;
    const start = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t * t * (3 - 2 * t);
      setThemeT(from + (to - from) * eased);
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDarkMode]);

  const plasmaColor = mixHexColors(LIGHT_PLASMA_COLOR, DARK_PLASMA_COLOR, themeT);
  const plasmaOpacity = lerp(0.8, 0.45, themeT);

  // Search
  const handleSearch = async (query: string, domains: string[], useLLM: boolean, numResults: number) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    
    // Save the parameters so the sticky header can use them
    setCurrentQuery(query);
    setCurrentDomains(domains);
    setCurrentNumResults(numResults);

    setHasSearched(true);
      try{
        const res = await fetch("http://127.0.0.1:8000/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: query,
            domains: domains,
            use_llm: useLLM,
            numResults: numResults
          })
        });
        if (!res.ok) throw new Error("Search failed.");
        const data = await res.json();
        setResults(data);
          } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* CSS Animations needed for the overlay effect */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>

      <div className="relative min-h-screen overflow-hidden transition-colors duration-500  pt-20 md:pt-0">

        {/* ----------------- BACKGROUND (PRESERVED) ----------------- */}
        
        {/* Background solid layer */}
        <div
          className="absolute inset-0 -z-20 transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? "#000" : "#fff" }}
        />

        {/* Plasma background */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Plasma
            color={plasmaColor}
            opacity={plasmaOpacity}
            speed={0.3}
            direction="forward"
            scale={2}
            mouseInteractive={false}
          />
        </div>
        {/* ------------------------------------------------------------ */}

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle
            isDarkMode={isDarkMode}
            onToggle={() => setIsDarkMode(!isDarkMode)}
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="container mx-auto px-4 pb-20">

          {/* INITIAL VIEW: Centered Logo + Search Box */}
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 px-4 animate-fadeIn">
              <h1 className="text-4xl md:text-6xl font-bold mb-8 text-gray-900 dark:text-white tracking-tight text-center">
                Memory Search
              </h1>
              
              <SearchForm onSearch={handleSearch} isLoading={isLoading} hasSearched={false} />
            </div>
          )}

          {/* SEARCHED VIEW: Results + Fixed Header */}
          {hasSearched && (
            <div className="animate-fadeIn">
              
              <SearchForm 
                onSearch={handleSearch} 
                isLoading={isLoading} 
                hasSearched={true}
                // PASSING THE PERSISTED STATE DOWN
                initialQuery={currentQuery}
                initialDomains={currentDomains}
                initialNumResults={currentNumResults}
              />

              {/* Results Container - Added padding top to account for fixed header */}
              <div className="w-full max-w-3xl mx-auto mt-32 px-4 md:px-0">

                {error && (
                  <div className="
                    bg-red-50 dark:bg-red-900/40 
                    text-red-700 dark:text-red-300 
                    border border-red-200 dark:border-red-700
                    rounded-xl p-4 mb-6
                  ">
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                    <p className="text-gray-600 dark:text-gray-300 animate-pulse">
                      Searching the memory bank...
                    </p>
                  </div>
                ) : (
                  results && <SearchResults results={results} />
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;