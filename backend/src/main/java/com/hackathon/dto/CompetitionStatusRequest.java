package com.hackathon.dto;

import lombok.Data;

@Data
public class CompetitionStatusRequest {

    private String status; // pending / ongoing / finished / cancelled
}
