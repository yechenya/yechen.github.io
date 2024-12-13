

# MYSQL一些关键字用法：

## UNION

UNION 操作符用于合并两个或多个 SELECT 语句的结果集。它可以从多个表中选择数据，并将结果集组合成一个结果集。使用 UNION 时，每个 SELECT 语句必须具有相同数量的列，且对应列的数据类型必须相似。

**使用前确定两表的对应列**

UNION ALL不会去掉重复行信息





# 记录一下写的sql：

## 1.竖转横

T_T_STUDENT表为：name,course,score

```sql
方法一：
--用decode实现,
SELECT T.NAME,
       SUM(DECODE(T.Course, '语文', T.Score)) 语文,
       SUM(DECODE(T.Course, '数学', T.Score)) 数学,
       SUM(DECODE(T.Course, '英语', T.Score)) 英语
  FROM T_T_STUDENT T
GROUP BY T.NAME


方法二：
--用case  when 实现
SELECT T.NAME,
       SUM(CASE T.Course WHEN '语文' THEN T.Score ELSE 0 END) 语文,
       SUM(CASE T.Course WHEN '数学' THEN T.Score ELSE 0 END) 数学,
       SUM(CASE T.Course WHEN '英语' THEN T.Score ELSE 0 END) 英语
  FROM T_T_STUDENT T
GROUP BY T.NAME
```

查询选择不同的分数类型

```sql
SELECT tmp.KH_PERSON_CODE,k.ASSESSOR_NAME,k.CHECK_DUTIES,
	ROUND(MAX( CASE tmp.KH_TYPE WHEN "5" THEN tmp.score ELSE 0 END ),2) as score1,
	ROUND(MAX( CASE tmp.KH_TYPE WHEN "6" THEN tmp.score ELSE 0 END ),2) as score2,
	ROUND(MAX( CASE tmp.KH_TYPE WHEN "3" THEN tmp.score ELSE 0 END ),2) as score3,
	ROUND(MAX( CASE tmp.KH_TYPE WHEN "4" THEN tmp.score ELSE 0 END ),2) as score4,
	ROUND(IFNULL(SUM(
		CASE tmp.KH_TYPE WHEN "5" THEN tmp.score*0.35
		  WHEN "6" THEN tmp.score*0.35
		  WHEN "3" THEN tmp.score*0.1
		  WHEN "4" THEN tmp.score*0.2 ELSE 0 END
	),0),2) as sumScore
FROM(
	SELECT KH_PERSON_CODE,KH_TYPE,AVG(BASS_SCORE) as score
	FROM hr_staff_kh_zb zb
	LEFT JOIN hr_employee_kh kh ON zb.KH_PERSON_CODE=kh.HR_EMPLOYEE_KHCODE
	WHERE zb.IS_DEL='0' AND kh.IS_DEL='0' AND kh.WF_STATE = '-96'
	GROUP BY zb.KH_TYPE,zb.KH_PERSON_CODE
) tmp
LEFT JOIN hr_employee_kh k ON tmp.KH_PERSON_CODE=k.HR_EMPLOYEE_KHCODE
GROUP BY tmp.KH_PERSON_CODE,k.ASSESSOR_NAME,k.CHECK_DUTIES
ORDER BY sumScore DESC
```



有一张考试表，里面有考试编码、考试名称、考试及格、考试开始时间、考试结束时间；还有一张考试记录表，里面有考生人员编码和姓名还有得分。现在用sql要求查出指定时间范围的考试的考试多少人，不及格多少人，及格率百分比:

```sql
SELECT 
    e.PA_TS_ID,
    e.PA_TS_DE,
    COUNT(er.US_TS_US_ID) AS total_count,
    SUM(CASE WHEN er.US_TS_SC < e.PA_PS_MK THEN 1 ELSE 0 END) AS fail_count,
    ROUND(
        (SUM(CASE WHEN er.US_TS_SC >= e.PA_PS_MK THEN 1 ELSE 0 END) / COUNT(er.US_TS_US_ID)) * 100,
        2
    ) AS pass_rate_percentage
FROM tr_pa_ts e
JOIN lk_us_ts er ON e.PA_TS_ID = er.US_TS_TS_ID
WHERE DELETEFLAG = 0 AND PA_TS_FR >= '${startTime}' AND PA_TS_TO <= '${endTime}'
GROUP BY e.PA_TS_ID, e.PA_TS_DE;
```



## 2.筛选不同的年龄段

```sql
SELECT count(*) as count,
CASE tmp.age <>'' WHEN tmp.age>=0 and tmp.age<=25 THEN '25岁以下'
	 WHEN tmp.age>25 and tmp.age<=35 THEN '25-35岁'
	 WHEN tmp.age>35 and tmp.age<=45 THEN '35-45岁'
	 WHEN tmp.age>45 THEN '45岁以上'
END AS agenum
FROM (
SELECT
IF
	( su.BIRTHDAY IS NOT NULL, TIMESTAMPDIFF( YEAR, BIRTHDAY, CURDATE()), '' ) AS age 
FROM
	sys_user su
	INNER JOIN userinfosuppl uf ON su.USERNAME = uf.US_CODE 
WHERE
	su.org_code = 'YNYHPMD' 
	AND su.del_flag = '0' 
	AND uf.STATUS = '在职') tmp
GROUP BY agenum
```

## 3.日期相关

```sql
SELECT
	XINGMING,
	QINYUE,
	HETONGQXSJ 
FROM
	htmanage 
WHERE
	TIMESTAMPDIFF( MONTH, CURDATE(), HETONGQXSJ ) <= 2 AND TIMESTAMPDIFF( MONTH, CURDATE(), HETONGQXSJ ) >= 0 
	AND ( RENEWCONTRACTCODE IS NULL OR RENEWCONTRACTCODE = '' ) 
	AND IS_DEL = 0 
	AND SU_NAME = 'YNYHPMD'
```

年龄加日期

```sql
SELECT * FROM(
SELECT
	su.`NAME` as name,
CASE  WHEN su.US_SEX='1' THEN DATE_ADD(su.BIRTHDAY, INTERVAL 60 YEAR)
		  WHEN su.US_SEX='0' THEN DATE_ADD(su.BIRTHDAY, INTERVAL 55 YEAR)
			END AS date
FROM
	sys_user su
	INNER JOIN userinfosuppl uf ON su.USERNAME = uf.US_CODE 
WHERE
	su.org_code = 'YNYHPMD' 
	AND su.del_flag = '0' 
	AND uf.STATUS = '在职') tmp
WHERE TIMESTAMPDIFF( MONTH, CURDATE(), tmp.date ) <= 2 AND TIMESTAMPDIFF( MONTH, CURDATE(), tmp.date ) >= 0 
```

（1）某个数据库字段为yyyy-mm-dd改为年月日

```sql
IF
	( `CREATE_TIME`, CONCAT( YEAR ( `CREATE_TIME` ), '年', MONTH ( `CREATE_TIME` ), '月', DAY ( `CREATE_TIME` ), '日' ), '' ) AS CREATE_TIME
```

（2）某个数据库字段为yyyy-mm-dd hh:mm:ss改为年月日 时分秒

