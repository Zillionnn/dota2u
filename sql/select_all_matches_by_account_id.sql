select
match_id, start_time,duration,radiant_win, players->array_position(account_array,'121320102')-1 player_json
from t_match_detail where player_accounts @>'121320102' ;