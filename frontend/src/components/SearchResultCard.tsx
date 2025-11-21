import { ExternalLink, TrendingUp } from 'lucide-react';
import { SearchResult } from '../types';
import { highlightKeywords } from '../utils/highlightKeywords';

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  isDarkMode: boolean;
}

function SearchResultCard({ result, index, isDarkMode }: SearchResultCardProps) {
  const snippet = result.text.substring(0, 300) + (result.text.length > 300 ? '...' : '');
  const highlightedSnippet = highlightKeywords(snippet, isDarkMode);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-2 flex-1"
        >
          <span className="line-clamp-2">{result.title}</span>
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
        </a>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 break-all">
        {result.url}
      </p>

      <div
        className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">Final Score:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {result.final_score.toFixed(3)}
            </span>
          </div>

          <div className="text-gray-400 dark:text-gray-600">|</div>

          <div>
            <span className="text-gray-600 dark:text-gray-400">Semantic:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {result.semantic_score.toFixed(3)}
            </span>
          </div>

          <div className="text-gray-400 dark:text-gray-600">|</div>

          <div>
            <span className="text-gray-600 dark:text-gray-400">Keyword:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {result.keyword_score.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResultCard;
