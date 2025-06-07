"use client";

import React, { useRef, useState } from "react";
import { saveUploadedDocument, generateBlobUploadUrl } from "@/lib/actions/fileUploadActions";

type Props = {
  entityType: 'driver' | 'vehicle' | 'trailer' | 'company';
  entityId: string;
  documentType?: string;
  onUpload: (file: File, metadata: any) => void;
};

export function DocumentUploadForm({ entityType, entityId, documentType = 'other', onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type/size (example: max 10MB, PDF/JPG/PNG)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    if (!/\.(pdf|jpg|jpeg|png)$/i.test(file.name)) {
      setError("Invalid file type. Only PDF, JPG, PNG allowed.");
      return;
    }
    setUploading(true);
    try {
      const signed = await generateBlobUploadUrl(file.name, file.type);
      if (!signed.success || !('data' in signed)) {
        setError('Unable to obtain upload URL');
        return;
      }
      const { url, token } = signed.data;
      const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'content-type': file.type,
          'x-vercel-blob-token': token,
        },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }
      const blobUrl = url.split('?')[0];
      const result = await saveUploadedDocument({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: blobUrl,
        entityType,
        entityId,
        documentType,
      });
      if (result.success && 'data' in result) {
        onUpload(file, result.data);
      } else if ('error' in result) {
        setError(result.error || "Upload failed");
      } else {
        setError("Upload failed");
      }
    } catch (err) {
      setError("Upload error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={e => e.preventDefault()}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <span>Uploading...</span>}
      {error && <span className="text-red-500">{error}</span>}
    </form>
  );
}
