package com.hackathon.repository;

import com.hackathon.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByCompetitionId(Long competitionId);

    List<Announcement> findByStatus(Integer status);

    List<Announcement> findByCreatedBy(Long createdBy);
}
