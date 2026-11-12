package com.example.mstrainerhiring.repositories;

import com.example.mstrainerhiring.entities.TrainerHiring;
import com.example.mstrainerhiring.enums.TrainerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TrainerHiringRepository
        extends JpaRepository<TrainerHiring, UUID>, JpaSpecificationExecutor<TrainerHiring> {
    Page<TrainerHiring> findByStatus(TrainerStatus status, Pageable pageable);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);
}
