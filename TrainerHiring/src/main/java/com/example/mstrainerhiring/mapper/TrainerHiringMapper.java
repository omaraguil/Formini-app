package com.example.mstrainerhiring.mapper;

import com.example.mstrainerhiring.dto.TrainerDocumentDTO;
import com.example.mstrainerhiring.dto.TrainerHiringDTO;
import com.example.mstrainerhiring.entities.TrainerDocument;
import com.example.mstrainerhiring.entities.TrainerHiring;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TrainerHiringMapper {

    TrainerHiringDTO toDTO(TrainerHiring entity);

    @Mapping(target = "documents", ignore = true)
    TrainerHiring toEntity(TrainerHiringDTO dto);

    @Mapping(target = "documents", ignore = true)
    void updateEntityFromDTO(TrainerHiringDTO dto, @MappingTarget TrainerHiring entity);

    @Mapping(source = "trainer.id", target = "trainerId")
    TrainerDocumentDTO toDocumentDTO(TrainerDocument entity);

    List<TrainerDocumentDTO> toDocumentDTOList(List<TrainerDocument> entities);

    List<TrainerHiringDTO> toDTOList(List<TrainerHiring> entities);
}
