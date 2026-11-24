import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export const ContenidoEnriquecido: React.FC<Props> = ({ content, className = '' }) => {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    return <p className={`whitespace-pre-line text-xs text-slate-700 leading-relaxed ${className}`}>{content}</p>;
  }

  return (
    <div
      className={`prose-sm max-w-none text-xs text-slate-800 leading-relaxed space-y-2 [&>h1]:text-sm [&>h1]:font-bold [&>h1]:text-slate-900 [&>h2]:text-xs [&>h2]:font-bold [&>h2]:text-slate-900 [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:text-slate-800 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-700 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>a]:text-emerald-700 [&>a]:underline [&>strong]:font-bold [&>p]:leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
