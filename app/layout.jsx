import "./globals.css";

export const metadata = {
  title: "Tartan Tickets — Find your next campus thing",
  description: "Find and book student events at Carnegie Mellon University.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
