'use client';

import { useState, type FormEvent } from 'react';
import type { DdysItem } from '../types/ddys';
import { DdysGrid } from './grid';

export interface DdysSearchProps {
  endpoint?: string;
}

export function DdysSearch({ endpoint = '/api/ddys/search' }: DdysSearchProps) {
  const [items, setItems] = useState<DdysItem[]>([]);
  const [status, setStatus] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === 'string') params.set(key, value);
    }
    setStatus('Searching...');
    const response = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'same-origin' });
    const json = await response.json().catch(() => ({ data: [] }));
    const data = Array.isArray(json.data) ? json.data : Array.isArray(json.data?.data) ? json.data.data : [];
    setItems(data);
    setStatus(data.length ? '' : 'No DDYS content found.');
  }

  return (
    <div className="ddys-next-search-block">
      <form className="ddys-next-search" onSubmit={submit}>
        <input type="search" name="q" placeholder="Search DDYS" required />
        <select name="type" defaultValue="movie"><option value="movie">Movie</option><option value="share">Share</option><option value="request">Request</option></select>
        <button type="submit">Search</button>
      </form>
      {status ? <p className="ddys-next-status" role="status">{status}</p> : null}
      {items.length ? <DdysGrid items={items} /> : null}
    </div>
  );
}
