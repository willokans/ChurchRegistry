'use client';

import React from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import type { BaptismResponse, FirstHolyCommunionResponse, ConfirmationRequest } from '@/lib/api';
import ConfirmationCreateFormContent from './ConfirmationCreateFormContent';

export interface ExternalBaptismState {
  baptismName: string;
  surname: string;
  otherNames: string;
  gender: string;
  fathersName: string;
  mothersName: string;
  baptisedChurchAddress: string;
}

export interface ExternalCommunionState {
  baptismName: string;
  surname: string;
  communionChurchAddress: string;
  communionDate: string;
  officiatingPriest: string;
  parish: string;
}

export interface ConfirmationCreateFormProps {
  cardClass: string;
  showCommunionSection: boolean;
  effectiveParishName?: string;
  baptismSource: 'this_parish' | 'external';
  baptisms: BaptismResponse[];
  setBaptismSource: React.Dispatch<React.SetStateAction<'this_parish' | 'external'>>;
  setCertificateFile: React.Dispatch<React.SetStateAction<File | null>>;
  setExternalBaptism: React.Dispatch<React.SetStateAction<ExternalBaptismState>>;
  setSelectedBaptismId: React.Dispatch<React.SetStateAction<number>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setCommunionSource: React.Dispatch<React.SetStateAction<'this_church' | 'other_church'>>;
  setCommunionCertificateFile: React.Dispatch<React.SetStateAction<File | null>>;
  selectedBaptism: BaptismResponse | null | undefined;
  fullNameBaptism: (b: BaptismResponse) => string;
  formatBaptismDate: (s: string) => string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  setSearchFocused: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  searchFocused: boolean;
  filteredBaptisms: BaptismResponse[];
  handleSubmit: (e: React.FormEvent) => void;
  externalBaptism: ExternalBaptismState;
  setExternalCommunion: React.Dispatch<React.SetStateAction<ExternalCommunionState>>;
  certificateFile: File | null;
  externalCommunion: ExternalCommunionState;
  parishes: { id: number; parishName: string }[];
  communionSource: 'this_church' | 'other_church';
  communionCertificateFile: File | null;
  communionByBaptism: FirstHolyCommunionResponse | null | undefined;
  fullNameCommunion: (c: FirstHolyCommunionResponse) => string;
  formatDisplayDate: (s: string) => string;
  selectedBaptismId: number;
  setForm: React.Dispatch<React.SetStateAction<ConfirmationRequest>>;
  form: ConfirmationRequest;
  error: string | null;
  submitting: boolean;
  communionSearchQuery: string;
  setCommunionSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  communionSearchFocused: boolean;
  setCommunionSearchFocused: React.Dispatch<React.SetStateAction<boolean>>;
  communionSearchInputRef: React.RefObject<HTMLInputElement>;
  filteredCommunions: FirstHolyCommunionResponse[];
  selectedCommunionId: number;
  setSelectedCommunionId: React.Dispatch<React.SetStateAction<number>>;
  selectedCommunion: FirstHolyCommunionResponse | null;
}

export default function ConfirmationCreateForm(props: ConfirmationCreateFormProps) {
  const {
    cardClass,
    showCommunionSection,
    effectiveParishName = '',
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
  } = props;

  const showNoBaptisms = baptisms.length === 0 && baptismSource === 'this_parish';

  return React.createElement(
    AuthenticatedLayout,
    null,
    React.createElement(ConfirmationCreateFormContent, {
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
      showNoBaptisms,
      communionSearchQuery,
      setCommunionSearchQuery,
      communionSearchFocused,
      setCommunionSearchFocused,
      communionSearchInputRef,
      filteredCommunions,
      selectedCommunionId,
      setSelectedCommunionId,
      selectedCommunion,
    })
  );
}
