-- Phase 3: readers may follow every supported topic and add up to five specific interests.
-- Backward compatible: existing rows keep their topics and get an empty interest list.

alter table public.profiles drop constraint if exists profiles_topics_check;
alter table public.profiles add constraint profiles_topics_check check (cardinality(topics) between 1 and 7);

alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add constraint profiles_interests_bounded check (
  cardinality(interests) <= 5 and array_to_string(interests, '') !~ '[\n\r]' and coalesce(length(array_to_string(interests, ' ')), 0) <= 5 * 41
);
