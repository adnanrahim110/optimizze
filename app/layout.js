import { ToastProvider } from '@/context/ToastContext';
import { clsx } from 'clsx';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const negan = localFont({
  src: "../public/font/negan.otf",
  variable: "--font-negan",
  display: "swap",
})

export const metadata = {
  title: 'OPTIMIZZE | Swiss Precision Converter',
  description: 'Premium client-side media optimization tool.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={clsx(inter.variable, mono.variable, negan.variable)}>
      <body className="antialiased bg-white text-black selection:bg-black selection:text-white">
        <div className="fixed inset-0 grid grid-cols-[1fr_minmax(auto,1200px)_1fr] pointer-events-none z-[-1]">
          <div className="border-r border-gray-100/50 h-full"></div>
          <div className="border-r border-gray-100/50 h-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="h-full"></div>
        </div>

        <ToastProvider>
          <main className="min-h-screen relative flex flex-col">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