```sql
SELECT
    DATE_FORMAT(mr.YEAR, '%Y年') AS YEAR,
    CASE
        WHEN TICKETTYPE = 'A' THEN '领导班子'
        WHEN TICKETTYPE = 'B' THEN '中层干部'
        WHEN TICKETTYPE = 'C' THEN '职工代表'
        ELSE ''
    END AS role,
    CONCAT(TICKETTYPE, '票') AS TICKETTYPE,
    CONCAT('http://mmapp.b2bsun.com/yhppf/index.html?code=', MIDDLECADRESSCORECODE) AS MIDDLECADRESSCORECODE,
    mrv.title,
    IF(
        STARTTIME IS NOT NULL,
        DATE_FORMAT(STARTTIME, '%Y年%m月%d日 %H:%i:%s'),
        ''
    ) AS STARTTIME,
    IF(
        ENDTIME IS NOT NULL,
        DATE_FORMAT(ENDTIME, '%Y年%m月%d日 %H:%i:%s'),
        ''
    ) AS ENDTIME
FROM
    MIDDLECADRESSCORE mr
    LEFT JOIN MIDDLECADRESREVIEW mrv ON mrv.MIDDLECADRESREVIEWCODE = mr.MIDDLECADRESREVIEWCODE 
WHERE
    mr.IS_DEL = '0';
```



## 4.联表修改

mysql批量修改一个字段为另一个表的字段；这两个表通过身份证号实现一对一对应关系

```sql
UPDATE table_a AS a
JOIN table_b AS b ON a.id_card = b.id_card
SET a.field_A = b.field_B;

UPDATE wagemaintenancelist AS a
JOIN sys_user AS b ON a.USER_IDCHAR=b.VU_IDCARDS
SET a.USER_CODE = b.USERNAME;
```

mysql批量修改一个表中的字段(根据这张表的另一个字段)

```sql
UPDATE import_test_test
SET type = CASE tmp
                WHEN '公司领导' THEN 1
                WHEN '中层干部' THEN 2
				WHEN '后备干部' THEN 3
                WHEN '专业技术人员' THEN 4
				WHEN '工程技术人员' THEN 5
                WHEN '技能操作人员' THEN 6
				WHEN '行政党务人员' THEN 7
                WHEN '后勤服务人员' THEN 8
             END;
```

根据一个字段去修改另一个字段-字符拼接之后再修改值

```sql
UPDATE sys_dict_item
SET label = CONCAT(label, '(', value,'分)')
 WHERE dict_id = '263339'
```

联表插入：

```
INSERT INTO lu_us_title (US_TI_CODE, US_TI_DESCRIPTION, US_TI_COMPANY)
SELECT tmp, name , 'YNYHPMD'
FROM import_test_test_copy1;
```





## 5.字符串连接

CONCAT函数

CONCAT_WS函数和concat()一样，将多个字符串连接成一个字符串，但是可以一次性指定分隔符

CONCAT_WS函数在执行的时候,不会因为NULL值而返回NULL 

GROUP_CONCAT函数：将group by产生的同一个分组中的值连接起来，返回一个字符串结果。

```sql
SET GLOBAL group_concat_max_len = 1000000


SELECT GROUP_CONCAT(COLUMN_NAME SEPARATOR ', ')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'KPIEXAMINE'


SELECT GROUP_CONCAT(US_CODE SEPARATOR ', ')
 from userinfosuppl where `STATUS` = '在职' and WORKERNATURE = '合同工'
```





## 6.变量

现在有一些name字段的数据表，从上到下设置其对应的tmp字段为TL00256、TL00257等

```
SET @counter = 256;  -- 设置起始值

UPDATE your_table
JOIN (
    SELECT id, @counter := @counter + 1 AS tmp_value
    FROM your_table
    ORDER BY name  -- 按照 'name' 字段排序
) AS temp_table
ON your_table.id = temp_table.id
SET your_table.tmp = CONCAT('TL', LPAD(temp_table.tmp_value, 5, '0'));

```

解释：

1. **`SET @counter = 256;`**：初始化一个变量 `@counter`，设置递增的起始值。
2. **子查询部分**：`SELECT id, @counter := @counter + 1 AS tmp_value` 对 `your_table` 进行排序，并为每行生成一个递增的 `tmp_value`。
3. **`JOIN`**：将更新目标表（`your_table`）与生成递增值的子查询结果进行连接。
4. **`CONCAT('TL', LPAD(temp_table.tmp_value, 5, '0'))`**：格式化 `tmp` 字段的值为 `TL` 前缀加上5位数字（如 `TL00256`）。

```sql
SET @counter = 256;

UPDATE import_test_test
JOIN (
    SELECT @counter := @counter + 1 AS tmp_value, @row_num := @row_num + 1 AS row_num
    FROM import_test_test
    JOIN (SELECT @row_num := 0) AS init
    ORDER BY name
) AS temp_table
ON (
    SELECT name
    FROM import_test_test
    ORDER BY name
    LIMIT 1 OFFSET temp_table.row_num - 1
) = import_test_test.name
SET import_test_test.tmp = CONCAT('TL', LPAD(temp_table.tmp_value, 5, '0'));

```

解释：

1. **初始化变量**：`SET @counter = 256;` 和 `SET @row_num := 0;` 用于设置递增值和行号。
2. 子查询部分：
   - `@counter := @counter + 1 AS tmp_value`：生成递增的 `tmp_value`。
   - `@row_num := @row_num + 1 AS row_num`：生成行号。
   - `ORDER BY name`：按 `name` 排序。
3. **`JOIN`**：将 `your_table` 与生成递增值的子查询结果进行连接。
4. **`ON` 子句**：通过排序后的 `name` 值来匹配行。
5. **`SET`**：将 `tmp` 字段更新为 `TL` 前缀加上5位数字。

```sql
SET @counter = 925;
SET @row_num = 0;

UPDATE import_test
JOIN (
    SELECT id, @row_num := @row_num + 1 AS row_num
    FROM import_test
    ORDER BY id
) AS temp_table
ON import_test.id = temp_table.id
SET import_test.tmp = CONCAT('TL', LPAD(@counter := @counter + 1, 5, '0'));
```

更新表数据(开启事务)

```sql
START TRANSACTION;

INSERT INTO lu_us_title (US_TI_CODE, US_TI_DESCRIPTION, US_TI_COMPANY, status)
SELECT tmp, name, 'YNYHPMD', '4'
FROM import_test;

COMMIT;
```





## 7.窗口函数

有重复的值，我要怎么做把第二条的status 状态设置为 1，把一条的status 状态设置为null

```sql
-- 1.创建临时表
CREATE TEMPORARY TABLE RankedTitles AS
SELECT 
    US_TI_CODE, -- 这里假设表有一个唯一标识符字段 `id`
    US_TI_DESCRIPTION,
    status,
    ROW_NUMBER() OVER (PARTITION BY US_TI_DESCRIPTION ORDER BY US_TI_CODE) AS rn
FROM lu_us_title;

-- 2.更新表
UPDATE lu_us_title
JOIN RankedTitles ON lu_us_title.US_TI_CODE = RankedTitles.US_TI_CODE
SET lu_us_title.status = CASE
    WHEN RankedTitles.rn = 1 THEN NULL
    WHEN RankedTitles.rn = 2 THEN 1
    ELSE lu_us_title.status
END;

-- 3.删除临时表
DROP TEMPORARY TABLE RankedTitles;
```

解释

1. `PARTITION BY US_TI_DESCRIPTION`：这个子句指定了窗口函数的分区。`US_TI_DESCRIPTION`字段的值相同的记录将被分为一组。对于每一组，`ROW_NUMBER()`函数都会重新开始计数。
2. `ROW_NUMBER()`：这是一个窗口函数，用于为结果集中的每一行分配一个唯一的行号。行号从1开始，对于每一组（由`PARTITION BY`指定）都是独立的。
3. `OVER`：这是窗口函数的关键字，用于指定窗口函数的分区和排序规则。
4. 更新表lu_us_title：如果`rn`为1，则将`status`设置为`NULL`；如果`rn`为2，则将`status`设置为1。



