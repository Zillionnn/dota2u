CREATE OR REPLACE FUNCTION auto_insert_into_t_match_detail_main_partition()  
  RETURNS trigger AS  
$BODY$  
DECLARE  
    time_column_name    text ;          -- 父表中用于分区的时间字段的名称[必须首先初始化!!]  
    curMM       varchar(6);     -- 'YYYYMM'字串,用做分区子表的后缀  
    isExist         boolean;        -- 分区子表,是否已存在  
    startTime       text;  
    endTime     text;  
    strSQL          text;  
      
BEGIN  
    -- 调用前,必须首先初始化(时间字段名):time_column_name [直接从调用参数中获取!!]  
    time_column_name := TG_ARGV[0];  
     
    -- 判断对应分区表 是否已经存在?  
    EXECUTE 'SELECT $1.'||time_column_name INTO strSQL USING NEW;  
    curMM := to_char( strSQL::timestamp , 'YYYYMM' );  
    select count(*) INTO isExist from pg_class where relname = (TG_RELNAME||'_'||curMM);  
  
    -- 若不存在, 则插入前需 先创建子分区  
    IF ( isExist = false ) THEN    
        -- 创建子分区表  
        startTime := curMM||'01 00:00:00.000';  
        endTime := to_char( startTime::timestamp + interval '1 month', 'YYYY-MM-DD HH24:MI:SS.MS');  
        strSQL := 'CREATE TABLE IF NOT EXISTS '||TG_RELNAME||'_'||curMM||  
                  ' ( CHECK('||time_column_name||'>='''|| startTime ||''' AND '  
                             ||time_column_name||'< '''|| endTime ||''' )  
                          ) INHERITS ('||TG_RELNAME||') ;'  ;    
        EXECUTE strSQL;  
  
        -- 创建索引  
        strSQL := 'CREATE INDEX '||TG_RELNAME||'_'||curMM||'_INDEX_'||time_column_name||' ON '  
                  ||TG_RELNAME||'_'||curMM||' ('||time_column_name||');' ;  
        EXECUTE strSQL;  
         
    END IF;  
  
    -- 插入数据到子分区!  
    strSQL := 'INSERT INTO '||TG_RELNAME||'_'||curMM||' SELECT $1.*' ;  
    EXECUTE strSQL USING NEW;  
  
    RETURN NULL;   
END  
$BODY$  
  LANGUAGE plpgsql;  