import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'copymac-convertio | Conversión Universal',
    description: 'Herramienta PRO para convertir imágenes sin límites.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
