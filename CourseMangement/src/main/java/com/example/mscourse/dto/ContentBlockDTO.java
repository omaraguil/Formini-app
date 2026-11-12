package com.example.mscourse.dto;

import com.example.mscourse.entities.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentBlockDTO {
    private Long id;
    private ContentType type;
    private Integer orderIndex;
    private String data;
    private String title;
    private Long chapterId;
}