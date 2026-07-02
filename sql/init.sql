-- =====================================================
-- 仿黑客松在线竞赛平台 · 数据库建库脚本 v2.0
-- 设计人：组员5 / 组员3
-- 日期：2026-07-01
-- 数据库：MySQL 8.0+ / MariaDB 10.5+
-- 变更：v2.0 新增 problems、test_cases 表；
--       competitions 加 competition_type 字段；
--       submissions 加 file_name、file_size、problem_id 字段；
--       rankings 改为同时支持 user_id / team_id
-- =====================================================

CREATE DATABASE IF NOT EXISTS hackathon_platform
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hackathon_platform;

-- =====================================================
-- 1. 用户表
-- =====================================================
CREATE TABLE users (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    nickname        VARCHAR(50)  NOT NULL,
    email           VARCHAR(100),
    avatar          VARCHAR(255),
    role            ENUM('player','expert','admin','spectator') NOT NULL DEFAULT 'spectator',
    status          TINYINT      NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. 赛事表（v2.0 新增 competition_type）
-- =====================================================
CREATE TABLE competitions (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    cover_image       VARCHAR(255),
    rules             TEXT,
    competition_type  ENUM('individual','team') NOT NULL DEFAULT 'individual',
    status            ENUM('pending','ongoing','ended') NOT NULL DEFAULT 'pending',
    register_start    DATETIME     NOT NULL,
    register_end      DATETIME     NOT NULL,
    submit_start      DATETIME     NOT NULL,
    submit_end        DATETIME     NOT NULL,
    created_by        INT          NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. 团队表
-- =====================================================
CREATE TABLE teams (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    competition_id  INT          NOT NULL,
    captain_id      INT          NOT NULL,
    description     TEXT,
    status          TINYINT      NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (captain_id) REFERENCES users(id),
    UNIQUE KEY uk_comp_name (competition_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. 团队成员关联表
-- =====================================================
CREATE TABLE team_members (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    team_id         INT          NOT NULL,
    user_id         INT          NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'member',
    joined_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_team_user (team_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. 报名表
-- =====================================================
CREATE TABLE registrations (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    competition_id  INT          NOT NULL,
    team_id         INT,
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE KEY uk_user_comp (user_id, competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. 赛题表（v2.0 新增）
-- =====================================================
CREATE TABLE problems (
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
-- 7. 作品提交表（v2.0 新增 file_name、file_size、problem_id）
-- =====================================================
CREATE TABLE submissions (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    competition_id  INT          NOT NULL,
    team_id         INT,
    problem_id      INT,
    title           VARCHAR(200),
    description     TEXT,
    file_name       VARCHAR(255),
    file_url        VARCHAR(255),
    file_size       BIGINT,
    status          ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
    submitted_at    DATETIME,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    INDEX idx_comp_status (competition_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. 专家-赛事分配表
-- =====================================================
CREATE TABLE competition_experts (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    competition_id  INT          NOT NULL,
    expert_id       INT          NOT NULL,
    assigned_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (expert_id) REFERENCES users(id),
    UNIQUE KEY uk_comp_expert (competition_id, expert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. 评分维度表
-- =====================================================
CREATE TABLE score_dimensions (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    competition_id  INT          NOT NULL,
    name            VARCHAR(100) NOT NULL,
    weight          DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    max_score       DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    description     VARCHAR(500),
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. AI评分表
-- =====================================================
CREATE TABLE ai_scores (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    submission_id   INT          NOT NULL,
    dimension_id    INT          NOT NULL,
    score           DECIMAL(5,2) NOT NULL,
    detail          TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (dimension_id) REFERENCES score_dimensions(id),
    UNIQUE KEY uk_sub_dim (submission_id, dimension_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. 专家评分表
-- =====================================================
CREATE TABLE expert_scores (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    submission_id   INT          NOT NULL,
    expert_id       INT          NOT NULL,
    dimension_id    INT          NOT NULL,
    score           DECIMAL(5,2) NOT NULL,
    comment         TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (expert_id) REFERENCES users(id),
    FOREIGN KEY (dimension_id) REFERENCES score_dimensions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. 成绩排名表（v2.0 支持个人/团队双模式）
-- =====================================================
CREATE TABLE rankings (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    competition_id  INT          NOT NULL,
    user_id         INT,
    team_id         INT,
    total_score     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ai_score        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    expert_score    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rank_no         INT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    INDEX idx_rank (competition_id, rank_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. 测试用例表（v2.0 新增，Judge0评测用）
-- =====================================================
CREATE TABLE test_cases (
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
-- 14. 评论表
-- =====================================================
CREATE TABLE comments (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    submission_id   INT          NOT NULL,
    user_id         INT          NOT NULL,
    content         TEXT         NOT NULL,
    parent_id       INT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. 点赞表
-- =====================================================
CREATE TABLE likes (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    submission_id   INT          NOT NULL,
    user_id         INT          NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_sub_user (submission_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. 公告表
-- =====================================================
CREATE TABLE announcements (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(200) NOT NULL,
    content         TEXT         NOT NULL,
    competition_id  INT,
    priority        TINYINT      NOT NULL DEFAULT 0,
    status          TINYINT      NOT NULL DEFAULT 1,
    created_by      INT          NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 17. 规则配置表
-- =====================================================
CREATE TABLE scoring_rules (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    competition_id  INT          NOT NULL,
    dimension_id    INT          NOT NULL,
    rule_type       VARCHAR(50)  NOT NULL,
    rule_name       VARCHAR(100) NOT NULL,
    rule_value      TEXT         NOT NULL,
    is_active       TINYINT      NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (dimension_id) REFERENCES score_dimensions(id),
    INDEX idx_comp_dim (competition_id, dimension_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 初始化：插入 admin 账户（密码明文 admin123，实际用 bcrypt 加密）
-- =====================================================
-- INSERT INTO users (username, password, nickname, role) VALUES
-- ('admin', '$2a$10$xxx', '系统管理员', 'admin');
