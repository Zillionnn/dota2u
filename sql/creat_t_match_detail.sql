create table t_match_detail(
	id serial PRIMARY KEY,
	match_id bigint NOT NULL,
	match_seq_num bigint NOT NULL,
	start_time integer NOT NULL,
	duration integer NOT NULL,

	radiant_win boolean NOT NULL DEFAULT 0,

	tower_status_radiant integer NOT NULL,
	tower_status_dire integer NOT NULL,
	barracks_status_radiant integer NOT NULL,  //兵营
	barracks_status_dire integer NOT NULL,
	cluster integer NOT NULL,
	first_blood_time integer NOT NULL,
	lobby_type integer NOT NULL,
	human_players integer DEFAULT 0,
	leagueid integer ,
	positive_votes integer NOT NULL,
	negative_votes integer NOT NULL,
	game_mode integer NOT NULL DEFAULT 0,
	
	player0_account integer ,
	player1_account integer ,
	player2_account integer ,
	player3_account integer ,
	player4_account integer ,
	player5_account integer ,
	player6_account integer ,
	player7_account integer ,
	player8_account integer ,
	player9_account integer ,

	player0 json,
	player1 json,
	player2 json,
	player3 json,
	player4 json,
	player5 json,
	player6 json,
	player7 json,
	player8 json,
	player9 json,



);