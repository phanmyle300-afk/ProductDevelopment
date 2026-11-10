"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  X,
  Play,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface UploadFileItem {
  id: string;
  name: string;
  size: string;
  status: "pending" | "ingesting" | "parsing" | "embedding" | "completed" | "error";
  progress: number;
  candidateName?: string;
  blindCode?: string;
  matchScore?: number;
  errorMsg?: string;
}

export default function ResumeUploadPage() {
  const [selectedJob, setSelectedJob] = useState("job-1");
  const [isDragging, setIsDragging] = useState(false);
  const [fileList, setFileList] = useState<UploadFileItem[]>([
    {
      id: "file-1",
      name: "CV_NguyenVanAn_Senior_Backend.pdf",
      size: "1.2 MB",
      status: "completed",
      progress: 100,
      candidateName: "Nguyễn Văn An",
      blindCode: "Candidate #TSC-4A8F",
      matchScore: 92,
    },
    {
      id: "file-2",
      name: "Resume_TranThiBich_Lead_Dev.pdf",
      size: "890 KB",
      status: "completed",
      progress: 100,
      candidateName: "Trần Thị Bích",
      blindCode: "Candidate #TSC-7C21",
      matchScore: 86,
    },
    {
      id: "file-3",
      name: "HoangMinhDuc_CV_Scan.pdf",
      size: "3.4 MB",
      status: "parsing",
      progress: 65,
      candidateName: "Đang nhận diện...",
      blindCode: "Candidate #TSC-192B",
    },
  ]);

  const handleSimulateUpload = () => {
    const newFile: UploadFileItem = {
      id: `file-${fileList.length + 1}`,
      name: `Ho_So_Ung_Vien_${fileList.length + 1}.pdf`,
      size: "1.5 MB",
      status: "ingesting",
      progress: 25,
      candidateName: "Đang trích xuất OCR...",
      blindCode: `Candidate #TSC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setFileList([newFile, ...fileList]);

    setTimeout(() => {
      setFileList((prev) =>
        prev.map((f) =>
          f.id === newFile.id ? { ...f, status: "parsing", progress: 60 } : f
        )
      );
    }, 800);

    setTimeout(() => {
      setFileList((prev) =>
        prev.map((f) =>
          f.id === newFile.id ? { ...f, status: "embedding", progress: 85 } : f
        )
      );
    }, 1500);

    setTimeout(() => {
      setFileList((prev) =>
        prev.map((f) =>
          f.id === newFile.id
            ? {
                ...f,
                status: "completed",
                progress: 100,
                candidateName: "Lê Minh Tuấn",
                matchScore: 89,
              }
            : f
        )
      );
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B66] hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Danh sách Ứng viên</span>
        </Link>
      </div>

      <div className="pb-2 border-b border-[#E5E5E0]">
        <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
          Tải Lên Hồ Sơ & Pipeline Bóc Tách (Resume Ingest & OCR)
        </h1>
        <p className="text-xs text-[#6B6B66] mt-1">
          Hỗ trợ tệp định dạng .pdf, .docx và bản scan ảnh với cơ chế fallback 3 tầng (PyMuPDF → Tesseract OCR → LayoutLMv3).
        </p>
      </div>

      {/* Target Job Selection Card */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Chọn vị trí tuyển dụng mục tiêu để đối chiếu (Target Requisition)
            </label>
            <p className="text-[11px] text-[#6B6B66]">
              CV tải lên sẽ được bóc tách và tự động tính điểm Hybrid Match so với tiêu chí của vị trí này.
            </p>
          </div>

          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E5E5E0] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#0F766E] w-full sm:w-80"
          >
            <option value="job-1">Senior Fullstack AI Engineer (Engineering)</option>
            <option value="job-2">Lead Backend Developer (Engineering)</option>
            <option value="job-3">Frontend Engineer (Product Design)</option>
            <option value="job-4">AI Research Scientist (AI Research)</option>
          </select>
        </div>
      </Card>

      {/* Drag & Drop Upload Box */}
      <Card
        padding="lg"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleSimulateUpload();
        }}
        className={`border-2 border-dashed text-center transition-colors cursor-pointer ${
          isDragging ? "border-[#0F766E] bg-[#F0FDFA]" : "border-[#E5E5E0] bg-white hover:bg-[#FAF9F6]"
        }`}
        onClick={handleSimulateUpload}
      >
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-12 h-12 rounded-full bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mb-3 border border-[#CCFBF1]">
            <UploadCloud size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">
            Kéo thả tệp CV vào đây hoặc <span className="text-[#0F766E] underline">Bấm để chọn tệp</span>
          </h3>
          <p className="text-xs text-[#6B6B66] mt-1 max-w-sm">
            Hỗ trợ tải lên nhiều tệp cùng lúc (PDF, DOCX, PNG, JPG). Kích thước tối đa 15MB/tệp.
          </p>
          <div className="flex items-center gap-2 mt-4 text-[11px] text-[#15803D] font-medium bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7]">
            <ShieldCheck size={14} />
            <span>Tự động khử Prompt Injection & Băm PII cho Blind Screening</span>
          </div>
        </div>
      </Card>

      {/* Batch Processing Queue */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEA]">
          <div>
            <CardTitle>Tiến Trình Xử Lý Hồ Sơ (Processing Queue)</CardTitle>
            <CardDescription>
              Theo dõi thời gian thực quá trình Ingest → OCR → Trích xuất thực thể NER → Tạo vector nhúng 1536-D.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleSimulateUpload}>
            + Tải Thêm Tệp Demo
          </Button>
        </div>

        <div className="space-y-3">
          {fileList.map((file) => (
            <div
              key={file.id}
              className="p-3.5 bg-[#FAFAF8] rounded-lg border border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E0] text-[#0F766E] flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-[#1A1A1A] block truncate">
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B6B66] mt-0.5">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span className="font-mono text-[#0F766E]">{file.blindCode}</span>
                    {file.candidateName && <span>• {file.candidateName}</span>}
                  </div>
                </div>
              </div>

              {/* Progress & Status */}
              <div className="flex items-center gap-4 shrink-0">
                {file.status === "completed" ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#15803D]">
                      Match: {file.matchScore}%
                    </span>
                    <Badge variant="success" size="sm" dot>
                      Hoàn tất
                    </Badge>
                    <Link href={`/candidates/${file.id}`}>
                      <Button variant="secondary" size="sm">
                        Xem Kết Quả
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-48">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] text-[#6B6B66] mb-1 font-semibold">
                        <span>
                          {file.status === "ingesting"
                            ? "Đang OCR..."
                            : file.status === "parsing"
                            ? "Trích xuất NER..."
                            : "Embedding..."}
                        </span>
                        <span>{file.progress}%</span>
                      </div>
                      <div className="w-full bg-[#E5E5E0] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0F766E] h-full rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

