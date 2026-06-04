package com.jprime.companion.web;

import com.jprime.companion.domain.NoteAttachment;
import com.jprime.companion.service.UserDataService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final UserDataService userData;

    public AttachmentController(UserDataService userData) {
        this.userData = userData;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> get(@PathVariable Long id, @DeviceId String deviceId) {
        NoteAttachment attachment = userData.getAttachment(deviceId, id);
        MediaType type;
        try {
            type = MediaType.parseMediaType(attachment.getContentType());
        } catch (RuntimeException e) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
            .contentType(type)
            .cacheControl(CacheControl.noCache())
            .body(new ByteArrayResource(attachment.getData()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @DeviceId String deviceId) {
        userData.deleteAttachment(deviceId, id);
    }
}
