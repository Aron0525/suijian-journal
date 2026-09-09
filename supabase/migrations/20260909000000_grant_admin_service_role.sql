begin;

grant select, insert, update, delete
on table public.journal_admins, public.admin_audit_events
to service_role;

notify pgrst, 'reload schema';

commit;
