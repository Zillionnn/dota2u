﻿create table t_user_info(
	id serial PRIMARY KEY,
	account_id integer DEFAULT 0,
	 steam_id bigint NOT NULL,
	communityvisibilitystate integer  DEFAULT 0,
	profilestate integer  DEFAULT 0,
	personaname text  DEFAULT '',
	lastlogoff bigint  DEFAULT 0,
	commentpermission integer  DEFAULT 0,
	profileurl text DEFAULT '',
	avatar text DEFAULT '',
	avatarmedium text DEFAULT '',
	avatarfull text DEFAULT '',
	personastate integer  DEFAULT 0,
	realname text,
	primaryclanid text,
	timecreated bigint NOT NULL,
	personastateflags integer DEFAULT 0,
	gameextrainfo text,
	gameid text,
	loccountrycode text,
	locstatecode	text,
	loccityid integer DEFAULT 0
);