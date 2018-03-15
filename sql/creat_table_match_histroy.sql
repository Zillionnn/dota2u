create table t_match_history(
	id serial PRIMARY KEY,
	 match_id bigint NOT NULL,
  match_seq_num bigint NOT NULL,
  start_time integer NOT NULL,
  radiant_team_id integer,
  dire_team_id integer,
  lobby_type integer,
  players json[]
);