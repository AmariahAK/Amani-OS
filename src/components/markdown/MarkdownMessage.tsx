import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

function highlightClauses(text: string): ReactNode[] {
  const re = /(Article\s+\d+(?:\.\d+)?|§\s*\d+(?:\.\d+)?|\b\d+\.\d+\b)/gi;
  const parts = text.split(re);
  return parts.map((part, i) =>
    /^(Article\s+\d|§\s*\d|\d+\.\d+)/i.test(part) ? (
      <span
        key={i}
        className="mx-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-semibold"
        style={{ background: "var(--color-clause)", color: "var(--color-text)" }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Flatten react-markdown children to plain text (for heading checks, etc.). */
export function childrenToPlainText(children: ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map(childrenToPlainText).join("");
  }
  if (isValidElement(children)) {
    const el = children as ReactElement<{ children?: ReactNode }>;
    return childrenToPlainText(el.props.children);
  }
  return "";
}

/** Apply clause highlighting to string nodes; preserve bold/em/links from markdown. */
function renderWithClauses(children: ReactNode): ReactNode {
  if (children == null || typeof children === "boolean") return null;
  if (typeof children === "string") return <>{highlightClauses(children)}</>;
  if (typeof children === "number") return <>{highlightClauses(String(children))}</>;
  if (Array.isArray(children)) {
    return Children.map(children, (child, i) => (
      <span key={i} className="contents">
        {renderWithClauses(child)}
      </span>
    ));
  }
  if (isValidElement(children)) {
    const el = children as ReactElement<{ children?: ReactNode }>;
    if (el.props.children == null) return el;
    return cloneElement(el, {
      children: renderWithClauses(el.props.children),
    } as { children: ReactNode });
  }
  return null;
}

function isRuling(content: string): boolean {
  return /^##\s*(Ruling|Uamuzi)/im.test(content);
}

function isResolved(content: string): boolean {
  return /\b(Settled|Resolved|Imesuluhishwa)\b/i.test(content);
}

const components: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed">{renderWithClauses(children)}</p>,
  li: ({ children }) => <li className="mb-1">{renderWithClauses(children)}</li>,
  strong: ({ children }) => <strong className="font-semibold">{renderWithClauses(children)}</strong>,
  em: ({ children }) => <em>{renderWithClauses(children)}</em>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="px-3 py-2 text-left font-semibold"
      style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="border-t px-3 py-2"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {children}
    </td>
  ),
  h2: ({ children }) => {
    const t = childrenToPlainText(children);
    const ruling = /Ruling|Uamuzi/i.test(t);
    return (
      <h2
        className="mb-2 mt-4 text-lg font-bold"
        style={
          ruling
            ? { color: "var(--color-dispute)", borderLeft: "4px solid var(--color-dispute)", paddingLeft: 12 }
            : undefined
        }
      >
        {renderWithClauses(children)}
      </h2>
    );
  },
  h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold">{renderWithClauses(children)}</h3>,
};

interface Props {
  content: string;
}

export function MarkdownMessage({ content }: Props) {
  const ruling = isRuling(content);
  const resolved = isResolved(content);

  return (
    <div
      className="prose-amani text-[15px]"
      style={{
        borderLeft: ruling
          ? "4px solid var(--color-dispute)"
          : resolved
            ? "4px solid var(--color-resolved)"
            : undefined,
        paddingLeft: ruling || resolved ? 12 : 0,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
