package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
public class CompetitionResponseDTO {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long id;
    private String title;
    private String description;
    private String coverImage;
    private String rules;
    private String competitionType;
    private String status;

    // 契约字段命名（映射数据库字段）
    private String startTime;              // 契约: startTime → 映射 submitStart
    private String endTime;                // 契约: endTime → 映射 submitEnd
    private String registrationOpenTime;   // 契约: registrationOpenTime → 映射 registerStart
    private String registrationDeadline;   // 契约: registrationDeadline → 映射 registerEnd

    // 保留原始字段（兼容旧接口）
    private LocalDateTime registerStart;
    private LocalDateTime registerEnd;
    private LocalDateTime submitStart;
    private LocalDateTime submitEnd;

    // 契约新增字段
    private Integer minTeamSize;           // 契约: minTeamSize
    private Integer maxTeamSize;           // 契约: maxTeamSize
    private Integer currentParticipants;   // 契约: currentParticipants（= approvedCount）
    private Integer maxParticipants;       // 契约: maxParticipants
    private Boolean isVirtual;             // 契约: isVirtual
    private String location;               // 契约: location

    // 契约: 赛事详情额外字段
    private List<ScoreDimensionDTO> scoreDimensions;  // 契约: scoreDimensions
    private List<String> organizers;                  // 契约: organizers
    private List<String> categories;                  // 契约: categories

    private Long createdBy;
    private String createdByName;
    private String createdAt;
    private String updatedAt;

    /** 报名人数统计（管理员视角） */
    private Long registrationCount;
    private Long approvedCount;
    private Long submissionCount;

    // ========== 辅助：从Entity填充契约字段 ==========

    public void fillContractFields(LocalDateTime regStart, LocalDateTime regEnd,
                                   LocalDateTime subStart, LocalDateTime subEnd,
                                   LocalDateTime created, LocalDateTime updated) {
        if (regStart != null) this.registrationOpenTime = regStart.format(DTF);
        if (regEnd != null) this.registrationDeadline = regEnd.format(DTF);
        if (subStart != null) this.startTime = subStart.format(DTF);
        if (subEnd != null) this.endTime = subEnd.format(DTF);
        if (created != null) this.createdAt = created.format(DTF);
        if (updated != null) this.updatedAt = updated.format(DTF);
        this.registerStart = regStart;
        this.registerEnd = regEnd;
        this.submitStart = subStart;
        this.submitEnd = subEnd;
    }

    @Data
    public static class ScoreDimensionDTO {
        private Long id;
        private String name;
        private java.math.BigDecimal weight;
        private java.math.BigDecimal maxScore;
    }
}
