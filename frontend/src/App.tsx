import React, { useState } from 'react';
import { Search, Moon, Sun, Check, Globe, ExternalLink } from 'lucide-react';

// --- Types ---
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

// --- Components ---

// 1. ThemeToggle
interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

const ThemeToggle = ({ isDarkMode, onToggle }: ThemeToggleProps) => (
  <button
    onClick={onToggle}
    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    aria-label="Toggle theme"
  >
    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
  </button>
);

// 2. DomainSelector
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
              key={domain}
              type="button"
              disabled={disabled}
              onClick={() => toggleDomain(domain)}
              className={`
                flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                ${isSelected 
                  ? 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isSelected && <Check className="w-3 h-3 mr-1" />}
              <span>{displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 3. SearchForm
interface SearchFormProps {
  onSearch: (query: string, domains: string[], numResults: number) => void;
  isLoading: boolean;
}

const AVAILABLE_DOMAINS = [
  'https://x.com',
  'https://www.threads.com',
  'https://www.tiktok.com',
  'https://www.reddit.com',
  'https://www.youtube.com',
  'https://www.instagram.com',
];

function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [numResults, setNumResults] = useState(10);
  const [queryError, setQueryError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setQueryError('Please enter a search query');
      return;
    }

    setQueryError('');
    onSearch(query, selectedDomains, numResults);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-200 border border-gray-100 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Query
          </label>
          <div className="relative">
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setQueryError('');
              }}
              placeholder="What are you looking for?"
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          {queryError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{queryError}</p>
          )}
        </div>

        <DomainSelector
          availableDomains={AVAILABLE_DOMAINS}
          selectedDomains={selectedDomains}
          onDomainsChange={setSelectedDomains}
          disabled={isLoading}
        />

        <div>
          <label htmlFor="numResults" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Results: <span className="text-blue-600 dark:text-blue-400 font-semibold">{numResults}</span>
          </label>
          <input
            id="numResults"
            type="range"
            min="1"
            max="50"
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
        >
          <Search className="w-5 h-5 inline-block mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
}

// 4. SearchResults
interface SearchResultsProps {
  results: SearchResponse;
  isDarkMode: boolean;
}

const SearchResults = ({ results }: SearchResultsProps) => {
  if (!results?.results?.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No results found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Search Results
      </h2>

      {results.results.map((result, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">

              {/* URL + Icon */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                  {result.url}
                </span>
              </div>

              {/* Title */}
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="block group">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                  {result.title}
                  <ExternalLink className="w-4 h-4 inline ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </a>

              {/* Snippet */}
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {result.text?.slice(0, 300) || "No preview available."}
              </p>

              {/* Score breakdown */}
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                Semantic: {result.semantic_score.toFixed(3)} | Keyword: {result.keyword_score.toFixed(3)} | Final: {result.final_score.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

function App() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string, domains: string[], numResults: number) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setHasSearched(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          domains,
          num_results: numResults
        })
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        </div>

        {/* Main Layout */}
        <div className={`
          container mx-auto px-4 transition-all duration-700
          ${hasSearched ? 'py-8' : 'h-screen flex items-center justify-center'}
        `}>
          <div className={`
            flex flex-col md:flex-row gap-8 w-full
            ${hasSearched ? 'items-start' : 'items-center justify-center'}
          `}>
            <div className={`
              transition-all flex-shrink-0
              ${hasSearched ? 'w-full md:w-1/3 lg:w-1/4' : 'w-full max-w-2xl'}
            `}>
              <header className={`text-center ${hasSearched ? 'md:text-left' : ''}`}>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Memory Search</h1>
                <p className="text-gray-600 dark:text-gray-400">Powered by EXA</p>
              </header>

              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {hasSearched && (
              <div className="w-full md:w-2/3 lg:w-3/4 animate-[fadeIn_0.8s_ease-out]">
                
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 mb-6">
                    {error}
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="text-gray-500 dark:text-gray-400 animate-pulse">Searching the memory bank...</p>
                  </div>
                )}

                {results && !isLoading && (
                  <SearchResults results={results} isDarkMode={isDarkMode} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
