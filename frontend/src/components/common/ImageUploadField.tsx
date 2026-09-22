import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, type UploadedFileResult } from "@/services/uploadService";

interface ImageUploadFieldProps {
  images: UploadedFileResult[];
  onChange: (images: UploadedFileResult[]) => void;
  maxFiles?: number;
}

export function ImageUploadField({ images, onChange, maxFiles = 6 }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (images.length + accepted.length > maxFiles) {
        toast.error(`You can upload up to ${maxFiles} images`);
        return;
      }
      setUploading(true);
      try {
        const uploaded = await Promise.all(accepted.map((file) => uploadImage(file)));
        onChange([...images, ...uploaded]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't upload one or more images");
      } finally {
        setUploading(false);
      }
    },
    [images, maxFiles, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] },
  });

  function removeImage(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <UploadCloud className="h-6 w-6 text-primary" />
        )}
        <p className="text-xs text-muted-foreground">
          {uploading ? "Uploading…" : "Drag & drop images here, or click to browse"}
        </p>
      </div>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
              <img src={img.filePath} alt={img.fileName} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
