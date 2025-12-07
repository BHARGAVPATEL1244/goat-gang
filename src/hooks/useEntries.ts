import useSWR from 'swr';
import { Entry } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEntries() {
    const { data, error, isLoading, mutate } = useSWR<Entry[]>('/api/entries', fetcher);

    return {
        entries: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}
