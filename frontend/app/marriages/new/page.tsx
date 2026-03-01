'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import AddRecordDesktopOnlyMessage from '@/components/AddRecordDesktopOnlyMessage';
import { useParish } from '@/context/ParishContext';
import {
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  createMarriageWithParties,
  uploadMarriageCertificate,
  type BaptismResponse,
  type FirstHolyCommunionResponse,
  type ConfirmationResponse,
  type MarriagePartyPayload,
  type CreateMarriageWithPartiesRequest,
} from '@/lib/api';

function fullNameBaptism(b: BaptismResponse): string {
  return [b.baptismName, b.otherNames, b.surname].filter(Boolean).join(' ');
}
function fullNameCommunion(c: FirstHolyCommunionResponse): string {
  return [c.baptismName, c.otherNames, c.surname].filter(Boolean).join(' ') || `Communion #${c.id}`;
}
function fullNameConfirmation(c: ConfirmationResponse): string {
  return [c.baptismName, c.otherNames, c.surname].filter(Boolean).join(' ') || `Confirmation #${c.id}`;
}

const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sancta-maroon focus:outline-none focus:ring-1 focus:ring-sancta-maroon';
const labelClass = 'block text-sm font-medium text-gray-700';

type SacramentSource = 'this_parish' | 'external';

const emptyParty: MarriagePartyPayload = {
  fullName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  nationality: '',
  residentialAddress: '',
  phone: '',
  email: '',
  occupation: '',
  maritalStatus: '',
  baptismId: undefined,
  communionId: undefined,
  confirmationId: undefined,
  baptismCertificatePath: '',
  communionCertificatePath: '',
  confirmationCertificatePath: '',
  baptismChurch: '',
  communionChurch: '',
  confirmationChurch: '',
};

