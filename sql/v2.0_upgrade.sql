-- =====================================================
-- 仿黑客松平台 · v1.0 → v2.0 增量升级脚本
-- 基于组员3修改版，仅补新表和字段，不丢已有数据
-- 执行前确认：USE hackathon_platform;
-- =====================================================

USE hackathon_platform;

-- =====================================================
-- 1. competitions 表：新增 competition_type 字段
-- =====================================================
ALTER TABLE competitions
    ADD COLUMN competition_type ENUM('individual','team') NOT NULL DEFAULT 'individual'
    AFTER rules;

-- =====================================================
-- 2. 新表：problems（赛题表）
-- =====================================================
CREATE TABLE IF NOT EXISTS problems (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    competition_id  INT          NOT NULL,
    problem_id      VARCHAR(20)  NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    score           INT          NOT NULL,
    difficulty      ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    UNIQUE KEY uk_comp_problem (competition_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. submissions 表：新增 file_name、file_size、problem_id 字段
-- =====================================================
ALTER TABLE submissions
    ADD COLUMN file_name  VARCHAR(255) AFTER description,
    ADD COLUMN file_size  BIGINT       AFTER file_url,
    ADD COLUMN problem_id INT          AFTER team_id,
    ADD FOREIGN KEY (problem_id) REFERENCES problems(id);

-- =====================================================
-- 4. rankings 表：user_id 改为可空，新增 team_id
-- =====================================================
ALTER TABLE rankings
    MODIFY COLUMN user_id INT NULL,
    ADD COLUMN team_id INT AFTER user_id,
    ADD FOREIGN KEY (team_id) REFERENCES teams(id);

-- =====================================================
-- 5. 新表：test_cases（Judge0评测测试用例）
-- =====================================================
CREATE TABLE IF NOT EXISTS test_cases (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    problem_id      INT          NOT NULL,
    title           VARCHAR(200) NOT NULL,
    difficulty      ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    input           TEXT         NOT NULL,
    expected_output TEXT         NOT NULL,
    is_public       TINYINT      NOT NULL DEFAULT 0,
    score_weight    DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ai_scores 表：rule_id 改为 dimension_id（适配 v2.0 架构）
-- =====================================================
ALTER TABLE ai_scores
    DROP FOREIGN KEY ai_scores_ibfk_2,
    DROP COLUMN rule_id,
    ADD COLUMN dimension_id INT NOT NULL AFTER submission_id,
    ADD FOREIGN KEY (dimension_id) REFERENCES score_dimensions(id);

-- =====================================================
-- 7. scoring_rules 表：新增 dimension_id
-- =====================================================
ALTER TABLE scoring_rules
    ADD COLUMN dimension_id INT NOT NULL AFTER competition_id,
    ADD FOREIGN KEY (dimension_id) REFERENCES score_dimensions(id);

-- =====================================================
-- 验证：确认17张表都就位
-- =====================================================
SELECT COUNT(*) AS table_count FROM information_schema.tables
WHERE table_schema = 'hackathon_platform';

SHOW TABLES;
