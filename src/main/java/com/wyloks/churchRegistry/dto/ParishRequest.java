package com.wyloks.churchRegistry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParishRequest {

    @NotBlank(message = "parishName is required")
    @Size(max = 255)
    private String parishName;

    @NotNull(message = "dioceseId is required")
    private Long dioceseId;

    @Size(max = 1000)
    private String description;
}
