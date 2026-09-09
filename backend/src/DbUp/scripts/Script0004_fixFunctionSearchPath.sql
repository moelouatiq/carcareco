-- f_concat_ws ran with whatever search_path the caller happened to have, so a caller able to
-- prepend a schema of their own could have array_to_string resolve to a function they control.
-- The privilege revocations in Script0003 already closed that path, and the function is
-- SECURITY INVOKER so it grants no elevation, but pinning the resolution costs nothing and takes
-- the question off the table.
--
-- search_path is emptied and array_to_string is schema-qualified, which becomes necessary once
-- search_path no longer includes pg_catalog implicitly. Signature, volatility, security context
-- and body semantics are unchanged.
--
-- The body is single-quoted rather than dollar-quoted, matching Script0000: DbUp's variable
-- preprocessor reads $tag$ as a substitution variable and fails on an unknown name.

CREATE OR REPLACE FUNCTION public.f_concat_ws(text, VARIADIC text[])
  RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = ''
  AS 'SELECT pg_catalog.array_to_string($2, $1)';

-- CREATE OR REPLACE keeps the existing ACL, so the revocations from Script0003 still stand.
-- They are reasserted anyway: this migration must leave the function locked down even when
-- replayed on a database where that earlier state cannot be assumed. Conditional on the roles
-- existing, so the script stays a no-op on a plain PostgreSQL server.
DO $$
DECLARE
    api_roles text;
BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.f_concat_ws(text, text[]) FROM PUBLIC';

    SELECT string_agg(quote_ident(rolname), ', ')
      INTO api_roles
      FROM pg_roles
     WHERE rolname IN ('anon', 'authenticated');

    IF api_roles IS NOT NULL THEN
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.f_concat_ws(text, text[]) FROM %s', api_roles);
    END IF;
END
$$;
