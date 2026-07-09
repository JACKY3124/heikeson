package com.hackathon.service.registration;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.PlayerRegistrationRequest;
import com.hackathon.dto.RegistrationResponseDTO;
import com.hackathon.entity.Competition;
import com.hackathon.entity.Registration;
import com.hackathon.entity.Team;
import com.hackathon.entity.TeamMember;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.RegistrationRepository;
import com.hackathon.repository.TeamMemberRepository;
import com.hackathon.repository.TeamRepository;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final CompetitionRepository competitionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final SecurityUtils securityUtils;

    /**
     * 选手报名参赛
     * - 自动取当前登录用户
     * - 校验赛事存在
     * - 校验报名时间段
     * - 校验重复报名
     * - 校验团队赛/个人赛类型
     */
    @Transactional
    public RegistrationResponseDTO register(PlayerRegistrationRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        // 校验赛事存在
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        // 校验报名时间段
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(competition.getRegisterStart())) {
            throw new BusinessException("报名尚未开始，开始时间：" + competition.getRegisterStart());
        }
        if (now.isAfter(competition.getRegisterEnd())) {
            throw new BusinessException("报名已截止，截止时间：" + competition.getRegisterEnd());
        }

        // 校验重复报名
        Optional<Registration> existing = registrationRepository.findByUserIdAndCompetitionId(userId, request.getCompetitionId());
        if (existing.isPresent()) {
            throw new BusinessException("您已报名该赛事，当前状态：" + existing.get().getStatus());
        }

        // 校验团队赛/个人赛
        if ("team".equals(competition.getCompetitionType()) && request.getTeamId() == null) {
            throw new BusinessException("该赛事为团队赛，请选择或创建团队");
        }
        if ("individual".equals(competition.getCompetitionType()) && request.getTeamId() != null) {
            throw new BusinessException("该赛事为个人赛，无需选择团队");
        }

        // 如果是团队赛，校验团队存在且用户是团队成员
        String teamName = null;
        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new BusinessException("团队不存在"));
            teamName = team.getName();
            // 校验用户是否为团队成员
            boolean isMember = teamMemberRepository.findByTeamIdAndUserId(request.getTeamId(), userId)
                    .isPresent();
            if (!isMember) {
                throw new BusinessException("您不是该团队的成员，无法以该团队报名");
            }
        }

        Registration registration = new Registration();
        registration.setUserId(userId);
        registration.setCompetitionId(request.getCompetitionId());
        registration.setTeamId(request.getTeamId());
        registration.setStatus("pending"); // 默认待审核

        // 契约: 扩展报名字段
        registration.setTeamName(request.getTeamName());
        registration.setRegion(request.getRegion());
        registration.setCaptainName(request.getCaptainName());
        registration.setCaptainPhone(request.getCaptainPhone());
        registration.setCaptainEmail(request.getCaptainEmail());
        registration.setAgreeIP(request.getAgreeIP());
        registration.setAgreeParticipation(request.getAgreeParticipation());

        Registration saved = registrationRepository.save(registration);
        return toResponseDTO(saved, currentUser, competition, teamName);
    }

    /**
     * 查询我的报名列表
     */
    public List<RegistrationResponseDTO> listMyRegistrations() {
        Long userId = securityUtils.getCurrentUserId();
        List<Registration> registrations = registrationRepository.findByUserId(userId);
        return registrations.stream()
                .map(r -> {
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(r.getCompetitionId()).orElse(null);
                    String teamName = r.getTeamId() != null ?
                            teamRepository.findById(r.getTeamId()).map(Team::getName).orElse(null) : null;
                    return toResponseDTO(r, user, comp, teamName);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查询我在某赛事的报名状态
     */
    public RegistrationResponseDTO getMyRegistrationStatus(Long competitionId) {
        Long userId = securityUtils.getCurrentUserId();
        Registration registration = registrationRepository.findByUserIdAndCompetitionId(userId, competitionId)
                .orElseThrow(() -> new BusinessException("您未报名该赛事"));
        User user = securityUtils.getCurrentUser();
        Competition comp = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        String teamName = registration.getTeamId() != null ?
                teamRepository.findById(registration.getTeamId()).map(Team::getName).orElse(null) : null;
        return toResponseDTO(registration, user, comp, teamName);
    }

    /**
     * 退赛（契约 POST /api/competitions/{id}/registration/withdraw）
     * 将报名状态改为 withdrawn（区别于 cancel 的 rejected）
     */
    @Transactional
    public void withdrawRegistration(Long competitionId) {
        Long userId = securityUtils.getCurrentUserId();
        Registration registration = registrationRepository.findByUserIdAndCompetitionId(userId, competitionId)
                .orElseThrow(() -> new BusinessException("您未报名该赛事"));

        if (!"pending".equals(registration.getStatus()) && !"approved".equals(registration.getStatus())) {
            throw new BusinessException("当前状态不可退赛：" + registration.getStatus());
        }

        registration.setStatus("withdrawn");
        registrationRepository.save(registration);
    }

    /**
     * 取消报名（仅限自己，且状态为 pending/approved 时可取消）
     * 旧接口兼容：设为 rejected
     */
    @Transactional
    public void cancelRegistration(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("报名记录不存在"));

        // 只能取消自己的报名
        if (!registration.getUserId().equals(userId)) {
            throw new BusinessException("只能取消自己的报名");
        }

        // 只有 pending 或 approved 状态可取消
        if (!"pending".equals(registration.getStatus()) && !"approved".equals(registration.getStatus())) {
            throw new BusinessException("当前状态不可取消报名：" + registration.getStatus());
        }

        registration.setStatus("rejected"); // 取消视为 rejected
        registrationRepository.save(registration);
    }

    /**
     * 管理员审批报名（approve / reject）
     */
    @Transactional
    public RegistrationResponseDTO approveOrReject(Long id, String status) {
        if (!"approved".equals(status) && !"rejected".equals(status)) {
            throw new BusinessException("审批状态只能为 approved 或 rejected");
        }
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("报名记录不存在"));
        registration.setStatus(status);
        Registration saved = registrationRepository.save(registration);

        User user = userRepository.findById(saved.getUserId()).orElse(null);
        Competition comp = competitionRepository.findById(saved.getCompetitionId()).orElse(null);
        String teamName = saved.getTeamId() != null ?
                teamRepository.findById(saved.getTeamId()).map(Team::getName).orElse(null) : null;
        return toResponseDTO(saved, user, comp, teamName);
    }

    /**
     * 查某赛事所有报名列表（管理员用）
     */
    public List<RegistrationResponseDTO> listByCompetition(Long competitionId) {
        List<Registration> registrations = registrationRepository.findByCompetitionId(competitionId);
        return registrations.stream()
                .map(r -> {
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(r.getCompetitionId()).orElse(null);
                    String teamName = r.getTeamId() != null ?
                            teamRepository.findById(r.getTeamId()).map(Team::getName).orElse(null) : null;
                    return toResponseDTO(r, user, comp, teamName);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查某赛事指定状态的报名列表（管理员用）
     */
    public List<RegistrationResponseDTO> listByCompetitionAndStatus(Long competitionId, String status) {
        List<Registration> registrations = registrationRepository.findByCompetitionIdAndStatus(competitionId, status);
        return registrations.stream()
                .map(r -> {
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(r.getCompetitionId()).orElse(null);
                    String teamName = r.getTeamId() != null ?
                            teamRepository.findById(r.getTeamId()).map(Team::getName).orElse(null) : null;
                    return toResponseDTO(r, user, comp, teamName);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查某赛事已通过的报名列表（用于提交作品校验）
     */
    public boolean isUserApproved(Long userId, Long competitionId) {
        return registrationRepository.findByUserIdAndCompetitionId(userId, competitionId)
                .filter(r -> "approved".equals(r.getStatus()))
                .isPresent();
    }

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private RegistrationResponseDTO toResponseDTO(Registration r, User user, Competition comp, String teamName) {
        RegistrationResponseDTO dto = new RegistrationResponseDTO();
        dto.setId(r.getId());
        dto.setUserId(r.getUserId());
        dto.setUsername(user != null ? user.getUsername() : null);
        dto.setNickname(user != null ? user.getNickname() : null);
        dto.setCompetitionId(r.getCompetitionId());
        dto.setCompetitionTitle(comp != null ? comp.getTitle() : null);
        dto.setTeamId(r.getTeamId());
        dto.setTeamName(teamName);
        dto.setStatus(r.getStatus());
        dto.setCreatedAt(r.getCreatedAt());

        // 契约字段填充
        dto.setRegisteredAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DTF) : null);
        dto.setReviewedAt(r.getReviewedAt() != null ? r.getReviewedAt().format(DTF) : null);
        dto.setReviewComment(r.getReviewComment());
        dto.setCaptainName(r.getCaptainName());
        dto.setCaptainPhone(r.getCaptainPhone());
        dto.setCaptainEmail(r.getCaptainEmail());
        dto.setRegion(r.getRegion());

        // 契约: 填充 team 对象
        if (r.getTeamId() != null) {
            RegistrationResponseDTO.TeamInfo teamInfo = new RegistrationResponseDTO.TeamInfo();
            teamInfo.setId(r.getTeamId());
            teamInfo.setName(teamName);
            teamInfo.setRegion(r.getRegion());
            // 查询团队成员
            List<TeamMember> members = teamMemberRepository.findByTeamId(r.getTeamId());
            List<RegistrationResponseDTO.TeamInfo.TeamMemberInfo> memberInfos = members.stream()
                    .map(m -> {
                        RegistrationResponseDTO.TeamInfo.TeamMemberInfo mi = new RegistrationResponseDTO.TeamInfo.TeamMemberInfo();
                        mi.setId(m.getUserId());
                        userRepository.findById(m.getUserId()).ifPresent(u -> {
                            mi.setUsername(u.getUsername());
                            mi.setName(u.getNickname());
                        });
                        // 队长判断：Team 的 captainId
                        mi.setRole(m.getUserId().equals(r.getUserId()) ? "captain" : "member");
                        return mi;
                    }).collect(Collectors.toList());
            teamInfo.setMembers(memberInfos);
            dto.setTeam(teamInfo);
        }

        return dto;
    }
}
