-- Studio admin: "Mark replied" and help-aware client wording.
-- Run once in the Supabase SQL editor (or with `supabase db push`).

-- 1. When the studio last replied to a brief. Stops the 2-working-day reply clock in the admin.
alter table public.briefs add column if not exists replied_at timestamptz;

-- 2. Does this project still have open "I'm not sure—help me decide" questions?
--    Used by the client project page so an "Awaiting reply" brief says the studio is
--    preparing options, instead of telling the client it's their move.
--    Mirrors helpWith() in src/Admin.jsx. Open means: no proposal has gone out yet.
--    to_jsonb() lets this work whether the list columns are text[] or jsonb.
create or replace function public.project_help_open(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.briefs b
    where b.project_code = upper(p_code)
      and b.status in ('new', 'in_review', 'awaiting_reply')
      and (
        b.project_type = 'I’m not sure—help me decide'
        or b.budget = 'I’m not sure—help me decide'
        or b.ready = 'I need help with this'
        or coalesce(to_jsonb(b.goals), '[]'::jsonb) ? 'I’m not sure—help me decide'
        or coalesce(to_jsonb(b.pages), '[]'::jsonb) ? 'I’m not sure—help me decide'
        or coalesce(to_jsonb(b.features), '[]'::jsonb) ? 'I’m not sure—help me decide'
        or coalesce(to_jsonb(b.feel), '[]'::jsonb) ? 'I’m not sure—help me decide'
      )
  );
$$;

-- Returns only a yes/no for a known project code, like project_progress.
grant execute on function public.project_help_open(text) to anon, authenticated;
