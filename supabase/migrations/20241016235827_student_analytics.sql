create table "public"."analytics_login_events" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "logged_in_at" timestamp with time zone default now()
);


alter table "public"."analytics_login_events" enable row level security;

CREATE UNIQUE INDEX analytics_login_events_pkey ON public.analytics_login_events USING btree (id);

CREATE INDEX idx_analytics_login_events_logged_in_at ON public.analytics_login_events USING btree (logged_in_at);

CREATE INDEX idx_analytics_login_events_user_id ON public.analytics_login_events USING btree (user_id);

alter table "public"."analytics_login_events" add constraint "analytics_login_events_pkey" PRIMARY KEY using index "analytics_login_events_pkey";

alter table "public"."analytics_login_events" add constraint "analytics_login_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."analytics_login_events" validate constraint "analytics_login_events_user_id_fkey";

set check_function_bodies = off;


CREATE OR REPLACE FUNCTION public.insert_login_event_on_user_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (NEW.last_sign_in_at IS NOT NULL) THEN
    INSERT INTO public.analytics_login_events (logged_in_at, user_id)
    VALUES (NEW.last_sign_in_at, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER insert_login_event_on_user_login_trigger
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.insert_login_event_on_user_login();

CREATE OR REPLACE FUNCTION public.insert_login_event_on_user_session_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (NEW.updated_at IS NOT NULL) THEN
    INSERT INTO public.analytics_login_events (logged_in_at, user_id)
    VALUES (NEW.updated_at, NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER insert_login_event_on_user_session_update_trigger
AFTER UPDATE OF updated_at ON auth.sessions
FOR EACH ROW
EXECUTE FUNCTION public.insert_login_event_on_user_session_update();

grant delete on table "public"."analytics_login_events" to "anon";

grant insert on table "public"."analytics_login_events" to "anon";

grant references on table "public"."analytics_login_events" to "anon";

grant select on table "public"."analytics_login_events" to "anon";

grant trigger on table "public"."analytics_login_events" to "anon";

grant truncate on table "public"."analytics_login_events" to "anon";

grant update on table "public"."analytics_login_events" to "anon";

grant delete on table "public"."analytics_login_events" to "authenticated";

grant insert on table "public"."analytics_login_events" to "authenticated";

grant references on table "public"."analytics_login_events" to "authenticated";

grant select on table "public"."analytics_login_events" to "authenticated";

grant trigger on table "public"."analytics_login_events" to "authenticated";

grant truncate on table "public"."analytics_login_events" to "authenticated";

grant update on table "public"."analytics_login_events" to "authenticated";

grant delete on table "public"."analytics_login_events" to "service_role";

grant insert on table "public"."analytics_login_events" to "service_role";

grant references on table "public"."analytics_login_events" to "service_role";

grant select on table "public"."analytics_login_events" to "service_role";

grant trigger on table "public"."analytics_login_events" to "service_role";

grant truncate on table "public"."analytics_login_events" to "service_role";

grant update on table "public"."analytics_login_events" to "service_role";

create policy "Users can insert their own login events"
on "public"."analytics_login_events"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));

CREATE POLICY "Enable delete for users based on user_id"
ON "public"."analytics_login_events"
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() = user_id)

CREATE OR REPLACE VIEW public.login_stats AS
SELECT
  user_id,
  DATE_TRUNC('day', logged_in_at) AS login_date,
  COUNT(*) AS login_count
FROM
  public.analytics_login_events
GROUP BY
  user_id, DATE_TRUNC('day', logged_in_at);

CREATE VIEW public.user_last_login AS
SELECT
  user_id,
  MAX(logged_in_at) AS last_login_at
FROM
  public.analytics_login_events
GROUP BY
  user_id;
