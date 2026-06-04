package com.jprime.companion.repo;

import com.jprime.companion.domain.NoteAttachment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteAttachmentRepository extends JpaRepository<NoteAttachment, Long> {
    Optional<NoteAttachment> findByIdAndNote_DeviceId(Long id, String deviceId);
}
