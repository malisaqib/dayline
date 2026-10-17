"use client";

import type { AnchorHTMLAttributes } from "react";
import { useStoryActions } from "./StoryShell";

export function TrackedLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const actions = useStoryActions();
  return <a {...props} onClick={() => actions?.open()} />;
}
