import React from "react";

interface AnswerPanelProps {
  answer: string;
  citations: { index: number; url: string }[];
}

export default function AnswerPanel({ answer, citations }: AnswerPanelProps) {
  if (!answer) return null;

  return (
    <div className="
      backdrop-blur-xl bg-white/70 dark:bg-gray-800/60 
      border border-white/40 dark:border-gray-700/40
      shadow-xl rounded-2xl p-6 mb-8
      animate-fadeIn
    ">
      <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
        Generated using AI
      </div>

      <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-line">
        {answer}
      </p>

      {/* Citations */}
      <div className="flex flex-wrap gap-2 mt-4">
        {citations.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="
              px-3 py-1 rounded-full text-xs font-medium
              bg-blue-100/60 dark:bg-blue-900/40 
              text-blue-700 dark:text-blue-300
              border border-blue-200/50 dark:border-blue-700/50
              hover:bg-blue-200/60 dark:hover:bg-blue-900/60
              transition
            "
          >
            Source {c.index}
          </a>
        ))}
      </div>
    </div>
  );
}
