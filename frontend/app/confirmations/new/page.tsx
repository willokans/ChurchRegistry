'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { useParish } from '@/context/ParishContext';
import {
  fetchBaptisms,
  fetchCommunions,
  createConfirmation,
  createBaptismWithCertificate,
  createCommunion,
  createCommunionWithCommunionCertificate,
  type BaptismResponse,
  type FirstHolyCommunionResponse,
  type ConfirmationRequest,
} from '@/lib/api';

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

export default function ConfirmationCreatePage() {
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
  const [communionCertificateFile, setCommunionCertificateFile] = useState<File | null>(null);
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

  useEffect(() => {
    if (effectiveParishId === null || Number.isNaN(effectiveParishId)) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchBaptisms(effectiveParishId), fetchCommunions(effectiveParishId)])
      .then(([baptismList, communionList]) => {
        if (!cancelled) {
          setBaptisms(baptismList);
          setCommunions(communionList);
          const defaultParish = parishes.find((p) => p.id === effectiveParishId);
          setExternalCommunion((prev) => ({
            ...prev,
            parish: defaultParish?.parishName ?? prev.parish,
          }));
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

  const selectedBaptism = selectedBaptismId ? baptisms.find((b) => b.id === selectedBaptismId) : null;
  const selectedCommunion = selectedCommunionId ? communions.find((c) => c.id === selectedCommunionId) : null;

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
    return React.createElement(
      AuthenticatedLayout,
      null,
      React.createElement('h1', { className: 'text-2xl font-serif font-semibold text-sancta-maroon' }, 'New Confirmation'),
      React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Select a parish from the confirmations list first.'),
      React.createElement(Link, { href: '/confirmations', className: 'mt-4 inline-block text-sancta-maroon hover:underline' }, '\u2190 Back to Confirmations')
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
        if (!communionCertificateFile || communionCertificateFile.size === 0) {
          setError('Upload a Holy Communion certificate when Communion was in another church.');
          return;
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
      if (!certificateFile || certificateFile.size === 0) {
        setError('Upload a baptism certificate when selecting Baptism from another Parish.');
        return;
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
        if (!communionCertificateFile || communionCertificateFile.size === 0) {
          setError('Upload a Holy Communion certificate when Communion was in another church.');
          return;
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
    return React.createElement(
      AuthenticatedLayout,
      null,
      React.createElement('p', { className: 'text-gray-600' }, 'Loading\u2026')
    );
  }

  const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
  const showCommunionSection = true;
  const effectiveParishName = parishes.find((p) => p.id === effectiveParishId)?.parishName ?? '';

  return React.createElement(ConfirmationCreateForm, {
    cardClass,
    showCommunionSection,
    effectiveParishName,
    baptismSource,
    baptisms,
    setBaptismSource,
    setCertificateFile,
    setExternalBaptism,
    setSelectedBaptismId,
    setSearchQuery,
    setCommunionSource,
    setCommunionCertificateFile,
    selectedBaptism,
    fullNameBaptism,
    formatBaptismDate,
    searchInputRef,
    setSearchFocused,
    searchQuery,
    searchFocused,
    filteredBaptisms,
    handleSubmit,
    externalBaptism,
    setExternalCommunion,
    certificateFile,
    externalCommunion,
    parishes,
    communionSource,
    communionCertificateFile,
    communionByBaptism,
    fullNameCommunion,
    formatDisplayDate,
    selectedBaptismId,
    setForm,
    form,
    error,
    submitting,
    communionSearchQuery,
    setCommunionSearchQuery,
    communionSearchFocused,
    setCommunionSearchFocused,
    communionSearchInputRef,
    filteredCommunions,
    selectedCommunionId,
    setSelectedCommunionId,
    selectedCommunion,
  });
}

