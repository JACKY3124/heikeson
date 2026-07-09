package com.hackathon.service.admin;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.*;
import com.hackathon.entity.Announcement;
import com.hackathon.entity.Competition;
import com.hackathon.entity.CompetitionExpert;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.AnnouncementRepository;
import com.hackathon.repository.CompetitionExpertRepository;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminMiscService {

    private final AnnouncementRepository announcementRepository;
    private final CompetitionExpertRepository competitionExpertRepository;
    private final CompetitionRepository competitionRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    // ===== 公告管理 =====

    /**
     * 创建公告
     */
    @Transactional
    public AnnouncementResponseDTO createAnnouncement(AnnouncementRequest request) {
        Announcement announcement = new Announcement();
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setCompetitionId(request.getCompetitionId());
        announcement.setPriority(request.getPriority() != null ? request.getPriority() : 0);
        announcement.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        announcement.setCreatedBy(securityUtils.getCurrentUserId());

        Announcement saved = announcementRepository.save(announcement);
        return toAnnouncementDTO(saved);
    }

    /**
     * 编辑公告
     */
    @Transactional
    public AnnouncementResponseDTO updateAnnouncement(Long id, AnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("公告不存在"));

        if (request.getTitle() != null) announcement.setTitle(request.getTitle());
        if (request.getContent() != null) announcement.setContent(request.getContent());
        if (request.getCompetitionId() != null) announcement.setCompetitionId(request.getCompetitionId());
        if (request.getPriority() != null) announcement.setPriority(request.getPriority());
        if (request.getStatus() != null) announcement.setStatus(request.getStatus());

        Announcement saved = announcementRepository.save(announcement);
        return toAnnouncementDTO(saved);
    }

    /**
     * 删除公告
     */
    @Transactional
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("公告不存在"));

        // 只有创建者或管理员可删除
        announcementRepository.deleteById(id);
    }

    /**
     * 获取公告详情
     */
    public AnnouncementResponseDTO getAnnouncementDetail(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("公告不存在"));
        return toAnnouncementDTO(announcement);
    }

    /**
     * 获取某赛事的公告列表
     */
    public List<AnnouncementResponseDTO> listAnnouncementsByCompetition(Long competitionId) {
        return announcementRepository.findByCompetitionId(competitionId)
                .stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取所有公告列表
     */
    public List<AnnouncementResponseDTO> listAllAnnouncements() {
        return announcementRepository.findAll()
                .stream()
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
    }

    // ===== 专家分配管理 =====

    /**
     * 为赛事分配专家
     * - 校验赛事存在
     * - 校验专家用户存在且角色为 expert
     * - 校验不重复分配
     */
    @Transactional
    public CompetitionExpertResponseDTO assignExpert(CompetitionExpertRequest request) {
        // 校验赛事存在
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        // 校验专家用户存在且角色正确
        User expert = userRepository.findById(request.getExpertId())
                .orElseThrow(() -> new BusinessException("用户不存在"));
        if (!"expert".equals(expert.getRole())) {
            throw new BusinessException("该用户角色不是专家，当前角色：" + expert.getRole());
        }

        // 校验不重复分配
        if (competitionExpertRepository.findByCompetitionIdAndExpertId(request.getCompetitionId(), request.getExpertId()).isPresent()) {
            throw new BusinessException("该专家已被分配到此赛事");
        }

        CompetitionExpert ce = new CompetitionExpert();
        ce.setCompetitionId(request.getCompetitionId());
        ce.setExpertId(request.getExpertId());

        CompetitionExpert saved = competitionExpertRepository.save(ce);
        return toCompetitionExpertDTO(saved, competition, expert);
    }

    /**
     * 移除赛事专家
     */
    @Transactional
    public void removeExpert(Long competitionId, Long expertId) {
        CompetitionExpert ce = competitionExpertRepository.findByCompetitionIdAndExpertId(competitionId, expertId)
                .orElseThrow(() -> new BusinessException("该专家未被分配到此赛事"));

        competitionExpertRepository.deleteById(ce.getId());
    }

    /**
     * 查询赛事下所有专家
     */
    public List<CompetitionExpertResponseDTO> listExpertsByCompetition(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        return competitionExpertRepository.findByCompetitionId(competitionId)
                .stream()
                .map(ce -> {
                    User expert = userRepository.findById(ce.getExpertId()).orElse(null);
                    return toCompetitionExpertDTO(ce, competition, expert);
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取所有可分配的专家列表（角色为 expert 且状态为启用）
     */
    public List<UserResponseDTO> listAvailableExperts() {
        return userRepository.findByRoleAndStatus("expert", 1)
                .stream()
                .map(u -> {
                    UserResponseDTO dto = new UserResponseDTO();
                    dto.setId(u.getId());
                    dto.setUsername(u.getUsername());
                    dto.setNickname(u.getNickname());
                    dto.setEmail(u.getEmail());
                    dto.setRole(u.getRole());
                    dto.setStatus(u.getStatus());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ===== DTO 转换 =====

    private AnnouncementResponseDTO toAnnouncementDTO(Announcement a) {
        AnnouncementResponseDTO dto = new AnnouncementResponseDTO();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setContent(a.getContent());
        dto.setCompetitionId(a.getCompetitionId());
        dto.setPriority(a.getPriority());
        dto.setStatus(a.getStatus());
        dto.setCreatedBy(a.getCreatedBy());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        // 关联赛事标题
        if (a.getCompetitionId() != null) {
            competitionRepository.findById(a.getCompetitionId())
                    .ifPresent(c -> dto.setCompetitionTitle(c.getTitle()));
        }

        // 创建者名称
        userRepository.findById(a.getCreatedBy())
                .ifPresent(u -> dto.setCreatedByName(u.getNickname()));

        return dto;
    }

    private CompetitionExpertResponseDTO toCompetitionExpertDTO(CompetitionExpert ce, Competition competition, User expert) {
        CompetitionExpertResponseDTO dto = new CompetitionExpertResponseDTO();
        dto.setId(ce.getId());
        dto.setCompetitionId(ce.getCompetitionId());
        dto.setCompetitionTitle(competition != null ? competition.getTitle() : null);
        dto.setExpertId(ce.getExpertId());
        dto.setExpertName(expert != null ? expert.getUsername() : null);
        dto.setExpertNickname(expert != null ? expert.getNickname() : null);
        dto.setAssignedAt(ce.getAssignedAt());
        return dto;
    }
}
