import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { GraduationCap, Award, Download } from "lucide-react";

interface CertificateGeneratorProps {
  userName: string;
  courseTitle: string;
  completionDate: string;
}

export default function CertificateGenerator({ userName, courseTitle, completionDate }: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${courseTitle.replace(/\s+/g, "_")}_Certificate.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Hidden Certificate Template */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={certificateRef}
          className="w-[1000px] h-[700px] bg-white p-12 relative flex flex-col items-center justify-center text-center border-[20px] border-neutral-900"
        >
          {/* Decorative Elements */}
          <div className="absolute top-8 left-8 text-neutral-200">
            <GraduationCap className="w-24 h-24" />
          </div>
          <div className="absolute bottom-8 right-8 text-neutral-200">
            <Award className="w-24 h-24" />
          </div>

          <div className="space-y-8 z-10">
            <div className="space-y-2">
              <h1 className="text-6xl font-serif font-bold text-neutral-900 tracking-tight uppercase">Certificate of Completion</h1>
              <div className="h-1 w-48 bg-neutral-900 mx-auto" />
            </div>

            <p className="text-2xl text-neutral-600 font-medium italic">This is to certify that</p>

            <h2 className="text-5xl font-bold text-neutral-900 border-b-2 border-neutral-200 pb-2 px-12 inline-block">
              {userName}
            </h2>

            <p className="text-2xl text-neutral-600 font-medium">has successfully completed the course</p>

            <h3 className="text-4xl font-bold text-neutral-900">
              {courseTitle}
            </h3>

            <div className="pt-12 flex justify-between items-end w-full max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-48 h-px bg-neutral-400" />
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Date</p>
                <p className="text-lg font-bold text-neutral-900">{completionDate}</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-48 h-px bg-neutral-400" />
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Instructor</p>
                <p className="text-lg font-bold text-neutral-900">LMS Platform Academy</p>
              </div>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
             <div className="grid grid-cols-10 gap-8 rotate-12 scale-150">
                {Array.from({ length: 100 }).map((_, i) => (
                   <GraduationCap key={i} className="w-12 h-12 text-neutral-900" />
                ))}
             </div>
          </div>
        </div>
      </div>

      <button
        onClick={downloadCertificate}
        className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
      >
        <Download className="w-5 h-5" />
        <span>Download Certificate</span>
      </button>
    </div>
  );
}
