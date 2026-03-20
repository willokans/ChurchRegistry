'use client';

import { useEffect, useState } from 'react';
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

function PwaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
      <path d="M8 3h8a2 2 0 0 1 2 2v2H6V5a2 2 0 0 1 2-2Z" />
      <path d="M6 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6Z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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
  {
    title: 'Installable App for Reliable Access',
    description: 'Add the app to your home screen for quick access. Your entries will stay saved, even if your internet is slow or temporarily unavailable.',
    Icon: PwaIcon,
  },
];

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <div className="rounded-lg border-2 border-gray-300 bg-white shadow-xl overflow-hidden">
        <Image
          src="/images/dashboard-preview.png"
          alt="Parish Registry dashboard showing sacrament records, quick actions, and parish management"
          width={800}
          height={600}
          className="w-full h-auto object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      router.replace('/dashboard');
    }
  }, [router]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = (
    <>
      <a href="#features" onClick={closeMobileMenu} className="text-sm font-medium text-gray-600 hover:text-sancta-maroon transition-colors py-2">
        Features
      </a>
      <a href="#how-it-works" onClick={closeMobileMenu} className="text-sm font-medium text-gray-600 hover:text-sancta-maroon transition-colors py-2">
        How it works
      </a>
      <Link
        href="/login"
        onClick={closeMobileMenu}
        className="rounded-lg bg-sancta-maroon px-4 py-2.5 text-sm font-medium text-white hover:bg-sancta-maroon-dark transition-colors min-h-[44px] inline-flex items-center justify-center"
      >
        Sign in
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-pattern flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <CrossIcon className="h-7 w-7 sm:h-8 sm:w-8 text-sancta-gold shrink-0" />
            <span className="font-serif text-lg sm:text-xl font-semibold text-sancta-maroon truncate">Parish Registry</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks}
          </nav>
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden p-2 -mr-2 rounded-lg text-gray-600 hover:text-sancta-maroon hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200/80 bg-white px-4 py-4 flex flex-col gap-1">
            <a href="#features" onClick={closeMobileMenu} className="py-3 text-base font-medium text-gray-600 hover:text-sancta-maroon transition-colors">
              Features
            </a>
            <a href="#how-it-works" onClick={closeMobileMenu} className="py-3 text-base font-medium text-gray-600 hover:text-sancta-maroon transition-colors">
              How it works
            </a>
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="mt-2 rounded-lg bg-sancta-maroon px-4 py-3.5 text-base font-medium text-white hover:bg-sancta-maroon-dark transition-colors min-h-[44px] flex items-center justify-center"
            >
              Sign in
            </Link>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="flex-1 px-4 py-10 sm:px-6 sm:py-16 md:py-24">
        <div className="mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
          <div className="flex-1 text-left min-w-0">
            <h1 className="font-serif text-2xl font-semibold text-sancta-maroon sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
              Sacramental Record Management for Catholic Parishes
            </h1>
            <p className="mt-3 sm:mt-4 text-base text-gray-600 sm:text-lg md:text-xl">
              Parish Registry helps priests and parish staff securely manage baptism, communion, confirmation, marriage, and holy orders records.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-sancta-maroon px-6 py-3.5 text-base font-medium text-white hover:bg-sancta-maroon-dark transition-colors min-h-[44px] w-full sm:w-auto"
              >
                Sign in
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border-2 border-sancta-maroon bg-white px-6 py-3.5 text-base font-medium text-sancta-maroon hover:bg-sancta-maroon/5 transition-colors min-h-[44px] w-full sm:w-auto"
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
      <section id="features" className="border-t border-gray-200/80 bg-white/60 px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-xl font-semibold text-gray-800 sm:text-2xl md:text-3xl text-center mb-8 sm:mb-12 px-2">
            Everything a parish needs to manage sacramental records.
          </h2>
          <div className="grid items-stretch gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {features.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm h-full flex flex-col"
              >
                <Icon className="h-9 w-9 sm:h-10 sm:w-10 text-sancta-gold shrink-0" aria-hidden />
                <h3 className="mt-3 font-semibold text-sancta-maroon text-base sm:text-lg">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access */}
      <section id="how-it-works" className="border-t border-gray-200/80 bg-white/60 px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-xl font-semibold text-sancta-maroon sm:text-2xl md:text-3xl px-2">
            Access is by invitation only
          </h2>
          <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base px-2">
            Parish Registry is available to Catholic parishes and dioceses. Contact your parish office or diocesan administrator to request access.
          </p>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-sancta-maroon px-6 py-3.5 text-base font-medium text-white hover:bg-sancta-maroon-dark transition-colors min-h-[44px] w-full sm:w-auto max-w-xs"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 sm:py-12 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2">
            <CrossIcon className="h-5 w-5 sm:h-6 sm:w-6 text-sancta-gold shrink-0" />
            <span className="font-serif text-base sm:text-lg font-semibold text-sancta-maroon">Parish Registry</span>
          </div>
          <p className="mt-2 sm:mt-3 text-sm text-gray-600">
            Sacramental Record Management System
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
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