export default function MarriageCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parishIdParam = searchParams.get('parishId');
  const parishIdFromQuery = parishIdParam ? parseInt(parishIdParam, 10) : null;
  const { parishId: contextParishId, parishes } = useParish();
  const effectiveParishId = parishIdFromQuery ?? contextParishId ?? null;

  const [baptisms, setBaptisms] = useState<BaptismResponse[]>([]);
  const [communions, setCommunions] = useState<FirstHolyCommunionResponse[]>([]);
  const [confirmations, setConfirmations] = useState<ConfirmationResponse[]>([]);
  const [loading, setLoading] = useState(!!effectiveParishId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groom, setGroom] = useState<MarriagePartyPayload>({ ...emptyParty });
  const [bride, setBride] = useState<MarriagePartyPayload>({ ...emptyParty });
  const [groomBaptismSource, setGroomBaptismSource] = useState<SacramentSource>('this_parish');
  const [groomCommunionSource, setGroomCommunionSource] = useState<SacramentSource>('this_parish');
  const [groomConfirmationSource, setGroomConfirmationSource] = useState<SacramentSource>('this_parish');
  const [brideBaptismSource, setBrideBaptismSource] = useState<SacramentSource>('this_parish');
  const [brideCommunionSource, setBrideCommunionSource] = useState<SacramentSource>('this_parish');
  const [brideConfirmationSource, setBrideConfirmationSource] = useState<SacramentSource>('this_parish');

  const [marriageDetails, setMarriageDetails] = useState({
    marriageDate: '',
    marriageTime: '',
    churchName: '',
    marriageRegister: '',
    diocese: '',
    civilRegistryNumber: '',
    dispensationGranted: false,
    canonicalNotes: '',
    officiatingPriest: '',
    parish: '',
  });

  const [witnesses, setWitnesses] = useState<Array<{ fullName: string; phone: string; address: string }>>([
    { fullName: '', phone: '', address: '' },
    { fullName: '', phone: '', address: '' },
  ]);

  useEffect(() => {
    if (effectiveParishId === null || Number.isNaN(effectiveParishId)) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchBaptisms(effectiveParishId),
      fetchCommunions(effectiveParishId),
      fetchConfirmations(effectiveParishId),
    ])
      .then(([bList, cList, confList]) => {
        if (!cancelled) {
          setBaptisms(bList);
          setCommunions(cList);
          setConfirmations(confList);
          const parishName = parishes.find((p) => p.id === effectiveParishId)?.parishName ?? '';
          setMarriageDetails((d) => ({ ...d, parish: parishName, churchName: parishName }));
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load parish records');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveParishId, parishes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveParishId) return;
    if (!groom.fullName.trim()) {
      setError('Groom full name is required.');
      return;
    }
    if (!bride.fullName.trim()) {
      setError('Bride full name is required.');
      return;
    }
    if (!marriageDetails.marriageDate || !marriageDetails.officiatingPriest || !marriageDetails.parish) {
      setError('Marriage date, officiating priest, and parish are required.');
      return;
    }
    const witnessList = witnesses.filter((w) => w.fullName.trim());
    if (witnessList.length < 2) {
      setError('At least 2 witnesses are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateMarriageWithPartiesRequest = {
        marriage: {
          partnersName: `${groom.fullName.trim()} & ${bride.fullName.trim()}`,
          marriageDate: marriageDetails.marriageDate,
          marriageTime: marriageDetails.marriageTime || undefined,
          churchName: marriageDetails.churchName || undefined,
          marriageRegister: marriageDetails.marriageRegister || undefined,
          diocese: marriageDetails.diocese || undefined,
          civilRegistryNumber: marriageDetails.civilRegistryNumber || undefined,
          dispensationGranted: marriageDetails.dispensationGranted,
          canonicalNotes: marriageDetails.canonicalNotes || undefined,
          officiatingPriest: marriageDetails.officiatingPriest,
          parish: marriageDetails.parish,
        },
        groom: {
          ...groom,
          fullName: groom.fullName.trim(),
          baptismId: groomBaptismSource === 'this_parish' ? groom.baptismId : undefined,
          communionId: groomCommunionSource === 'this_parish' ? groom.communionId : undefined,
          confirmationId: groomConfirmationSource === 'this_parish' ? groom.confirmationId : undefined,
          baptismCertificatePath: groomBaptismSource === 'external' ? groom.baptismCertificatePath : undefined,
          communionCertificatePath: groomCommunionSource === 'external' ? groom.communionCertificatePath : undefined,
          confirmationCertificatePath: groomConfirmationSource === 'external' ? groom.confirmationCertificatePath : undefined,
        },
        bride: {
          ...bride,
          fullName: bride.fullName.trim(),
          baptismId: brideBaptismSource === 'this_parish' ? bride.baptismId : undefined,
          communionId: brideCommunionSource === 'this_parish' ? bride.communionId : undefined,
          confirmationId: brideConfirmationSource === 'this_parish' ? bride.confirmationId : undefined,
          baptismCertificatePath: brideBaptismSource === 'external' ? bride.baptismCertificatePath : undefined,
          communionCertificatePath: brideCommunionSource === 'external' ? bride.communionCertificatePath : undefined,
          confirmationCertificatePath: brideConfirmationSource === 'external' ? bride.confirmationCertificatePath : undefined,
        },
        witnesses: witnessList.map((w, i) => ({
          fullName: w.fullName.trim(),
          phone: w.phone.trim() || undefined,
          address: w.address.trim() || undefined,
          sortOrder: i,
        })),
      };
      await createMarriageWithParties(payload);
      router.push('/marriages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create marriage');
    } finally {
      setSubmitting(false);
    }
  }

  if (effectiveParishId === null || Number.isNaN(effectiveParishId)) {
    return (
      <AuthenticatedLayout>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Create Marriage Record</h1>
        <p className="mt-4 text-gray-600">Select a parish from the marriages list first.</p>
        <Link href="/marriages" className="mt-4 inline-block text-sancta-maroon hover:underline">
          ← Back to marriages
        </Link>
      </AuthenticatedLayout>
    );
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <p className="text-gray-600">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="md:hidden space-y-4">
        <AddRecordDesktopOnlyMessage />
        <Link href="/marriages" className="inline-block text-sancta-maroon hover:underline">
          ← Back to marriages
        </Link>
      </div>
      <div className="hidden md:block space-y-6">
        <div>
          <Link href="/marriages" className="text-sancta-maroon hover:underline">
            ← Back to marriages
          </Link>
        </div>
        <h1 className="text-2xl font-serif font-semibold text-sancta-maroon">Create Marriage Record</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Groom & Bride: two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Groom Information */}
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sancta-maroon/10 text-sancta-maroon" aria-hidden>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Groom Information
                <span className="text-gray-400" aria-hidden>›</span>
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="groom-fullName" className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <input id="groom-fullName" type="text" required value={groom.fullName} onChange={(e) => setGroom((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-dob" className={labelClass}>Date of Birth</label>
                  <input id="groom-dob" type="date" value={groom.dateOfBirth ?? ''} onChange={(e) => setGroom((p) => ({ ...p, dateOfBirth: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-pob" className={labelClass}>Place of Birth</label>
                  <input id="groom-pob" type="text" value={groom.placeOfBirth ?? ''} onChange={(e) => setGroom((p) => ({ ...p, placeOfBirth: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-nationality" className={labelClass}>Nationality</label>
                  <input id="groom-nationality" type="text" value={groom.nationality ?? ''} onChange={(e) => setGroom((p) => ({ ...p, nationality: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-address" className={labelClass}>Residential Address</label>
                  <input id="groom-address" type="text" value={groom.residentialAddress ?? ''} onChange={(e) => setGroom((p) => ({ ...p, residentialAddress: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-phone" className={labelClass}>Phone</label>
                  <input id="groom-phone" type="tel" value={groom.phone ?? ''} onChange={(e) => setGroom((p) => ({ ...p, phone: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-email" className={labelClass}>Email</label>
                  <input id="groom-email" type="email" value={groom.email ?? ''} onChange={(e) => setGroom((p) => ({ ...p, email: e.target.value || undefined }))} placeholder="Email" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-occupation" className={labelClass}>Occupation</label>
                  <input id="groom-occupation" type="text" value={groom.occupation ?? ''} onChange={(e) => setGroom((p) => ({ ...p, occupation: e.target.value || undefined }))} placeholder="Select Occupation" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="groom-maritalStatus" className={labelClass}>Marital Status</label>
                  <select id="groom-maritalStatus" value={groom.maritalStatus ?? ''} onChange={(e) => setGroom((p) => ({ ...p, maritalStatus: e.target.value || undefined }))} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Bachelor / Widower">Bachelor / Widower</option>
                    <option value="Single / Widow">Single / Widow</option>
                  </select>
                </div>
                {/* Groom sacraments: Baptism */}
                <SacramentSection
                  title="Baptism"
                  labelSearch="Select Baptism Record"
                  source={groomBaptismSource}
                  setSource={setGroomBaptismSource}
                  parishRecords={baptisms}
                  fullName={fullNameBaptism}
                  recordId={groom.baptismId}
                  setRecordId={(id) => setGroom((p) => ({ ...p, baptismId: id }))}
                  certificatePath={groom.baptismCertificatePath}
                  onCertificateUpload={async (file) => {
                    const { path: p } = await uploadMarriageCertificate(effectiveParishId!, file, 'baptism', 'groom');
                    setGroom((prev) => ({ ...prev, baptismCertificatePath: p }));
                  }}
                  churchName={groom.baptismChurch}
                  setChurchName={(v) => setGroom((p) => ({ ...p, baptismChurch: v }))}
                />
                {/* Groom: Holy Communion */}
                <SacramentSection
                  title="Holy Communion"
                  labelSearch="Select Communion Record"
                  source={groomCommunionSource}
                  setSource={setGroomCommunionSource}
                  parishRecords={communions}
                  fullName={fullNameCommunion}
                  recordId={groom.communionId}
                  setRecordId={(id) => setGroom((p) => ({ ...p, communionId: id }))}
                  certificatePath={groom.communionCertificatePath}
                  onCertificateUpload={async (file) => {
                    const { path: p } = await uploadMarriageCertificate(effectiveParishId!, file, 'communion', 'groom');
                    setGroom((prev) => ({ ...prev, communionCertificatePath: p }));
                  }}
                  churchName={groom.communionChurch}
                  setChurchName={(v) => setGroom((p) => ({ ...p, communionChurch: v }))}
                />
                {/* Groom: Confirmation */}
                <SacramentSection
                  title="Confirmation"
                  labelSearch="Select Confirmation Record"
                  source={groomConfirmationSource}
                  setSource={setGroomConfirmationSource}
                  parishRecords={confirmations}
                  fullName={fullNameConfirmation}
                  recordId={groom.confirmationId}
                  setRecordId={(id) => setGroom((p) => ({ ...p, confirmationId: id }))}
                  certificatePath={groom.confirmationCertificatePath}
                  onCertificateUpload={async (file) => {
                    const { path: p } = await uploadMarriageCertificate(effectiveParishId!, file, 'confirmation', 'groom');
                    setGroom((prev) => ({ ...prev, confirmationCertificatePath: p }));
                  }}
                  churchName={groom.confirmationChurch}
                  setChurchName={(v) => setGroom((p) => ({ ...p, confirmationChurch: v }))}
                />
              </div>
            </div>

            {/* Bride Information */}
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sancta-maroon/10 text-sancta-maroon" aria-hidden>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Bride Information
                <span className="text-gray-400" aria-hidden>›</span>
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="bride-fullName" className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <input id="bride-fullName" type="text" required value={bride.fullName} onChange={(e) => setBride((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-dob" className={labelClass}>Date of Birth</label>
                  <input id="bride-dob" type="date" value={bride.dateOfBirth ?? ''} onChange={(e) => setBride((p) => ({ ...p, dateOfBirth: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-pob" className={labelClass}>Place of Birth</label>
                  <input id="bride-pob" type="text" value={bride.placeOfBirth ?? ''} onChange={(e) => setBride((p) => ({ ...p, placeOfBirth: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-nationality" className={labelClass}>Nationality</label>
                  <input id="bride-nationality" type="text" value={bride.nationality ?? ''} onChange={(e) => setBride((p) => ({ ...p, nationality: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-address" className={labelClass}>Residential Address</label>
                  <input id="bride-address" type="text" value={bride.residentialAddress ?? ''} onChange={(e) => setBride((p) => ({ ...p, residentialAddress: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-phone" className={labelClass}>Phone</label>
                  <input id="bride-phone" type="tel" value={bride.phone ?? ''} onChange={(e) => setBride((p) => ({ ...p, phone: e.target.value || undefined }))} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-email" className={labelClass}>Email</label>
                  <input id="bride-email" type="email" value={bride.email ?? ''} onChange={(e) => setBride((p) => ({ ...p, email: e.target.value || undefined }))} placeholder="Email" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-occupation" className={labelClass}>Occupation</label>
                  <input id="bride-occupation" type="text" value={bride.occupation ?? ''} onChange={(e) => setBride((p) => ({ ...p, occupation: e.target.value || undefined }))} placeholder="Select Occupation" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bride-maritalStatus" className={labelClass}>Marital Status</label>
                  <select id="bride-maritalStatus" value={bride.maritalStatus ?? ''} onChange={(e) => setBride((p) => ({ ...p, maritalStatus: e.target.value || undefined }))} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Bachelor / Widower">Bachelor / Widower</option>
                    <option value="Single / Widow">Single / Widow</option>
                  </select>
                </div>
                <SacramentSection
                  title="Baptism"
                  labelSearch="Select Baptism Record"
                  source={brideBaptismSource}
                  setSource={setBrideBaptismSource}
                  parishRecords={baptisms}
                  fullName={fullNameBaptism}
                  recordId={bride.baptismId}
                  setRecordId={(id) => setBride((p) => ({ ...p, baptismId: id }))}
                  certificatePath={bride.baptismCertificatePath}
                  onCertificateUpload={async (file) => {
                    const { path: p } = await uploadMarriageCertificate(effectiveParishId!, file, 'baptism', 'bride');
                    setBride((prev) => ({ ...prev, baptismCertificatePath: p }));
                  }}
                  churchName={bride.baptismChurch}
                  setChurchName={(v) => setBride((p) => ({ ...p, baptismChurch: v }))}
                />
                <SacramentSection
                  title="Holy Communion"
                  labelSearch="Select Communion Record"
                  source={brideCommunionSource}
                  setSource={setBrideCommunionSource}
                  parishRecords={communions}
                  fullName={fullNameCommunion}
                  recordId={bride.communionId}
                  setRecordId={(id) => setBride((p) => ({ ...p, communionId: id }))}
                  certificatePath={bride.communionCertificatePath}
                  onCertificateUpload={async (file) => {
                    const { path: p } = await uploadMarriageCertificate(effectiveParishId!, file, 'communion', 'bride');
                    setBride((prev) => ({ ...prev, communionCertificatePath: p }));
                  }}
                  churchName={bride.communionChurch}
                  setChurchName={(v) => setBride((p) => ({ ...p, communionChurch: v }))}
                />
                <SacramentSection
                  title="Confirmation"
                  labelSearch="Select Confirmation Record"
                  source={brideConfirmationSource}
                  setSource={setBrideConfirmationSource}
                  parishRecords={confirmations}
                  fullName={fullNameConfirmation}
                  recordId={bride.confirmationId}
                  setRecordId={(id) => setBride((p) => ({ ...p, confirmationId: id }))}
                  certificatePath={bride.confirmationCertificatePath}
                  onCertificateUpload={async (file) => {
                    const { path: p } = await uploadMarriageCertificate(effectiveParishId!, file, 'confirmation', 'bride');
                    setBride((prev) => ({ ...prev, confirmationCertificatePath: p }));
                  }}
                  churchName={bride.confirmationChurch}
                  setChurchName={(v) => setBride((p) => ({ ...p, confirmationChurch: v }))}
                />
              </div>
            </div>
          </div>

          {/* Marriage Details */}
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sancta-maroon/10 text-sancta-maroon" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </span>
              Marriage Details
              <span className="text-gray-400" aria-hidden>›</span>
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="marriageDate" className={labelClass}>Marriage Date <span className="text-red-500">*</span></label>
                <input id="marriageDate" type="date" required value={marriageDetails.marriageDate} onChange={(e) => setMarriageDetails((d) => ({ ...d, marriageDate: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="marriageTime" className={labelClass}>Marriage Time</label>
                <input id="marriageTime" type="time" value={marriageDetails.marriageTime} onChange={(e) => setMarriageDetails((d) => ({ ...d, marriageTime: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="churchName" className={labelClass}>Church Name <span className="text-red-500">*</span></label>
                <input id="churchName" type="text" required value={marriageDetails.churchName} onChange={(e) => setMarriageDetails((d) => ({ ...d, churchName: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="marriageRegister" className={labelClass}>Marriage Register</label>
                <input id="marriageRegister" type="text" value={marriageDetails.marriageRegister} onChange={(e) => setMarriageDetails((d) => ({ ...d, marriageRegister: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="diocese" className={labelClass}>Diocese</label>
                <input id="diocese" type="text" value={marriageDetails.diocese} onChange={(e) => setMarriageDetails((d) => ({ ...d, diocese: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label htmlFor="civilRegistryNumber" className={labelClass}>Civil Registry Number</label>
                <input id="civilRegistryNumber" type="text" value={marriageDetails.civilRegistryNumber} onChange={(e) => setMarriageDetails((d) => ({ ...d, civilRegistryNumber: e.target.value }))} placeholder="e.g. Civil Registry Number" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <span className={labelClass}>Dispensation Granted</span>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="dispensation" checked={marriageDetails.dispensationGranted === true} onChange={() => setMarriageDetails((d) => ({ ...d, dispensationGranted: true }))} className="text-sancta-maroon focus:ring-sancta-maroon" />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="dispensation" checked={marriageDetails.dispensationGranted === false} onChange={() => setMarriageDetails((d) => ({ ...d, dispensationGranted: false }))} className="text-sancta-maroon focus:ring-sancta-maroon" />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="officiatingPriest" className={labelClass}>Officiating Priest <span className="text-red-500">*</span></label>
                <input id="officiatingPriest" type="text" required value={marriageDetails.officiatingPriest} onChange={(e) => setMarriageDetails((d) => ({ ...d, officiatingPriest: e.target.value }))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="parish" className={labelClass}>Parish <span className="text-red-500">*</span></label>
                <input id="parish" type="text" required value={marriageDetails.parish} onChange={(e) => setMarriageDetails((d) => ({ ...d, parish: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Canonical Requirements */}
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sancta-maroon/10 text-sancta-maroon" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Canonical Requirements
              <span className="text-gray-400" aria-hidden>›</span>
            </h2>
            <div className="mt-4">
              <label htmlFor="canonicalNotes" className={labelClass}>Notes (e.g. Freedom to marry confirmed)</label>
              <textarea id="canonicalNotes" rows={3} value={marriageDetails.canonicalNotes} onChange={(e) => setMarriageDetails((d) => ({ ...d, canonicalNotes: e.target.value }))} className={inputClass} />
            </div>
          </div>

          {/* Witnesses */}
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sancta-maroon/10 text-sancta-maroon" aria-hidden>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Witnesses
              <span className="text-gray-400" aria-hidden>›</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">Minimum of 2 witnesses required.</p>
            <div className="mt-4 space-y-4">
              {witnesses.map((w, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div>
                    <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={w.fullName} onChange={(e) => setWitnesses((prev) => { const n = [...prev]; n[i] = { ...n[i], fullName: e.target.value }; return n; })} placeholder="Full Name" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone (Optional)</label>
                    <input type="tel" value={w.phone} onChange={(e) => setWitnesses((prev) => { const n = [...prev]; n[i] = { ...n[i], phone: e.target.value }; return n; })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <input type="text" value={w.address} onChange={(e) => setWitnesses((prev) => { const n = [...prev]; n[i] = { ...n[i], address: e.target.value }; return n; })} className={inputClass} />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setWitnesses((prev) => [...prev, { fullName: '', phone: '', address: '' }])}
                className="text-sm font-medium text-sancta-maroon hover:underline flex items-center gap-1"
              >
                <span aria-hidden>+</span> Add witness
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-sancta-maroon px-5 py-3 text-white font-medium hover:bg-sancta-maroon-dark disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save marriage'}
            </button>
            <Link href="/marriages" className="rounded-xl border border-gray-300 px-5 py-3 text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}

// Reusable sacrament block: link parish record or upload certificate
function SacramentSection<T extends { id: number }>({
  title,
  labelSearch,
  source,
  setSource,
  parishRecords,
  fullName,
  recordId,
  setRecordId,
  certificatePath,
  onCertificateUpload,
  churchName,
  setChurchName,
}: {
  title: string;
  labelSearch: string;
  source: SacramentSource;
  setSource: (s: SacramentSource) => void;
  parishRecords: T[];
  fullName: (r: T) => string;
  recordId?: number;
  setRecordId: (id: number | undefined) => void;
  certificatePath?: string | null;
  onCertificateUpload: (file: File) => Promise<void>;
  churchName?: string | null;
  setChurchName: (v: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return parishRecords;
    const q = searchQuery.trim().toLowerCase();
    return parishRecords.filter((r) => fullName(r).toLowerCase().includes(q));
  }, [parishRecords, searchQuery, fullName]);

  const selected = recordId ? parishRecords.find((r) => r.id === recordId) : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) return;
    setUploading(true);
    try {
      await onCertificateUpload(file);
    } catch {
      // Error can be shown at form level
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <div className="mt-2 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={source === 'this_parish'} onChange={() => setSource('this_parish')} className="text-sancta-maroon focus:ring-sancta-maroon" />
          <span className="text-sm">In this parish</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={source === 'external'} onChange={() => setSource('external')} className="text-sancta-maroon focus:ring-sancta-maroon" />
          <span className="text-sm">Elsewhere (upload certificate)</span>
        </label>
      </div>
      {source === 'this_parish' && (
        <>
          {selected ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <span className="text-sm font-medium text-gray-900">{fullName(selected)}</span>
              <button type="button" onClick={() => setRecordId(undefined)} className="text-sm text-sancta-maroon hover:underline">
                Change
              </button>
            </div>
          ) : (
            <div className="mt-2 relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder={labelSearch}
                className={inputClass}
                aria-label={labelSearch}
              />
              {(searchFocused || searchQuery) && (
                <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {filtered.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">No records match.</li>
                  ) : (
                    filtered.slice(0, 20).map((r) => (
                      <li
                        key={r.id}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-sancta-maroon/10"
                        onMouseDown={(e) => { e.preventDefault(); setRecordId(r.id); setSearchQuery(''); }}
                      >
                        {fullName(r)}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </>
      )}
      {source === 'external' && (
        <div className="mt-2 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-sancta-maroon hover:underline disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload certificate'}
            </button>
            {certificatePath && <span className="text-sm text-green-600">Uploaded</span>}
          </div>
          <div>
            <input
              type="text"
              value={churchName ?? ''}
              onChange={(e) => setChurchName(e.target.value)}
              placeholder={`${title} church (optional)`}
              className={inputClass}
            />
          </div>
          {certificatePath && (
            <p className="text-xs text-gray-500">View &amp; download certificate after saving the record.</p>
          )}
        </div>
      )}
    </div>
  );
}
