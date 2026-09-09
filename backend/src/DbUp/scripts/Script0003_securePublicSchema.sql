-- Managed PostgreSQL providers that ship a REST data layer (Supabase and similar) grant their
-- browser-facing roles broad privileges on everything created in the public schema, through
-- ALTER DEFAULT PRIVILEGES. CarCare creates public."user" there, which holds usernames and
-- password hashes, so those defaults made credentials readable -- and writable -- by whoever holds
-- the project's public API key.
--
-- This application never uses such a data API: every query goes through ASP.NET Core over a
-- dedicated PostgreSQL role. The exposure is therefore removed rather than papered over with row
-- level security policies that would only describe access nobody should have.
--
-- Everything below is conditional on those roles existing, so the script is a no-op on a plain
-- PostgreSQL server -- the local Docker stack and CI have no anon or authenticated role.

DO $$
DECLARE
    api_roles text;
BEGIN
    SELECT string_agg(quote_ident(rolname), ', ')
      INTO api_roles
      FROM pg_roles
     WHERE rolname IN ('anon', 'authenticated');

    IF api_roles IS NULL THEN
        RAISE NOTICE 'No data API roles present; nothing to revoke.';
        RETURN;
    END IF;

    -- Existing application objects in public.
    EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public."user", public.schemaversions FROM %s', api_roles);

    -- The function carries EXECUTE for PUBLIC as well, which anon and authenticated inherit, so
    -- revoking it from them alone would leave the function reachable.
    IF EXISTS (SELECT 1 FROM pg_proc p
                 JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.proname = 'f_concat_ws') THEN
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.f_concat_ws(text, text[]) FROM %s', api_roles);
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.f_concat_ws(text, text[]) FROM PUBLIC';
    END IF;

    -- Future objects: neutralise the provider's default privileges so a later migration cannot
    -- silently re-expose a new table, sequence or function. Only the defaults owned by postgres
    -- are touched; those owned by the provider's own admin role are left alone.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
            'REVOKE ALL PRIVILEGES ON TABLES FROM %s', api_roles);
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
            'REVOKE ALL PRIVILEGES ON SEQUENCES FROM %s', api_roles);
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
            'REVOKE EXECUTE ON FUNCTIONS FROM %s', api_roles);
        EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
                'REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC';
    END IF;
END
$$;

-- Defence in depth, deliberately without policies: no policy means no row is visible to anyone
-- who does not bypass RLS. The table owner does bypass it, which is the role the application
-- connects as, so this changes nothing for ASP.NET while closing the door on every other role.
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemaversions ENABLE ROW LEVEL SECURITY;
