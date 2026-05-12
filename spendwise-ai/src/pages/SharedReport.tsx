import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ReportContent } from "@/components/Result page/ReportContent";


export default function SharedReport() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ReportContent shared={true} />
      <Footer />
    </div>
  );
}