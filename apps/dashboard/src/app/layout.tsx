import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Layout from '@/components/layout/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OracleWA SaaS - Dashboard',
  description: 'Plataforma empresarial de automação WhatsApp multi-tenant',
  keywords: ['whatsapp', 'automation', 'saas', 'multi-tenant', 'enterprise'],
  authors: [{ name: 'OracleWA Team', url: 'https://oraclewa.com' }],
  creator: 'OracleWA',
  publisher: 'OracleWA',
  robots: 'noindex,nofollow', // Private dashboard
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}