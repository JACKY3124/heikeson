package com.hackathon.dto;

import lombok.Data;

@Data
public class LikeResponseDTO {

    private Long submissionId;
    private boolean liked;
    private long likeCount;
}
