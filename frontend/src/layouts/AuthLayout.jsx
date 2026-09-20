import { Link } from 'react-router-dom';

import { BrandMark } from '@/components/product/BrandMark';
import { ArchMotif } from '@/components/product/ArchMotif';

const POINTS = [
  'See every project and where it stands.',
  'Move work across the board as it happens.',
  'Talk it through with your team in one place.',
];

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="kiln-grain relative hidden w-[46%] flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex xl:p-14">
        <div className="arch-backdrop pointer-events-none absolute inset-0 opacity-70" />
        <ArchMotif className="pointer-events-none absolute -right-24 bottom-[-12%] h-[560px] w-[560px] text-primary opacity-60" />

        <Link
          to="/"
          className="relative w-fit rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <BrandMark className="text-background" />
        </Link>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-display font-semibold text-balance text-background">
            Every project, one place.
          </h1>
          <p className="text-body text-background/70">
            Projects, boards, and chat for a team that ships.
          </p>
          <ul className="space-y-2.5 border-t border-background/15 pt-6">
            {POINTS.map((point) => (
              <li key={point} className="text-small text-background/70">
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-micro text-background/50">
          Built for teams that make things that hold.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
