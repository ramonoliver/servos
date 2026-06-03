begin;

insert into public.kids_rooms (
  id,
  church_id,
  name,
  min_age,
  max_age,
  capacity,
  description,
  status,
  volunteer_ids,
  created_at,
  updated_at
)
values
  (
    'kids_room_kids_1_c1',
    'c1',
    'Kids 1',
    5,
    8,
    18,
    'Sala recomendada para criancas de 5 a 8 anos.',
    'active',
    '{}'::text[],
    now(),
    now()
  ),
  (
    'kids_room_kids_2_c1',
    'c1',
    'Kids 2',
    9,
    12,
    20,
    'Sala para criancas maiores e pre-teens.',
    'active',
    '{}'::text[],
    now(),
    now()
  )
on conflict (id) do update
set
  name = excluded.name,
  min_age = excluded.min_age,
  max_age = excluded.max_age,
  capacity = excluded.capacity,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.users (
  id,
  church_id,
  email,
  password_hash,
  name,
  phone,
  role,
  status,
  avatar_color,
  photo_url,
  birth_date,
  gender,
  is_child,
  primary_guardian_id,
  guardian_ids,
  spouse_id,
  availability,
  total_schedules,
  confirm_rate,
  must_change_password,
  last_served_at,
  notes,
  active,
  joined_at,
  created_at
)
values (
  'kid_bianca_zoe_frota_sousa',
  'c1',
  'bianca.zoe.frota.sousa@kids.local',
  '',
  'Bianca Zoe Frota de Sousa',
  '',
  'member',
  'active',
  '#F4532A',
  null,
  date '2018-12-13',
  'feminino',
  true,
  'u1',
  array['u1', 'id_1775262734350_nova4o']::text[],
  null,
  array[true, true, true, true, true, true, true],
  0,
  100,
  false,
  null,
  'Crianca cadastrada pelo modulo Kids. Pais: Ramon Oliveira de Sousa e Fernanda Frota.',
  true,
  now(),
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  birth_date = excluded.birth_date,
  gender = excluded.gender,
  is_child = true,
  primary_guardian_id = excluded.primary_guardian_id,
  guardian_ids = excluded.guardian_ids,
  notes = excluded.notes,
  active = true;

insert into public.kids_guardianship (
  id,
  church_id,
  child_id,
  guardian_id,
  relationship,
  is_primary,
  created_at
)
values
  (
    'kids_guardian_bianca_ramon',
    'c1',
    'kid_bianca_zoe_frota_sousa',
    'u1',
    'Pai',
    true,
    now()
  ),
  (
    'kids_guardian_bianca_fernanda',
    'c1',
    'kid_bianca_zoe_frota_sousa',
    'id_1775262734350_nova4o',
    'Mae',
    false,
    now()
  )
on conflict (child_id, guardian_id) do update
set
  relationship = excluded.relationship,
  is_primary = excluded.is_primary;

commit;
