import { UnifrakturMaguntia } from 'next/font/google';

const unifraktur = UnifrakturMaguntia({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export default function CoBuildWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      <span className={unifraktur.className}>Co</span>
      -Build
    </span>
  );
}
