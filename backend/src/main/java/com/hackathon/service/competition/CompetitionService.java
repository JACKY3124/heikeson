package com.hackathon.service.competition;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.CompetitionRequest;
import com.hackathon.entity.Competition;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.CompetitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final SecurityUtils securityUtils;

    public Competition createCompetition(CompetitionRequest request) {
        Competition competition = new Competition();
        competition.setTitle(request.getTitle());
        competition.setDescription(request.getDescription());
        competition.setCoverImage(request.getCoverImage());
        competition.setRules(request.getRules());
        competition.setCompetitionType(request.getCompetitionType() != null ? request.getCompetitionType() : "individual");
        competition.setStatus(request.getStatus() != null ? request.getStatus() : "pending");
        competition.setRegisterStart(request.getRegisterStart());
        competition.setRegisterEnd(request.getRegisterEnd());
        competition.setSubmitStart(request.getSubmitStart());
        competition.setSubmitEnd(request.getSubmitEnd());
        competition.setCreatedBy(securityUtils.getCurrentUserId());
        return competitionRepository.save(competition);
    }

    public List<Competition> listCompetitions() {
        return competitionRepository.findAll();
    }

    public Competition getCompetition(Long id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛事不存在"));
    }

    public Competition updateCompetition(Long id, CompetitionRequest request) {
        Competition competition = getCompetition(id);
        if (request.getTitle() != null) competition.setTitle(request.getTitle());
        if (request.getDescription() != null) competition.setDescription(request.getDescription());
        if (request.getCoverImage() != null) competition.setCoverImage(request.getCoverImage());
        if (request.getRules() != null) competition.setRules(request.getRules());
        if (request.getCompetitionType() != null) competition.setCompetitionType(request.getCompetitionType());
        if (request.getStatus() != null) competition.setStatus(request.getStatus());
        if (request.getRegisterStart() != null) competition.setRegisterStart(request.getRegisterStart());
        if (request.getRegisterEnd() != null) competition.setRegisterEnd(request.getRegisterEnd());
        if (request.getSubmitStart() != null) competition.setSubmitStart(request.getSubmitStart());
        if (request.getSubmitEnd() != null) competition.setSubmitEnd(request.getSubmitEnd());
        return competitionRepository.save(competition);
    }

    public void deleteCompetition(Long id) {
        competitionRepository.deleteById(id);
    }
}