第一步：设置第二条记录为1



## 8.ORDER BY按自定义顺序排序

ORDER BY + CASE组合使用

```sql
SELECT
  su.username,su.name,su.dept_code,uf.WORKERNATURE
FROM
  sys_user su
  LEFT JOIN userinfosuppl uf ON su.USERNAME = uf.US_CODE 
WHERE  su.del_flag = '0' 
  AND uf.STATUS = '在职'  ORDER BY  CASE uf.WORKERNATURE
    WHEN '合同工' THEN 1
    WHEN '劳务派遣' THEN 2
    WHEN '外包' THEN 3
    ELSE 4
  END,su.dept_code
```



## 9.排序(把null值放到后边)

```mysql
SELECT 
    main_table.id,
    main_table.name,
    sort_table.sort
FROM 
    main_table
LEFT JOIN 
    sort_table ON main_table.id = sort_table.main_table_id
ORDER BY 
    sort_table.sort IS NULL,   -- 将 NULL 排到最后
    sort_table.sort ASC;      -- 按 sort 字段递增排序

```

**`sort_table.sort IS NULL`**：这部分条件会返回一个布尔值（`TRUE` 或 `FALSE`）。

在 MySQL 中，`TRUE` 被认为是 `1`，而 `FALSE` 被认为是 `0`。所以，`IS NULL` 为 `TRUE`（即 `1`）的记录（`sort` 为 `NULL`）会排到排序的最后，因为 `1` 比 `0` 大。



## 10 .FIND_IN_SET和UNION

```mysql
( SELECT csi.id AS subject_id,csi.subject_name AS subject_name,COUNT( DISTINCT ca.id ) AS achievement_count
  FROM cross_subject_info csi
          LEFT JOIN cross_subject_info csi_child ON csi.id = csi_child.pid
          LEFT JOIN cross_achievements ca ON FIND_IN_SET( csi_child.id, ca.subject_ids ) > 0
  WHERE csi.pid IS NULL
  GROUP BY csi.id,csi.subject_name
) UNION
( SELECT csi.id AS subject_id,csi.subject_name AS subject_name,COUNT( ca.id ) AS achievement_count
    FROM cross_subject_info csi
            LEFT JOIN cross_achievements ca ON FIND_IN_SET( csi.id, ca.subject_ids ) > 0
    WHERE csi.pid IS NOT NULL
    GROUP BY csi.id,csi.subject_name
)
```



## 11.地点城市相关

sql下载链接

```
https://area.site/china
```

`address`表中

新增full_name字段以及level字段

```sql
WITH RECURSIVE address_path AS (
    -- 递归查询，从根地址开始
    SELECT id, parent_id, name, CAST(name AS CHAR) AS full_name
    FROM address
    WHERE parent_id = 0  -- 假设根地址的 parent_id 为 0

    UNION ALL

    -- 递归地将子级地址与父级地址的 full_name 拼接
    SELECT a.id, a.parent_id, a.name, CONCAT(ap.full_name, '-', a.name) AS full_name
    FROM address a
    JOIN address_path ap ON a.parent_id = ap.id
)
-- 更新表中的 full_name 字段
UPDATE address a
JOIN address_path ap ON a.id = ap.id
SET a.full_name = ap.full_name;


UPDATE address
SET level = CHAR_LENGTH(full_name) - CHAR_LENGTH(REPLACE(full_name, '-', ''))
WHERE full_name IS NOT NULL;
```

若不更新，则有：查找id = 442 的full_name

```sql
WITH RECURSIVE address_hierarchy AS (
  SELECT id, parent_id, name, CAST(name AS CHAR(255)) AS full_name
  FROM address
  WHERE id = 442 
  UNION ALL
  SELECT a.id, a.parent_id, a.name, CONCAT(a.name, '-',b.full_name ) AS full_name
  FROM address a
  INNER JOIN address_hierarchy b ON a.id = b.parent_id
)
SELECT full_name FROM address_hierarchy  ORDER BY id LIMIT 1;   
```







# MYSQL面试秘籍

## 索引：





索引：B+树





## 基础

""和NULL

- `NULL` 代表一个不确定的值,就算是两个 `NULL`,它俩也不一定相等。例如，`SELECT NULL=NULL`的结果为 false，但是在我们使用`DISTINCT`,`GROUP BY`,`ORDER BY`时,`NULL`又被认为是相等的。
- `''`的长度是 0，是不占用空间的，而`NULL` 是需要占用空间的。
- `NULL` 会影响聚合函数的结果。例如，`SUM`、`AVG`、`MIN`、`MAX` 等聚合函数会忽略 `NULL` 值。
- 如果参数是 `*`(`COUNT(*)`)，则会统计所有的记录数，包括 `NULL` 值；
- 如果参数是某个字段名(`COUNT(列名)`)，则会忽略 `NULL` 值，只统计非空值的个数。
- 查询 `NULL` 值时，必须使用 `IS NULL` 或 `IS NOT NULLl` 来判断，而不能使用 =、!=、 <、> 之类的比较运算符。而`''`是可以使用这些比较运算符的。

## 事务相关：

| 隔离级别                 | 脏读 | 不可重复读 | 幻读 |
| ------------------------ | ---- | ---------- | ---- |
| READ-UNCOMMITTED读未提交 | √    | √          | √    |
| READ-COMMITTED读已提交   | ×    | √          | √    |
| REPEATABLE-READ可重复读  | ×    | ×          | √    |
| SERIALIZABLE             | ×    | ×          | ×    |

并发事务带来的问题：**脏读、不可重复读、幻读、丢失修改**

1.为什么说innoDB解决了脏读、不可重复等并发问题，他是怎么解决的

```
InnoDB 通过多版本并发控制（MVCC）和不同的事务隔离级别来解决脏读、不可重复读和幻读等并发问题。下面是对这些问题的具体解释以及 InnoDB 的解决方式：

1. 脏读 (Dirty Read)-读未提交
定义：脏读发生在一个事务读取了另一个未提交事务修改的数据。
解决方案：在默认的隔离级别（可重复读）下，InnoDB 不允许脏读。它只允许读取已提交的数据版本。这是通过 MVCC 实现的，确保事务只能看到其开始时的快照数据。
2. 不可重复读 (Non-Repeatable Read)-读已提交
定义：不可重复读发生在同一事务中多次读取同一数据，但读取到的结果不同，因为其他事务已经提交了对该数据的修改。
解决方案：InnoDB 在可重复读隔离级别下使用 MVCC，确保在整个事务期间，读取的数据始终是事务开始时的快照，从而避免了不可重复读的问题。
3. 幻读 (Phantom Read)
定义：幻读发生在一个事务执行两次查询时，第二次查询返回了不同的结果集，因为其他事务插入或删除了符合查询条件的记录。
解决方案：InnoDB 通过范围锁（gap lock）来防止幻读。当一个事务在范围查询时，InnoDB 会锁定这个范围，确保其他事务无法在此范围内插入新记录，直到当前事务完成。
4. 丢失修改 (Lost Update)
定义：丢失修改发生在两个事务同时读取同一数据并进行更新，最后两个事务的结果会导致某一方的修改被覆盖。
解决方案：虽然 MVCC 有助于管理并发读取，但对于更新操作，InnoDB 的行级锁定机制可以防止丢失修改。如果一个事务正在修改某一行数据，其他事务必须等待该事务完成才能进行更新，从而避免冲突和数据丢失。

总结
InnoDB 通过 MVCC、事务隔离级别、行级锁和范围锁等机制，综合解决了脏读、不可重复读、幻读和丢失修改等并发问题，确保了高并发环境下的数据一致性和完整性。
```

