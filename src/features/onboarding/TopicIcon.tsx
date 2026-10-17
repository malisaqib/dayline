const PATHS: Record<string, string> = {
  world: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.6 3.5 5.6 3.5 9s-1 6.4-3.5 9m0-18C9.5 5.6 8.5 8.6 8.5 12s1 6.4 3.5 9M3.6 9h16.8M3.6 15h16.8",
  pakistan: "M5 21V4m0 1h11l-2 4 2 4H5",
  technology: "M4 6h16v10H4zM9 20h6M12 16v4",
  science: "M9 3h6M10 3v6L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-10V3",
  space: "M12 15l-3-3a12 12 0 0 1 9-8 12 12 0 0 1-8 9l-3 3M7 14l-3 1 3-5h3M10 17l-1 3 5-3v-3",
  security: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Zm-3 9 2 2 4-4",
  disasters: "M12 3 2 20h20L12 3Zm0 6v5m0 3h.01",
};

export function TopicIcon({ topic }: { topic: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[topic] ?? PATHS.world} />
    </svg>
  );
}
