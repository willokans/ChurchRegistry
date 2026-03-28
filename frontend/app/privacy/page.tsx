import Link from 'next/link';

type NoticeSection = {
  id: string;
  title: string;
  intro?: string;
  bullets?: string[];
  paragraphs?: string[];
};

const NOTICE_SECTIONS: NoticeSection[] = [
  {
    id: 'who-we-are',
    title: '1) Who We Are',
    paragraphs: [
      'SacramentRegistry is a UK-registered technology company that designs and delivers IT solutions.',
      'We develop, operate, and support the Church Registry platform.',
      'For privacy enquiries, contact: support@sacramentregistry.com.',
    ],
  },
  {
    id: 'data-we-process',
    title: '2) Data We Process',
    intro: 'Depending on use of the platform, we may process:',
    bullets: [
      'identity and contact details (such as name, phone, email, address)',
      'sacramental data (baptism, first holy communion, confirmation, marriage details)',
      'parish and role data (parish assignment, user permissions)',
      'technical/security data (login events, device/IP metadata, security audit events)',
      'support communications',
    ],
  },
  {
    id: 'why-we-process',
    title: '3) Why We Process Data',
    intro: 'We process personal data to:',
    bullets: [
      'maintain sacramental records',
      'issue and verify certificates',
      'enforce secure and role-based access',
      'monitor and protect platform security',
      'meet legal and regulatory obligations',
    ],
  },
  {
    id: 'legal-basis',
    title: '4) Legal Basis',
    intro: 'Where required under NDPA, processing is based on one or more of:',
    bullets: [
      'provision of requested services',
      'compliance with legal obligations',
      'legitimate interests in secure recordkeeping and fraud prevention',
      'consent, where consent is specifically collected',
    ],
  },
  {
    id: 'how-we-share-data',
    title: '5) How We Share Data',
    intro: 'We only share data when necessary for service delivery, security, or legal compliance, including:',
    bullets: [
      'authorized diocesan/parish personnel with appropriate permissions',
      'vetted infrastructure and service providers',
      'regulators, legal authorities, or auditors when required by law',
    ],
    paragraphs: ['We do not sell personal data.'],
  },
  {
    id: 'international-transfers',
    title: '6) International Data Transfers',
    paragraphs: [
      'If data is processed outside Nigeria, we apply contractual and technical safeguards consistent with NDPA requirements and NDPC guidance.',
    ],
  },
  {
    id: 'data-location-transparency',
    title: '6A) Data Location Transparency',
    bullets: [
      'Application hosting region: Fly.io primary region jnb (Johannesburg, South Africa).',
      'Managed data services: Supabase Postgres and private storage endpoints configured on eu-west-1 infrastructure.',
      'Infrastructure providers are selected for published GDPR support commitments, with NDPA safeguards applied for cross-border processing.',
    ],
  },
  {
    id: 'retention',
    title: '7) Retention',
    paragraphs: [
      'We retain personal data only for as long as necessary to fulfill operational, legal, audit, and ecclesiastical obligations. For detailed internal retention controls, contact the privacy team at [privacy@yourdomain.com].',
    ],
  },
  {
    id: 'your-rights',
    title: '8) Your Rights',
    intro: 'Subject to NDPA and applicable legal limits, you may request:',
    bullets: [
      'access to your personal data',
      'correction of inaccurate data',
      'deletion (where legally permissible)',
      'restriction or objection to processing (where applicable)',
      'data portability (where applicable)',
      'withdrawal of consent for consent-based processing',
    ],
  },
  {
    id: 'submit-request',
    title: '9) How to Submit a Request',
    paragraphs: [
      'To submit a privacy or data rights request, contact [support@sacramentregistry.com] or use [DSR form URL].',
      'We may ask for identity verification before completing your request. We aim to acknowledge requests promptly and respond within applicable legal timeframes.',
    ],
  },
  {
    id: 'security',
    title: '10) Security',
    paragraphs: [
      'We apply technical and organizational measures to protect personal data, including authenticated access controls, role-based authorization, encrypted transport, and operational monitoring.',
    ],
  },
  {
    id: 'complaints',
    title: '11) Complaints',
    paragraphs: [
      'If you have concerns about how your data is handled, contact us at [support@sacramentregistry.com].',
      'You may also lodge a complaint with the Nigeria Data Protection Commission (NDPC) where applicable.',
    ],
  },
  {
    id: 'changes-to-notice',
    title: '12) Changes to This Notice',
    paragraphs: [
      'We may update this Privacy Notice from time to time. Material updates will be communicated through official channels, including the application when appropriate.',
    ],
  },
];

export default function PrivacyNoticePage() {
  return (
    <main className="min-h-screen bg-pattern px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-sancta-maroon">
            Privacy Notice
          </h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: [2026-03-30]</p>
          <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
            This Privacy Notice explains how we collect, use, share, and protect personal data in the Church Registry platform. It is intended for parish users, administrators, and individuals whose sacramental records are managed through this service.
          </p>
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm sm:text-base font-semibold text-amber-900">
            All data belongs to your parish/diocese. SacramentRegistry is only a processor.
          </p>
        </header>

        {NOTICE_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-serif font-semibold text-sancta-maroon">
              {section.title}
            </h2>
            {section.intro && (
              <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                {section.intro}
              </p>
            )}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm sm:text-base text-gray-700 leading-relaxed">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <footer className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">
            This page is derived from the policy source in <code className="font-mono">docs/PRIVACY_NOTICE.md</code>. Replace bracketed placeholder values with your organization details before publishing to production.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/login" className="font-medium text-sancta-maroon hover:underline">
              Go to Login
            </Link>
            <Link href="/" className="font-medium text-sancta-maroon hover:underline">
              Back to Home
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