2.按照隔离级别来说，可重复读 隔离级别下是不能解决 幻读问题的。为什么InnoDB可以?

```
但是！InnoDB 实现的 REPEATABLE-READ 隔离级别其实是可以解决幻读问题发生的，主要有下面两种情况：
快照读：由 MVCC 机制来保证不出现幻读。
当前读：使用 Next-Key Lock 进行加锁来保证不出现幻读，Next-Key Lock 是行锁（Record Lock）和间隙锁（Gap Lock）的结合，行锁只能锁住已经存在的行，为了避免插入新行，需要依赖间隙锁。
因为隔离级别越低，事务请求的锁越少，所以大部分数据库系统的隔离级别都是 READ-COMMITTED ，但是你要知道的是 InnoDB 存储引擎默认使用 REPEATABLE-READ 并不会有任何性能损失。


您说得对，在理论上，可重复读隔离级别确实无法完全解决幻读问题，而 InnoDB 通过一些额外的机制实现了对幻读的防护。以下是 InnoDB 如何在可重复读隔离级别下处理幻读的具体机制：

InnoDB 的解决方案
多版本并发控制 (MVCC)：

InnoDB 使用 MVCC 来提供每个事务的快照视图，使得读取数据时不会受到其他事务的影响。
这意味着在可重复读隔离级别下，事务 A 在开始时看到的数据快照在整个事务期间都是一致的。
范围锁 (Gap Lock)：

为了防止幻读，InnoDB 在执行范围查询时会使用范围锁。
当一个事务对某个范围进行查询时（例如 SELECT ... WHERE id BETWEEN x AND y），它不仅会锁定该范围内的记录，还会锁定该范围的间隙。
这意味着其他事务不能在这个范围内插入新记录，从而防止了幻读的发生。
意向锁 (Intent Locks)：

InnoDB 还使用意向锁来管理行锁和表锁之间的关系，确保多级锁定的一致性，避免因插入新记录而导致的幻读。
例子说明
假设事务 T1 执行以下查询：

sql
SELECT * FROM orders WHERE amount > 100;
如果此时没有其他事务插入符合条件的记录，T1 能够安全地读取到结果集。若此时事务 T2 尝试插入一个新的订单，T2 在执行插入时会被范围锁阻塞，直到 T1 提交或回滚，从而防止了幻读的发生。

总结
因此，虽然在理论上可重复读隔离级别可能无法解决幻读，但 InnoDB 的实现通过 MVCC 和范围锁等机制，能够有效防止幻读问题。这使得在实际应用中，InnoDB 对于并发事务的处理更为健壮。
```

3.InnoDB 能够在读取时确保只访问到事务已提交的数据版本。不太明白过程，如果另一个事务正在运行还未提交，那InnoDB是会读取失败，还是读取结果为空，还是阻塞一直到这个事务提交结果之后才运行这条查询的sql返回查询结果

```
InnoDB 通过多版本并发控制（MVCC）来确保在读取时只访问已提交的数据版本。具体来说，当一个事务在进行读取操作时，如果另一个事务正在修改数据但尚未提交，InnoDB 的处理方式如下：

1. 读取已提交的数据
当你执行查询时，InnoDB 会提供一个数据快照。这是基于当前事务开始时的状态。
如果你读取的数据正在被其他事务修改，但这些修改尚未提交，你将不会看到这些未提交的更改。
2. 读取结果
结果不会为空：即使另一个事务正在运行且未提交，你仍然可以读取到该数据的之前已提交的版本。
你的查询不会阻塞，除非你使用了特定的锁机制（例如 SELECT ... FOR UPDATE），这会导致当前事务等待直到其他事务完成。
3. 事务隔离级别
在默认的 可重复读 隔离级别下，InnoDB 利用 MVCC 机制，确保你所查询的数据是你事务开始时的快照版本。
这意味着，即使其他事务对数据进行了修改，只要这些修改未提交，你就无法看到它们。
4. 阻塞与锁
如果你执行的查询需要对数据进行写入（如更新、删除），则会涉及锁的机制。在这种情况下，如果另一个事务持有锁，当前事务会被阻塞，直到那个事务提交或回滚。
总结
InnoDB 设计的目标是确保查询操作能够高效地读取到一致的数据，而不需要等待其他事务的提交。通过 MVCC 和快照机制，InnoDB 能够在高并发环境下提供良好的性能和数据一致性。
```

4.当事务在执行范围查询时，InnoDB 会锁定该范围，确保没有其他事务可以在这个范围内插入新记录。这个其他事务是会执行失败，还是会等待事务完成后再执行？

```
当一个事务在 InnoDB 中执行范围查询时，涉及的锁定机制如下：

1. 范围锁（Gap Lock）
当一个事务执行范围查询，例如 SELECT ... WHERE column BETWEEN value1 AND value2，InnoDB 会在这个范围内施加间隙锁（gap lock）。
这意味着其他事务在这个范围内无法插入新的记录，以防止幻读。
2. 其他事务的行为
等待：如果另一个事务尝试在已被锁定的范围内插入新记录，该事务会被阻塞，直到持有该锁的事务提交或回滚。
不会执行失败：其他事务不会因为范围锁而执行失败，而是会处于等待状态，直到可以获得所需的锁资源。
3. 锁的粒度
锁的粒度确保数据的一致性，同时允许其他事务在没有冲突的情况下进行操作。例如，其他事务仍然可以读取和修改不在锁定范围内的数据。

总结
在 InnoDB 中，当一个事务对某个范围施加锁定时，其他事务在该范围内的插入操作会被阻塞，直到事务完成。这种机制有效地避免了幻读现象，同时保证了数据的一致性。
```

## 多版本并发控制 **MVCC**：

### 前置知识

1.读操作：快照读-遵信[**一致性非锁定读**]（如果读取的行正在执行 `DELETE` 或 `UPDATE` 操作，这时读取操作不会去等待行上锁的释放。相反地，`InnoDB` 存储引擎会去读取行的一个快照数据，对于这种读取历史数据的方式，我们叫它快照读 (snapshot read)）

2.写操作：添加版本号和修改新的数据（之后会进行回收版本号），同时原始数据（快照读）仍然存在

**锁定读（Locking Reads）**读取的是数据的最新版本，这种读也被称为 `当前读（current read）`

- `select ... lock in share mode`：对记录加 `S` 锁，其它事务也可以加`S`锁，如果加 `x` 锁则会被阻塞
- `select ... for update`、`insert`、`update`、`delete`：对记录加 `X` 锁，且其它事务不能加任何锁



`MVCC` 的实现依赖于：**隐藏字段、Read View、undo log**。在内部实现中，`InnoDB` 通过数据行的 `DB_TRX_ID` 和 `Read View` 来判断数据的可见性，如不可见，则通过数据行的 `DB_ROLL_PTR` 找到 `undo log` 中的历史版本。每个事务读到的数据版本可能是不一样的，在同一个事务中，用户只能看到该事务创建 `Read View` 之前已经提交的修改和该事务本身做的修改

