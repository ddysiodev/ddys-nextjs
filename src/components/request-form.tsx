'use client';

import { useState, type FormEvent } from 'react';

export interface DdysRequestFormProps {
  action?: string;
  token?: string;
  honeypotField?: string;
}

export function DdysRequestForm({ action = '/api/ddys/request', token = '', honeypotField = 'ddys_website' }: DdysRequestFormProps) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus('Submitting...');
    setError(false);
    const response = await fetch(action, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    const json = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response.' }));
    if (json.success) {
      setStatus('Request submitted.');
      form.reset();
    } else {
      setError(true);
      setStatus(json.message || `Request failed with HTTP ${response.status}.`);
    }
  }

  return (
    <form className="ddys-next-request-form" onSubmit={submit}>
      <input type="hidden" name="ddys_token" value={token} />
      <label className="ddys-next-honeypot">Website<input type="text" name={honeypotField} tabIndex={-1} autoComplete="off" /></label>
      <label>Title<input type="text" name="title" maxLength={255} required /></label>
      <label>Year<input type="number" name="year" min={1900} max={2099} /></label>
      <label>Type<select name="type"><option value=""></option><option value="movie">Movie</option><option value="series">Series</option><option value="variety">Variety</option><option value="anime">Anime</option></select></label>
      <label>Douban ID<input type="text" name="douban_id" maxLength={30} /></label>
      <label>IMDb ID<input type="text" name="imdb_id" maxLength={30} /></label>
      <label>Description<textarea name="description" maxLength={1000} /></label>
      <button type="submit">Submit request</button>
      <p className={`ddys-next-status${error ? ' is-error' : ''}`} role="status">{status}</p>
    </form>
  );
}
