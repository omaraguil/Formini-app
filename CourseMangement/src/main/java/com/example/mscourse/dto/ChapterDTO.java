package com.example.mscourse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterDTO {
    private Long id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Long courseId;
    private List<ContentBlockDTO> contentBlocks;
    private Integer totalContentBlocks;
}