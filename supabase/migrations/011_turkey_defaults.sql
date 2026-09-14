-- Dragg-TR Turkey defaults.
-- Applies to NEW users only. Existing user data is not modified.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, name, terms_accepted)
  values (
    new.id,
    null,
    null,
    coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false)
  );

  insert into public.categories (
    user_id,
    name,
    group_type,
    monthly_limit,
    is_default,
    icon
  )
  values
    (new.id, 'Konut', 'needs', null, true, '🏠'),
    (new.id, 'Market & Gıda', 'needs', null, true, '🛒'),
    (new.id, 'Ulaşım', 'needs', null, true, '🚗'),
    (new.id, 'Sağlık', 'needs', null, true, '🏥'),
    (new.id, 'Eğitim', 'needs', null, true, '📚'),
    (new.id, 'Faturalar', 'needs', null, true, '⚡'),
    (new.id, 'Borçlar', 'needs', null, true, '🧾'),
    (new.id, 'Eğlence', 'wants', null, true, '🎮'),
    (new.id, 'Abonelikler', 'wants', null, true, '🎬'),
    (new.id, 'Alışveriş', 'wants', null, true, '🛍️'),
    (new.id, 'Diğer', 'wants', null, true, '🏷️'),
    (new.id, 'Yatırım', 'savings', null, true, '📈'),
    (new.id, 'Rezerv', 'savings', null, true, '🛟'),
    (new.id, 'Gelir', 'income', null, true, '💼');

  insert into public.payment_methods (
    user_id,
    name,
    type,
    credit_limit
  )
  values
    (new.id, 'Nakit', 'cash', null),
    (new.id, 'Kredi Kartı', 'credit', 0),
    (new.id, 'Banka Kartı', 'debit', null),
    (new.id, 'Banka Transferi', 'bank', null);

  return new;
end;
$$;
