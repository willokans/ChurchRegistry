'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 32" fill="currentColor" aria-hidden>
      <path d="M9 0L15 0 14 4 14 11 20 11 22 12 22 14 20 15 14 15 14 28 15 32 9 32 10 28 10 15 4 15 2 14 2 12 4 11 10 11 10 4z" />
    </svg>
  );
}

function ChaliceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c-.5 0-1 .2-1.4.6L8.5 4.7c-.4.4-.6.9-.6 1.4v2.5c0 .8.3 1.6.8 2.2l2.5 2.8V18h-2v2h6v-2h-2v-4.4l2.5-2.8c.5-.6.8-1.4.8-2.2V6.1c0-.5-.2-1-.6-1.4l-2.1-2.1C13 2.2 12.5 2 12 2zm-2 4h4v1.5l-2 2.2-2-2.2V6z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CertificateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function ChurchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2L2 8v2h2v10h6v-6h4v6h6V10h2V8L12 2zm0 2.5l6 4v1.5h-2V20h-2v-6h-4v6H8v-10H6V8.5l6-4z" />
    </svg>
  );
}

const features = [
  {
    title: 'Register Sacraments',
    description: 'Record baptisms, confirmations, marriages, holy communion, and holy orders in a secure, structured format.',
    Icon: ChaliceIcon,
  },
  {
    title: 'Search Parish Records',
    description: 'Quickly find records by name, address, parents, or sacrament type.',
    Icon: SearchIcon,
  },
  {
    title: 'Generate Certificates',
    description: 'Automatically generate official sacramental certificates with one click.',
    Icon: CertificateIcon,
  },
  {
    title: 'Multi-Parish Access',
    description: 'Records are organized by diocese and parish with secure access control.',
    Icon: ChurchIcon,
  },
];

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-lg border-2 border-gray-300 bg-white shadow-xl overflow-hidden">
        <Image
          src="/images/dashboard-preview.png"
          alt="Parish Registry dashboard showing sacrament records, quick actions, and parish management"
          width={800}
          height={600}
          className="w-full h-auto object-cover"
          priority
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <CrossIcon className="h-8 w-8 text-sancta-gold shrink-0" />
            <span className="font-serif text-xl font-semibold text-sancta-maroon">Parish Registry</span>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-sancta-maroon transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-sancta-maroon transition-colors">
              How it works
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-sancta-maroon px-4 py-2.5 text-sm font-medium text-white hover:bg-sancta-maroon-dark transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-left">
            <h1 className="font-serif text-3xl font-semibold text-sancta-maroon sm:text-4xl md:text-5xl">
              Sacramental Record Management for Catholic Parishes
            </h1>
            <p className="mt-4 text-lg text-gray-600 sm:text-xl">
              Parish Registry helps priests and parish staff securely manage baptism, communion, confirmation, marriage, and holy orders records.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-sancta-maroon px-6 py-3.5 text-base font-medium text-white hover:bg-sancta-maroon-dark transition-colors min-h-[44px]"
              >
                Sign in
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border-2 border-sancta-maroon bg-white px-6 py-3.5 text-base font-medium text-sancta-maroon hover:bg-sancta-maroon/5 transition-colors min-h-[44px]"
              >
                Learn more
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-200/80 bg-white/60 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl font-semibold text-gray-800 sm:text-3xl text-center mb-12">
            Everything a parish needs to manage sacramental records.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <Icon className="h-10 w-10 text-sancta-gold" aria-hidden />
                <h3 className="mt-3 font-semibold text-sancta-maroon">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access */}
      <section id="how-it-works" className="border-t border-gray-200/80 bg-white/60 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-semibold text-sancta-maroon sm:text-3xl">
            Access is by invitation only
          </h2>
          <p className="mt-4 text-gray-600">
            Parish Registry is available to Catholic parishes and dioceses. Contact your parish office or diocesan administrator to request access.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-sancta-maroon px-6 py-3.5 text-base font-medium text-white hover:bg-sancta-maroon-dark transition-colors min-h-[44px]"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2">
            <CrossIcon className="h-6 w-6 text-sancta-gold shrink-0" />
            <span className="font-serif text-lg font-semibold text-sancta-maroon">Parish Registry</span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Sacramental Record Management System
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            <Link href="/login" className="text-sm font-medium text-sancta-maroon hover:underline">
              Sign in
            </Link>
            <a href="mailto:parishregistry@example.com" className="text-sm text-gray-600 hover:text-sancta-maroon">
              Support
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-sancta-maroon">
              Documentation
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Support: parishregistry@example.com
          </p>
        </div>
      </footer>
    </div>
  );
}
