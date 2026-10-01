import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Cuerpo de texto largo (noticias, descripciones) desde el richtext (Markdown) del backend.
 * Cada bloque entra al llegar a él (data-reveal): la lectura se va armando mientras se baja.
 */
export function Prose({ markdown }: { markdown: string }) {
  // Contenido guardado antes de corregir el sanitizador del backend (src/security/
  // richtext-sanitizer.ts): «&gt; cita» al inicio de línea vuelve a ser la sintaxis de una cita
  const source = markdown.replace(/^([ \t]*)&gt;/gm, '$1>');
  return (
    <div className="prose-acta max-w-[68ch] text-[1.08rem] leading-[1.7] text-fg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p data-reveal="up">{children}</p>,
          h2: ({ children }) => <h2 data-reveal="left">{children}</h2>,
          h3: ({ children }) => <h3 data-reveal="left">{children}</h3>,
          ul: ({ children }) => <ul data-reveal-stagger="up">{children}</ul>,
          ol: ({ children }) => <ol data-reveal-stagger="up">{children}</ol>,
          blockquote: ({ children }) => <blockquote data-reveal="blur">{children}</blockquote>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage underline underline-offset-4"
            >
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