**隐藏字段**

- `DB_TRX_ID（6字节）`：表示最后一次插入或更新该行的事务 id。此外，`delete` 操作在内部被视为更新，只不过会在记录头 `Record header` 中的 `deleted_flag` 字段将其标记为已删除
- `DB_ROLL_PTR（7字节）` 回滚指针，指向该行的 `undo log` 。如果该行未被更新，则为空
- `DB_ROW_ID（6字节）`：如果没有设置主键且该表没有唯一非空索引时，`InnoDB` 会使用该 id 来生成聚簇索引

**Read View**

主要是用来做可见性判断，里面保存了 “当前对本事务不可见的其他活跃事务”

- `m_low_limit_id`：目前出现过的最大的事务 ID+1，即下一个将被分配的事务 ID。大于等于这个 ID 的数据版本均不可见
- `m_up_limit_id`：活跃事务列表 `m_ids` 中最小的事务 ID，如果 `m_ids` 为空，则 `m_up_limit_id` 为 `m_low_limit_id`。小于这个 ID 的数据版本均可见
- `m_ids`：`Read View` 创建时其他未提交的活跃事务 ID 列表。创建 `Read View`时，将当前未提交事务 ID 记录下来，后续即使它们修改了记录行的值，对于当前事务也是不可见的。`m_ids` 不包括当前事务自己和已提交的事务（正在内存中）
- `m_creator_trx_id`：创建该 `Read View` 的事务 

**undo-log**

`undo log` 主要有两个作用：

- 当事务回滚时用于将数据恢复到修改前的样子
- 另一个作用是 `MVCC` ，当读取记录时，若该记录被其他事务占用或当前版本对该事务不可见，则可以通过 `undo log` 读取之前的版本数据，以此实现非锁定读

**在 `InnoDB` 存储引擎中 `undo log` 分为两种：`insert undo log` 和 `update undo log`：**

1. **`insert undo log`**：指在 `insert` 操作中产生的 `undo log`。因为 `insert` 操作的记录只对事务本身可见，对其他事务不可见，故该 `undo log` 可以在事务提交后直接删除。不需要进行 `purge` 操作

2. **`update undo log`**：`update` 或 `delete` 操作中产生的 `undo log`。该 `undo log`可能需要提供 `MVCC` 机制，因此不能在事务提交时就进行删除。提交时放入 `undo log` 链表，等待 `purge线程` 进行最后的删除

   

不同事务或者相同事务的对同一记录行的修改，会使该记录行的 `undo log` 成为一条链表，链首就是最新的记录，链尾就是最早的旧记录。



在事务隔离级别 `RC` 和 `RR` （InnoDB 存储引擎的默认事务隔离级别）下，`InnoDB` 存储引擎使用 `MVCC`（非锁定一致性读），但它们生成 `Read View` 的时机却不同

- 在 RC（读已提交） 隔离级别下的 **`每次select`** 查询前都生成一个`Read View` (m_ids 列表)
- 在 RR （可重复读）隔离级别下只在事务开始后 **`第一次select`** 数据前生成一个`Read View`（m_ids 列表）



### MVCC的流程

```
1.如果记录 DB_TRX_ID < m_up_limit_id，那么表明最新修改该行的事务（DB_TRX_ID）在当前事务创建快照之前就提交了，所以该记录行的值对当前事务是可见的 
2.如果 DB_TRX_ID >= m_low_limit_id，那么表明最新修改该行的事务（DB_TRX_ID）在当前事务创建快照之后才修改该行，所以该记录行的值对当前事务不可见。跳到步骤 5 
3.m_ids 为空，则表明在当前事务创建快照之前，修改该行的事务就已经提交了，所以该记录行的值对当前事务是可见的
4.如果 m_up_limit_id <= DB_TRX_ID < m_low_limit_id，表明最新修改该行的事务（DB_TRX_ID）在当前事务创建快照的时候可能处于“活动状态”或者“已提交状态”；所以就要对活跃事务列表 m_ids 进行查找（源码中是用的二分查找，因为是有序的） 
	如果在活跃事务列表 m_ids 中能找到 DB_TRX_ID，表明：① 在当前事务创建快照前，该记录行的值被事务 ID 为 DB_TRX_ID 的事务修改了，但没有提交；或者② 在当前事务创建快照后，该记录行的值被事务 ID 为 DB_TRX_ID 的事务修改了。这些情况下，这个记录行的值对当前事务都是不可见的。跳到步骤 5 
	在活跃事务列表中找不到，则表明“id 为 trx_id 的事务”在修改“该记录行的值”后，在“当前事务”创建快照前就已经提交了，所以记录行对当前事务可见 
5.在该记录行的 DB_ROLL_PTR 指针所指向的 undo log 取出快照记录，用快照记录的 DB_TRX_ID 跳到步骤 1 重新开始判断，直到找到满足的快照版本或返回空
```

### 解决幻读：

`InnoDB`存储引擎在 RR 级别下通过 `MVCC`和 `Next-key Lock` 来解决幻读问题：

**1、执行普通 `select`，此时会以 `MVCC` 快照读的方式读取数据**

在快照读的情况下，RR 隔离级别只会在事务开启后的第一次查询生成 `Read View` ，并使用至事务提交。所以在生成 `Read View` 之后其它事务所做的更新、插入记录版本对当前事务并不可见，实现了可重复读和防止快照读下的 “幻读”

**2、执行 select...for update/lock in share mode、insert、update、delete 等当前读**

