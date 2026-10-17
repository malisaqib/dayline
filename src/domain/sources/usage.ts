/**
 * What we allow ourselves to do with a source's content. This is separate from
 * whether the feed can be fetched: being reachable grants no reuse rights.
 * - display "excerpt": show the publisher's own feed excerpt with attribution.
 * - display "headline_only": show title and link, nothing else.
 * - aiProcessing: may send the text to the model for a summary.
 */
export type SourceUsage = {
  display: "excerpt" | "headline_only";
  aiProcessing: boolean;
  /** May send only the headline and the publisher's short feed excerpt (never full text) to the model. */
  aiExcerptSummary: boolean;
  /** Basis for the decision; "unverified" means a prototype assumption pending terms review. */
  basis: "public_domain" | "unverified";
};
