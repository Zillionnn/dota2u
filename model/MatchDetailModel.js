var _pgdb=require('../config/pgDB');
var util=require('util');


function MatchDetailModel(obj) {
    this.params=obj;
}
const sql_options={
    SELECT_ALL:"select * from t_match_detail_main",

    INSERT:`INSERT INTO t_match_detail(
	 match_id, match_seq_num, radiant_win, duration, start_time, tower_status_radiant, tower_status_dire, barracks_status_radiant, 
	barracks_status_dire, cluster, first_blood_time, lobby_type, human_players, leagueid, positive_votes, negative_votes, game_mode, 
	flags, engine, radiant_score, dire_score, tournament_id, tournament_round, radiant_team_id, radiant_name, radiant_logo, radiant_team_complete, 
	dire_team_id, dire_name, dire_logo, dire_team_complete, radiant_captain, dire_captain, player_accounts, players, picks_bans, 
	player0, player1, player2, player3, player4, player5, player6, player7, player8, player9)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46);`,

    UPDATE_PLAYER_ADD_PLAYER__NUM:`UPDATE t_match_detail SET  account_array=$1  WHERE match_id=$2;`,

    INSERT_PARTITION:`INSERT INTO t_match_detail_main(
	 match_id, match_seq_num, radiant_win, duration, start_time, tower_status_radiant, tower_status_dire, barracks_status_radiant, 
	barracks_status_dire, cluster, first_blood_time, lobby_type, human_players, leagueid, positive_votes, negative_votes, game_mode, 
	flags, engine, radiant_score, dire_score, tournament_id, tournament_round, radiant_team_id, radiant_name, radiant_logo, radiant_team_complete, 
	dire_team_id, dire_name, dire_logo, dire_team_complete, radiant_captain, dire_captain, player_accounts, players, picks_bans,account_array)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37);`,


    SELECT_BY_MATCH_ID:`select * from t_match_detail_main where match_id=$1;`,

    SELECT_ALL_BY_CONTAIN_ACCOUNT_ID:`SELECT * FROM t_match_detail_main where player_accounts @> $1;`,
    
    SELECT_ID_BY_CONTAIN_ACCOUNT_ID:`SELECT id FROM t_match_detail_main where player_accounts @> $1;`,

    //暂时降序获取所有，后台获取截取20条记录；
    SELECT_ALL_BY_CONTAIN_ACCOUNT_ID_ORDER_BY_START_TIME_LIMIT_20:
      //  `SELECT match_id  FROM t_match_detail_main where  account_array @>$1 ORDER BY match_seq_num DESC LIMIT 20;`,
      `SELECT match_id  FROM t_match_detail_main where  account_array @>$1 ORDER BY match_seq_num DESC;`,

    SELECT_ID_BY_MATCH_ID:
        `select id from 
        (select id,match_id from  t_match_detail_main where account_array @>$1) temp  where match_id=$2 ;`,

    SELECT_SUMMERY_BY_CONTAIN_ACCOUNT_ID:`select 
match_id, start_time,duration,radiant_win,game_mode, players->array_position(account_array,$1)-1 player_json ,
array_position(account_array,$1)-1  player_position
from t_match_detail_main where account_array @>$2  order by start_time DESC;`


    
};
//继承
util.inherits(MatchDetailModel,_pgdb);



MatchDetailModel.prototype.selectAll=function (callback) {
    this._query(sql_options.selectAll,[],function (data) {
        callback( data);
    });
}



MatchDetailModel.prototype.selectByMatchId=function (params,callback) {
    this._query(sql_options.SELECT_BY_MATCH_ID,params,function (data) {
        callback( data);
    });
}

MatchDetailModel.prototype.insert=function (params,callback) {
    this._query(sql_options.INSERT,params,function (data) {
        callback( data);
    });
}

MatchDetailModel.prototype.insertPartition=function (params,callback) {
    this._query(sql_options.INSERT_PARTITION,params,function (data) {
        callback( data);
    });
}

/**
 * 查询 player_accounts中包含account_id的元素
 * @param params
 * @param callback
 */
MatchDetailModel.prototype.selectAllByContainAccountID=function (params, callback) {
    this._query(sql_options.SELECT_ALL_BY_CONTAIN_ACCOUNT_ID,params,function (data) {
        callback(data);
    });
};

/**
 * 查询20条包含指定account_id的元素，按时间降序排列；
 * @param params
 * @param callback
 */
MatchDetailModel.prototype.selectRecentByContainAccountIDLimit20=function (params, callback) {
    this._query(sql_options.SELECT_ALL_BY_CONTAIN_ACCOUNT_ID_ORDER_BY_START_TIME_LIMIT_20,params,function (data) {
        callback(data);
    });
};

/**
 * 查询包含指定account_id的id
 * @param params
 * @param callback
 */
MatchDetailModel.prototype.selectIDsByContainAccount=function (params, callback) {
    this._query(sql_options.SELECT_ID_BY_CONTAIN_ACCOUNT_ID,params,function (data) {
        callback(data);
    });
};

/**
 * 查询
 * @param params
 * @param callback
 */
MatchDetailModel.prototype.selectIDByMatchId=function (params,callback) {
    this._query(sql_options.SELECT_ID_BY_MATCH_ID,params,function (data) {
        callback( data);
    });
};

/**
 * 查询玩家所有比赛
 * @param params
 * @param callback
 */
MatchDetailModel.prototype.selectSummeryByAccountID=function(params,callback){
  this._query(sql_options.SELECT_SUMMERY_BY_CONTAIN_ACCOUNT_ID,params,function (data) {
      callback(data);
  })
};

MatchDetailModel.prototype.updateMatchDetailSetPlayerByMatchID=function (params,callback) {

    this._query(sql_options.UPDATE_PLAYER_ADD_PLAYER__NUM,params,function (data) {
        callback( data);
    });
};




module.exports=MatchDetailModel;