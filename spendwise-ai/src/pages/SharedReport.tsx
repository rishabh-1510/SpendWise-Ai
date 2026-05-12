import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ReportContent } from "@/components/Result page/ReportContent";

/**
 * Public shared report page.
 * Rendered when someone opens a share link — no auth, no localStorage.
 * All audit data is decoded from the ?data= query param by ReportContent.
 */
export default function SharedReport() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ReportContent shared={true} />
      <Footer />
    </div>
  );
}