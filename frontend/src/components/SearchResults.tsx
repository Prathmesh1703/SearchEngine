import { SearchResponse } from '../types';
import SearchResultCard from './SearchResultCard';

interface SearchResultsProps {
  results: SearchResponse;
  isDarkMode: boolean;
}

function SearchResults({ results, isDarkMode }: SearchResultsProps) {
  if (!results.results || results.results.length === 0) {
    return (
      <div className="mt-8 text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No results found. Try a different query or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="text-gray-700 dark:text-gray-300 text-sm">
        Found <span className="font-semibold">{results.results.length}</span> results for "{results.query}"
      </div>

      <div className="space-y-4">
        {results.results.map((result, index) => (
          <SearchResultCard
            key={`${result.url}-${index}`}
            result={result}
            index={index}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
