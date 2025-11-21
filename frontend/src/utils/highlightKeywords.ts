export function highlightKeywords(text: string, isDarkMode: boolean): string {
  const keywords = ['search', 'engine', 'memory', 'ai', 'semantic', 'keyword'];
  let highlightedText = text;

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    const highlightClass = isDarkMode
      ? 'bg-yellow-900/40 text-yellow-300 font-medium px-1 rounded'
      : 'bg-yellow-200 text-yellow-900 font-medium px-1 rounded';
    highlightedText = highlightedText.replace(
      regex,
      `<mark class="${highlightClass}">$1</mark>`
    );
  });

  return highlightedText;
}
