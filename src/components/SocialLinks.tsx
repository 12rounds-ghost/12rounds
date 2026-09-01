// Conturile oficiale 12 ROUNDS — aceleasi patru linkuri in antet si footer
// (Sarcina: adaugare linkuri social media). Iconite minimale, desenate manual
// (fara librarie externa — proiectul nu are niciuna), mostenesc culoarea prin
// currentColor, ca sa raspunda la :hover din CSS ca orice alt link.
const RETELE = [
  { nume: 'Facebook', url: 'https://www.facebook.com/12rounds.ro', Icon: IconFacebook },
  { nume: 'Instagram', url: 'https://www.instagram.com/12rounds.ro/', Icon: IconInstagram },
  { nume: 'YouTube', url: 'https://www.youtube.com/@12Rounds_ro', Icon: IconYouTube },
  { nume: 'TikTok', url: 'https://www.tiktok.com/@12rounds.ro', Icon: IconTikTok },
] as const;

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={`social-links${className ? ` ${className}` : ''}`}>
      {RETELE.map(({ nume, url, Icon }) => (
        <a key={nume} href={url} target="_blank" rel="noopener noreferrer" aria-label={nume}>
          <Icon />
        </a>
      ))}
    </div>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.6-1.5H16.5V4.3C16.2 4.26 15.2 4.2 14 4.2c-2.4 0-4 1.46-4 4.15V10.5H7.5v3H10V21h3.5z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 8.5s-.2-1.6-.85-2.3c-.8-.9-1.7-.9-2.1-1C16.4 5 12 5 12 5h0s-4.4 0-7.05.2c-.4.1-1.3.1-2.1 1C2.2 6.9 2 8.5 2 8.5S1.8 10.4 1.8 12.3v1.8C1.8 16 2 17.9 2 17.9s.2 1.6.85 2.3c.8.9 1.85.87 2.3.97C6.8 21.3 12 21.4 12 21.4s4.4 0 7.05-.2c.4-.1 1.3-.1 2.1-1 .65-.7.85-2.3.85-2.3s.2-1.9.2-3.8v-1.8C22.2 10.4 22 8.5 22 8.5zM9.9 15.5V8.9l6 3.3-6 3.3z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.3 2.4 1.8 4 4.3 4.2v2.8c-1.5 0-2.9-.5-4.3-1.4v6.8c0 3.3-2.6 5.9-5.9 5.9S4.7 18.7 4.7 15.4c0-3.2 2.5-5.7 5.6-5.9v3c-1.4.2-2.5 1.4-2.5 2.9 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9V3h3z" />
    </svg>
  );
}
