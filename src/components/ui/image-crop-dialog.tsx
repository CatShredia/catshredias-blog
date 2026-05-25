"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { cropImageToBlob } from "@/lib/crop-image";

type ImageCropDialogProps = {
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onComplete: (file: File) => void;
};

export function ImageCropDialog({
  imageSrc,
  aspect,
  onCancel,
  onComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setCroppedArea(area);
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedArea);
      const file = new File([blob], `cropped-${Date.now()}.jpg`, {
        type: blob.type,
      });
      onComplete(file);
    } catch {
      setError("Не удалось обрезать изображение");
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-4 shadow-xl">
        <h2 id="crop-dialog-title" className="text-lg font-semibold">
          Обрезка изображения
        </h2>
        <div className="relative mt-4 h-64 overflow-hidden rounded-lg bg-card">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            {...(aspect ? { aspect } : {})}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <label className="mt-4 block text-sm text-muted">
          Масштаб
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={processing || !croppedArea}
          >
            {processing ? "Сохранение…" : "Применить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
