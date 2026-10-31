-- Supabase SQL Editor에서 한 번 실행합니다.
create table public.guestbook (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 20),
  message text not null check (char_length(trim(message)) between 1 and 300),
  created_at timestamptz not null default now()
);
create index guestbook_created_at_idx on public.guestbook (created_at desc);
alter table public.guestbook enable row level security;
revoke all on public.guestbook from anon, authenticated;
grant select (name, message, created_at), insert (name, message) on public.guestbook to anon;
grant usage on sequence public.guestbook_id_seq to anon;
create policy "Visitors can read guestbook" on public.guestbook for select to anon using (true);
create policy "Visitors can leave messages" on public.guestbook for insert to anon with check (true);
-- 수정/삭제는 방문자에게 허용하지 않습니다. 관리자는 대시보드에서 관리합니다.
-- 공개 쓰기 기능이므로 전시 규모가 커지면 서버 측 요청 제한/봇 방지를 추가하세요.
