CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    login character varying NOT NULL
);;
