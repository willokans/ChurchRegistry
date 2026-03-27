# Dashboard PII Exposure Review

This document reviews the exposure of Personally Identifiable Information (PII) in the parish dashboard's recent records feature.

## Overview

The dashboard at `/dashboard` displays a "Latest sacrament records" section and a "Recent Activity" section. Both show recent sacrament records with varying levels of PII depending on sacrament type.

## API Exposure

**Endpoint:** `GET /api/parishes/{parishId}/dashboard`

The dashboard API returns full response DTOs for each sacrament type (up to 50 records each). All PII fields are included in the JSON response.

| Sacrament   | Response DTO                 | PII Fields in API Response                                                                 |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Baptism     | `BaptismResponse`            | `baptismName`, `otherNames`, `surname`, `dateOfBirth`, `fathersName`, `mothersName`, `address`, `parentAddress`, `parishAddress`, `sponsorNames` |
| Communion   | `FirstHolyCommunionResponse` | `baptismName`, `otherNames`, `surname`, `dateOfBirth`, `communionDate`, `fathersName`, `mothersName` |
| Confirmation| `ConfirmationResponse`       | `baptismName`, `otherNames`, `surname`, `dateOfBirth`, `confirmationDate`, `fathersName`, `mothersName` |
| Marriage    | `MarriageResponse`           | `partnersName`, `marriageDate`, `groomName`, `brideName`, `groomFatherName`, `groomMotherName`, `brideFatherName`, `brideMotherName`, `witnessesDisplay` |

**Note:** The API returns full records for dashboard convenience. Access is restricted by `SacramentAuthorizationService.requireParishAccess(parishId)`—only users with parish access receive the response.

## Frontend Display Exposure

The "Latest sacrament records" and "Recent Activity" sections display the following in the UI:

| Sacrament   | Label Shown (name)           | Date Shown        | PII Displayed |
| ----------- | ---------------------------- | ----------------- | -------------- |
| Baptism     | Full name (baptismName + otherNames + surname) | dateOfBirth       | Yes: full name, DOB |
| Communion   | "Holy Communion" (generic)   | communionDate     | Partial: date only |
| Confirmation| "Confirmation" (generic)     | confirmationDate  | Partial: date only |
| Marriage    | partnersName                 | marriageDate      | Yes: partners' names, marriage date |

### Date PII

Dates (dateOfBirth, communionDate, confirmationDate, marriageDate) are PII under GDPR and similar frameworks when they can identify an individual. All four sacrament types display dates in the recent records UI.

## Access Control Context

- **Authorization:** Users must have parish access (via role or `app_user_parish_access`) to call the dashboard API.
- **Scope:** Data is parish-scoped; users see only records for parishes they can access.
- **Audience:** Parish staff (priests, secretaries, viewers) and admins with parish access.

## Recommendations

1. **Current design is acceptable** for sacrament registry use: authorized parish staff need to identify records for quick navigation. Full names and dates support that workflow.
2. **API over-fetching:** The dashboard API returns full DTOs. Consider a lighter `DashboardRecentRecord` DTO with only `id`, `type`, `label` (or `displayName`), and `date` if you want to minimize PII in the response. This would require backend changes.
3. **Future diocesan dashboard:** When implementing the diocesan dashboard (Phase 1), apply the same PII review—diocesan admins will see recent records across parishes. Ensure access control is strictly ADMIN/SUPER_ADMIN.
4. **Logging/analytics:** Ensure dashboard API responses are not logged in full; avoid logging PII in request/response interceptors.

## Files Referenced

- Backend: `DashboardController.java`, `DashboardResponse.java`, `BaptismResponse.java`, `FirstHolyCommunionResponse.java`, `ConfirmationResponse.java`, `MarriageResponse.java`
- Frontend: `frontend/app/dashboard/page.tsx` (lines 98–139 build `recentItems`; lines 374–417 render them)
- Authorization: `SacramentAuthorizationService.requireParishAccess`
