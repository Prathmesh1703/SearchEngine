export interface SearchResult {
  title: string;
  url: string;
  text: string;
  semantic_score: number;
  keyword_score: number;
  final_score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  num_results: number;
}

export interface SearchFormData {
  query: string;
  domains: string[];
  numResults: number;
}
