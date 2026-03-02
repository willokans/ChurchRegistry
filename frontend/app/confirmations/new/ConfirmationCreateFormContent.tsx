'use client';

import React from 'react';
import Link from 'next/link';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import type { BaptismResponse, FirstHolyCommunionResponse, ConfirmationRequest } from '@/lib/api';
import type { ConfirmationCreateFormProps } from './ConfirmationCreateForm';

export type ConfirmationCreateFormContentProps = ConfirmationCreateFormProps & {
  showNoBaptisms: boolean;
};

export default function ConfirmationCreateFormContent(
  props: ConfirmationCreateFormContentProps
) {
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
  } = props;

  return (
    <>
      <div className="md:hidden space-y-4">
        <AddRecordDesktopOnlyMessage />
        <Link href="/confirmations" className="inline-block text-sancta-maroon hover:underline">
          ← Back to Confirmations
        </Link>
      </div>
      <div className="hidden md:block space-y-6">
        <div>
          <Link href="/confirmations" className="text-sancta-maroon hover:underline">
            ← Back to Confirmations
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">New Confirmation</h1>
          <p className="mt-1 text-gray-600">Register a parishioner&apos;s confirmation.</p>
        </div>

        {showNoBaptisms ? (
          <div className={cardClass}>
            <p className="text-gray-600">No baptisms in this parish. Record a baptism first.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-gray-900">Select Baptism Record</h2>
                <div className="mt-4 flex flex-wrap gap-6">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="baptismSource"
                      checked={baptismSource === 'this_parish'}
                      onChange={() => {
                        setBaptismSource('this_parish');
                        setCertificateFile(null);
                        setExternalBaptism({
                          baptismName: '',
                          surname: '',
                          otherNames: '',
                          gender: 'MALE',
                          fathersName: '',
                          mothersName: '',
                          baptisedChurchAddress: '',
                        });
                      }}
                      className="mt-1 text-sancta-maroon focus:ring-sancta-maroon"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Baptism in this Parish</span>
                      <span className="block text-sm text-gray-500">Select if baptized in this church</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="baptismSource"
                      checked={baptismSource === 'external'}
                      onChange={() => setBaptismSource('external')}
                      className="mt-1 text-sancta-maroon focus:ring-sancta-maroon"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Baptism from another Parish</span>
                      <span className="block text-sm text-gray-500">Select if baptized elsewhere (upload certificate)</span>
                    </span>
                  </label>
                </div>

                {baptismSource === 'this_parish' &&
                  (selectedBaptism ? (
                    <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex gap-3 min-w-0">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"
                          aria-hidden
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{fullNameBaptism(selectedBaptism)}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Date of Baptism: {formatBaptismDate(selectedBaptism.dateOfBirth)}
                            {(selectedBaptism.fathersName || selectedBaptism.mothersName) &&
                              ` · Father: ${selectedBaptism.fathersName ?? '—'} · Mother: ${selectedBaptism.mothersName ?? '—'}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBaptismId(0);
                          setSelectedCommunionId(0);
                          setSearchQuery('');
                          setCommunionSearchQuery('');
                          setTimeout(() => searchInputRef.current?.focus(), 0);
                        }}
                        className="shrink-0 text-sm font-medium text-sancta-maroon hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label htmlFor="baptism-search" className="block text-sm font-medium text-gray-700">
                        Search baptism record
                      </label>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Search by name, date of birth, or parents&apos; names. Click a result to select.
                      </p>
                      <div className="relative mt-2">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          aria-hidden
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </span>
                        <input
                          ref={searchInputRef}
                          id="baptism-search"
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setSearchFocused(true)}
                          onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                          placeholder="Search by name, date of birth, or parents' names"
                          className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Search baptism records"
                          aria-expanded={
                            searchFocused && (filteredBaptisms.length > 0 || searchQuery.trim().length > 0)
                          }
                          aria-autocomplete="list"
                          role="combobox"
                          aria-controls="baptism-results-list"
                        />
                        {(searchFocused || searchQuery.trim()) && (
                          <ul
                            id="baptism-results-list"
                            role="listbox"
                            className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                          >
                            {filteredBaptisms.length === 0 ? (
                              <li className="px-3 py-3 text-sm text-gray-500" role="option" aria-selected={false}>
                                No baptism records match your search.
                              </li>
                            ) : (
                              filteredBaptisms.map((b) => (
                                <li
                                  key={b.id}
                                  role="option"
                                  aria-selected={selectedBaptismId === b.id}
                                  className="cursor-pointer px-3 py-2.5 text-sm text-gray-900 hover:bg-sancta-maroon/10 focus:bg-sancta-maroon/10 focus:outline-none"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSelectedCommunionId(0);
                                    setSelectedBaptismId(b.id);
                                    setSearchQuery('');
                                    setSearchFocused(false);
                                  }}
                                >
                                  <span className="font-medium">{fullNameBaptism(b)}</span>
                                  <span className="text-gray-600">
                                    {' '}
                                    · {formatBaptismDate(b.dateOfBirth)}
                                    {(b.fathersName || b.mothersName) &&
                                      ` · ${b.fathersName ?? '—'} / ${b.mothersName ?? '—'}`}
                                  </span>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}

                {baptismSource === 'external' && (
                  <>
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-gray-600">
                        Enter details from the baptism certificate (from the other parish).
                      </p>
                      <div>
                        <label htmlFor="external-baptismName" className="block text-sm font-medium text-gray-700">
                          Baptism Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="external-baptismName"
                          type="text"
                          value={externalBaptism.baptismName}
                          onChange={(e) =>
                            setExternalBaptism((p) => ({ ...p, baptismName: e.target.value }))
                          }
                          placeholder="First name as on certificate"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Baptism name"
                        />
                      </div>
                      <div>
                        <label htmlFor="external-surname" className="block text-sm font-medium text-gray-700">
                          Surname <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="external-surname"
                          type="text"
                          value={externalBaptism.surname}
                          onChange={(e) => setExternalBaptism((p) => ({ ...p, surname: e.target.value }))}
                          placeholder="Surname as on certificate"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Surname"
                        />
                      </div>
                      <div>
                        <label htmlFor="external-otherNames" className="block text-sm font-medium text-gray-700">
                          Other Names <span className="text-gray-500">(Optional)</span>
                        </label>
                        <input
                          id="external-otherNames"
                          type="text"
                          value={externalBaptism.otherNames}
                          onChange={(e) =>
                            setExternalBaptism((p) => ({ ...p, otherNames: e.target.value }))
                          }
                          placeholder="Middle names if any"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Other names"
                        />
                      </div>
                      <div>
                        <label htmlFor="external-gender" className="block text-sm font-medium text-gray-700">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="external-gender"
                          value={externalBaptism.gender}
                          onChange={(e) =>
                            setExternalBaptism((p) => ({ ...p, gender: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Gender"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="external-fathersName" className="block text-sm font-medium text-gray-700">
                          Father&apos;s Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="external-fathersName"
                          type="text"
                          value={externalBaptism.fathersName}
                          onChange={(e) =>
                            setExternalBaptism((p) => ({ ...p, fathersName: e.target.value }))
                          }
                          placeholder="As on certificate"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Father's name"
                        />
                      </div>
                      <div>
                        <label htmlFor="external-mothersName" className="block text-sm font-medium text-gray-700">
                          Mother&apos;s Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="external-mothersName"
                          type="text"
                          value={externalBaptism.mothersName}
                          onChange={(e) =>
                            setExternalBaptism((p) => ({ ...p, mothersName: e.target.value }))
                          }
                          placeholder="As on certificate"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Mother's name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="external-baptisedChurchAddress"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Baptised Church Address <span className="text-gray-500">(Optional)</span>
                        </label>
                        <textarea
                          id="external-baptisedChurchAddress"
                          rows={2}
                          value={externalBaptism.baptisedChurchAddress}
                          onChange={(e) =>
                            setExternalBaptism((p) => ({ ...p, baptisedChurchAddress: e.target.value }))
                          }
                          placeholder="Address of the church where baptism took place"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon resize-y"
                          aria-label="Baptised church address"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Upload Baptism Certificate <span className="text-red-500">(Required)</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500">Select if baptized in another parish</p>
                      <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3">
                        <span className="text-gray-400" aria-hidden>
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </span>
                        <span className="text-sm text-gray-500">
                          {certificateFile ? certificateFile.name : 'No file chosen'}
                        </span>
                        <label className="ml-auto cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          {certificateFile ? 'Change file' : 'Browse Files'}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {showCommunionSection && (
                <div className={cardClass}>
                  <h2 className="text-lg font-semibold text-gray-900">Select Holy Communion</h2>
                  {baptismSource === 'this_parish' && selectedBaptismId && communionByBaptism ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-3">This baptism has a Holy Communion record in this church.</p>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="font-medium text-gray-900">{fullNameCommunion(communionByBaptism)}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          Communion Date: {formatDisplayDate(communionByBaptism.communionDate)} ·{' '}
                          {communionByBaptism.officiatingPriest} · {communionByBaptism.parish}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 flex flex-wrap gap-6">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="communionSource"
                            checked={communionSource === 'this_church'}
                            onChange={() => setCommunionSource('this_church')}
                            className="mt-1 text-sancta-maroon focus:ring-sancta-maroon"
                          />
                          <span>
                            <span className="font-medium text-gray-900">Holy Communion in this church</span>
                            <span className="block text-sm text-gray-500">Select if received First Holy Communion here</span>
                          </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="communionSource"
                            checked={communionSource === 'other_church'}
                            onChange={() => setCommunionSource('other_church')}
                            className="mt-1 text-sancta-maroon focus:ring-sancta-maroon"
                          />
                          <span>
                            <span className="font-medium text-gray-900">Holy Communion in another church</span>
                            <span className="block text-sm text-gray-500">Upload communion certificate</span>
                          </span>
                        </label>
                      </div>

                  {communionSource === 'this_church' && baptismSource === 'this_parish' && (
                    <>
                      {selectedBaptismId && communionByBaptism ? (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-3">This baptism has a Holy Communion record in this church.</p>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="font-medium text-gray-900">{fullNameCommunion(communionByBaptism)}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              Communion Date: {formatDisplayDate(communionByBaptism.communionDate)} ·{' '}
                              {communionByBaptism.officiatingPriest} · {communionByBaptism.parish}
                            </p>
                          </div>
                        </div>
                      ) : selectedCommunion ? (
                        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <div className="flex gap-3 min-w-0">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"
                              aria-hidden
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{fullNameCommunion(selectedCommunion)}</p>
                              <p className="text-sm text-gray-600 mt-0.5">
                                Communion Date: {formatDisplayDate(selectedCommunion.communionDate)} · {selectedCommunion.officiatingPriest} · {selectedCommunion.parish}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCommunionId(0);
                              setCommunionSearchQuery('');
                              setTimeout(() => communionSearchInputRef.current?.focus(), 0);
                            }}
                            className="shrink-0 text-sm font-medium text-sancta-maroon hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <label htmlFor="communion-search" className="block text-sm font-medium text-gray-700">
                            Search Holy Communion record
                          </label>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Search by name, communion date, or officiating priest. Click a result to select.
                          </p>
                          <div className="relative mt-2">
                            <span
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              aria-hidden
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </span>
                            <input
                              ref={communionSearchInputRef}
                              id="communion-search"
                              type="search"
                              value={communionSearchQuery}
                              onChange={(e) => setCommunionSearchQuery(e.target.value)}
                              onFocus={() => setCommunionSearchFocused(true)}
                              onBlur={() => setTimeout(() => setCommunionSearchFocused(false), 150)}
                              placeholder="Search by name, communion date, or priest"
                              className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                              aria-label="Search Holy Communion records"
                              aria-expanded={
                                communionSearchFocused && (filteredCommunions.length > 0 || communionSearchQuery.trim().length > 0)
                              }
                              aria-autocomplete="list"
                              role="combobox"
                              aria-controls="communion-results-list"
                            />
                            {(communionSearchFocused || communionSearchQuery.trim()) && (
                              <ul
                                id="communion-results-list"
                                role="listbox"
                                className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                              >
                                {filteredCommunions.length === 0 ? (
                                  <li className="px-3 py-3 text-sm text-gray-500" role="option" aria-selected={false}>
                                    No Holy Communion records match your search.
                                  </li>
                                ) : (
                                  filteredCommunions.map((c) => (
                                    <li
                                      key={c.id}
                                      role="option"
                                      aria-selected={selectedCommunionId === c.id}
                                      className="cursor-pointer px-3 py-2.5 text-sm text-gray-900 hover:bg-sancta-maroon/10 focus:bg-sancta-maroon/10 focus:outline-none"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSelectedCommunionId(c.id);
                                        setSelectedBaptismId(c.baptismId);
                                        setCommunionSearchQuery('');
                                        setCommunionSearchFocused(false);
                                      }}
                                    >
                                      <span className="font-medium">{fullNameCommunion(c)}</span>
                                      <span className="text-gray-600">
                                        {' '}
                                        · {formatDisplayDate(c.communionDate)} · {c.officiatingPriest}
                                        {c.parish ? ` · ${c.parish}` : ''}
                                      </span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {communionSource === 'this_church' && baptismSource === 'external' && (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-gray-600">Enter communion details for this parish.</p>
                      <div>
                        <label htmlFor="external-this-church-communionDate" className="block text-sm font-medium text-gray-700">
                          Communion Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="external-this-church-communionDate"
                          type="date"
                          value={externalCommunion.communionDate}
                          onChange={(e) => setExternalCommunion((p) => ({ ...p, communionDate: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Communion date"
                        />
                      </div>
                      <div>
                        <label htmlFor="external-this-church-officiatingPriest" className="block text-sm font-medium text-gray-700">
                          Officiating Priest <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="external-this-church-officiatingPriest"
                          type="text"
                          value={externalCommunion.officiatingPriest}
                          onChange={(e) => setExternalCommunion((p) => ({ ...p, officiatingPriest: e.target.value }))}
                          placeholder="Priest who celebrated First Holy Communion"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon"
                          aria-label="Officiating priest"
                        />
                      </div>
                      {effectiveParishName && (
                        <p className="text-sm text-gray-600">
                          Parish: <span className="font-medium text-gray-900">{effectiveParishName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {communionSource === 'other_church' && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="other-baptismName" className="block text-sm font-medium text-gray-700">Baptism Name <span className="text-red-500">*</span></label>
                        <input id="other-baptismName" type="text" value={externalCommunion.baptismName} onChange={(e) => setExternalCommunion((p) => ({ ...p, baptismName: e.target.value }))} placeholder="As on baptism record" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Baptism name" />
                      </div>
                      <div>
                        <label htmlFor="other-surname" className="block text-sm font-medium text-gray-700">Surname <span className="text-red-500">*</span></label>
                        <input id="other-surname" type="text" value={externalCommunion.surname} onChange={(e) => setExternalCommunion((p) => ({ ...p, surname: e.target.value }))} placeholder="As on baptism record" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Surname" />
                      </div>
                      <div>
                        <label htmlFor="other-communionChurchAddress" className="block text-sm font-medium text-gray-700">Holy Communion Church Address <span className="text-red-500">*</span></label>
                        <textarea id="other-communionChurchAddress" rows={2} value={externalCommunion.communionChurchAddress} onChange={(e) => setExternalCommunion((p) => ({ ...p, communionChurchAddress: e.target.value }))} placeholder="Address of church where Communion was received" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon resize-y" aria-label="Holy Communion church address" />
                      </div>
                      <div>
                        <label htmlFor="other-communionDate" className="block text-sm font-medium text-gray-700">Communion Date <span className="text-red-500">*</span></label>
                        <input id="other-communionDate" type="date" value={externalCommunion.communionDate} onChange={(e) => setExternalCommunion((p) => ({ ...p, communionDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Communion date" />
                      </div>
                      <div>
                        <label htmlFor="other-officiatingPriest" className="block text-sm font-medium text-gray-700">Officiating Priest <span className="text-red-500">*</span></label>
                        <input id="other-officiatingPriest" type="text" value={externalCommunion.officiatingPriest} onChange={(e) => setExternalCommunion((p) => ({ ...p, officiatingPriest: e.target.value }))} placeholder="Priest who celebrated First Holy Communion" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Officiating priest" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Upload Holy Communion Certificate <span className="text-red-500">(Required)</span></label>
                        <p className="mt-1 text-xs text-gray-500">Required when Communion was in another church</p>
                        <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3">
                          <span className="text-sm text-gray-500">{communionCertificateFile ? communionCertificateFile.name : 'No file chosen'}</span>
                          <label className="ml-auto cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            {communionCertificateFile ? 'Change file' : 'Browse Files'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setCommunionCertificateFile(e.target.files?.[0] ?? null)} />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
                  )}
                </div>
              )}

              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-gray-900">Confirmation Details</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="confirmationDate" className="block text-sm font-medium text-gray-700">Confirmation Date <span className="text-red-500">*</span></label>
                    <input id="confirmationDate" type="date" value={form.confirmationDate} onChange={(e) => setForm((f) => ({ ...f, confirmationDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Confirmation date" />
                  </div>
                  <div>
                    <label htmlFor="officiatingBishop" className="block text-sm font-medium text-gray-700">Officiating Bishop <span className="text-red-500">*</span></label>
                    <input id="officiatingBishop" type="text" value={form.officiatingBishop} onChange={(e) => setForm((f) => ({ ...f, officiatingBishop: e.target.value }))} placeholder="Bishop who celebrated Confirmation" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Officiating bishop" />
                  </div>
                  <div>
                    <label htmlFor="confirmation-parish" className="block text-sm font-medium text-gray-700">Parish <span className="text-gray-500">(Optional)</span></label>
                    <input id="confirmation-parish" type="text" value={form.parish ?? ''} onChange={(e) => setForm((f) => ({ ...f, parish: e.target.value }))} placeholder="Venue or parish if different" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon" aria-label="Parish (optional)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {showCommunionSection && (communionByBaptism || selectedCommunion) && (
                <div className={cardClass}>
                  <h2 className="text-lg font-semibold text-gray-900">Holy Communion Record</h2>
                  <div className="mt-4 text-sm">
                    {(() => {
                      const c = communionByBaptism ?? selectedCommunion!;
                      return (
                        <>
                          <p className="font-medium text-gray-900">{fullNameCommunion(c)}</p>
                          <p className="text-gray-600 mt-1">{formatDisplayDate(c.communionDate)} · {c.officiatingPriest}</p>
                          <p className="text-gray-600">{c.parish}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sancta-maroon px-4 py-3 min-h-[44px] text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save Confirmation'}
                </button>
                <Link href="/confirmations" className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 min-h-[44px] text-gray-700 font-medium hover:bg-gray-50">Cancel</Link>
                <p className="text-xs text-gray-500">* Required fields</p>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
