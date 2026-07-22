import DOMPurify from "dompurify";
import parse from "html-react-parser";
import linkifyHtml from "linkify-html";
import React from "react";
import {
  createLinkifyOptions,
  createPostBodyParseOptions,
} from "@/lib/post-body-links";

type Props = {
  body: string;
  pluginId: string;
  className?: string;
};

/**
 * Renders a post body, linkifying mentions, hashtags and bare URLs.
 *
 * Order matters: sanitize first so linkify only ever walks clean markup, then
 * linkify (which leaves existing anchors alone), then parse into React.
 */
const PostBody: React.FC<Props> = ({ body, pluginId, className }) => {
  const content = React.useMemo(() => {
    const clean = DOMPurify.sanitize(body);
    const linkified = linkifyHtml(clean, createLinkifyOptions(pluginId));
    return parse(linkified, createPostBodyParseOptions(pluginId));
  }, [body, pluginId]);

  return <div className={className}>{content}</div>;
};

export default PostBody;
