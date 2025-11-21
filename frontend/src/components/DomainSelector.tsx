import { X } from 'lucide-react';

interface DomainSelectorProps {
  availableDomains: string[];
  selectedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
  disabled: boolean;
}

function DomainSelector({ availableDomains, selectedDomains, onDomainsChange, disabled }: DomainSelectorProps) {
  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      onDomainsChange(selectedDomains.filter(d => d !== domain));
    } else {
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  const clearAll = () => {
    onDomainsChange([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Domains (optional)
        </label>
        {selectedDomains.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableDomains.map((domain) => {
          const isSelected = selectedDomains.includes(domain);
          return (
            <button
              key={domain}
              type="button"
              onClick={() => toggleDomain(domain)}
              disabled={disabled}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1
                ${isSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <span>{domain.replace('https://', '').replace('www.', '')}</span>
              {isSelected && <X className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DomainSelector;
