package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.CreateUserRequest;
import com.wyloks.churchRegistry.dto.UserParishAccessResponse;

public interface AdminUserService {

    UserParishAccessResponse createUser(CreateUserRequest request);
}
