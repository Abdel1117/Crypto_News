import Markdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";

type LinkProps = React.ComponentProps<"a"> & ExtraProps;
type ImageProps = React.ComponentProps<"img"> & ExtraProps;

/** react-markdown passes its syntax-tree `node`: keep it off the DOM element. */
function withoutNode<T extends ExtraProps>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

function MarkdownLink(props: LinkProps) {
  const external = /^https?:\/\//.test(props.href ?? "");
  return (
    <a
      {...withoutNode(props)}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer nofollow" }
        : {})}
    />
  );
}

function MarkdownImage(props: ImageProps) {
  // eslint-disable-next-line @next/next/no-img-element -- any host, unknown size
  return <img {...withoutNode(props)} alt={props.alt ?? ""} loading="lazy" />;
}

// Raw HTML in the Markdown is shown as text, never rendered, and
// react-markdown drops unsafe link targets (javascript: …).
const COMPONENTS: Components = {
  h1: "h2", // the page title is the only h1
  a: MarkdownLink,
  img: MarkdownImage,
};

/** An article's Markdown body, in Nocturne's reading typography. */
export default function ArticleBody({
  markdown,
  className = "",
}: Readonly<{ markdown: string; className?: string }>) {
  return (
    <div className={`n-prose ${className}`}>
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {markdown}
      </Markdown>
    </div>
  );
}
