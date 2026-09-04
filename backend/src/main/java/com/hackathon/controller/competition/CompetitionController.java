package com.hackathon.controller.competition;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.CompetitionRequest;
import com.hackathon.service.competition.CompetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<?> create(@RequestBody CompetitionRequest request) {
        return ApiResponse.success(competitionService.createCompetition(request));
    }

    @GetMapping
    public ApiResponse<?> list() {
        return ApiResponse.success(competitionService.listCompetitions());
    }

    @GetMapping("/{id}")
    public ApiResponse<?> get(@PathVariable Long id) {
        return ApiResponse.success(competitionService.getCompetition(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody CompetitionRequest request) {
        return ApiResponse.success(competitionService.updateCompetition(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<?> delete(@PathVariable Long id) {
        competitionService.deleteCompetition(id);
        return ApiResponse.success(null);
    }
}
