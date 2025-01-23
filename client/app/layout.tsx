import type { Metadata } from "next";
import { Montserrat,Josefin_Sans,Urbanist,Oswald,Roboto,Noto_Sans_Cuneiform} from "next/font/google";
import "./globals.css";



const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Include desired font weights
});

const josefinSans=Josefin_Sans({
  variable: "--font-josefinsans",
  subsets: ["latin"],
  weight: ["100","200","300","400", "500", "600", "700"], 
});

const urbanist=Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["100","200","300","400", "500", "600", "700","800","900"], 
});

const roboto=Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: [ "700","400"], 
});

const noto=Noto_Sans_Cuneiform({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400"], 
});

export const metadata: Metadata = {
  title: "studyGPT",
  description: "your study companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${montserrat.variable} ${josefinSans.variable} ${urbanist.variable} ${noto.variable} ${roboto.variable}antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
