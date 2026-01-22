import QRCodeStyling from "qr-code-styling";

export class SafeQRClass {
  private qr: QRCodeStyling;

  constructor(options: any) {
    this.qr = new QRCodeStyling(options);
  }

  update(options: any) {
    this.qr.update(options);
  }

  /**
   * RENDER QR KE CANVAS (OFFSCREEN)
   */
  async renderToCanvas(): Promise<HTMLCanvasElement> {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    this.qr.append(container);

    await new Promise((r) => setTimeout(r, 50));

    const canvas = container.querySelector("canvas");
    if (!canvas) {
      document.body.removeChild(container);
      throw new Error("QR canvas not rendered");
    }

    document.body.removeChild(container);
    return canvas;
  }
}
