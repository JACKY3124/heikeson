package com.hackathon.service.team;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.TeamMemberResponseDTO;
import com.hackathon.dto.TeamRequest;
import com.hackathon.dto.TeamResponseDTO;
import com.hackathon.entity.*;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final CompetitionRepository competitionRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final SecurityUtils securityUtils;

    private static final int MAX_TEAM_SIZE = 6;

    // ======================== 创建队伍 ========================

    @Transactional
    public TeamResponseDTO createTeam(TeamRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        // 校验赛事类型为团队赛
        if (!"team".equals(competition.getCompetitionType())) {
            throw new BusinessException("该赛事为个人赛，无需创建队伍");
        }

        // 校验赛事状态：报名中
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(competition.getRegisterStart()) || now.isAfter(competition.getRegisterEnd())) {
            throw new BusinessException("不在报名时间范围内");
        }

        // 校验同一赛事不可重复创建队伍
        if (teamRepository.findByCompetitionIdAndCaptainId(request.getCompetitionId(), userId).isPresent()) {
            throw new BusinessException("您已在该赛事创建了队伍");
        }

        // 校验同一赛事不可已加入其他队伍
        List<Team> teamsInCompetition = teamRepository.findByCompetitionId(request.getCompetitionId());
        for (Team t : teamsInCompetition) {
            if (teamMemberRepository.findByTeamIdAndUserId(t.getId(), userId).isPresent()) {
                throw new BusinessException("您已加入该赛事的其他队伍，请先退出");
            }
        }

        // 校验队伍名称不重复
        if (teamRepository.findByNameAndCompetitionId(request.getName(), request.getCompetitionId()).isPresent()) {
            throw new BusinessException("该赛事下已存在同名队伍");
        }

        // 创建队伍
        Team team = new Team();
        team.setName(request.getName());
        team.setCompetitionId(request.getCompetitionId());
        team.setCaptainId(userId);
        team.setDescription(request.getDescription());
        team.setStatus(1);
        team = teamRepository.save(team);

        // 创建者自动成为队长（加入成员表）
        TeamMember captain = new TeamMember();
        captain.setTeamId(team.getId());
        captain.setUserId(userId);
        captain.setRole("captain");
        teamMemberRepository.save(captain);

        // 同步更新报名记录的 teamId
        final Long teamId = team.getId();
        registrationRepository.findByUserIdAndCompetitionId(userId, request.getCompetitionId())
                .ifPresent(reg -> {
                    reg.setTeamId(teamId);
                    registrationRepository.save(reg);
                });

        log.info("选手 {} 创建队伍: {}", userId, team.getName());
        return toDTO(team);
    }

    // ======================== 更新队伍信息 ========================

    @Transactional
    public TeamResponseDTO updateTeam(Long teamId, TeamRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("队伍不存在"));

        if (!team.getCaptainId().equals(userId)) {
            throw new BusinessException("只有队长可以修改队伍信息");
        }

        if (request.getName() != null) {
            // 校验名称不重复（排除自己）
            teamRepository.findByNameAndCompetitionId(request.getName(), team.getCompetitionId())
                    .ifPresent(t -> {
                        if (!t.getId().equals(teamId)) {
                            throw new BusinessException("该赛事下已存在同名队伍");
                        }
                    });
            team.setName(request.getName());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }

        team = teamRepository.save(team);
        log.info("队伍 {} 信息已更新", teamId);
        return toDTO(team);
    }

    // ======================== 解散队伍 ========================

    @Transactional
    public void disbandTeam(Long teamId) {
        Long userId = securityUtils.getCurrentUserId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("队伍不存在"));

        if (!team.getCaptainId().equals(userId)) {
            throw new BusinessException("只有队长可以解散队伍");
        }

        // 删除所有成员记录
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        teamMemberRepository.deleteAll(members);

        // 清除报名记录中的 teamId
        List<Registration> registrations = registrationRepository.findByCompetitionId(team.getCompetitionId());
        for (Registration reg : registrations) {
            if (teamId.equals(reg.getTeamId())) {
                reg.setTeamId(null);
                registrationRepository.save(reg);
            }
        }

        // 删除队伍
        teamRepository.delete(team);
        log.info("队伍 {} 已解散", teamId);
    }

    // ======================== 查询我的队伍 ========================

    public List<TeamResponseDTO> listMyTeams() {
        Long userId = securityUtils.getCurrentUserId();
        List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> teamRepository.findById(m.getTeamId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ======================== 查询赛事下队伍列表 ========================

    public List<TeamResponseDTO> listTeamsByCompetition(Long competitionId) {
        competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        List<Team> teams = teamRepository.findByCompetitionId(competitionId);
        return teams.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ======================== 查询队伍详情 ========================

    public TeamResponseDTO getTeamDetail(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("队伍不存在"));
        return toDTO(team);
    }

    // ======================== 邀请/添加成员 ========================

    @Transactional
    public TeamResponseDTO addMember(Long teamId, Long targetUserId) {
        Long userId = securityUtils.getCurrentUserId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("队伍不存在"));

        if (!team.getCaptainId().equals(userId)) {
            throw new BusinessException("只有队长可以添加成员");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException("目标用户不存在"));

        if (!"player".equals(targetUser.getRole())) {
            throw new BusinessException("只能添加选手为队员");
        }

        // 校验是否已是成员
        if (teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId).isPresent()) {
            throw new BusinessException("该用户已是队伍成员");
        }

        // 校验队伍人数上限
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        if (members.size() >= MAX_TEAM_SIZE) {
            throw new BusinessException("队伍人数已达上限（" + MAX_TEAM_SIZE + "人）");
        }

        // 校验该用户是否已加入该赛事的其他队伍
        List<Team> competitionTeams = teamRepository.findByCompetitionId(team.getCompetitionId());
        for (Team t : competitionTeams) {
            if (!t.getId().equals(teamId) && teamMemberRepository.findByTeamIdAndUserId(t.getId(), targetUserId).isPresent()) {
                throw new BusinessException("该用户已加入该赛事的其他队伍");
            }
        }

        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setUserId(targetUserId);
        member.setRole("member");
        teamMemberRepository.save(member);

        // 同步更新报名记录的 teamId
        registrationRepository.findByUserIdAndCompetitionId(targetUserId, team.getCompetitionId())
                .ifPresent(reg -> {
                    reg.setTeamId(teamId);
                    registrationRepository.save(reg);
                });

        log.info("队伍 {} 添加成员: {}", teamId, targetUserId);
        return toDTO(team);
    }

    // ======================== 移除成员 ========================

    @Transactional
    public void removeMember(Long teamId, Long targetUserId) {
        Long userId = securityUtils.getCurrentUserId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("队伍不存在"));

        if (!team.getCaptainId().equals(userId)) {
            throw new BusinessException("只有队长可以移除成员");
        }

        if (team.getCaptainId().equals(targetUserId)) {
            throw new BusinessException("队长不可被移除，请先转让队长或解散队伍");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .orElseThrow(() -> new BusinessException("该用户不是队伍成员"));

        teamMemberRepository.delete(member);

        // 清除报名记录中的 teamId
        registrationRepository.findByUserIdAndCompetitionId(targetUserId, team.getCompetitionId())
                .ifPresent(reg -> {
                    reg.setTeamId(null);
                    registrationRepository.save(reg);
                });

        log.info("队伍 {} 移除成员: {}", teamId, targetUserId);
    }

    // ======================== 退出队伍 ========================

    @Transactional
    public void leaveTeam(Long teamId) {
        Long userId = securityUtils.getCurrentUserId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("队伍不存在"));

        if (team.getCaptainId().equals(userId)) {
            throw new BusinessException("队长不可退出，请先转让队长或解散队伍");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new BusinessException("您不是该队伍成员"));

        teamMemberRepository.delete(member);

        // 清除报名记录中的 teamId
        registrationRepository.findByUserIdAndCompetitionId(userId, team.getCompetitionId())
                .ifPresent(reg -> {
                    reg.setTeamId(null);
                    registrationRepository.save(reg);
                });

        log.info("选手 {} 退出队伍: {}", userId, teamId);
    }

    // ======================== DTO 转换 ========================

    private TeamResponseDTO toDTO(Team team) {
        TeamResponseDTO dto = new TeamResponseDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setDescription(team.getDescription());
        dto.setCompetitionId(team.getCompetitionId());
        dto.setCaptainId(team.getCaptainId());
        dto.setStatus(team.getStatus());
        dto.setCreatedAt(team.getCreatedAt());

        // 赛事标题
        competitionRepository.findById(team.getCompetitionId())
                .ifPresent(c -> dto.setCompetitionTitle(c.getTitle()));

        // 队长昵称
        userRepository.findById(team.getCaptainId())
                .ifPresent(u -> dto.setCaptainNickname(u.getNickname()));

        // 成员列表
        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        List<TeamMemberResponseDTO> memberDTOs = members.stream().map(m -> {
            TeamMemberResponseDTO mDTO = new TeamMemberResponseDTO();
            mDTO.setId(m.getId());
            mDTO.setTeamId(m.getTeamId());
            mDTO.setUserId(m.getUserId());
            mDTO.setRole(m.getRole());
            mDTO.setJoinedAt(m.getJoinedAt());
            userRepository.findById(m.getUserId())
                    .ifPresent(u -> {
                        mDTO.setNickname(u.getNickname());
                        mDTO.setAvatar(u.getAvatar());
                    });
            return mDTO;
        }).collect(Collectors.toList());

        dto.setMembers(memberDTOs);
        dto.setMemberCount(memberDTOs.size());
        dto.setMaxMembers(MAX_TEAM_SIZE);

        return dto;
    }
}
