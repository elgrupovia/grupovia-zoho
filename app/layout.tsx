import type { Metadata } from "next";
import "./globals.css";
import { Montserrat, Roboto } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grupo Vía (Zoho)",
  description: "Mismo diseño que grupovia.net, datos desde Zoho",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${roboto.variable}`}>
        {children}
      </body>
    </html>
  );
}