在当前读下，读取的都是最新的数据，如果其它事务有插入新的记录，并且刚好在当前事务查询范围内，就会产生幻读！`InnoDB` 使用 [Next-key Lock](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html#innodb-next-key-locks) 来防止这种情况。当执行当前读时，会锁定读取到的记录的同时，锁定它们的间隙，防止其它事务在查询范围内插入数据。只要我不让你插入，就不会发生幻读





## 三大日志：

### **redo log**（重做日志）

**让 InnoDB 存储引擎拥有了崩溃恢复能力。**

物理日志，记录到重做日志缓存（`redo log buffer`）里，接着刷盘到 redo log 文件里。

**刷盘时机**：事务提交、buffer缓冲区满了、事务日志缓冲区满了、Checkpoint（检查点）、后台刷新线程、正常关闭服务器

**刷盘策略**  `innodb_flush_log_at_trx_commit`：0、1（默认，每次事务提交刷盘）、2（写入 `page cache`（文件系统缓存））

InnoDB 存储引擎有一个后台线程，每隔`1` 秒，就会把 `redo log buffer` 中的内容写到文件系统缓存（`page cache`），然后调用 `fsync` 刷盘。

写入 redo log，一行记录可能就占几十 `Byte`，只包含表空间号、数据页号、磁盘文件偏移
 量、更新值，再加上是顺序写，所以刷盘速度很快。

所以用 redo log 形式记录修改内容，性能会远远超过刷数据页的方式，这也让数据库的并发能力更强





### **binlog**（归档日志）

**保证了 MySQL 集群架构的数据一致性。**

逻辑日志

update_time=now()

三种格式 `binlog_format`：statement(记录原始)、row(更换为具体字段值)、mixed(会进行判断符合那种方式)

binlog 的写入时机也非常简单，事务执行过程中，先把日志写到`binlog cache`，事务提交的时候，再把`binlog cache`写到 binlog 文件中。

因为一个事务的 binlog 不能被拆开，无论这个事务多大，也要确保一次性写入，所以系统会给每个线程分配一个块内存作为`binlog cache`。

我们可以通过`binlog_cache_size`参数控制单个线程 binlog cache 大小，如果存储内容超过了这个参数，就要暂存到磁盘（`Swap`）。



write是指把日志写入到文件系统的 page cache，并没有把数据持久化到磁盘，所以速度比较快

fsync是将数据持久化到磁盘的操作

`write`和`fsync`的时机，可以由参数`sync_binlog`控制，默认是`1`。

为`0`的时候，表示每次提交事务都只`write`，由系统自行判断什么时候执行`fsync`

**两阶段提交**

 redo log 的写入拆成了两个步骤`prepare`和`commit`，

开始事务 -> 更新数据 -> 写入redo log（prepare阶段） -> 提交事务（写入binlog、redo log的commit阶段）

1.使用**两阶段提交**后，写入 binlog 时发生异常也不会有影响，因为 MySQL 根据 redo log 日志恢复数据时，发现 redo log 还处于`prepare`阶段，并且没有对应 binlog 日志，就会回滚该事务



2.redo log 设置`commit`阶段发生异常,并不会回滚事务，它会执行上图框住的逻辑，虽然 redo log 是处于`prepare`阶段，但是能通过事务`id`找到对应的 binlog 日志，所以 MySQL 认为是完整的，就会提交事务恢复数据。



### **undo log**（回滚日志）

每一个事务对数据的修改都会被记录到 undo log ，当执行事务过程中出现错误或者需要执行回滚操作的话，MySQL 可以利用 undo log 将数据恢复到事务开始之前的状态。

逻辑日志，记录sql语句。

INSERT 操作，在事务提交之后就可以清除掉了；UPDATE/DELETE 操作在事务提交不会立即删除，会加入 history list，由后台线程 purge 进行清理。

同时，undo log 的信息也会被记录到 redo log 中，因为 undo log 也要实现持久性保护。并且，undo-log 本身是会被删除清理的，例如 undo log 是采用 segment（段）的方式来记录的，每个 undo 操作在记录的时候占用一个 undo log segment（undo 日志段），undo log segment 包含在 rollback segment（回滚段）中。事务开始时，需要为其分配一个 rollback segment。每个 rollback segment 有 1024 个 undo log segment，这有助于管理多个并发事务的回滚需求。 通常情况下， rollback segment header（通常在回滚段的第一个页）负责管理 rollback segment。rollback segment header 是 rollback segment 的一部分，通常在回滚段的第一个页。history list 是 rollback segment header 的一部分，它的主要作用是记录所有已经提交但还没有被清理（purge）的事务的 undo log。这个列表使得 purge 线程能够找到并清理那些不再需要的 undo log 记录。



- 



## 慢SQL查询：

### 4.15 （JOIN）联表查询有哪些注意事项和优化措施？

答：在MySQL中进行联表查询时，为了确保查询的效率和准确性，需要注意以下几点并采取相应的优化措施：
注意事项：
1.选择正确的连接类型：根据你的数据需求选择合适的连接类型(INNER JOIN、LEFT JOIN、RIGHT JOIN等)。错误的连接类型不仅可能导致查询结果不正确，还可能影响性能。
2.使用索引：确保参与连接条件的列上有索引。没有索引的连接操作可能导致全表扫描，极大地降低查询效率。
3.避免使用SELECT*:避免在联表查询中使用SELECT *尽量只选择需要的列，这样可以减少数据传输量和减轻数据库的负担。
4.小心NULL值：在连接条件中涉及到可能为NULL的列时要小心，因为NULL值在比较中的行为可能会导致预期之外的结果。
5.减少数据集大小：如果可能，通过在WHERE子句中添加筛选条件来减少参与连接的数据集大小，从而提高查询效率。
优化措施：
1.合理设计索引：在经常用作连接条件的列上创建索引。考虑使用复合索引，如果WHERE子句或连接条件中经常同时使用多个列。
2.使用EXPLAIN分析查询：使用EXPLAIN命令来分析查询的执行计划，检查是否利用了索引以及如何优化查询。
3.调整ON顺序：在某些情况下，改变ON的顺序可以提高查询效率。尽量先处理数据量小的表或结果集，这样可以减少后续操作的数据量。MySQL通常能够自动优化ON的顺序，但在复杂查询中手动调整仍然有可能带来性能改进。
4.优化查询逻辑：尝试重写查询逻辑，有时候将一个复杂的联表查询分解成多个简单查询再在应用层面合并结果，可能会更有效率。
5.使用临时表：对于特别复杂的联表查询，可以考虑将中间结果存储在临时表中，然后在临时表上进行进一步的操作。这可以减少重复计算和不必要的数据扫描。
6.限制结果集：使用LIMIT语句限制结果集的大小，尤其是在只需要查询部分数据时。但要注意，如果使用LIMIT而不指定ORDER BY,返回的结果可能是不确定的。

### 4.16 如何分析一条SQL语句的执行计划和性能？

答：
1.使用EXPLAIN命令（需要自己实践）
在MySQL中，可以通过在SQL语句前加上EXPLAIN关键字来获取其执行计划。这将返回一张表，列出了执行查询的各个阶段和相关的性能信息，如下面几个关键字段：
id:查询的标识符，如果查询包含多个部分，每个部分都会有不同的id。
select type:查询的类型，比如简单查询(SIMPLE)、联接查询UOIN)等。
table:显示这一行的数据是关于哪个表的。
type:显示了连接类型，常见的有ALL(全表扫描)、index(索引全扫描)、range(索引范围扫描)等。
possible keys:显示可能应用于这张表的索引。
key:实际使用的索l。
key len:使用的索l的长度。
ref:显示索引的哪一列被使用了。
rows:估计要检查的行数。
Extra:包含不适合在其他列中显示但非常重要的额外信息，如是否使用了索引。
2.分析执行计划
了解每个阶段的作用和相关的成本，特别是以下几点：
索引使用情况：确认查询是否有效利用了索引。如果没有使用索引，或者使用的索引不是最优选择，可能需要添加或调整索引。
连接类型：ALL或index这样的连接类型通常意味着需要优化，因为它们分别表示全表扫描和索引全扫描。
估计的行数：估计的行数可以给你一个大概的效率指标。数字越大，执行查询所需的时间可能越长。
3.优化查询
基于执行计划的分析结果，你可能需要进行一些优化，比如：
添加或调整索引：确保查询中的条件列被索引，或者考虑复合索引以优化多列的查询条件。
调整查询结构：有时候，重写查询语句或者调整ON的顺序可以提高查询效率。
使用分析函数：对于复杂的数据处理，合理使用分析函数可能比多次执行子查询更高效。

### 4.17 SQL优化手段有哪些？

答：1.使用索引：合理创建和使用索引可以大大提高查询效率，尤其是对于频繁查询的列。
2.避免全表扫描：尽量避免编写会触发全表扫描的SQL语句，改用条件查询。
3.查询条件优化使用有效的条件表达式，比如避免在索列上使用函数操作。
4.选择合适的数据类型：选择最适合数据的类型可以减少存诸空间，提高查询效率。
5.使用连接(JON)代替子查询：在一些情况下，连接查询比子查询效率更高。
6.优化查询投影：只查询需要的列，避免使用SELECT *
7.限制结果集大小：使用LMTT语句限制返回的结果数量，尤其是在只需要部分数据的情况下。
8.SQL语句重写：通过重写SQL语句，比如利用联合(UNION)替代多个OR条件，来优化查询。
9.使用批处理：对于大量的插入、更新操作，使用批收处理可以减少对数据库的总体压力。
10.避免锁竞争：尽量减少长事务，合理设计事务的大小和持续时间，减少锁的竞争。

