import '@testing-library/jest-dom';

// Frontend runtime requires a configured backend base URL.
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
