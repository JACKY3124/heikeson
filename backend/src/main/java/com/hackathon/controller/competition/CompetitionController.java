package com.hackathon.controller.competition;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.CompetitionRequest;
import com.hackathon.service.competition.CompetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;

    @PostMapping
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
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody CompetitionRequest request) {
        return ApiResponse.success(competitionService.updateCompetition(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id) {
        competitionService.deleteCompetition(id);
        return ApiResponse.success(null);
    }
}
