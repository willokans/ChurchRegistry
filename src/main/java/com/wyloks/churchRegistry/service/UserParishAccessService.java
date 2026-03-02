package com.wyloks.churchRegistry.service;

import com.wyloks.churchRegistry.dto.ReplaceUserParishAccessRequest;
import com.wyloks.churchRegistry.dto.UserParishAccessResponse;

import java.util.List;

public interface UserParishAccessService {

    List<UserParishAccessResponse> listAllUsersWithParishAccess();

    UserParishAccessResponse getUserParishAccess(Long userId);

    UserParishAccessResponse replaceUserParishAccess(Long userId, ReplaceUserParishAccessRequest request);
}
