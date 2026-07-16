grant select on table public.profiles to anon;

grant select, insert, update on table public.profiles to authenticated;

grant all privileges on table public.profiles to service_role;
