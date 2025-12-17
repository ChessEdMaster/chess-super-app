create table if not exists work_pgns (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references pgn_games(id) on delete cascade unique not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table work_pgns enable row level security;

create policy "Users can read their own work pgns"
  on work_pgns for select
  using (
    exists (
      select 1 from pgn_games
      where pgn_games.id = work_pgns.game_id
      and pgn_games.collection_id in (
        select id from pgn_collections where user_id = auth.uid()
      )
    )
  );

create policy "Users can insert their own work pgns"
  on work_pgns for insert
  with check (
    exists (
      select 1 from pgn_games
      where pgn_games.id = work_pgns.game_id
      and pgn_games.collection_id in (
        select id from pgn_collections where user_id = auth.uid()
      )
    )
  );

create policy "Users can update their own work pgns"
  on work_pgns for update
  using (
    exists (
      select 1 from pgn_games
      where pgn_games.id = work_pgns.game_id
      and pgn_games.collection_id in (
        select id from pgn_collections where user_id = auth.uid()
      )
    )
  );

create policy "Users can delete their own work pgns"
  on work_pgns for delete
  using (
    exists (
      select 1 from pgn_games
      where pgn_games.id = work_pgns.game_id
      and pgn_games.collection_id in (
        select id from pgn_collections where user_id = auth.uid()
      )
    )
  );
