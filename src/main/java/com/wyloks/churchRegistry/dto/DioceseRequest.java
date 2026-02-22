package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DioceseRequest {

    @NotBlank(message = "dioceseName is required")
    @Size(max = 255)
    private String dioceseName;

    @Size(max = 50)
    private String code;

    @Size(max = 1000)
    private String description;
}
