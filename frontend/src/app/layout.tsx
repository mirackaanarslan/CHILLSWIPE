import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chiliz Prediction Market',
  description: 'A scalable prediction market app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookies = headers().get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers cookies={cookies}>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
