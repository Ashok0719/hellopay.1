import './globals.css';

export const metadata = {
  title: 'HelloPay | Admin Panel',
  description: 'Secure Neural Command Center',
}

import FirebaseManager from './FirebaseManager';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden bg-[#020617]">
        <FirebaseManager />
        {children}
      </body>
    </html>
  )
}
