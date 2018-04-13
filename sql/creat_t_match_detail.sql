create table t_match_detail(
	id serial PRIMARY KEY,
	match_id bigint NOT NULL,
	match_seq_num bigint NOT NULL,
	radiant_win boolean NOT NULL DEFAULT true,
	duration bigint NOT NULL,
	start_time bigint NOT NULL,

	tower_status_radiant integer NOT NULL,
	tower_status_dire integer NOT NULL,
	barracks_status_radiant integer NOT NULL,  
	barracks_status_dire integer NOT NULL,

	cluster integer NOT NULL,
	first_blood_time integer NOT NULL,
	lobby_type integer NOT NULL,
	human_players integer DEFAULT 0,
	leagueid integer ,
	positive_votes integer NOT NULL,
	negative_votes integer NOT NULL,
	game_mode integer NOT NULL DEFAULT 0,
	flags integer NOT NULL DEFAULT 0,
	engine integer DEFAULT 0,

	radiant_score integer DEFAULT 0,
	dire_score integer DEFAULT 0,
	tournament_id integer ,
	tournament_round integer ,
	radiant_team_id integer ,
	radiant_name text ,
	radiant_logo bigint ,
	radiant_team_complete integer ,

	dire_team_id integer ,
	dire_name text ,
	dire_logo bigint ,
	dire_team_complete integer ,
	radiant_captain bigint ,
	dire_captain bigint,

	player_accounts json,
	players json,
	picks_bans json

);