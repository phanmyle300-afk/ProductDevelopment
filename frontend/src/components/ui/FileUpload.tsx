"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import clsx from "clsx";

export interface FileUploadProps {
  onFileSelect?: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = ".pdf,.docx",
  maxSizeMB = 10,
  label = "Tải lên hồ sơ CV",
  helperText = "Hỗ trợ tệp định dạng PDF, DOCX (Dung lượng tối đa 10MB)",
  error: initialError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    setError(null);
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    const validExts = accept.split(",").map((e) => e.trim().toLowerCase());

    if (!validExts.includes(ext)) {
      setError(`Định dạng tệp không hợp lệ. Chỉ chấp nhận các tệp: ${accept}`);
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`Dung lượng tệp vượt quá giới hạn ${maxSizeMB}MB.`);
      return;
    }

    // Simulate upload progress
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setFile(selectedFile);
          onFileSelect?.(selectedFile);
          return 100;
        }
        return prev + 35;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadProgress(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileSelect?.(null);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
          {label}
        </label>
      )}

      {!file && uploadProgress === null ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            "p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors bg-white",
            isDragging
              ? "border-[#0F766E] bg-[#F0FDFA]"
              : "border-[#E5E5E0] hover:bg-[#FAFAF8]",
            error && "border-[#B91C1C] bg-[#FEF2F2]/30"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            accept={accept}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto mb-2 border border-[#CCFBF1]">
            <UploadCloud size={20} />
          </div>
          <p className="text-xs font-semibold text-[#1A1A1A]">
            Kéo thả tệp CV vào đây hoặc <span className="text-[#0F766E] underline">chọn tệp từ máy tính</span>
          </p>
          <p className="text-[11px] text-[#6B6B66] mt-1">{helperText}</p>
        </div>
      ) : uploadProgress !== null && uploadProgress < 100 ? (
        <div className="p-4 bg-white border border-[#E5E5E0] rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#1A1A1A]">Đang xử lý tệp...</span>
            <span className="font-semibold text-[#0F766E]">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[#E5E5E0] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0F766E] h-full rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">{file?.name}</p>
              <p className="text-[11px] text-[#6B6B66]">
                {(file?.size ? file.size / (1024 * 1024) : 0).toFixed(2)} MB • Sẵn sàng nộp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 rounded-lg text-[#6B6B66] hover:bg-white hover:text-[#B91C1C] flex items-center justify-center transition-colors"
            title="Xóa tệp này để chọn lại"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#B91C1C]">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

