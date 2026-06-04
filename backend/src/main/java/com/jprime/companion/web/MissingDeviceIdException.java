package com.jprime.companion.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class MissingDeviceIdException extends RuntimeException {
    public MissingDeviceIdException() {
        super("Missing required X-Device-Id header");
    }
}
