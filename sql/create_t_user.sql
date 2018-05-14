create table t_user (
	id bigserial PRIMARY KEY,
	account_name text NOT NULL,
	password text NOT NULL,
	game_account_id bigint REFERENCES t_user_info (id) ON DELETE RESTRICT,
	nick_name text NOT NULL,
	email text NOT NULL

);