import { useState } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import ThemeToggle from './components/ThemeToggle';
import { SearchResponse } from './types';

function App() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSearch = async (query: string, domains: string[], numResults: number) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          domains,
          num_results: numResults,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed. Please try again.');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the backend. Please ensure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Memory Search Engine
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Powered by EXA</p>
          </header>

          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {error && (
            <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {results && !isLoading && (
            <SearchResults results={results} isDarkMode={isDarkMode} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
