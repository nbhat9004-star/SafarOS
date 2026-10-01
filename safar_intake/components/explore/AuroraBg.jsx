'use client';
export default function AuroraBg({ variant = 'default' }) {
  return (
    <>
      <div className="e-aurora" aria-hidden="true" />
      <div className="e-orb" aria-hidden="true" style={{ width: 380, height: 380, background: 'radial-gradient(circle, rgba(110,231,183,0.55), transparent 60%)', top: '10%', right: '-6%' }} />
      <div className="e-orb" aria-hidden="true" style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(167,139,250,0.6), transparent 60%)', bottom: '-8%', left: '-6%', animationDelay: '-6s' }} />
    </>
  );
}
