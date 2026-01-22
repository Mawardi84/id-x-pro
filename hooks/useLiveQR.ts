import { useEffect, useRef } from "react";
import { Canvas, Image as FabricImage } from "fabric";
import { SafeQRClass } from "../utils/SafeQRClass";

export function useLiveQR(
  canvas: Canvas | null,
  qrClass: SafeQRClass | null
) {
  const qrImageRef = useRef<FabricImage | null>(null);

  useEffect(() => {
    if (!canvas || !qrClass) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    const render = async () => {
      try {
        const qrCanvas = await qrClass.renderToCanvas();
        const dataUrl = qrCanvas.toDataURL("image/png");

        const img = await FabricImage.fromURL(dataUrl, {
          crossOrigin: "anonymous",
        });

        if (cancelled) return;

        img.set({
          left: canvas.getWidth() / 2 - (img.width ?? 0) / 2,
          top: canvas.getHeight() / 2 - (img.height ?? 0) / 2,
          selectable: true,
          objectCaching: false,
          name: "QR_CODE",
          dataField: "qr_code",
        });

        if (qrImageRef.current) {
          canvas.remove(qrImageRef.current);
        }

        qrImageRef.current = img;
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      } catch (e) {
        console.error("QR render error:", e);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [canvas, qrClass]);
}
