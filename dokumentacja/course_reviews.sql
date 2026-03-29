-- Optional SQL for Supabase: database-backed reviews for courses
-- Run in Supabase SQL Editor.

create table if not exists public.course_reviews (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  course_id int8 not null references public.courses(id) on delete cascade,
  user_uid uuid not null,
  rating int2 not null check (rating between 1 and 5),
  comment text not null,
  unique (course_id, user_uid)
);

create index if not exists idx_course_reviews_course_id on public.course_reviews(course_id);
create index if not exists idx_course_reviews_user_uid on public.course_reviews(user_uid);

alter table public.course_reviews enable row level security;

-- Everyone can read reviews for open courses.
drop policy if exists "read_open_course_reviews" on public.course_reviews;
create policy "read_open_course_reviews"
on public.course_reviews
for select
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_reviews.course_id
      and coalesce(c.isOpen, true) = true
  )
);

-- Logged in users can add or update only their own review.
drop policy if exists "insert_own_review" on public.course_reviews;
create policy "insert_own_review"
on public.course_reviews
for insert
to authenticated
with check (auth.uid() = user_uid);

drop policy if exists "update_own_review" on public.course_reviews;
create policy "update_own_review"
on public.course_reviews
for update
to authenticated
using (auth.uid() = user_uid)
with check (auth.uid() = user_uid);

-- Optional: allow user to delete own review
drop policy if exists "delete_own_review" on public.course_reviews;
create policy "delete_own_review"
on public.course_reviews
for delete
to authenticated
using (auth.uid() = user_uid);
