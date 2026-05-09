import { ReportContent } from "@/components/Result page/ReportContent"
import { Footer } from "@/components/shared/Footer"
import { Navbar } from "@/components/shared/Navbar"


const Results = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ReportContent />
      <Footer/>
    </div>
  )
}

export default Results