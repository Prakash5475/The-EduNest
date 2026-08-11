import { FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportToCsv, exportToExcel, exportToPdf, type ExportColumn } from "@/lib/exportFile";

interface ReportDownloadButtonsProps {
  title: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string | number>>;
  filenamePrefix?: string;
  size?: "sm" | "default";
}

const FORMATS = [
  { format: "pdf" as const, label: "PDF", icon: FileText, run: exportToPdf },
  { format: "excel" as const, label: "Excel", icon: FileSpreadsheet, run: exportToExcel },
  { format: "csv" as const, label: "CSV", icon: FileDown, run: exportToCsv },
];

export function ReportDownloadButtons({ title, columns, rows, filenamePrefix, size = "sm" }: ReportDownloadButtonsProps) {
  function handleDownload(run: typeof exportToCsv) {
    if (rows.length === 0) {
      toast.error("No data available to export yet");
      return;
    }
    const filename = `${filenamePrefix ?? title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`;
    run({ title, columns, rows, filename });
  }

  return (
    <div className="flex items-center gap-1.5">
      {FORMATS.map(({ format, label, icon: Icon, run }) => (
        <Button key={format} variant="outline" size={size} className="gap-1.5" onClick={() => handleDownload(run)}>
          <Icon className="h-3.5 w-3.5" /> {label}
        </Button>
      ))}
    </div>
  );
}
