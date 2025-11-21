import { useState } from 'react';
import { Search } from 'lucide-react';
import DomainSelector from './DomainSelector';

interface SearchFormProps {
  onSearch: (query: string, domains: string[], numResults: number) => void;
  isLoading: boolean;
}

const AVAILABLE_DOMAINS = [
  'https://x.com',
  'https://twitter.com',
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-200">
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
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
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
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Search className="w-5 h-5" />
          <span>{isLoading ? 'Searching...' : 'Search'}</span>
        </button>
      </form>
    </div>
  );
}

export default SearchForm;