### 4.18 有哪些常见的MySQL查询优化方式？（SQL优化思路）

答：1.使用索引优化查询
创建有效的索引：对经常用于查询条件、JOIN操作的列创建索引，可以大幅度提高查询速度。
合理使用复合索引：当查询条件包含多个列时，复合索引（多列索引)通常比多个单列索引更有效。
避免使用索引的操作：避免在索引列上使用函数或表达式，这会导致索引失效。
2.优化查询语句
避免SELECT*:只选择需要的列，而不是使用SELECT*,减少数据传输量。
使用EXPLAIN分析查询：通过EXPLAIN命令分析查询，了解其执行计划和是否有效使用索引。
减少JON的使用：尽量减少ON操作，特别是在大表上。如果必须使用ON,确保ON的列上有索引。
优化子查询：将子查询优化为ON操作，或者使用临时表，以提高效率。
3.查询条件优化
使用有效的条件表达式：尽量使用索引列做条件判断，并且避免在索引列上使用不等式操作(如<>或！=)，这样可以更有效地利用索引。
利用范围条件：对于范围查询，确保使用有效的索范围。
4.优化表的结构和数据类型
选择合适的数据类型：使用最合适的数据类型可以减少存诸空间和提高查询效率。
使用分区分表：对于非常大的表，考虑使用分区来提高查询性能。
5.其他优化技巧
限制查询结果的数量：使用LM虹T语句限制返回的数据量，特别是在只需要部分数据的情况下。
使用缓存优化：利用MySQL的查询缓存，对于经常执行且结果集不经常改变的查询，可以通过缓存来提高性能。
定期维护数据库：通过定期运行OPTIMIZE、TABLE来整理表的存储和索引结构，以及使用ANALYZE TABLE更新表的统计信息，从而优化杳询性能。
6.减少锁竞争
优化事务：保持事务尽可能短，减少锁定资源的时间，避免不必要的锁竞争。
7.避免全表扫描
使用条件过滤：尽量在WHERE子句中使用索引列，避免全表扫描。

### 4.19 什么是慢查询？如何定义慢查询？慢查询日志？分析慢查询日志？优化慢查询？

答：在MySQL中，慢查询是指执行时间超过某个特定阈值的SQL查询。这个阈值可以根据具体情况进行设置。慢查询通常表明这些查询可能需要优化，因为它们可能会占用过多的CPU资源、内存或/IO，从而影响数据库的整体性能和其他查询的响应时间。
MySQL提供了一个系统变量long_query_time来定义什么样的查询可以被认为是慢查询。默认情况下，这个值可能设置为10秒。
MySQL提供了慢查询日志（slow query log)功能，用来记录那些执行时间超过long_query_.time阈值的查询。通过分析慢查询日志，可以识别出数据库中性能瓶颈，从而对这些低效的查询进行优化。慢查询日志可以记录查询的执行时间、锁定时间、返回的行数和扫描的行数等信息，这些信息对于诊断性能问题非常有用。
慢查询日志默认是禁用的，可以通过修改MySQL的my.ini配置文件或在运行时设置系统变量来启用。
慢查询日志的分析可以帮助识别出需要优化的查询。MySQL提供了一个名为mysql dumpslow的工具，用于对慢查询日志进行汇总和分析。
识别出慢查询后，可以采取以下措施进行优化：
优化查询语句：通过重写查询或使用更有效的查询方法来减少执行时间。
使用索引：确保查询中的关键列上有适当的索引。
调整MySQL配置：调整相关的MySQL配置参数，如缓冲区大小，以提高性能。
硬件升级：如果硬件资源是瓶颈，考虑升级CPU、内存或存储设备。

### 4.20 如何避免慢查询？

答：避免MySQL中的慢查询主要涉及对查询本身、数据库设计、以及服务器配置的优化。
1.优化查询语句
使用索引：确保查询中的关键列都有适当的索引。这包括WHERE子句中的列、JON操作的列，以及ORDER BY和GROUP BY子句中的列。
避免全表扫描：尽量避免编写会触发全表扫描的查询语句。使用EXPLAIN来检查查询计划确保查询利用了索引。
减少数据检索量：尽可能地只检索需要的数据。使用SELECT具体字段而非SELECT*,并利用LIMIT来限制返回的数据量。
2.合理设计数据库
适当的数据类型：为每个字段选择合适的数据类型，既可以节省存储空间，也可以提升查询效率。
归一化与反归一化：通过归一化减少数据冗余，提高数据一致性；通过反归一化减少表连接，提升查询性能。平衡这两者的关系，根据实际需求做出选择。
使用分区：对大表使用分区技术，可以提高查询性能，因为查询可以限定在特定的一个或几个分区内，减少数据扫描量。
3.利用高级特性
索引优化：了解并使用各种索引类型，如全文索引、空间索引等，以及MySQL8.0引入的功能如窗口函数，可以提高特定查询的效率。
查询缓存：虽然MySQL8.0已经废弃了查询缓存，但是对于早期版本，合理利用查询缓存可以提高查询效率。对于MySQL8.0及以后版本，可以考虑使用代理层缓存或应用层缓存策略。
4.监控和分析
慢查询日志：启用慢查询日志，定期检查并分析慢查询，伐出并优化那些执行效率低的查询。
性能分析工具：使用性能分析工具，如MySQLVorkbench、Percona Toolkit等，帮助识别和优化慢查询。
5.服务器配置优化
优化配置参数：根据服务器的硬件资源和数据库的负载特点，调整MySQL的配置参数，如缓冲池大小、线程缓存大小等，以提升整体性能。
硬件优化：在必要时，通过升级硬件（如增加内存、使用更快的存储设备等)来提高数据库服务器的处理能力。

### 4.21 如何优化慢SQL？

答：以下将分为8个方向进行回答。
1.分析查询执行计划
使用如ySQL的EXPLAIN命令来分析SQL查询的执行计划。这可以帮助你理解ySQL如何执行你的查询，包括它是如何使用索引的，以及哪些操作是最耗时的。
2.使用索引
添加适当的索引：确保你的查询所涉及的所有列都正确索引。特别是在WHERE子句、JOIN条件、ORDER BY和GROUP BY子句中使用的列。
避免过度索引：虽然索引可以加快查询速度，但它们也会减慢数据写入操作并占用额外的磁盘空间。评估并测试以找到最佳平衡。
3.优化查询结构
简化查询：避免不必要的复杂子查询，考虑是否可以重写查询以使其更有效率。减少返回的数据量：使用LIMIT语句来减少查询结果的数量，特别是在只需要部分数据的情况下。
避免SELECT *:指定只需要的列，而不是使用SELECT*,以减少处理的数据量。
4.优化表结构
数据类型优化：确保使用最有效的数据类型，避免不必要的大型数据类型，这可以减少磁盘IO负担，加快查询速度。
分区表：对于非常大的表，考虑使用分区来提高查询效率。
5.使用查询缓存
虽然MySQL8.0已移除查询缓存，但在某些日版本中，如果适用，利用查询缓存可以显著提高性能。
6.服务器和硬件优化
内存增加：增加服务器内存可以提高缓存效率，减少磁盘IO。
使用SSD:相比于传统硬盘，固态硬盘(SSD)可以提供更快的数据访问速度。
7.定期维护
定期更新统计信息：确保数据库能够准确地评估查询计划。
定期优化表：使用OPTIMIZE TABLE命令来重新组织表并回收未使用的空间。
8.应用级优化
缓存应用层数据：考虑在应用层缓存常见查询的结果，以减少数据库负担。
批量操作：对于需要大量INSERT或UPDATE的操作，考虑合并这些操作以减少数据库负载。





