create table if not exists public.decal_inventory (
  id uuid primary key default gen_random_uuid(),
  material_id text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'sparkles',
  price_per_sq_in numeric(8,2) not null check (price_per_sq_in >= 0),
  has_color boolean not null default false,
  special_order boolean not null default false,
  colors jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.decal_inventory enable row level security;
drop policy if exists "Public can read active decal inventory" on public.decal_inventory;
create policy "Public can read active decal inventory" on public.decal_inventory for select using (active = true);

insert into public.decal_inventory (material_id, name, description, icon, price_per_sq_in, has_color, special_order, colors, sort_order)
values
('glossy','Glossy Color','Vivid, smooth, weatherproof','droplet',0.10,true,false,'["#111111","#FAFAFA","#D6208A","#F44FA0","#F2BAD3","#B31E30","#6B1521","#EF5A24","#EA6420","#A98D18","#E8A72E","#F3C60E","#E9F05B","#6CC24A","#2E9E4C","#1F5C3D","#0F7B85","#2FB7B1","#82E4D7","#5AB9DA","#1E5FD0","#17225E","#B18ECB","#5A2D8C","#3B2824","#EADFC4","#B8BCC2","#D3D6DB","#3E4149"]',10),
('matte','Matte Color','Flat, no-glare finish','square',0.15,true,false,'["#111111","#FAFAFA","#D6208A","#F44FA0","#B31E30","#6B1521","#EF5A24","#EA6420","#F3C60E","#E9F05B","#6CC24A","#2E9E4C","#1F5C3D","#0F7B85","#2FB7B1","#82E4D7","#1E5FD0","#17225E","#B18ECB","#5A2D8C","#3B2824","#EADFC4","#D3D6DB"]',20),
('chrome','Metallic Chrome','Mirror-like metallic finish','gem',0.25,true,false,'["#B8BCC2","#A98D18"]',30),
('holographic','Holographic','Rainbow-shift finish · special order','sparkles',0.20,false,true,'["#B98CFF"]',40),
('holographic-black','Holographic Black','Black holo finish · special order','sparkles',0.25,false,true,'["#17131d"]',50),
('glow','Glow-in-the-Dark','Charges in light · special order','moon-star',0.25,false,true,'["#C7F9CC"]',60),
('hologlow','Holo/Glow','Holographic + glow · special order','sparkles',0.40,false,true,'["#C7F9CC"]',70),
('reflective-white','Reflective White','Reflective white · special order','flashlight',0.40,false,true,'["#FAFAFA"]',80),
('reflective-black','Reflective Black','Reflective black · special order','flashlight',0.40,false,true,'["#111111"]',90)
on conflict (material_id) do update set name=excluded.name, description=excluded.description, icon=excluded.icon, price_per_sq_in=excluded.price_per_sq_in, has_color=excluded.has_color, special_order=excluded.special_order, colors=excluded.colors, sort_order=excluded.sort_order, active=true;