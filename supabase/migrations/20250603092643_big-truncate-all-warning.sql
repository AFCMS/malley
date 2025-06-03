set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.extreme_danger_truncate_all_tables_yes_i_am_sure()
 RETURNS void
 LANGUAGE plpgsql
AS $function$declare
  r RECORD;
begin
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
    END LOOP;
end;$function$
;



