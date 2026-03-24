# Acceptance: Holy Communion with external baptism, certificate pending

This document records **product acceptance criteria** for registering First Holy Communion when the person was baptized elsewhere and the **baptism certificate is not available at create time**, then **attaching proof later** on the baptism record. It maps each criterion to **APIs**, **implementation**, and **automated tests** used to verify behavior.

## Criteria

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | User can create communion with **external baptism** and **no certificate file**; request succeeds (201) and no file upload runs on the server for that step. | `FirstHolyCommunionControllerTest#createMultipart_externalBaptism_returns201_whenCertificateMissing` |
| 2 | Created communion response can indicate **pending proof** (`baptismCertificatePending: true`) when the linked baptism has an issuing parish but no stored certificate path. | `FirstHolyCommunionServiceImplTest#findById_baptismCertificatePendingTrue_whenExternalIssuingParishSetAndCertificateMissing` |
| 3 | **Later upload** of the certificate via baptism updates **both** the baptism record and the linked communion’s `baptismCertificatePath` when a communion exists. | `BaptismServiceImplTest#attachExternalCertificate_updatesBaptismAndCommunion_whenCommunionExists` |
| 4 | After upload, communion detail reflects **proof no longer pending** (`baptismCertificatePending: false`). | `FirstHolyCommunionServiceImplTest#findById_baptismCertificatePendingFalse_whenExternalCertificateUploaded` |
| 5 | HTTP layer for upload: `POST /api/baptisms/{id}/external-certificate` accepts multipart `file`, persists path, returns updated baptism. | `CertificateControllerTest` (success and error cases) |
| 6 | UI/API client: create without file calls `createCommunionWithExternalBaptismPendingProof` (multipart without `certificate`); upload uses `uploadBaptismExternalCertificate`. | `frontend/__tests__/communions/create-page.test.tsx`, `frontend/__tests__/lib/api.test.ts` |

## API contract (reference)

### Create communion with external baptism, certificate optional

- **Method / path:** `POST /api/communions`
- **Content-Type:** `multipart/form-data`
- **Required for external flow:** `baptismSource=external`, `parishId`, `communionDate`, `officiatingPriest`, `parish`, `externalBaptismName`, `externalSurname` (plus other external fields as implemented in `FirstHolyCommunionController#createCommunionWithExternalBaptism`).
- **Optional:** `certificate` (baptism certificate file). When omitted or empty, the server creates the external baptism without `externalCertificatePath` and creates communion without `baptismCertificatePath`.

Implementation: `src/main/java/com/wyloks/churchRegistry/web/FirstHolyCommunionController.java`.

### Attach certificate after the fact

- **Method / path:** `POST /api/baptisms/{id}/external-certificate`
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (required, max 2 MB per controller).

Implementation: `src/main/java/com/wyloks/churchRegistry/web/CertificateController.java` → `BaptismServiceImpl#attachExternalCertificate` (updates baptism `externalCertificatePath` and, when present, linked communion `baptismCertificatePath`).

### Read certificate (optional check)

- **Method / path:** `GET /api/baptisms/{id}/external-certificate`

### Frontend helpers

- `createCommunionWithExternalBaptismPendingProof` — `POST /api/communions` multipart without certificate (`frontend/lib/api.ts`).
- `uploadBaptismExternalCertificate` — `POST /api/baptisms/{id}/external-certificate` (`frontend/lib/api.ts`).

## How verification was run (automated)

From the repository root (Java) — covers multipart create without certificate, `attachExternalCertificate` (baptism + communion), `baptismCertificatePending` on read, and `CertificateController` upload:

```bash
./mvnw -q test -Dtest=FirstHolyCommunionControllerTest,BaptismServiceImplTest,FirstHolyCommunionServiceImplTest,CertificateControllerTest
```

From `frontend/` (TypeScript) — UI create flow, communion view pending state, and API helpers:

```bash
npm test -- --testPathPattern="communions/(create-page|view-page)\\.test|lib/api\\.test" --no-cache --watchman=false
```

Use `--watchman=false` when Watchman is unavailable (some CI or restricted environments).

Re-run these after changes to communion creation, baptism certificate upload, or related DTOs.

## Manual QA (optional)

1. Sign in with a user who can write the parish.
2. **Communion → New** → **Baptism from another Parish** → fill required fields → **do not** attach a certificate → submit. Expect success and redirect to the new communion.
3. Open the linked **baptism** record → upload certificate → expect success.
4. Open the **communion** record again → expect proof available / no longer “awaiting proof” per UI (aligned with `baptismCertificatePending` and certificate download).
