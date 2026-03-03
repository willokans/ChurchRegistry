'use client';

import useSWR from 'swr';
import {
  fetchBaptisms,
  fetchCommunions,
  fetchConfirmations,
  fetchMarriages,
  fetchHolyOrders,
  type BaptismResponse,
  type FirstHolyCommunionResponse,
  type ConfirmationResponse,
  type MarriageResponse,
  type HolyOrderResponse,
} from '@/lib/api';

const PAGE_SIZE = 50;

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  revalidateOnReconnect: true,
};

export interface SacramentListResult<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

function useSacramentList<T>(
  key: [string, number, number] | null,
  fetcher: (parishId: number, page: number, size: number) => Promise<{ content: T[]; totalElements: number; totalPages: number; number: number; size: number; first: boolean; last: boolean }>
): SacramentListResult<T> {
  const { data, error, isLoading, mutate } = useSWR(
    key,
    key ? ([, parishId, page]: [string, number, number]) => fetcher(parishId, page, PAGE_SIZE) : null,
    SWR_OPTIONS
  );
  return {
    data: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    page: data?.number ?? 0,
    size: data?.size ?? PAGE_SIZE,
    first: data?.first ?? true,
    last: data?.last ?? true,
    isLoading,
    error: error ?? null,
    mutate,
  };
}

export function useBaptisms(parishId: number | null, page = 0) {
  return useSacramentList<BaptismResponse>(
    parishId != null ? ['baptisms', parishId, page] : null,
    fetchBaptisms
  );
}

export function useCommunions(parishId: number | null, page = 0) {
  return useSacramentList<FirstHolyCommunionResponse>(
    parishId != null ? ['communions', parishId, page] : null,
    fetchCommunions
  );
}

export function useConfirmations(parishId: number | null, page = 0) {
  return useSacramentList<ConfirmationResponse>(
    parishId != null ? ['confirmations', parishId, page] : null,
    fetchConfirmations
  );
}

export function useMarriages(parishId: number | null, page = 0) {
  return useSacramentList<MarriageResponse>(
    parishId != null ? ['marriages', parishId, page] : null,
    fetchMarriages
  );
}

export function useHolyOrders(parishId: number | null, page = 0) {
  return useSacramentList<HolyOrderResponse>(
    parishId != null ? ['holy-orders', parishId, page] : null,
    fetchHolyOrders
  );
}
