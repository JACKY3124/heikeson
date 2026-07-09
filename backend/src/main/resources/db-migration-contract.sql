-- 契约兼容字段迁移脚本
-- 为 competitions 表添加契约新字段
ALTER TABLE competitions ADD COLUMN start_time DATETIME COMMENT '比赛开始时间(契约)';
ALTER TABLE competitions ADD COLUMN end_time DATETIME COMMENT '比赛结束时间(契约)';
ALTER TABLE competitions ADD COLUMN min_team_size INT DEFAULT 1 COMMENT '最小团队人数';
ALTER TABLE competitions ADD COLUMN max_team_size INT DEFAULT 5 COMMENT '最大团队人数';
ALTER TABLE competitions ADD COLUMN max_participants INT DEFAULT 500 COMMENT '最大参赛人数';
ALTER TABLE competitions ADD COLUMN is_virtual TINYINT(1) DEFAULT 0 COMMENT '是否线上赛';
ALTER TABLE competitions ADD COLUMN location VARCHAR(255) COMMENT '比赛地点';

-- 为 registrations 表添加契约新字段
ALTER TABLE registrations ADD COLUMN team_name VARCHAR(100) COMMENT '团队名(契约)';
ALTER TABLE registrations ADD COLUMN region VARCHAR(50) COMMENT '赛区(契约)';
ALTER TABLE registrations ADD COLUMN captain_name VARCHAR(100) COMMENT '队长姓名(契约)';
ALTER TABLE registrations ADD COLUMN captain_phone VARCHAR(20) COMMENT '队长电话(契约)';
ALTER TABLE registrations ADD COLUMN captain_email VARCHAR(100) COMMENT '队长邮箱(契约)';
ALTER TABLE registrations ADD COLUMN agree_ip TINYINT(1) DEFAULT 0 COMMENT '同意知识产权';
ALTER TABLE registrations ADD COLUMN agree_participation TINYINT(1) DEFAULT 0 COMMENT '同意参赛条款';
ALTER TABLE registrations ADD COLUMN reviewed_at DATETIME COMMENT '审核时间(契约)';
ALTER TABLE registrations ADD COLUMN review_comment VARCHAR(500) COMMENT '审核备注(契约)';

-- 如果需要将现有赛事状态迁移为契约枚举（可选，暂保留旧枚举兼容）
-- pending → draft 或 registration_open
-- ongoing → competition_running
-- finished → results_announced
-- cancelled → 保持 cancelled
