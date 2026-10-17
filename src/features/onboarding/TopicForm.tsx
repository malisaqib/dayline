"use client";

import { useActionState } from "react";
import { completeOnboarding, type ActionState } from "@/app/actions";
import { PendingButton } from "@/features/shared/PendingButton";

export type TopicOption = { id: string; label: string };

const INITIAL: ActionState = { error: null };

export function TopicForm({ topics, selected, maxTopics }: { topics: TopicOption[]; selected: string[]; maxTopics: number }) {
  const [state, action] = useActionState(completeOnboarding, INITIAL);

  return (
    <form action={action} className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">Pick up to {maxTopics} topics</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {topics.map((topic) => (
            <label
              key={topic.id}
              className="flex cursor-pointer items-center gap-2 rounded border border-rule bg-white/40 px-3 py-2.5 has-[:checked]:border-ink has-[:checked]:bg-white"
            >
              <input type="checkbox" name="topics" value={topic.id} defaultChecked={selected.includes(topic.id)} className="accent-accent" />
              <span className="font-serif text-lg">{topic.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && (
        <p role="alert" className="rounded border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent">
          {state.error}
        </p>
      )}
      <PendingButton label="Make my paper" pendingLabel="Gathering today's stories… (up to a minute)" />
    </form>
  );
}
