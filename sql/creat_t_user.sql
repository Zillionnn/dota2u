﻿create table t_user(
	id serial PRIMARY KEY,
	account_id integer NOT NULL,
	 steam_id integer NOT NULL,
	avg_kill numeric NOT NULL DEFAULT 0,
	avg_death numeric NOT NULL DEFAULT 0,
	avg_assist numeric NOT NULL DEFAULT 0,
	avg_gold numeric NOT NULL DEFAULT 0,
	avg_xp numeric NOT NULL DEFAULT 0,
	avg_damage numeric NOT NULL DEFAULT 0,
	avg_last_hits numeric NOT NULL DEFAULT 0,
	avg_denies numeric NOT NULL DEFAULT 0,
	win integer NOT NULL DEFAULT 0,
	lose intger NOT NULL DEFAULT 0
	players json
);