# Redis面试秘籍：

SortedSet底层是基于**HashTable**来实现的。

ZSet 有两种不同的实现：ziplist 和 skiplist，在Redis7.0版本以后，`ZipList`又被替换为**Listpack**（紧凑列表）。

- 当有序集合对象同时满足以下两个条件时，使用 ziplist： 
  1. ZSet 保存的键值对数量少于 128 个；
  2. 每个元素的长度小于 64 字节。
- 如果不满足上述两个条件，那么使用 skiplist 。

## 跳表：

插入新数据时，获取高度随机值（1为50%、2为25%、3为12.5% ...）满足logN

先由maxOfMinArr[]数组指向不大于插入值的最大值

再由forwards[]数组（用于记录原始链表节点的后继节点和多级索引的后继节点指向。）

更新插入新节点newNode







**VS 平衡二叉树、红黑树** 

**VS B+树** 

插入时可能会导致数据重新分布、重建树结构

所以，B+树更适合作为数据库和文件系统中常用的索引结构之一，它的核心思想是通过可能少的 IO 定位到尽可能多的索引来获得查询数据。对于 Redis 这种内存数据库来说，它对这些并不感冒，因为 Redis 作为内存数据库它不可能存储大量的数据，所以对于索引不需要通过 B+树这种方式进行维护，只需按照概率进行随机维护即可，节约内存。而且使用跳表实现 zset 时相较前者来说更简单一些，在进行插入时只需通过索引将数据插入到链表中合适的位置再随机维护一定高度的索引即可，也不需要像 B+树那样插入时发现失衡时还需要对节点分裂与合并。





## 持久化：

RDB和AOF、混合模式



RDB：创建快照来获得存储在内存里面的数据在 **某个时间点** 上的副本

save（同步），bgsave（异步，交给子线程）两种模式

1、是经过压缩的二进制文件，文件小，适合数据备份

2、直接还原数据即可，不需要一行一行的执行命令，恢复大数据集的时候，RDB 速度更快。

3、数据安全性和实时性低；BGSAVE 子进程写入 RDB 文件的工作不会阻塞主线程，但会对机器的 CPU 资源和内存资源产生影响



AOF的实时性更好

**执行顺序**：命令追加 -> append -> aof缓冲区 -> write -> 系统内核缓冲区 -> fsync -> 磁盘

 **`fsync`策略** AOF持久化策略

1. `appendfsync always`：主线程调用 `write` 执行写操作后，后台线程（ `aof_fsync` 线程）立即会调用 `fsync` 函数同步 AOF 文件（刷盘），`fsync` 完成后线程返回，这样会严重降低 Redis 的性能（`write` + `fsync`）。
2. `appendfsync everysec`：主线程调用 `write` 执行写操作后立即返回，由后台线程（ `aof_fsync` 线程）每秒钟调用 `fsync` 函数（系统调用）同步一次 AOF 文件（`write`+`fsync`，`fsync`间隔为 1 秒）
3. `appendfsync no`：主线程调用 `write` 执行写操作后立即返回，让操作系统决定何时进行同步，Linux 下一般为 30 秒一次（`write`但不`fsync`，`fsync` 的时机由操作系统决定）

Redis 7.0.0之后使用了 **Multi Part AOF** 机制：拆分为多个AOF文件

**执行完命令之后后记录日志**（不堵塞命令执行、AOF记录日志不会检查语法）

**AOF重写**：当 AOF 变得太大时，Redis 能够在后台自动重写 AOF。新的 AOF 文件和原有的 AOF 文件所保存的数据库状态一样，但体积更小

1、AOF类似与MYSQL的binlog日志，存储的是每一次写命令

2、易于理解和解析

3、支持秒级数据丢失，取决fsync策略，仅需要追加命令到AOF文件



## 主从

写操作在master节点 读操作分配到salve节点



**主从同步**

1. salve节点请求增量同步
2. master节点判断replid，发现不一致，拒绝增量同步，请求全量同步。
3. master节点备份RDB文件并发送RDB文件到salve节点
4. salve节点清空本地数据，加载master传输的RDB文件
5. master节点将RDB期间执行的命令记录存储到repl_backlog，并持续将log中的命令发送到slave，slave保持同步

增量同步：slave提交自己的offset到master，master获取repl_baklog中从offset之后的命令给slave

什么时候执行全量同步？

- slave节点第一次连接master节点时
- slave节点断开时间太久，repl_baklog中的offset已经被覆盖时

什么时候执行增量同步？

- slave节点断开又恢复，并且在`repl_baklog`中能找到offset时



## 哨兵原理

- **状态监控**：`Sentinel` 会不断检查您的`master`和`slave`是否按预期工作

怎么检测？心跳检测：每隔1秒向集群的每个节点发送ping命令（主观下线和客观下线）

- **故障恢复（failover）**：如果`master`故障，`Sentinel`会将一个`slave`提升为`master`。当故障实例恢复后会成为`slave`

选举新的master节点：

1. 首先会判断slave节点与master节点断开时间长短，如果超过`down-after-milliseconds * 10`则会排除该slave节点
2. 然后判断slave节点的`slave-priority`值，越小优先级越高，如果是0则永不参与选举（默认都是1）。
3. 如果`slave-prority`一样，则判断slave节点的`offset`值，越大说明数据越新，优先级越高
4. 最后是判断slave节点的`run_id`大小，越小优先级越高（`通过info server可以查看run_id`）

接下来，多个sentinel中选举一个leader ，由leader执行failover

第一个确认master客观下线的人会立刻发起投票，一定会成为leader。

- **状态通知**：`Sentinel`充当`Redis`客户端的服务发现来源，当集群发生`failover`时，会将最新集群信息推送给`Redis`的客户端



分片集群：分片策略：利用散列插槽（hash slot）的方式实现数据分片



## **内存过期和内存淘汰**

**判断是否过期**

在Redis中会有两个Dict，也就是HashTable，其中一个记录KEY-VALUE键值对，另一个记录KEY和过期时间。要判断一个KEY是否过期，只需要到记录过期时间的Dict中根据KEY查询即可。



**过期策略** 通过expire  惰性删除 、周期删除 

执行时间是否上限？（执行清理<执行周期的25%） 抽样看过期key的比例，如果大于10%，再次进行一次抽样

- **SLOW模式：**Redis会设置一个定时任务`serverCron()`，按照`server.hz`的频率来执行过期key清理
- **FAST模式：**Redis的每个事件循环前执行过期key清理（事件循环就是NIO事件处理的循环）。

**淘汰策略**

- **SLOW模式：**Redis会设置一个定时任务`serverCron()`，按照`server.hz`的频率来执行过期key清理
- **FAST模式：**Redis的每个事件循环前执行过期key清理（事件循环就是NIO事件处理的循环）。



Redis采取的是**抽样法**，即每次抽样一定数量（`maxmemory_smples`）的key，然后基于内存策略做排序，找出淘汰优先级最高的，删除这个key。这就导致Redis的算法并不是真正的**LRU**，而是一种基于抽样的**近似LRU算法**。



