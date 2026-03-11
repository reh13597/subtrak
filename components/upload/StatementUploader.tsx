"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { authHeadersFormData, authHeaders } from "@/lib/client-auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".csv"];

type UploadStatus = "idle" | "uploading" | "extracting" | "done" | "error";

interface StatementUploaderProps {
  onUploadComplete: (uploadId: number) => void;
}

export function StatementUploader({
  onUploadComplete,
}: StatementUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = useCallback(
    (f: File): string | null => {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      if (
        !ACCEPTED_TYPES.includes(f.type) &&
        !ACCEPTED_EXTENSIONS.includes(ext)
      ) {
        return "Only PDF and CSV files are supported.";
      }
      if (f.size > MAX_FILE_SIZE) {
        return "File size must be under 10 MB.";
      }
      return null;
    },
    []
  );

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setErrorMsg(err);
        toast({ title: "Invalid file", description: err, variant: "destructive" });
        return;
      }
      setFile(f);
      setErrorMsg("");
      setStatus("idle");
    },
    [validateFile, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const clearFile = () => {
    setFile(null);
    setErrorMsg("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setStatus("uploading");
      setErrorMsg("");

      const formData = new FormData();
      formData.append("file", file);

      const uploadHeaders = await authHeadersFormData();
      const uploadRes = await fetch("/api/upload/statement", {
        method: "POST",
        headers: uploadHeaders,
        body: formData,
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => null);
        throw new Error(body?.error ?? "Upload failed");
      }

      const { uploadId } = (await uploadRes.json()) as { uploadId: number };

      setStatus("extracting");

      const extractHeaders = await authHeaders();
      const extractRes = await fetch(`/api/extract/${uploadId}`, {
        method: "POST",
        headers: extractHeaders,
      });

      if (!extractRes.ok) {
        const body = await extractRes.json().catch(() => null);
        throw new Error(body?.error ?? "Extraction failed");
      }

      setStatus("done");
      toast({ title: "Extraction complete", description: "Review the results below." });
      onUploadComplete(uploadId);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const isBusy = status === "uploading" || status === "extracting";

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur">
      <CardContent className="p-6 space-y-4">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "w-full rounded-2xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
            "flex flex-col items-center justify-center gap-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragOver
              ? "border-[#155885] bg-[#155885]/10"
              : "border-white/10 hover:border-white/20 bg-white/[0.02]",
            isBusy && "pointer-events-none opacity-60"
          )}
          aria-label="Upload bank statement"
        >
          {!file ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <Upload size={28} />
              </div>
              <p className="text-white font-bold">Drop your bank statement here</p>
              <p className="text-white/40 text-sm">
                PDF or CSV &middot; Max 10 MB
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-[#155885] shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-white font-semibold truncate">{file.name}</p>
                <p className="text-white/40 text-xs">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!isBusy && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="ml-2 p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Status indicator */}
        {status === "uploading" && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 size={16} className="animate-spin text-[#155885]" />
            Uploading statement…
          </div>
        )}
        {status === "extracting" && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 size={16} className="animate-spin text-[#155885]" />
            AI is extracting subscriptions…
          </div>
        )}
        {status === "done" && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle2 size={16} />
            Extraction complete
          </div>
        )}
        {status === "error" && errorMsg && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={!file || isBusy || status === "done"}
          className="w-full bg-[#155885] hover:bg-[#1a6ba1] text-white font-bold rounded-2xl h-11 shadow-lg shadow-[#155885]/20 disabled:opacity-40"
        >
          {isBusy ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {status === "uploading" ? "Uploading…" : "Extracting…"}
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload &amp; Extract
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
