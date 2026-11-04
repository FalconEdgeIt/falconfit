"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Camera scanner with a typed fallback. The library loads on open, so it costs nothing until used.
export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let closed = false;
    let stop = () => {};

    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (closed || !videoRef.current) return;

        const hints = new Map([
          [
            DecodeHintType.POSSIBLE_FORMATS,
            [BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8],
          ],
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, _error, liveControls) => {
            if (!result || closed) return;
            closed = true;
            liveControls.stop();
            onDetected(result.getText());
          }
        );
        stop = () => controls.stop();
        if (closed) stop();
      } catch {
        if (!closed) setCameraError("Couldn't open the camera. Allow camera access, or type the barcode below.");
      }
    })();

    return () => {
      closed = true;
      stop();
    };
  }, [onDetected]);

  const digits = typed.replace(/\D/g, "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan a barcode"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 p-4"
    >
      <div className="w-full max-w-md bg-gray-800 rounded-2xl border border-gray-700/70 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2>Scan Barcode</h2>
          <button onClick={onClose} aria-label="Close scanner" className="p-2 text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {cameraError ? (
          <p className="text-gray-300 text-sm bg-gray-700/60 rounded-lg p-3">{cameraError}</p>
        ) : (
          <div className="relative aspect-[4/3] bg-gray-950 rounded-lg overflow-hidden">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-red-500/80" />
          </div>
        )}

        <form
          className="flex gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (digits.length >= 6) onDetected(digits);
          }}
        >
          <input
            inputMode="numeric"
            placeholder="Or type the barcode number"
            aria-label="Barcode number"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="bg-gray-700 p-2.5 rounded flex-1 min-w-0 text-base"
          />
          <button type="submit" disabled={digits.length < 6} className="bg-red-600 disabled:opacity-40 px-4 rounded font-semibold">
            Look up
          </button>
        </form>
      </div>
    </div>
  );
}
