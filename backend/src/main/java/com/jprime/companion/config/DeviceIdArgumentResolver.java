package com.jprime.companion.config;

import com.jprime.companion.web.DeviceId;
import com.jprime.companion.web.MissingDeviceIdException;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

public class DeviceIdArgumentResolver implements HandlerMethodArgumentResolver {

    public static final String HEADER = "X-Device-Id";

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(DeviceId.class)
            && String.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        String deviceId = webRequest.getHeader(HEADER);
        if (deviceId == null || deviceId.isBlank()) {
            throw new MissingDeviceIdException();
        }
        return deviceId.trim();
    }
}
