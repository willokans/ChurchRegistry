'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useParish } from '@/context/ParishContext';
import {
  fetchBaptisms,
  fetchCommunions,
  createConfirmation,
  createBaptismWithCertificate,
  createCommunion,
  createCommunionWithCommunionCertificate,
  getStoredUser,
  type BaptismResponse,
  type FirstHolyCommunionResponse,
  type ConfirmationRequest,
} from '@/lib/api';

import { deleteDraft, loadDraft, saveDraft, type OfflineDraftRecord } from '@/lib/offline/drafts';
import { useDebouncedDraftAutosave } from '@/lib/offline/draftAutosave';
import { loadOfflineBlob, persistOfflineAttachmentWithGuardrails } from '@/lib/offline/files';
import { useNetworkStatus } from '@/lib/offline/network';
import { enqueueOfflineSubmission } from '@/lib/offline/queue';
import { useOfflineQueueItem } from '@/lib/offline/useOfflineQueueItem';
import { deleteQueueItemAfterSync, retryOfflineQueueItem } from '@/lib/offline/replay';

import ConfirmationCreateForm from './ConfirmationCreateForm';

type ConfirmationFormState = ConfirmationRequest;

function fullNameBaptism(b: BaptismResponse): string {
  return [b.baptismName, b.otherNames, b.surname].filter(Boolean).join(' ');
}

function fullNameCommunion(c: FirstHolyCommunionResponse): string {
  return [c.baptismName, c.otherNames, c.surname].filter(Boolean).join(' ');
}

function formatBaptismDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ConfirmationCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishId = parishIdParam ? parseInt(parishIdParam, 10) : null;
  const { parishId: contextParishId, parishes } = useParish();
  const effectiveParishId = parishId ?? contextParishId ?? null;

  const [baptisms, setBaptisms] = useState<BaptismResponse[]>([]);
  const [communions, setCommunions] = useState<FirstHolyCommunionResponse[]>([]);
  const [loading, setLoading] = useState(!!effectiveParishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baptismSource, setBaptismSource] = useState<'this_parish' | 'external'>('this_parish');
  const [communionSource, setCommunionSource] = useState<'this_church' | 'other_church'>('this_church');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateFileMetaFromDraft, setCertificateFileMetaFromDraft] = useState<{
    fileRefId?: string;
    name: string;
    size: number;
    type?: string;
    storedBlob: boolean;
    deferredReason?: string;
  } | null>(null);
  const [communionCertificateFile, setCommunionCertificateFile] = useState<File | null>(null);
  const [communionCertificateFileMetaFromDraft, setCommunionCertificateFileMetaFromDraft] = useState<{
    fileRefId?: string;
    name: string;
    size: number;
    type?: string;
    storedBlob: boolean;
    deferredReason?: string;
  } | null>(null);
  const [certificateAttachmentWarning, setCertificateAttachmentWarning] = useState<string | null>(null);
  const [communionAttachmentWarning, setCommunionAttachmentWarning] = useState<string | null>(null);

  // Ensure Save Draft uses the final attachment guardrails decision.
  const certificatePersistTaskRef = useRef<Promise<void> | null>(null);
  const communionPersistTaskRef = useRef<Promise<void> | null>(null);
  const [externalBaptism, setExternalBaptism] = useState({
    baptismName: '',
    surname: '',
    otherNames: '',
    gender: 'MALE',
    fathersName: '',
    mothersName: '',
    baptisedChurchAddress: '',
  });
  const [externalCommunion, setExternalCommunion] = useState({
    baptismName: '',
    surname: '',
    communionChurchAddress: '',
    communionDate: '',
    officiatingPriest: '',
    parish: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedBaptismId, setSelectedBaptismId] = useState(0);
  const [communionSearchQuery, setCommunionSearchQuery] = useState('');
  const [communionSearchFocused, setCommunionSearchFocused] = useState(false);
  const communionSearchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCommunionId, setSelectedCommunionId] = useState(0);
  const [form, setForm] = useState<ConfirmationFormState>({
    baptismId: 0,
    communionId: 0,
    confirmationDate: '',
    officiatingBishop: '',
    parish: '',
  });

  const storedUser = getStoredUser();
  const draftId =
    effectiveParishId != null && !Number.isNaN(effectiveParishId) && storedUser?.username
      ? `confirmation_create:${effectiveParishId}:${storedUser.username}`
      : null;

  const [draftRecord, setDraftRecord] = useState<OfflineDraftRecord<ConfirmationDraftPayload> | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  const { isOnline } = useNetworkStatus();
  const [queuedItemId, setQueuedItemId] = useState<string | null>(null);
  const queuedItem = useOfflineQueueItem(queuedItemId);

  useEffect(() => {
    if (!queuedItem || queuedItem.status !== 'synced') return;
    void deleteQueueItemAfterSync(queuedItem.id);
    if (draftId) void deleteDraft(draftId);
    router.push('/confirmations');
  }, [queuedItem, draftId, router]);

  type ConfirmationDraftPayload = {
    baptismSource: 'this_parish' | 'external';
    communionSource: 'this_church' | 'other_church';
    selectedBaptismId: number;
    selectedCommunionId: number;
    externalBaptism: typeof externalBaptism;
    externalCommunion: typeof externalCommunion;
    form: typeof form;
    certificateAttachment: {
      fileRefId?: string;
      name: string;
      size: number;
      type?: string;
      storedBlob: boolean;
      deferredReason?: string;
    } | null;
    communionCertificateAttachment: {
      fileRefId?: string;
      name: string;
      size: number;
      type?: string;
      storedBlob: boolean;
      deferredReason?: string;
    } | null;
    // Legacy (pre-fileRefId) fields (optional) for older drafts.
    certificateFileMeta?: { name: string; size: number; type?: string } | null;
    communionCertificateFileMeta?: { name: string; size: number; type?: string } | null;
  };

  useDebouncedDraftAutosave<ConfirmationDraftPayload>({
    draftId,
    formType: 'confirmation_create',
    payload: {
      baptismSource,
      communionSource,
      selectedBaptismId,
      selectedCommunionId,
      externalBaptism,
      externalCommunion,
      form,
      certificateAttachment: certificateFileMetaFromDraft,
      communionCertificateAttachment: communionCertificateFileMetaFromDraft,
    },
    enabled: false,
  });

  useEffect(() => {
    if (effectiveParishId === null || Number.isNaN(effectiveParishId)) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchBaptisms(effectiveParishId), fetchCommunions(effectiveParishId)])
      .then(([baptismPage, communionPage]) => {
        if (!cancelled) {
          setBaptisms(baptismPage.content);
          setCommunions(communionPage.content);
          const defaultParish = parishes.find((p) => p.id === effectiveParishId);
          setExternalCommunion((prev) => ({
            ...prev,
            parish: defaultParish?.parishName ?? prev.parish,
          }));
          if (baptismPage.content.length === 0) {
            setBaptismSource('external');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load records');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [effectiveParishId, parishes]);

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    setDraftStatus(null);
    loadDraft<ConfirmationDraftPayload>(draftId)
      .then((d) => {
        if (cancelled) return;
        setDraftRecord(d);
      })
      .catch(() => {
        if (cancelled) return;
        setDraftRecord(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const filteredBaptisms = useMemo(() => {
    if (!searchQuery.trim()) return baptisms;
    const q = searchQuery.trim().toLowerCase();
    return baptisms.filter((b) => {
      const name = fullNameBaptism(b).toLowerCase();
      const dob = (b.dateOfBirth ?? '').toLowerCase();
      const father = (b.fathersName ?? '').toLowerCase();
      const mother = (b.mothersName ?? '').toLowerCase();
      return name.includes(q) || dob.includes(q) || father.includes(q) || mother.includes(q);
    });
  }, [baptisms, searchQuery]);

  useEffect(() => {
    if (selectedBaptismId <= 0 || !searchQuery.trim()) return;
    const inFiltered = filteredBaptisms.some((b) => b.id === selectedBaptismId);
    if (!inFiltered) setSelectedBaptismId(0);
  }, [searchQuery, filteredBaptisms, selectedBaptismId]);

  const filteredCommunions = useMemo(() => {
    if (!communionSearchQuery.trim()) return communions;
    const q = communionSearchQuery.trim().toLowerCase();
    return communions.filter((c) => {
      const name = fullNameCommunion(c).toLowerCase();
      const date = (c.communionDate ?? '').toLowerCase();
      const priest = (c.officiatingPriest ?? '').toLowerCase();
      const parish = (c.parish ?? '').toLowerCase();
      return name.includes(q) || date.includes(q) || priest.includes(q) || parish.includes(q);
    });
  }, [communions, communionSearchQuery]);

  useEffect(() => {
    if (selectedCommunionId <= 0 || !communionSearchQuery.trim()) return;
    const inFiltered = filteredCommunions.some((c) => c.id === selectedCommunionId);
    if (!inFiltered) setSelectedCommunionId(0);
  }, [communionSearchQuery, filteredCommunions, selectedCommunionId]);

  const selectedBaptism = selectedBaptismId ? baptisms.find((b) => b.id === selectedBaptismId) ?? null : null;
  const selectedCommunion = selectedCommunionId ? communions.find((c) => c.id === selectedCommunionId) ?? null : null;

  // Pre-fill Baptism Name and Surname when user selects "Holy Communion in another church" and has a baptism selected (this parish) or external baptism (another parish)
  useEffect(() => {
    if (communionSource !== 'other_church') return;
    if (baptismSource === 'this_parish' && selectedBaptismId) {
      const b = baptisms.find((x) => x.id === selectedBaptismId);
      if (b) {
        setExternalCommunion((prev) => ({
          ...prev,
          baptismName: b.baptismName ?? prev.baptismName,
          surname: b.surname ?? prev.surname,
        }));
      }
    } else if (baptismSource === 'external') {
      setExternalCommunion((prev) => ({
        ...prev,
        baptismName: externalBaptism.baptismName || prev.baptismName,
        surname: externalBaptism.surname || prev.surname,
      }));
    }
  }, [communionSource, baptismSource, selectedBaptismId, baptisms, externalBaptism.baptismName, externalBaptism.surname]);
  const communionByBaptism = selectedBaptismId ? communions.find((c) => c.baptismId === selectedBaptismId) : null;

  if (effectiveParishId === null || Number.isNaN(effectiveParishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New Confirmation</h1>
        <p className="mt-4 text-gray-600">Select a parish from the confirmations list first.</p>
        <Link href="/confirmations" className="mt-4 inline-block text-sancta-maroon hover:underline">
          ← Back to Confirmations
        </Link>
      </AuthenticatedLayout>
    );
  }

  const setCertificateFileWithDraftClear = (value: File | null) => {
    const existingFileRefId = certificateFileMetaFromDraft?.fileRefId;
    certificatePersistTaskRef.current = null;
    setCertificateAttachmentWarning(null);
    setCertificateFileMetaFromDraft(null);
    setCertificateFile(value);

    if (!value) return;
    certificatePersistTaskRef.current = (async () => {
      const res = await persistOfflineAttachmentWithGuardrails(value, {
        fileRefId: existingFileRefId,
        maxBytesPerFile: 2 * 1024 * 1024,
        maxTotalBytes: 25 * 1024 * 1024,
      });

      setCertificateFileMetaFromDraft({
        fileRefId: res.fileRefId,
        name: value.name,
        size: value.size,
        type: res.mimeType,
        storedBlob: res.storedBlob,
        deferredReason: res.deferredReason,
      });
      setCertificateAttachmentWarning(res.storedBlob ? null : res.deferredReason ?? 'Some files will upload when online.');
    })().catch(() => {
      setCertificateFileMetaFromDraft({
        fileRefId: existingFileRefId,
        name: value.name,
        size: value.size,
        storedBlob: false,
        deferredReason: 'Failed to store certificate offline. It may need to be re-uploaded.',
      });
      setCertificateAttachmentWarning('Failed to store certificate offline. It may need to be re-uploaded.');
    });
  };

  const setCommunionCertificateFileWithDraftClear = (value: File | null) => {
    const existingFileRefId = communionCertificateFileMetaFromDraft?.fileRefId;
    communionPersistTaskRef.current = null;
    setCommunionAttachmentWarning(null);
    setCommunionCertificateFileMetaFromDraft(null);
    setCommunionCertificateFile(value);

    if (!value) return;
    communionPersistTaskRef.current = (async () => {
      const res = await persistOfflineAttachmentWithGuardrails(value, {
        fileRefId: existingFileRefId,
        maxBytesPerFile: 2 * 1024 * 1024,
        maxTotalBytes: 25 * 1024 * 1024,
      });

      setCommunionCertificateFileMetaFromDraft({
        fileRefId: res.fileRefId,
        name: value.name,
        size: value.size,
        type: res.mimeType,
        storedBlob: res.storedBlob,
        deferredReason: res.deferredReason,
      });
      setCommunionAttachmentWarning(res.storedBlob ? null : res.deferredReason ?? 'Some files will upload when online.');
    })().catch(() => {
      setCommunionCertificateFileMetaFromDraft({
        fileRefId: existingFileRefId,
        name: value.name,
        size: value.size,
        storedBlob: false,
        deferredReason: 'Failed to store certificate offline. It may need to be re-uploaded.',
      });
      setCommunionAttachmentWarning('Failed to store certificate offline. It may need to be re-uploaded.');
    });
  };

  async function handleSaveDraft() {
    if (!draftId) return;
    setDraftStatus('Saving draft locally…');
    try {
      if (certificatePersistTaskRef.current) await certificatePersistTaskRef.current;
      if (communionPersistTaskRef.current) await communionPersistTaskRef.current;

      const payload: ConfirmationDraftPayload = {
        baptismSource,
        communionSource,
        selectedBaptismId,
        selectedCommunionId,
        externalBaptism,
        externalCommunion,
        form,
        certificateAttachment: certificateFileMetaFromDraft,
        communionCertificateAttachment: communionCertificateFileMetaFromDraft,
      };
      await saveDraft<ConfirmationDraftPayload>(draftId, 'confirmation_create', payload);
      const loaded = await loadDraft<ConfirmationDraftPayload>(draftId);
      setDraftRecord(loaded);
      setDraftStatus('Draft saved locally on this device.');
    } catch {
      setDraftStatus('Failed to save draft locally.');
    }
  }

  function handleResumeDraft() {
    if (!draftRecord) return;
    void (async () => {
      setBaptismSource(draftRecord.payload.baptismSource);
      setCommunionSource(draftRecord.payload.communionSource);
      setSelectedBaptismId(draftRecord.payload.selectedBaptismId);
      setSelectedCommunionId(draftRecord.payload.selectedCommunionId);
      setExternalBaptism(draftRecord.payload.externalBaptism);
      setExternalCommunion(draftRecord.payload.externalCommunion);
      setForm(draftRecord.payload.form);

      certificatePersistTaskRef.current = null;
      communionPersistTaskRef.current = null;

      setCertificateFile(null);
      setCommunionCertificateFile(null);

      const legacyCert = draftRecord.payload.certificateFileMeta;
      const certAttachment = draftRecord.payload.certificateAttachment ?? (legacyCert
        ? { name: legacyCert.name, size: legacyCert.size, type: legacyCert.type, storedBlob: false as const }
        : null);
      setCertificateFileMetaFromDraft(certAttachment);
      setCertificateAttachmentWarning(
        certAttachment ? (certAttachment.storedBlob ? null : certAttachment.deferredReason ?? 'Certificate was not stored offline. Please re-upload when online.') : null
      );

      const legacyCommunionCert = draftRecord.payload.communionCertificateFileMeta;
      const communionCertAttachment =
        draftRecord.payload.communionCertificateAttachment ??
        (legacyCommunionCert
          ? { name: legacyCommunionCert.name, size: legacyCommunionCert.size, type: legacyCommunionCert.type, storedBlob: false as const }
          : null);
      setCommunionCertificateFileMetaFromDraft(communionCertAttachment);
      setCommunionAttachmentWarning(
        communionCertAttachment ? (communionCertAttachment.storedBlob ? null : communionCertAttachment.deferredReason ?? 'Certificate was not stored offline. Please re-upload when online.') : null
      );

      if (certAttachment?.storedBlob && certAttachment.fileRefId) {
        const blob = await loadOfflineBlob(certAttachment.fileRefId);
        if (blob) setCertificateFile(new File([blob], certAttachment.name, { type: certAttachment.type ?? blob.type }));
      }
      if (communionCertAttachment?.storedBlob && communionCertAttachment.fileRefId) {
        const blob = await loadOfflineBlob(communionCertAttachment.fileRefId);
        if (blob) {
          setCommunionCertificateFile(new File([blob], communionCertAttachment.name, { type: communionCertAttachment.type ?? blob.type }));
        }
      }

      setDraftStatus('Draft loaded from this device.');
    })();
  }

  async function handleDiscardDraft() {
    if (!draftId) return;
    setDraftStatus('Discarding draft…');
    try {
      await deleteDraft(draftId);
      setDraftRecord(null);
      setCertificateFile(null);
      setCommunionCertificateFile(null);
      setCertificateFileMetaFromDraft(null);
      setCommunionCertificateFileMetaFromDraft(null);
      setCertificateAttachmentWarning(null);
      setCommunionAttachmentWarning(null);
      certificatePersistTaskRef.current = null;
      communionPersistTaskRef.current = null;
      setDraftStatus('Draft discarded.');
    } catch {
      setDraftStatus('Failed to discard draft.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (certificatePersistTaskRef.current) {
      try {
        await certificatePersistTaskRef.current;
      } catch {
        // ignore: we'll handle via queue sync status
      }
    }
    if (communionPersistTaskRef.current) {
      try {
        await communionPersistTaskRef.current;
      } catch {
        // ignore: we'll handle via queue sync status
      }
    }

    if (baptismSource === 'this_parish') {
      if (selectedBaptismId <= 0 && !selectedCommunionId) {
        setError('Select a baptism record or search and select a Holy Communion record.');
        return;
      }
      if (communionByBaptism) {
        // Baptism has a communion record — no need to choose source; we use it
      } else if (selectedCommunionId) {
        // User selected a communion via search — we have baptism from communion.baptismId
      } else if (communionSource === 'this_church') {
        setError('Search and select a Holy Communion record, or choose "Holy Communion in another church" to upload a certificate.');
        return;
      } else {
        if (isOnline) {
          if (!communionCertificateFile || communionCertificateFile.size === 0) {
            setError('Upload a Holy Communion certificate when Communion was in another church.');
            return;
          }
        } else {
          if (!communionCertificateFileMetaFromDraft?.fileRefId) {
            setError('Upload a Holy Communion certificate (or resume an offline draft with it) before saving offline.');
            return;
          }
        }
        if (!externalCommunion.baptismName.trim() || !externalCommunion.surname.trim()) {
          setError('Baptism name and surname are required for Holy Communion from another church.');
          return;
        }
        if (!externalCommunion.communionChurchAddress.trim()) {
          setError('Holy Communion church address is required.');
          return;
        }
        if (!externalCommunion.communionDate.trim() || !externalCommunion.officiatingPriest.trim()) {
          setError('Communion date and officiating priest are required for Communion from another church.');
          return;
        }
      }
    } else {
      if (isOnline) {
        if (!certificateFile || certificateFile.size === 0) {
          setError('Upload a baptism certificate when selecting Baptism from another Parish.');
          return;
        }
      } else {
        if (!certificateFileMetaFromDraft?.fileRefId) {
          setError('Upload a baptism certificate (or resume an offline draft with it) before saving offline.');
          return;
        }
      }
      if (!externalBaptism.baptismName.trim() || !externalBaptism.surname.trim()) {
        setError('Baptism name and surname are required for external baptism.');
        return;
      }
      if (!externalBaptism.fathersName.trim() || !externalBaptism.mothersName.trim()) {
        setError("Father's and mother's names are required.");
        return;
      }
      if (communionSource === 'this_church') {
        if (!externalCommunion.communionDate.trim() || !externalCommunion.officiatingPriest.trim()) {
          setError('Communion date and officiating priest are required when Holy Communion was in this church.');
          return;
        }
      } else {
        if (isOnline) {
          if (!communionCertificateFile || communionCertificateFile.size === 0) {
            setError('Upload a Holy Communion certificate when Communion was in another church.');
            return;
          }
        } else {
          if (!communionCertificateFileMetaFromDraft?.fileRefId) {
            setError('Upload a Holy Communion certificate (or resume an offline draft with it) before saving offline.');
            return;
          }
        }
        if (!externalCommunion.baptismName.trim() || !externalCommunion.surname.trim()) {
          setError('Baptism name and surname are required for Holy Communion from another church.');
          return;
        }
        if (!externalCommunion.communionChurchAddress.trim()) {
          setError('Holy Communion church address is required.');
          return;
        }
        if (!externalCommunion.communionDate.trim() || !externalCommunion.officiatingPriest.trim()) {
          setError('Communion date and officiating priest are required for Communion from another church.');
          return;
        }
      }
    }

    if (!form.confirmationDate.trim() || !form.officiatingBishop.trim()) {
      setError('Confirmation date and officiating bishop are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (!isOnline) {
        if (baptismSource === 'external') {
          const baptismCert = certificateFileMetaFromDraft;
          if (!baptismCert?.fileRefId) throw new Error('Missing offline baptism certificate file reference.');

          const communionCertRef =
            communionSource === 'other_church' ? communionCertificateFileMetaFromDraft : null;
          if (communionSource === 'other_church' && !communionCertRef?.fileRefId) {
            throw new Error('Missing offline Holy Communion certificate file reference.');
          }

          const itemId = await enqueueOfflineSubmission(
            {
              kind: 'confirmation_create',
              payload: {
                effectiveParishId,
                effectiveParishName,
                externalCommunion,
                branch: {
                  type: 'external_baptism',
                  externalBaptism: {
                    baptismName: externalBaptism.baptismName.trim(),
                    surname: externalBaptism.surname.trim(),
                    otherNames: externalBaptism.otherNames.trim(),
                    gender: externalBaptism.gender,
                    fathersName: externalBaptism.fathersName.trim(),
                    mothersName: externalBaptism.mothersName.trim(),
                    baptisedChurchAddress: externalBaptism.baptisedChurchAddress.trim(),
                  },
                  baptismCertificateAttachment: {
                    fileRefId: baptismCert.fileRefId,
                    name: baptismCert.name,
                    mimeType: baptismCert.type,
                    size: baptismCert.size,
                  },
                  communionSource,
                  communionCertificateAttachment:
                    communionSource === 'other_church' && communionCertRef
                      ? {
                          fileRefId: communionCertRef.fileRefId,
                          name: communionCertRef.name,
                          mimeType: communionCertRef.type,
                          size: communionCertRef.size,
                        }
                      : undefined,
                },
                form,
              },
            },
            { draftId: draftId ?? undefined }
          );

          setQueuedItemId(itemId);
          return;
        }

        // baptismSource: this_parish
        if (
          communionSource === 'other_church' &&
          selectedBaptismId > 0 &&
          communionCertificateFileMetaFromDraft?.fileRefId
        ) {
          const itemId = await enqueueOfflineSubmission(
            {
              kind: 'confirmation_create',
              payload: {
                effectiveParishId,
                effectiveParishName,
                externalCommunion,
                branch: {
                  type: 'create_communion_from_other_church',
                  selectedBaptismId,
                  communionCertificateAttachment: {
                    fileRefId: communionCertificateFileMetaFromDraft.fileRefId,
                    name: communionCertificateFileMetaFromDraft.name,
                    mimeType: communionCertificateFileMetaFromDraft.type,
                    size: communionCertificateFileMetaFromDraft.size,
                  },
                },
                form,
              },
            },
            { draftId: draftId ?? undefined }
          );
          setQueuedItemId(itemId);
          return;
        }

        const resolvedCommunionId =
          selectedCommunionId && selectedCommunion ? selectedCommunion.id : communionByBaptism?.id;
        const resolvedBaptismId = selectedCommunion
          ? selectedCommunion.baptismId
          : communionByBaptism
            ? selectedBaptismId
            : undefined;

        if (!resolvedCommunionId || !resolvedBaptismId) {
          throw new Error('No communion selected to link confirmation.');
        }

        const itemId = await enqueueOfflineSubmission(
          {
            kind: 'confirmation_create',
            payload: {
              effectiveParishId,
              effectiveParishName,
              externalCommunion,
              branch: {
                type: 'use_existing_ids',
                baptismId: resolvedBaptismId,
                communionId: resolvedCommunionId,
              },
              form,
            },
          },
          { draftId: draftId ?? undefined }
        );

        setQueuedItemId(itemId);
        return;
      }

      let communionId: number;
      let baptismId: number;

      if (baptismSource === 'external') {
        const createdBaptism = await createBaptismWithCertificate(
          effectiveParishId!,
          certificateFile!,
          {
            baptismName: externalBaptism.baptismName.trim(),
            surname: externalBaptism.surname.trim(),
            otherNames: externalBaptism.otherNames.trim(),
            gender: externalBaptism.gender,
            fathersName: externalBaptism.fathersName.trim(),
            mothersName: externalBaptism.mothersName.trim(),
            baptisedChurchAddress: externalBaptism.baptisedChurchAddress.trim(),
          }
        );
        baptismId = createdBaptism.id;
        if (communionSource === 'this_church') {
          const currentParishName = parishes.find((p) => p.id === effectiveParishId)?.parishName ?? '';
          const communion = await createCommunion({
            baptismId: createdBaptism.id,
            communionDate: externalCommunion.communionDate,
            officiatingPriest: externalCommunion.officiatingPriest,
            parish: currentParishName,
            baptismCertificatePath: createdBaptism.certificatePath,
          });
          communionId = communion.id;
        } else {
          const created = await createCommunionWithCommunionCertificate(
            {
              baptismId: createdBaptism.id,
              communionDate: externalCommunion.communionDate,
              officiatingPriest: externalCommunion.officiatingPriest,
              parish: externalCommunion.communionChurchAddress.trim(),
            },
            communionCertificateFile!,
            createdBaptism.certificatePath
          );
          communionId = created.id;
        }
      } else if (communionSource === 'other_church' && selectedBaptism && communionCertificateFile) {
        const created = await createCommunionWithCommunionCertificate(
          {
            baptismId: selectedBaptism.id,
            communionDate: externalCommunion.communionDate,
            officiatingPriest: externalCommunion.officiatingPriest,
            parish: externalCommunion.communionChurchAddress.trim(),
          },
          communionCertificateFile
        );
        communionId = created.id;
        baptismId = selectedBaptism.id;
      } else if (selectedCommunionId && selectedCommunion) {
        communionId = selectedCommunion.id;
        baptismId = selectedCommunion.baptismId;
      } else {
        if (!communionByBaptism) throw new Error('No communion selected');
        communionId = communionByBaptism.id;
        baptismId = selectedBaptismId;
      }

      await createConfirmation({
        baptismId,
        communionId,
        confirmationDate: form.confirmationDate,
        officiatingBishop: form.officiatingBishop,
        parish: form.parish || undefined,
      });
      router.push('/confirmations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create confirmation');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
  const showCommunionSection = true;
  const effectiveParishName = parishes.find((p) => p.id === effectiveParishId)?.parishName ?? '';

  const canSubmit = (() => {
    if (!form.confirmationDate.trim() || !form.officiatingBishop.trim()) return false;
    if (baptismSource === 'this_parish') {
      if (selectedBaptismId <= 0 && !selectedCommunionId) return false;
      if (communionByBaptism || selectedCommunionId) return true;
      if (communionSource === 'this_church') return false;
      return !!(
        (isOnline ? communionCertificateFile?.size : communionCertificateFileMetaFromDraft?.fileRefId) &&
        externalCommunion.baptismName.trim() &&
        externalCommunion.surname.trim() &&
        externalCommunion.communionChurchAddress.trim() &&
        externalCommunion.communionDate.trim() &&
        externalCommunion.officiatingPriest.trim()
      );
    }
    if (
      (isOnline ? !certificateFile?.size : !certificateFileMetaFromDraft?.fileRefId) ||
      !externalBaptism.baptismName.trim() ||
      !externalBaptism.surname.trim()
    ) {
      return false;
    }
    if (!externalBaptism.fathersName.trim() || !externalBaptism.mothersName.trim()) return false;
    if (communionSource === 'this_church') {
      return !!(externalCommunion.communionDate.trim() && externalCommunion.officiatingPriest.trim());
    }
    return !!(
      (isOnline ? communionCertificateFile?.size : communionCertificateFileMetaFromDraft?.fileRefId) &&
      externalCommunion.baptismName.trim() &&
      externalCommunion.surname.trim() &&
      externalCommunion.communionChurchAddress.trim() &&
      externalCommunion.communionDate.trim() &&
      externalCommunion.officiatingPriest.trim()
    );
  })();

  return (
    <ConfirmationCreateForm
      cardClass={cardClass}
      showCommunionSection={showCommunionSection}
      effectiveParishName={effectiveParishName}
      baptismSource={baptismSource}
      baptisms={baptisms}
      setBaptismSource={setBaptismSource}
      setCertificateFile={setCertificateFileWithDraftClear}
      setExternalBaptism={setExternalBaptism}
      setSelectedBaptismId={setSelectedBaptismId}
      setSearchQuery={setSearchQuery}
      setCommunionSource={setCommunionSource}
      setCommunionCertificateFile={setCommunionCertificateFileWithDraftClear}
      selectedBaptism={selectedBaptism}
      fullNameBaptism={fullNameBaptism}
      formatBaptismDate={formatBaptismDate}
      searchInputRef={searchInputRef}
      setSearchFocused={setSearchFocused}
      searchQuery={searchQuery}
      searchFocused={searchFocused}
      filteredBaptisms={filteredBaptisms}
      handleSubmit={handleSubmit}
      externalBaptism={externalBaptism}
      setExternalCommunion={setExternalCommunion}
      certificateFile={certificateFile}
      externalCommunion={externalCommunion}
      parishes={parishes}
      communionSource={communionSource}
      communionCertificateFile={communionCertificateFile}
      communionByBaptism={communionByBaptism}
      fullNameCommunion={fullNameCommunion}
      formatDisplayDate={formatDisplayDate}
      selectedBaptismId={selectedBaptismId}
      setForm={setForm}
      form={form}
      error={error}
      submitting={submitting}
      canSubmit={canSubmit}
      draftRecord={draftRecord}
      draftStatus={draftStatus}
      handleSaveDraft={handleSaveDraft}
      handleResumeDraft={handleResumeDraft}
      handleDiscardDraft={handleDiscardDraft}
      communionSearchQuery={communionSearchQuery}
      setCommunionSearchQuery={setCommunionSearchQuery}
      communionSearchFocused={communionSearchFocused}
      setCommunionSearchFocused={setCommunionSearchFocused}
      communionSearchInputRef={communionSearchInputRef}
      filteredCommunions={filteredCommunions}
      selectedCommunionId={selectedCommunionId}
      setSelectedCommunionId={setSelectedCommunionId}
      selectedCommunion={selectedCommunion}
      certificateFileNameFromDraft={certificateFileMetaFromDraft?.name ?? null}
      communionCertificateFileNameFromDraft={communionCertificateFileMetaFromDraft?.name ?? null}
      certificateAttachmentWarning={certificateAttachmentWarning}
      communionAttachmentWarning={communionAttachmentWarning}
      offlineQueueItemStatus={queuedItem?.status}
      offlineQueueItemError={queuedItem?.lastError}
      onOfflineQueueRetry={queuedItem?.status === 'failed' ? () => void retryOfflineQueueItem(queuedItem.id) : undefined}
    />
  );
}
