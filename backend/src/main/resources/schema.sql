-- ============================================================
-- 仿黑客松在线竞赛平台 · 数据库建库脚本 v2.0
-- 设计人：组员5 / 组员3  |  后端对齐：组员2
-- 数据库：MySQL 8.0+  字符集：utf8mb4
-- 说明：本脚本与 JPA entity 对齐，CREATE TABLE 均加 IF NOT EXISTS，
--       可安全被 Spring Boot 自动执行，也可手动执行。
--       id 列类型：组员5原设计为 INT，后端 entity 用 Long(BIGINT)，
--       两者兼容，运行时以 ddl-auto=update 实际建表为准。
-- ============================================================

CREATE DATABASE IF NOT EXISTS hackathon_platform
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    nickname        VARCHAR(50)  NOT NULL,
    email           VARCHAR(100),
    avatar          VARCHAR(255),
    role            VARCHAR(20)  NOT NULL DEFAULT 'spectator',
    status          TINYINT      NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 赛事表
CREATE TABLE IF NOT EXISTS competitions (
    id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    cover_image       VARCHAR(255),
    rules             TEXT,
    competition_type  VARCHAR(20)  NOT NULL DEFAULT 'individual',
    status            VARCHAR(20)  NOT NULL DEFAULT 'pending',
    register_start    DATETIME     NOT NULL,
    register_end      DATETIME     NOT NULL,
    submit_start      DATETIME     NOT NULL,
    submit_end        DATETIME     NOT NULL,
    created_by        BIGINT       NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 团队表
CREATE TABLE IF NOT EXISTS teams (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    competition_id  BIGINT       NOT NULL,
    captain_id      BIGINT       NOT NULL,
    description     TEXT,
    status          TINYINT      NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_comp_name (competition_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 团队成员关联表
CREATE TABLE IF NOT EXISTS team_members (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    team_id         BIGINT       NOT NULL,
    user_id         BIGINT       NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'member',
    joined_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_team_user (team_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 报名表
CREATE TABLE IF NOT EXISTS registrations (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    competition_id  BIGINT       NOT NULL,
    team_id         BIGINT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_comp (user_id, competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 赛题表
CREATE TABLE IF NOT EXISTS problems (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    competition_id  BIGINT       NOT NULL,
    problem_id      VARCHAR(20)  NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    score           INT          NOT NULL,
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_comp_problem (competition_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 作品提交表
CREATE TABLE IF NOT EXISTS submissions (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    competition_id  BIGINT       NOT NULL,
    team_id         BIGINT,
    problem_id      BIGINT,
    title           VARCHAR(200),
    description     TEXT,
    file_name       VARCHAR(255),
    file_url        VARCHAR(255),
    file_size       BIGINT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft',
    submitted_at    DATETIME,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_comp_status (competition_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 专家-赛事分配表
CREATE TABLE IF NOT EXISTS competition_experts (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    competition_id  BIGINT       NOT NULL,
    expert_id       BIGINT       NOT NULL,
    assigned_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_comp_expert (competition_id, expert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 评分维度表
CREATE TABLE IF NOT EXISTS score_dimensions (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    competition_id  BIGINT       NOT NULL,
    name            VARCHAR(100) NOT NULL,
    weight          DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    max_score       DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    description     VARCHAR(500),
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AI评分表
CREATE TABLE IF NOT EXISTS ai_scores (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id   BIGINT       NOT NULL,
    dimension_id    BIGINT       NOT NULL,
    score           DECIMAL(5,2) NOT NULL,
    detail          TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sub_dim (submission_id, dimension_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 专家评分表
CREATE TABLE IF NOT EXISTS expert_scores (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id   BIGINT       NOT NULL,
    expert_id       BIGINT       NOT NULL,
    dimension_id    BIGINT       NOT NULL,
    score           DECIMAL(5,2) NOT NULL,
    comment         TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 成绩排名表
CREATE TABLE IF NOT EXISTS rankings (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    competition_id  BIGINT       NOT NULL,
    user_id         BIGINT,
    team_id         BIGINT,
    total_score     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ai_score        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    expert_score    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rank_no         INT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rank (competition_id, rank_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. 测试用例表
CREATE TABLE IF NOT EXISTS test_cases (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id      BIGINT       NOT NULL,
    title           VARCHAR(200) NOT NULL,
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    input           TEXT         NOT NULL,
    expected_output TEXT         NOT NULL,
    is_public       TINYINT      NOT NULL DEFAULT 0,
    score_weight    DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. 评论表
CREATE TABLE IF NOT EXISTS comments (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id   BIGINT       NOT NULL,
    user_id         BIGINT       NOT NULL,
    content         TEXT         NOT NULL,
    parent_id       BIGINT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. 点赞表
CREATE TABLE IF NOT EXISTS likes (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id   BIGINT       NOT NULL,
    user_id         BIGINT       NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sub_user (submission_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(200) NOT NULL,
    content         TEXT         NOT NULL,
    competition_id  BIGINT,
    priority        TINYINT      NOT NULL DEFAULT 0,
    status          TINYINT      NOT NULL DEFAULT 1,
    created_by      BIGINT       NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. 规则配置表
CREATE TABLE IF NOT EXISTS scoring_rules (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    competition_id  BIGINT       NOT NULL,
    dimension_id    BIGINT       NOT NULL,
    rule_type       VARCHAR(50)  NOT NULL,
    rule_name       VARCHAR(100) NOT NULL,
    rule_value      TEXT         NOT NULL,
    is_active       TINYINT      NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_comp_dim (competition_id, dimension_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
