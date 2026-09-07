import React from "react";
import { useNsfwGate, type GateOptions } from "@/hooks/useNsfwGate";

type Props = GateOptions & {
  /**
   * Whether the thing being wrapped is adult content. Callers OR the item's own
   * flag with its community's, since some sources only classify the community.
   */
  nsfw?: boolean;
  children: React.ReactNode;
};

/**
 * Withholds adult content until the reader asks for it. See useNsfwGate for
 * what that means and why the placeholder replaces the content rather than
 * covering it.
 */
const NsfwGate: React.FC<Props> = ({ nsfw, children, ...options }) => {
  const { withheld, placeholder } = useNsfwGate(nsfw, options);
  return <>{withheld ? placeholder : children}</>;
};

export default NsfwGate;
