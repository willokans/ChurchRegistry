'use client';

import Link from 'next/link';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const SECTIONS = [
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'register-baptism', title: 'Register Baptism' },
  { id: 'register-holy-communion', title: 'Register Holy Communion' },
  { id: 'register-confirmation', title: 'Register Confirmation' },
  { id: 'register-marriage', title: 'Register Marriage' },
  { id: 'search-records', title: 'Search Records' },
  { id: 'generate-certificates', title: 'Generate Certificates' },
  { id: 'contact-support', title: 'Contact Support' },
] as const;

export default function HelpPage() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-sancta-maroon">
          Help Center
        </h1>

        {/* Table of Contents */}
        <nav
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          aria-label="Help sections"
        >
          <h2 className="text-sm font-medium text-gray-500 mb-3">On this page</h2>
          <ul className="space-y-2">
            {SECTIONS.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm text-sancta-maroon hover:underline font-medium"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Start */}
        <section
          id="quick-start"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Quick Start
          </h2>
          <p className="mt-2 text-gray-600 text-sm leading-relaxed">
            Select your parish from the sidebar. Use the Quick Actions on the dashboard to register new sacraments or search existing records. All records are organized by parish.
          </p>
        </section>

        {/* Register Baptism */}
        <section
          id="register-baptism"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Register Baptism
          </h2>
          <ol className="mt-2 text-gray-600 text-sm leading-relaxed list-decimal list-inside space-y-1">
            <li>Go to the dashboard or use the Baptisms link in the sidebar.</li>
            <li>Click &quot;Register Baptism&quot; or use the Quick Action.</li>
            <li>Fill in the baptism details (name, date of birth, parents, etc.).</li>
            <li>Save the record.</li>
          </ol>
          <Link
            href="/baptisms/new"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            Register a baptism →
          </Link>
        </section>

        {/* Register Holy Communion */}
        <section
          id="register-holy-communion"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Register Holy Communion
          </h2>
          <ol className="mt-2 text-gray-600 text-sm leading-relaxed list-decimal list-inside space-y-1">
            <li>Go to the dashboard or use the Holy Communion link in the sidebar.</li>
            <li>Click &quot;Register Holy Communion&quot; or use the Quick Action.</li>
            <li>Enter the communion details (child, date, parish, etc.).</li>
            <li>Save the record.</li>
          </ol>
          <Link
            href="/communions/new"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            Register Holy Communion →
          </Link>
        </section>

        {/* Register Confirmation */}
        <section
          id="register-confirmation"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Register Confirmation
          </h2>
          <ol className="mt-2 text-gray-600 text-sm leading-relaxed list-decimal list-inside space-y-1">
            <li>Go to the dashboard or use the Confirmation link in the sidebar.</li>
            <li>Click &quot;Register Confirmation&quot; or use the Quick Action.</li>
            <li>Fill in the confirmation details (candidate, date, bishop, etc.).</li>
            <li>Save the record.</li>
          </ol>
          <Link
            href="/confirmations/new"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            Register Confirmation →
          </Link>
        </section>

        {/* Register Marriage */}
        <section
          id="register-marriage"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Register Marriage
          </h2>
          <ol className="mt-2 text-gray-600 text-sm leading-relaxed list-decimal list-inside space-y-1">
            <li>Go to the dashboard or use the Marriage link in the sidebar.</li>
            <li>Click &quot;Register Marriage&quot; or use the Quick Action.</li>
            <li>Enter the marriage details (partners, date, witnesses, etc.).</li>
            <li>Save the record.</li>
          </ol>
          <Link
            href="/marriages/new"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            Register Marriage →
          </Link>
        </section>

        {/* Search Records */}
        <section
          id="search-records"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Search Records
          </h2>
          <p className="mt-2 text-gray-600 text-sm leading-relaxed">
            Use the search box on each sacrament list page (Baptisms, Holy Communion, Confirmation, Marriage) to find records by name, address, parents, or other fields. Filters for year, month, and day help narrow results.
          </p>
          <Link
            href="/baptisms"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            Search baptisms →
          </Link>
        </section>

        {/* Generate Certificates */}
        <section
          id="generate-certificates"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Generate Certificates
          </h2>
          <p className="mt-2 text-gray-600 text-sm leading-relaxed">
            Open any record&apos;s detail page (e.g. from the Baptisms list, click a record). On the detail page, use the &quot;Print Certificate&quot; button to generate an official sacramental certificate. Certificates are available for baptisms, communions, confirmations, and marriages.
          </p>
          <Link
            href="/baptisms"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            View records →
          </Link>
        </section>

        {/* Contact Support */}
        <section
          id="contact-support"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-serif font-semibold text-sancta-maroon text-lg">
            Contact Support
          </h2>
          <p className="mt-2 text-gray-600 text-sm leading-relaxed">
            Contact your parish administrator for assistance with access, data questions, or technical issues.
          </p>
          <a
            href="mailto:parishregistry@example.com"
            className="mt-3 inline-block text-sm font-medium text-sancta-maroon hover:underline"
          >
            parishregistry@example.com
          </a>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
