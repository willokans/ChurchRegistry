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

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  revalidateOnReconnect: true,
};

function useSacramentList<T>(
  key: [string, number] | null,
  fetcher: (parishId: number) => Promise<{ content: T[] }>
): { data: T[]; isLoading: boolean; error: Error | null; mutate: () => void } {
  const { data, error, isLoading, mutate } = useSWR<{ content: T[] }>(
    key,
    key ? ([, parishId]: [string, number]) => fetcher(parishId) : null,
    SWR_OPTIONS
  );
  return {
    data: data?.content ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}

export function useBaptisms(parishId: number | null) {
  return useSacramentList<BaptismResponse>(
    parishId != null ? ['baptisms', parishId] : null,
    fetchBaptisms
  );
}

export function useCommunions(parishId: number | null) {
  return useSacramentList<FirstHolyCommunionResponse>(
    parishId != null ? ['communions', parishId] : null,
    fetchCommunions
  );
}

export function useConfirmations(parishId: number | null) {
  return useSacramentList<ConfirmationResponse>(
    parishId != null ? ['confirmations', parishId] : null,
    fetchConfirmations
  );
}

export function useMarriages(parishId: number | null) {
  return useSacramentList<MarriageResponse>(
    parishId != null ? ['marriages', parishId] : null,
    fetchMarriages
  );
}

export function useHolyOrders(parishId: number | null) {
  return useSacramentList<HolyOrderResponse>(
    parishId != null ? ['holy-orders', parishId] : null,
    fetchHolyOrders
  );
}
