import * as fabricImport from 'fabric';
import { SafeQRClass } from './SafeQRClass';

// Helper to resolve Fabric instance similarly to DesignEditor
const resolveFabric = () => {
    try {
        const lib = fabricImport as any;
        let fabricInstance = null;
        if (lib && lib.default && lib.default.Canvas) fabricInstance = lib.default;
        else if (lib && lib.Canvas) fabricInstance = lib;
        else if (lib && lib.fabric && lib.fabric.Canvas) fabricInstance = lib.fabric;
        else if (typeof window !== 'undefined' && (window as any).fabric) fabricInstance = (window as any).fabric;
        
        return fabricInstance;
    } catch (e) {
        console.error("Fabric resolve error:", e);
        return null;
    }
};

export async function syncQRToFabric(
    qrInstance: SafeQRClass,
    canvas: any, // fabric.Canvas
    existingObj?: any // fabric.Image
): Promise<any> {
    // CHECKLIST: Canvas ready sebelum sync
    if (!canvas) return null;

    try {
        const fabricLib = resolveFabric();
        if (!fabricLib) return null;

        const url = await qrInstance.toDataURL();
        
        // Prevent Fabric from loading empty URLs
        if (!url) {
            console.warn("QR generation produced empty URL");
            return existingObj || null;
        }

        // CHECKLIST: Promise tidak dibiarkan menggantung
        return new Promise((resolve) => {
            let isResolved = false;

            // Safety timeout to ensure promise resolves eventually
            const safetyTimeout = setTimeout(() => {
                if (!isResolved) {
                    console.warn("QR Sync timed out, resolving cleanup");
                    URL.revokeObjectURL(url);
                    isResolved = true;
                    resolve(existingObj || null);
                }
            }, 3000);

            const finishUpdate = (objResult: any) => {
                 if (isResolved) return;
                 clearTimeout(safetyTimeout);
                 
                 if (objResult) {
                    objResult.set('dirty', true);
                    canvas.requestRenderAll();
                 }
                 URL.revokeObjectURL(url);
                 isResolved = true;
                 resolve(objResult);
            };

            if (existingObj) {
                // UPDATE MODE
                if (typeof existingObj.setSrc === 'function') {
                    // Fabric v5/v6 compatibility
                    try {
                        const result = existingObj.setSrc(url, (updatedObj: any) => {
                            // v5 callback
                            finishUpdate(updatedObj || existingObj);
                        }, { crossOrigin: 'anonymous' }); // CHECKLIST: crossOrigin: 'anonymous'
                        
                        // v6 Promise support
                        if (result && typeof result.then === 'function') {
                            result.then(() => finishUpdate(existingObj))
                                  .catch((e: any) => {
                                      console.error("Error setting src promise", e);
                                      finishUpdate(existingObj);
                                  });
                        }
                    } catch (e) {
                        console.error("Error calling setSrc", e);
                        finishUpdate(existingObj);
                    }
                } else {
                     finishUpdate(existingObj);
                }
            } else {
                // CREATE MODE
                const ImageClass = fabricLib.FabricImage || fabricLib.Image;
                // CHECKLIST: crossOrigin: 'anonymous'
                const imgOpts = { crossOrigin: 'anonymous' };

                const setupNewImage = (img: any) => {
                    if (!img) {
                        finishUpdate(null);
                        return;
                    }

                    try {
                        img.set({
                            left: canvas.width / 2,
                            top: canvas.height / 2,
                            originX: 'center',
                            originY: 'center',
                            selectable: true,
                            hasControls: true,
                            dataField: 'qr_code',
                            scaleX: 0.5,
                            scaleY: 0.5,
                            // Default Custom Props for serialization
                            qrDotStyle: 'square',
                            qrCornerStyle: 'square',
                            qrColor1: '#000000',
                            qrBgColor: 'transparent'
                        });

                        canvas.add(img);
                        canvas.setActiveObject(img);
                        finishUpdate(img);
                    } catch (e) {
                        console.error("Error setting up new image", e);
                        finishUpdate(null);
                    }
                };

                // Version agnostic loader
                try {
                    if (ImageClass.fromURL.length > 1) {
                        ImageClass.fromURL(url, setupNewImage, imgOpts);
                    } else {
                        ImageClass.fromURL(url, imgOpts).then((img: any) => setupNewImage(img)).catch((e: any) => {
                            console.error("QR Image Load Error (Promise)", e);
                            finishUpdate(null);
                        });
                    }
                } catch (e) {
                    console.error("QR Image Load Error (Sync)", e);
                    finishUpdate(null);
                }
            }
        });
    } catch (e) {
        console.error("syncQRToFabric fatal error:", e);
        return null;
    }
}