import type { CSSProperties } from "react";

interface CodeBlockProps {
  children: string;
  title?: string;
  language?: string;
}

export function CodeBlock({ children, title, language = "ts" }: CodeBlockProps) {
  return (
    <figure
      className="code-block"
      style={{ "--lang": `"${language}"` } as CSSProperties}
    >
      {title ? <figcaption className="code-block__title">{title}</figcaption> : null}
      <pre className="code-block__pre">
        <code className="code-block__code">{children.trimEnd()}</code>
      </pre>
    </figure>
  );
}
