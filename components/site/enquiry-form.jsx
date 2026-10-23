'use client';
import { useState } from 'react';

export default function EnquiryForm({ slug, tourName, buttonLabel = 'Send enquiry' }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: tourName ? `I'm interested in ${tourName}` : '' });
  const [status, setStatus] = useState(''); // '', 'sending', 'success', 'error'
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`/api/public/site/${slug}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send enquiry');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ padding: '1.5rem', borderRadius: 'var(--br)', background: 'var(--a)', border: '1px solid var(--p)' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--p)' }}>Thank you! We'll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      {error && (
        <div style={{ padding: '.75rem', borderRadius: 'var(--br)', background: '#fee', border: '1px solid #fcc', color: '#c33' }}>
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        disabled={status === 'sending'}
        required
      />
      <input
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        disabled={status === 'sending'}
        required
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        disabled={status === 'sending'}
      />
      <textarea
        rows={4}
        placeholder="Tell us about your trip..."
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        disabled={status === 'sending'}
      />
      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : buttonLabel}
      </button>
    </form>
  );
}
