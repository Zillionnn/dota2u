var _pgdb=require('../config/pgDB');
var util=require('util');


function MatchDetailModel(obj) {
    this.params=obj;
}
const sql_options={
    SELECT_ALL:"select * from t_match_detail",

    INSERT:`INSERT INTO t_match_detail(
	 match_id, match_seq_num, radiant_win, duration, start_time, tower_status_radiant, tower_status_dire, barracks_status_radiant, 
	barracks_status_dire, cluster, first_blood_time, lobby_type, human_players, leagueid, positive_votes, negative_votes, game_mode, 
	flags, engine, radiant_score, dire_score, tournament_id, tournament_round, radiant_team_id, radiant_name, radiant_logo, radiant_team_complete, 
	dire_team_id, dire_name, dire_logo, dire_team_complete, radiant_captain, dire_captain, player_accounts, players, picks_bans)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36);`,

    SELECT_BY_MATCH_ID:`select * from t_match_detail where match_id=$1;`,

    SELECT_ALL_BY_CONTAIN_ACCOUNT_ID:`SELECT * FROM t_match_detail where player_accounts @> $1;`

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

/**
 * 查询 player_accounts中包含account_id的元素
 * @param params
 * @param callback
 */
MatchDetailModel.prototype.selectByContainAccountID=function (params, callback) {
    this._query(sql_options.SELECT_ALL_BY_CONTAIN_ACCOUNT_ID,params,function (data) {
        callback(data);
    });
}





module.exports=MatchDetailModel;