package com.example.mscourse.dto;

import com.example.mscourse.entities.AttachmentCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseAttachmentDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private AttachmentCategory category;
    private String description;
    private Long courseId;
    private LocalDateTime createdAt;
}