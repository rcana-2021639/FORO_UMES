import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Cuerpo de texto largo (noticias, descripciones) desde el richtext (Markdown) del backend. */
export function Prose({ markdown }: { markdown: string }) {
  return (
    <div className="prose-acta max-w-[68ch] text-[1.08rem] leading-[1.7] text-fg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-jade underline underline-offset-4"
            >
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
