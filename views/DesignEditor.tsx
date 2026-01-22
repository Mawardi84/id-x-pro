import React, { useState, useRef, useEffect } from 'react';
import * as fabricImport from 'fabric';
import QRCodeStyling from 'qr-code-styling';
import { 
    Type, Square, Circle, Triangle, Image as ImageIcon, QrCode, Trash2, Save, PenTool, 
    Sparkles, Upload, X, Copy, Lock, Unlock, 
    AlignCenter, AlignVerticalJustifyCenter, Layers, Grip, Fingerprint,
    CheckCircle, Download, Palette, AlertTriangle, Loader2, RefreshCcw,
    Undo, Redo, Scissors, Ban, ZoomIn, ZoomOut, Maximize, Move
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button, Input, Label, Select, cn } from '../components/UIComponents';
import { analyzeDesign } from '../services/geminiService';
import { CardTemplate, InstitutionConfig } from '../types';
import { CardBackground } from '../components/CardRenderers';

// --- CONSTANTS ---
const CR80_WIDTH = 350;
const CR80_HEIGHT = 555;

const JSON_KEYS = [
    'dataField', 'qrStyles', 'id', 'qrAnimation', 
    'qrDotStyle', 'qrColor1', 'qrColor2', 'qrColorType', 
    'qrCornerStyle', 'qrCornerDotStyle', 'qrCornerColor', 'qrBgColor', 
    'qrLogoUrl', 'qrLogoSize', 'qrGradientRotation',
    'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY',
    'selectable', 'evented', 'stroke', 'strokeWidth', 'rx', 'ry', 'fill', 'fontFamily',
    'clipPath' 
];

const AVAILABLE_FONTS = [
    'Arial', 
    'Times New Roman', 
    'Courier New', 
    'Verdana', 
    'Georgia', 
    'Trebuchet MS', 
    'Impact', 
    'Inter', 
    'Space Grotesk'
];

const QR_PRESETS: Record<string, any> = {
    'custom': { name: 'Kustom' },
    'classic': { name: 'Klasik', dot: 'square', corner: 'square', cornerDot: 'square' },
    'modern': { name: 'Modern', dot: 'dots', corner: 'extra-rounded', cornerDot: 'dot' },
    'soft': { name: 'Lembut', dot: 'rounded', corner: 'extra-rounded', cornerDot: 'square' },
    'liquid': { name: 'Cair', dot: 'classy-rounded', corner: 'extra-rounded', cornerDot: 'dot' },
    'tech': { name: 'Teknologi', dot: 'square', corner: 'dot', cornerDot: 'square' },
    'elegant': { name: 'Elegan', dot: 'classy', corner: 'square', cornerDot: 'square' },
};

// --- RESOLVERS ---
const resolveFabric = () => {
    try {
        const lib = fabricImport as any;
        let fabricInstance = null;
        
        // Strategy 1: Default Export (Common in v5 via esm.sh)
        if (lib && lib.default && lib.default.Canvas) fabricInstance = lib.default;
        // Strategy 2: Named Exports (v6 or specific bundles)
        else if (lib && lib.Canvas) fabricInstance = lib;
        // Strategy 3: Nested fabric object (Legacy)
        else if (lib && lib.fabric && lib.fabric.Canvas) fabricInstance = lib.fabric;
        // Strategy 4: Global Fallback
        else if (typeof window !== 'undefined' && (window as any).fabric) fabricInstance = (window as any).fabric;

        // CRITICAL FIX: Polyfill window.fabric for plugins/internals that expect global scope
        if (fabricInstance && typeof window !== 'undefined') {
            if (!(window as any).fabric) {
                (window as any).fabric = fabricInstance;
            }
        }
        
        return fabricInstance;
    } catch (e) {
        console.error("Fabric resolution error:", e);
    }
    return null;
};

const resolveQR = () => {
    try {
        // @ts-ignore
        return (QRCodeStyling && QRCodeStyling.default) ? QRCodeStyling.default : QRCodeStyling;
    } catch(e) { return QRCodeStyling; }
}

interface DesignEditorProps {
    frontJson: any;
    setFrontJson: (json: any) => void;
    backJson: any;
    setBackJson: (json: any) => void;
    bgFront: string;
    setBgFront: (color: string) => void;
    bgBack: string;
    setBgBack: (color: string) => void;
    templates: CardTemplate[];
    setTemplates: (t: CardTemplate[]) => void | Promise<void>;
    config: InstitutionConfig;
    setConfig: (c: InstitutionConfig) => void;
    isLocked: boolean;
    setIsLocked: (l: boolean) => void;
    key?: React.Key | string | number | undefined; 
}

export const DesignEditor: React.FC<DesignEditorProps> = ({ 
    frontJson, setFrontJson, backJson, setBackJson, 
    bgFront, setBgFront, bgBack, setBgBack,
    templates, setTemplates, config, setConfig,
    isLocked, setIsLocked
}) => {
    
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
    const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvas = useRef<any>(null);
    const initializingRef = useRef(false);
    
    // Undo/Redo History State
    const [history, setHistory] = useState<Record<'front' | 'back', { stack: any[], index: number }>>({
        front: { stack: [], index: -1 },
        back: { stack: [], index: -1 }
    });
    const historyProcessing = useRef(false);

    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [canvasObjects, setCanvasObjects] = useState<any[]>([]); 
    const [refreshKey, setRefreshKey] = useState(0); 
    const qrDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFabricReady, setIsFabricReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Zoom & Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const isPanningRef = useRef(false); // Ref to access inside fabric events
    const isDraggingRef = useRef(false);
    const lastPosX = useRef(0);
    const lastPosY = useRef(0);

    // --- FABRIC JS LOADING CHECK ---
    useEffect(() => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            const lib = resolveFabric();
            if (lib && lib.Canvas) {
                setIsFabricReady(true);
                clearInterval(checkInterval);
            } else {
                attempts++;
                if (attempts > 50) { 
                    clearInterval(checkInterval);
                    setIsFabricReady(true); // Attempt anyway
                }
            }
        }, 100);
        
        // Immediate check
        if (resolveFabric()) {
            setIsFabricReady(true);
            clearInterval(checkInterval);
        }

        return () => clearInterval(checkInterval);
    }, []);

    // --- FABRIC JS INIT ---
    useEffect(() => {
        if (!canvasRef.current || !isFabricReady) return;

        const fabricLib = resolveFabric();
        if (!fabricLib) {
             setLoadError("Library Fabric.js tidak ditemukan atau gagal dimuat.");
             return;
        }

        let isMounted = true;
        
        const initCanvas = async () => {
            if (initializingRef.current) return;
            initializingRef.current = true;

            // Cleanup existing if any
            if (fabricCanvas.current) {
                try {
                    fabricCanvas.current.dispose();
                } catch(e) { console.warn("Cleanup error", e); }
                fabricCanvas.current = null;
            }

            if (!isMounted) {
                initializingRef.current = false;
                return;
            }

            try {
                const canvas = new fabricLib.Canvas(canvasRef.current, {
                    width: CR80_WIDTH,
                    height: CR80_HEIGHT,
                    backgroundColor: null, 
                    preserveObjectStacking: true,
                    selection: !isLocked && !isPanningRef.current
                });

                fabricCanvas.current = canvas;

                // Load Data
                const currentJson = activeSide === 'front' ? frontJson : backJson;
                
                if (currentJson && typeof currentJson === 'object') {
                    historyProcessing.current = true; // Don't trigger save during load
                    
                    // Safe loading wrapper
                    await new Promise<void>((resolve) => {
                         try {
                             canvas.loadFromJSON(currentJson, () => {
                                 resolve();
                             });
                         } catch (err) {
                             console.error("Error inside loadFromJSON", err);
                             resolve(); // Resolve anyway to prevent hanging
                         }
                    });
                    
                    historyProcessing.current = false;

                    canvas.forEachObject((obj: any) => {
                        obj.selectable = !isLocked;
                        obj.evented = !isLocked;
                        obj.lockMovementX = isLocked;
                        obj.lockMovementY = isLocked;
                    });
                } else if (!isLocked) {
                    const text = new fabricLib.IText('Kartu Baru', { left: 100, top: 100, fontSize: 20, selectable: !isLocked });
                    canvas.add(text);
                }
                
                // Initialize History for this side if empty
                if (history[activeSide].stack.length === 0) {
                     // Ensure we have a valid object to save
                     try {
                        const initialJson = canvas.toJSON(JSON_KEYS);
                        addToHistoryInternal(initialJson, activeSide);
                     } catch (e) { console.error("History Init Error", e); }
                }

                if(!isMounted) {
                    try { canvas.dispose(); } catch(e) {}
                    fabricCanvas.current = null;
                    initializingRef.current = false;
                    return;
                }

                canvas.requestRenderAll();
                updateLayerList(canvas);
                
                // Events
                const updateSelection = (e: any) => {
                    if (!e) return;
                    let selected = null;
                    // Robust selection check
                    if (e.selected && Array.isArray(e.selected) && e.selected.length > 0) selected = e.selected[0];
                    else if (e.target) selected = e.target;
                    
                    setSelectedObject(selected);
                    if (selected) {
                        setActiveTab('properties'); 
                        setRefreshKey(prev => prev + 1);
                    }
                };

                const clearSelection = () => {
                    if (!canvas.getActiveObject()) {
                        setSelectedObject(null);
                        setRefreshKey(prev => prev + 1);
                    }
                };

                const onModified = () => {
                    if (historyProcessing.current) return;
                    saveCanvasState(canvas);
                    updateLayerList(canvas);
                    setRefreshKey(prev => prev + 1);
                };

                canvas.on('selection:created', updateSelection);
                canvas.on('selection:updated', updateSelection);
                canvas.on('selection:cleared', clearSelection);
                
                // Trigger save on these events
                canvas.on('object:modified', onModified);
                canvas.on('object:added', onModified);
                canvas.on('object:removed', onModified);
                
                const onLiveUpdate = () => setRefreshKey(prev => prev + 1);
                canvas.on('object:moving', onLiveUpdate);
                canvas.on('object:scaling', onLiveUpdate);
                canvas.on('object:rotating', onLiveUpdate);
                
                canvas.on('mouse:down', (e: any) => {
                    // Panning Logic
                    if (isPanningRef.current || e.e.altKey) {
                        isDraggingRef.current = true;
                        canvas.selection = false;
                        lastPosX.current = e.e.clientX;
                        lastPosY.current = e.e.clientY;
                        canvas.setCursor('grabbing');
                        return; // Stop other processing
                    }

                    if (!e.target) {
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                        setSelectedObject(null);
                        setRefreshKey(prev => prev + 1);
                    }
                });

                canvas.on('mouse:move', (e: any) => {
                    if (isDraggingRef.current) {
                        const evt = e.e;
                        const vpt = canvas.viewportTransform;
                        vpt[4] += evt.clientX - lastPosX.current;
                        vpt[5] += evt.clientY - lastPosY.current;
                        canvas.requestRenderAll();
                        lastPosX.current = evt.clientX;
                        lastPosY.current = evt.clientY;
                    }
                });

                canvas.on('mouse:up', () => {
                    if (isDraggingRef.current) {
                        canvas.setViewportTransform(canvas.viewportTransform);
                        isDraggingRef.current = false;
                        canvas.selection = !isPanningRef.current;
                        canvas.setCursor(isPanningRef.current ? 'grab' : 'default');
                    }
                });

                canvas.on('mouse:wheel', (opt: any) => {
                    const delta = opt.e.deltaY;
                    let zoom = canvas.getZoom();
                    zoom *= 0.999 ** delta;
                    if (zoom > 5) zoom = 5;
                    if (zoom < 0.2) zoom = 0.2;
                    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
                    setZoomLevel(zoom);
                    opt.e.preventDefault();
                    opt.e.stopPropagation();
                });

                // Helper to fix offset issues
                setTimeout(() => {
                    if (canvas && !canvas.disposed) canvas.calcOffset();
                }, 100);

            } catch (error) {
                console.error("Canvas init error:", error);
            } finally {
                initializingRef.current = false;
            }
        };

        initCanvas();
        
        return () => {
            isMounted = false;
            if(fabricCanvas.current) {
                try {
                    fabricCanvas.current.dispose();
                } catch(e) {}
                fabricCanvas.current = null;
            }
        }
    }, [activeSide, isLocked, isFabricReady]); 

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => {
            if (fabricCanvas.current) fabricCanvas.current.calcOffset();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateLayerList = (canvas: any) => {
        if (!canvas) return;
        try {
            const objs = canvas.getObjects().slice().reverse(); 
            setCanvasObjects(objs);
        } catch (e) { console.error("Error updating layer list", e); }
    }

    // Helper to modify history state locally
    const addToHistoryInternal = (json: any, side: 'front' | 'back') => {
        setHistory(prev => {
            const currentSide = prev[side];
            const newStack = currentSide.stack.slice(0, currentSide.index + 1);
            newStack.push(json);
            // Limit stack size to 20
            if (newStack.length > 20) newStack.shift();
            
            return {
                ...prev,
                [side]: {
                    stack: newStack,
                    index: newStack.length - 1
                }
            };
        });
    };

    const addToHistory = (json: any) => {
        addToHistoryInternal(json, activeSide);
    };

    const saveCanvasState = (canvas: any, skipHistory: boolean = false) => {
        if(!canvas || isLocked) return;
        try {
            // Guard against disposed canvas or invalid state
            if (canvas.disposed) return;
            
            const json = canvas.toJSON(JSON_KEYS); 
            
            // Save to Parent (Persistence)
            if (activeSide === 'front') setFrontJson(json);
            else setBackJson(json);
            
            // Save to History (Undo/Redo)
            if (!skipHistory) {
                addToHistory(json);
            }
        } catch (e) { console.error("Save state error", e); }
    };

    const handleUndo = () => {
        const sideHistory = history[activeSide];
        if (sideHistory.index <= 0 || !fabricCanvas.current) return;
        
        const newIndex = sideHistory.index - 1;
        const json = sideHistory.stack[newIndex];
        
        historyProcessing.current = true;
        
        try {
            fabricCanvas.current.loadFromJSON(json, () => {
                fabricCanvas.current.renderAll();
                historyProcessing.current = false;
                
                // Update History Index
                setHistory(prev => ({
                    ...prev,
                    [activeSide]: { ...prev[activeSide], index: newIndex }
                }));
                
                // Sync with parent state but skip adding to history stack
                saveCanvasState(fabricCanvas.current, true);
                updateLayerList(fabricCanvas.current);
                setRefreshKey(prev => prev + 1);
            });
        } catch(e) {
            console.error("Undo error", e);
            historyProcessing.current = false;
        }
    };

    const handleRedo = () => {
        const sideHistory = history[activeSide];
        if (sideHistory.index >= sideHistory.stack.length - 1 || !fabricCanvas.current) return;
        
        const newIndex = sideHistory.index + 1;
        const json = sideHistory.stack[newIndex];
        
        historyProcessing.current = true;
        try {
            fabricCanvas.current.loadFromJSON(json, () => {
                fabricCanvas.current.renderAll();
                historyProcessing.current = false;
                
                setHistory(prev => ({
                    ...prev,
                    [activeSide]: { ...prev[activeSide], index: newIndex }
                }));
                
                saveCanvasState(fabricCanvas.current, true);
                updateLayerList(fabricCanvas.current);
                setRefreshKey(prev => prev + 1);
            });
        } catch(e) {
             console.error("Redo error", e);
             historyProcessing.current = false;
        }
    };

    const updateBackgroundColor = (color: string) => {
        if (isLocked) return;
        if (activeSide === 'front') setBgFront(color);
        else setBgBack(color);
    };

    const refreshQRCodeImage = (fabricObj: any) => {
        if (!fabricObj || fabricObj.dataField !== 'qr_code') return;
        const QRClass = resolveQR();
        if (qrDebounceRef.current) clearTimeout(qrDebounceRef.current);

        qrDebounceRef.current = setTimeout(() => {
            const style = {
                qrDotStyle: fabricObj.qrDotStyle || 'square',
                qrColor1: fabricObj.qrColor1 || '#000000',
                qrColorType: fabricObj.qrColorType || 'single',
                qrColor2: fabricObj.qrColor2,
                qrCornerStyle: fabricObj.qrCornerStyle || 'square',
                qrCornerDotStyle: fabricObj.qrCornerDotStyle, 
                qrCornerColor: fabricObj.qrCornerColor || fabricObj.qrColor1 || '#000000',
                qrBgColor: fabricObj.qrBgColor || 'transparent',
                qrLogoUrl: fabricObj.qrLogoUrl,
                qrLogoSize: fabricObj.qrLogoSize || 0.4,
                qrGradientRotation: fabricObj.qrGradientRotation || 0
            };

            const dotsOptions: any = { type: style.qrDotStyle };
            if (style.qrColorType === 'gradient' && style.qrColor2) {
                dotsOptions.gradient = {
                    type: 'linear', 
                    rotation: style.qrGradientRotation * (Math.PI / 180), 
                    colorStops: [{ offset: 0, color: style.qrColor1 }, { offset: 1, color: style.qrColor2 }]
                };
            } else {
                dotsOptions.color = style.qrColor1;
            }

            let cornerDotType = style.qrCornerDotStyle;
            if (!cornerDotType) {
                if (style.qrCornerStyle === 'extra-rounded' || style.qrCornerStyle === 'dot') cornerDotType = 'dot';
                else cornerDotType = 'square';
            }

            const qr = new QRClass({
                width: 300, height: 300,
                data: 'https://id-forge.app', 
                image: style.qrLogoUrl,
                dotsOptions,
                cornersSquareOptions: { type: style.qrCornerStyle, color: style.qrCornerColor },
                cornersDotOptions: { type: cornerDotType, color: style.qrCornerColor },
                backgroundOptions: { color: style.qrBgColor },
                imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: style.qrLogoSize }
            });

            qr.getRawData('png').then((blob: any) => {
                if(blob) {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const newSrc = reader.result as string;
                        try {
                             if (fabricObj.setSrc) await fabricObj.setSrc(newSrc);
                             else fabricObj.src = newSrc;
                             fabricCanvas.current?.requestRenderAll();
                        } catch(e) { console.error("Error setting QR src", e); }
                    }
                    reader.readAsDataURL(blob as Blob);
                }
            });
        }, 150);
    };

    const addObject = (obj: any) => {
         if(!fabricCanvas.current || isLocked) return;
         fabricCanvas.current.discardActiveObject();
         fabricCanvas.current.add(obj);
         fabricCanvas.current.setActiveObject(obj);
         fabricCanvas.current.requestRenderAll(); 
         setSelectedObject(obj); 
         setRefreshKey(prev => prev + 1);
         saveCanvasState(fabricCanvas.current);
         updateLayerList(fabricCanvas.current);
    }

    const addText = () => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricCanvas.current || !fabricLib) return;
        const text = new fabricLib.IText('Teks Baru', { 
            left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center',
            fontSize: 16, fontFamily: 'Arial', fill: '#000000',
            cornerColor: '#06b6d4', borderColor: '#06b6d4', transparentCorners: false, cornerSize: 10
        });
        addObject(text);
    };

    const addShape = (type: 'rect' | 'circle' | 'triangle' = 'rect') => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricCanvas.current || !fabricLib) return;
        
        const commonOptions = {
            left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center',
            fill: '#3b82f6',
            cornerColor: '#06b6d4', borderColor: '#06b6d4', transparentCorners: false, cornerSize: 10
        };

        let shape;
        if (type === 'rect') {
            shape = new fabricLib.Rect({ ...commonOptions, width: 100, height: 100 });
        } else if (type === 'circle') {
            shape = new fabricLib.Circle({ ...commonOptions, radius: 50 });
        } else if (type === 'triangle') {
            shape = new fabricLib.Triangle({ ...commonOptions, width: 100, height: 100 });
        }

        if (shape) addObject(shape);
    };

    const addImage = async (url: string) => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricCanvas.current || !fabricLib) return;
        try {
            // Compatibility for v5 (Image) and v6 (FabricImage)
            const ImageClass = fabricLib.FabricImage || fabricLib.Image;
            const imgOpts = url.startsWith('data:') ? {} : { crossOrigin: 'anonymous' };
            
            // v5 uses fromURL with callback, v6 returns promise. Handle both.
            if (ImageClass.fromURL.length > 1) {
                // v5 style callback
                ImageClass.fromURL(url, (img: any) => {
                     if (!img) return;
                     setupImage(img);
                }, imgOpts);
            } else {
                // v6 style promise
                const img = await ImageClass.fromURL(url, imgOpts);
                setupImage(img);
            }
        } catch (error) {
            console.error("Error loading image:", error);
            alert("Gagal memuat gambar.");
        }
    };
    
    const setupImage = (img: any) => {
        if (!img || img.width === 0) return;
        const maxWidth = CR80_WIDTH * 0.6;
        const scale = img.width > maxWidth ? (maxWidth / img.width) : 0.5;
        img.set({ 
            left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center', 
            scaleX: scale, scaleY: scale,
            cornerColor: '#06b6d4', borderColor: '#06b6d4', transparentCorners: false, cornerSize: 10
        });
        addObject(img);
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const result = f.target?.result as string;
            if (result) addImage(result);
        };
        reader.readAsDataURL(files[0]);
    };
    
    const addQR = () => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        const QRClass = resolveQR();
        if (!fabricCanvas.current || !fabricLib || !QRClass) return;
        
        const qr = new QRClass({ width: 100, height: 100, data: 'https://id-forge.app' });
        qr.getRawData('png').then((blob: any) => {
           if(blob) {
               const reader = new FileReader();
               reader.onload = async () => {
                   const ImageClass = fabricLib.FabricImage || fabricLib.Image;
                   const result = reader.result as string;
                   
                   if (ImageClass.fromURL.length > 1) {
                        ImageClass.fromURL(result, (img: any) => setupQR(img));
                   } else {
                        const img = await ImageClass.fromURL(result);
                        setupQR(img);
                   }
               }
               reader.readAsDataURL(blob as Blob);
           }
        });
    };
    
    const setupQR = (img: any) => {
        img.set({ 
           left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center',
           dataField: 'qr_code', qrDotStyle: 'square', qrCornerStyle: 'square', qrCornerDotStyle: 'square',
           qrColor1: '#000000', qrBgColor: 'transparent',
           cornerColor: '#06b6d4', borderColor: '#06b6d4', transparentCorners: false, cornerSize: 10
       });
       addObject(img);
    }

    const applyMask = (type: 'none' | 'circle' | 'rect' | 'rounded') => {
        if(!fabricCanvas.current || !selectedObject || isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricLib) return;

        // Reset clipPath
        if (type === 'none') {
            selectedObject.set({ clipPath: null });
        } else {
            // Determine size based on original image dimensions
            const width = selectedObject.width;
            const height = selectedObject.height;
            const size = Math.min(width, height);
            
            let clipObj;
            if (type === 'circle') {
                clipObj = new fabricLib.Circle({
                    radius: size / 2,
                    originX: 'center', originY: 'center',
                    left: 0, top: 0
                });
            } else if (type === 'rounded') {
                clipObj = new fabricLib.Rect({
                    width: width, height: height,
                    rx: width * 0.1, ry: height * 0.1, // 10% roundness
                    originX: 'center', originY: 'center',
                    left: 0, top: 0
                });
            } else if (type === 'rect') {
                clipObj = new fabricLib.Rect({
                    width: width, height: height,
                    originX: 'center', originY: 'center',
                    left: 0, top: 0
                });
            }

            if (clipObj) {
                selectedObject.set({ clipPath: clipObj });
            }
        }
        
        selectedObject.dirty = true;
        fabricCanvas.current.requestRenderAll();
        saveCanvasState(fabricCanvas.current);
        setRefreshKey(prev => prev + 1);
    };

    // Viewport Controls
    const togglePanning = () => {
        const newVal = !isPanning;
        setIsPanning(newVal);
        isPanningRef.current = newVal;
        if(fabricCanvas.current) {
            fabricCanvas.current.selection = !newVal;
            fabricCanvas.current.defaultCursor = newVal ? 'grab' : 'default';
            fabricCanvas.current.hoverCursor = newVal ? 'grab' : 'move';
            fabricCanvas.current.requestRenderAll();
        }
    };

    const handleZoom = (factor: number) => {
        if(!fabricCanvas.current) return;
        let newZoom = fabricCanvas.current.getZoom() * factor;
        if (newZoom > 5) newZoom = 5;
        if (newZoom < 0.2) newZoom = 0.2;
        
        const center = fabricCanvas.current.getCenter();
        fabricCanvas.current.zoomToPoint({ x: center.left, y: center.top }, newZoom);
        setZoomLevel(newZoom);
    };

    const resetZoom = () => {
        if(!fabricCanvas.current) return;
        fabricCanvas.current.setViewportTransform([1,0,0,1,0,0]);
        setZoomLevel(1);
    };

    const updateSelectedObject = async (key: string, value: any) => {
        if (!fabricCanvas.current || !selectedObject || isLocked) return;
        selectedObject.set(key, value);
        
        // --- NEW LOGIC: Update Text Content from Config immediately ---
        if (key === 'dataField') {
             if (value && (config as any)[value]) {
                 // It's a config field (Disclaimer, Address, etc.) -> Show actual text
                 selectedObject.set('text', (config as any)[value]);
             } else if (value === 'fullName') {
                 selectedObject.set('text', 'Nama Lengkap');
             } else if (value === 'role') {
                 selectedObject.set('text', 'JABATAN');
             } else if (value === 'employeeId') {
                 selectedObject.set('text', '1234567890');
             } else if (value === 'department') {
                 selectedObject.set('text', 'Departemen');
             } else if (value === 'joinedDate') {
                 selectedObject.set('text', '01-01-2024');
             } else if (value === 'expiryDate') {
                 selectedObject.set('text', '01-01-2029');
             }
             fabricCanvas.current.requestRenderAll();
        }

        if (key === 'qrColorType' && value === 'gradient' && !selectedObject.qrColor2) {
             selectedObject.set('qrColor2', '#000000');
        }
        if (selectedObject.dataField === 'qr_code') {
            refreshQRCodeImage(selectedObject);
        } else {
            fabricCanvas.current.requestRenderAll();
        }
        saveCanvasState(fabricCanvas.current);
        setRefreshKey(prev => prev + 1); 
    };

    const handleQRLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const result = f.target?.result as string;
            updateSelectedObject('qrLogoUrl', result);
        };
        reader.readAsDataURL(files[0]);
    };

    const applyQRPreset = (presetKey: string) => {
        if (!fabricCanvas.current || !selectedObject || isLocked) return;
        const p = QR_PRESETS[presetKey];
        if (!p || presetKey === 'custom') return;
        selectedObject.set({ qrDotStyle: p.dot, qrCornerStyle: p.corner, qrCornerDotStyle: p.cornerDot });
        refreshQRCodeImage(selectedObject);
        setRefreshKey(prev => prev + 1);
        saveCanvasState(fabricCanvas.current);
    }

    const handleAlignment = (type: 'centerH' | 'centerV') => {
        if (!fabricCanvas.current || !selectedObject || isLocked) return;
        if (typeof selectedObject.centerH === 'function') selectedObject.centerH();
        else if (selectedObject.center) {
             const center = fabricCanvas.current.getCenter();
             if(type === 'centerH') selectedObject.setX(center.left);
        }
        if (typeof selectedObject.centerV === 'function') selectedObject.centerV();
        else if (selectedObject.center) {
             const center = fabricCanvas.current.getCenter();
             if(type === 'centerV') selectedObject.setY(center.top);
        }
        selectedObject.setCoords();
        fabricCanvas.current.renderAll();
        saveCanvasState(fabricCanvas.current);
    };

    const handleLayer = (action: 'front' | 'back' | 'forward' | 'backward') => {
        if (!fabricCanvas.current || !selectedObject || isLocked) return;
        switch (action) {
            case 'front': selectedObject.bringToFront(); break;
            case 'back': selectedObject.sendToBack(); break;
            case 'forward': selectedObject.bringForward(); break;
            case 'backward': selectedObject.sendBackwards(); break;
        }
        fabricCanvas.current.renderAll();
        saveCanvasState(fabricCanvas.current);
        updateLayerList(fabricCanvas.current);
    };

    const handleDuplicate = async () => {
         if (!fabricCanvas.current || !selectedObject || isLocked) return;
         try {
            // v5 clone needs a callback, v6 returns promise
            if (selectedObject.clone.length > 0) {
                 selectedObject.clone((cloned: any) => {
                     finishDuplicate(cloned);
                 });
            } else {
                 const cloned = await selectedObject.clone();
                 finishDuplicate(cloned);
            }
         } catch(e) { console.error("Clone error", e); }
    };

    const finishDuplicate = (cloned: any) => {
        if(!fabricCanvas.current) return;
        fabricCanvas.current.discardActiveObject();
        cloned.set({ left: cloned.left + 20, top: cloned.top + 20, evented: true });
        if (cloned.type === 'activeSelection') {
            cloned.canvas = fabricCanvas.current;
            cloned.forEachObject((obj: any) => fabricCanvas.current.add(obj));
            cloned.setCoords();
        } else {
            fabricCanvas.current.add(cloned);
        }
        fabricCanvas.current.setActiveObject(cloned);
        fabricCanvas.current.requestRenderAll();
        saveCanvasState(fabricCanvas.current);
        setSelectedObject(cloned);
        updateLayerList(fabricCanvas.current);
        setRefreshKey(prev => prev + 1);
    }

    const toggleLock = () => {
        if (!fabricCanvas.current || !selectedObject || isLocked) return;
        const isLockedObj = !selectedObject.lockMovementX;
        selectedObject.set({
            lockMovementX: isLockedObj, lockMovementY: isLockedObj,
            lockRotation: isLockedObj, lockScalingX: isLockedObj, lockScalingY: isLockedObj
        });
        setRefreshKey(prev => prev + 1);
        fabricCanvas.current.renderAll();
        saveCanvasState(fabricCanvas.current);
    };

    const handleAiDesignCritique = async () => {
         if(!fabricCanvas.current) return;
         const json = fabricCanvas.current.toJSON();
         const objCount = json.objects.length;
         // @ts-ignore
         const hasQr = json.objects.some((o:any) => o.dataField === 'qr_code');
         alert("Menganalisis desain dengan AI...");
         const tip = await analyzeDesign(objCount, hasQr);
         alert(`TIPS DESAIN AI:\n\n${tip}`);
    };

    const handleDownloadImage = async () => {
        const node = document.getElementById('design-canvas-container');
        if (!node) return;
        try {
            const dataUrl = await toPng(node, { pixelRatio: 4, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `design_${activeSide}_HD.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to download image', error);
            alert("Gagal mengunduh gambar.");
        }
    };

    const getObjectName = (obj: any) => {
        if (!obj) return 'Unknown';
        if (obj.type === 'i-text' || obj.type === 'textbox') return `Teks: "${obj.text?.substring(0, 15)}${obj.text?.length > 15 ? '...' : ''}"`;
        if (obj.type === 'image' || obj.type === 'fabric-image') return obj.dataField === 'qr_code' ? 'QR Code' : (obj.dataField === 'photoUrl' ? 'Foto Pegawai' : 'Gambar');
        if (obj.type === 'rect') return 'Kotak';
        if (obj.type === 'circle') return 'Lingkaran';
        if (obj.type === 'triangle') return 'Segitiga';
        return obj.type;
    };

    const selectObjectFromLayer = (obj: any) => {
        if (!fabricCanvas.current || isLocked) return;
        fabricCanvas.current.setActiveObject(obj);
        fabricCanvas.current.renderAll();
        setSelectedObject(obj);
        setActiveTab('properties');
        setRefreshKey(prev => prev + 1);
    };

    const deleteObject = (obj: any) => {
         if (!fabricCanvas.current || isLocked) return;
         fabricCanvas.current.remove(obj);
         setSelectedObject(null);
         saveCanvasState(fabricCanvas.current);
         updateLayerList(fabricCanvas.current);
         setRefreshKey(prev => prev + 1);
    };
    
    // UI Helpers
    const safeInt = (val: string) => { const parsed = parseInt(val); return isNaN(parsed) ? 0 : parsed; }
    const safeFloat = (val: string) => { const parsed = parseFloat(val); return isNaN(parsed) ? 1 : parsed; }
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!isLocked) setIsDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragOver(false); if (isLocked) return;
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (f) => { if (f.target?.result) addImage(f.target.result as string); };
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    };

    if (loadError) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 flex-col gap-4 text-center p-8">
                <AlertTriangle size={48} className="text-red-500" />
                <h2 className="text-xl font-bold text-white">Editor Gagal Dimuat</h2>
                <p className="text-slate-400 max-w-md">{loadError}</p>
                <Button onClick={() => window.location.reload()}>Muat Ulang Halaman</Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950">
            {/* Left Toolbar */}
            <div className={cn("w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-10 transition-opacity", isLocked && "opacity-30 pointer-events-none grayscale")}>
                <div className="space-y-4">
                    <Button size="icon" variant="ghost" onClick={addText} title="Tambah Teks"><Type size={20}/></Button>
                    <div className="flex flex-col gap-2 p-1 bg-slate-800/50 rounded-lg">
                        <Button size="icon" variant="ghost" onClick={() => addShape('rect')} title="Kotak"><Square size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => addShape('circle')} title="Lingkaran"><Circle size={16}/></Button>
                        <Button size="icon" variant="ghost" onClick={() => addShape('triangle')} title="Segitiga"><Triangle size={16}/></Button>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => document.getElementById('img-upload')?.click()} title="Tambah Gambar"><ImageIcon size={20}/></Button>
                    <input id="img-upload" type="file" className="hidden" onChange={handleImageUpload} />
                    <Button size="icon" variant="ghost" onClick={addQR} title="Tambah QR"><QrCode size={20}/></Button>
                </div>
                <div className="flex-1" />
                <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => {
                    if(fabricCanvas.current?.getActiveObject()) fabricCanvas.current.remove(fabricCanvas.current.getActiveObject()!);
                    setSelectedObject(null);
                    updateLayerList(fabricCanvas.current);
                    setRefreshKey(prev => prev + 1);
                }}><Trash2 size={20}/></Button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col relative">
                <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             {isLocked ? (
                                 <div className="flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                     <Lock size={12} /> STATUS: SIAP CETAK
                                 </div>
                             ) : (
                                 <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 px-3 py-1 rounded-full text-xs font-bold">
                                     <PenTool size={12} /> MODE EDIT
                                 </div>
                             )}
                        </div>
                        <div className="flex bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setActiveSide('front')} className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", activeSide === 'front' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200")}>DEPAN</button>
                            <button onClick={() => setActiveSide('back')} className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", activeSide === 'back' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200")}>BELAKANG</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <div className="flex gap-1 mr-2 border-r border-slate-700 pr-2">
                            <Button size="icon" variant="ghost" disabled={isLocked || history[activeSide].index <= 0} onClick={handleUndo} className="text-slate-400 hover:text-white disabled:opacity-30" title="Undo">
                                <Undo size={16}/>
                            </Button>
                            <Button size="icon" variant="ghost" disabled={isLocked || history[activeSide].index >= history[activeSide].stack.length - 1} onClick={handleRedo} className="text-slate-400 hover:text-white disabled:opacity-30" title="Redo">
                                <Redo size={16}/>
                            </Button>
                         </div>
                         <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/20" onClick={handleDownloadImage} title="Unduh Gambar HD">
                            <Download size={16} className="mr-2"/> Unduh HD
                        </Button>
                        <Button 
                            size="sm" 
                            className={cn(
                                "font-bold transition-all border", 
                                isLocked 
                                    ? "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700" 
                                    : "bg-green-600 text-black border-green-500 hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            )}
                            onClick={() => setIsLocked(!isLocked)}
                        >
                            {isLocked ? (
                                <><Unlock size={16} className="mr-2"/> Buka Kunci (Edit)</>
                            ) : (
                                <><CheckCircle size={16} className="mr-2"/> Kunci & Siap Cetak</>
                            )}
                        </Button>
                        {!isLocked && (
                            <>
                                <Button size="sm" variant="outline" className="text-purple-400 border-purple-500/50 hover:bg-purple-900/20" onClick={handleAiDesignCritique}>
                                    <Sparkles size={16} className="mr-2"/> Kritik AI
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const name = prompt("Nama Templat:");
                                    if(name) {
                                        setTemplates([...templates, { 
                                            id: Date.now().toString(), name, category: 'CUSTOM', 
                                            layout: { 
                                                front: { background: bgFront, elements: [], json: frontJson },
                                                back: { background: bgBack, elements: [], json: backJson }
                                            },
                                            // -- ADDED: Save Configuration into Template --
                                            config: {
                                                enablePattern: config.enablePattern,
                                                patternText: config.patternText,
                                                patternLayout: config.patternLayout,
                                                patternColor: config.patternColor,
                                                patternOpacity: config.patternOpacity,
                                                patternRotation: config.patternRotation,
                                                patternSpacing: config.patternSpacing,
                                                patternFontSize: config.patternFontSize,
                                                enableWatermark: config.enableWatermark,
                                                watermarkOpacity: config.watermarkOpacity,
                                                watermarkScale: config.watermarkScale
                                            }
                                        } as any]);
                                        alert("Templat Disimpan!");
                                    }
                                }}><Save size={16} className="mr-2"/> Simpan Templat</Button>
                            </>
                        )}
                    </div>
                </header>
                
                <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-950 flex items-center justify-center overflow-hidden p-8 relative"
                     onClick={(e) => {
                         if (e.target !== e.currentTarget) return;
                         if(fabricCanvas.current) {
                             fabricCanvas.current.discardActiveObject();
                             fabricCanvas.current.requestRenderAll();
                             setSelectedObject(null);
                             setRefreshKey(prev => prev + 1);
                         }
                     }}
                >
                    <div id="design-canvas-container" 
                        className={cn(
                            "shadow-2xl relative border transition-all duration-300", 
                            isLocked ? "border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.1)]" : "border-slate-700/50",
                            isDragOver && !isLocked && "border-4 border-dashed border-cyan-400 bg-cyan-900/20 scale-105",
                            isPanning && "cursor-grab active:cursor-grabbing"
                        )} 
                        style={{ width: CR80_WIDTH, height: CR80_HEIGHT }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                         <div className="absolute inset-0" style={{ backgroundColor: activeSide === 'front' ? bgFront : bgBack }} />
                         <CardBackground config={config} isBack={activeSide === 'back'} />
                        
                        {!isFabricReady && !loadError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                                <div className="text-cyan-400 flex flex-col items-center">
                                    <Loader2 size={32} className="animate-spin mb-2"/>
                                    <span>Memuat Editor...</span>
                                </div>
                            </div>
                        )}

                        <canvas ref={canvasRef} width={CR80_WIDTH} height={CR80_HEIGHT} />
                        
                        {isDragOver && !isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                                <div className="bg-black/60 p-4 rounded-xl flex flex-col items-center backdrop-blur-sm text-cyan-400">
                                    <Upload size={48} className="animate-bounce mb-2"/>
                                    <span className="font-bold text-lg">Lepaskan Foto</span>
                                </div>
                            </div>
                        )}

                        {isLocked && (
                            <div className="absolute inset-0 pointer-events-none z-50 border-4 border-green-500/20 flex items-center justify-center">
                                <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm border border-green-500/30">
                                    <Lock size={24} className="text-green-400 opacity-50"/>
                                </div>
                            </div>
                        )}

                        {/* ZOOM CONTROLS */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-slate-900/80 backdrop-blur rounded-lg p-2 border border-slate-700 z-40 shadow-xl">
                            <Button size="icon" variant="ghost" onClick={() => handleZoom(1.1)} className="h-8 w-8 text-cyan-400 hover:bg-cyan-900/50"><ZoomIn size={16}/></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleZoom(0.9)} className="h-8 w-8 text-cyan-400 hover:bg-cyan-900/50"><ZoomOut size={16}/></Button>
                            <Button size="icon" variant="ghost" onClick={resetZoom} className="h-8 w-8 text-slate-400 hover:bg-slate-700" title="Reset Zoom"><Maximize size={16}/></Button>
                            <div className="h-px bg-slate-700 my-1"/>
                            <Button size="icon" variant="ghost" onClick={togglePanning} className={cn("h-8 w-8", isPanning ? "bg-cyan-600 text-black hover:bg-cyan-500" : "text-slate-400 hover:bg-slate-700")} title="Mode Geser (Pan)"><Move size={16}/></Button>
                            <div className="text-[10px] text-center font-mono text-slate-500 mt-1">{Math.round(zoomLevel * 100)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Properties Panel */}
            <div className={cn("w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full transition-all", isLocked && "opacity-50 pointer-events-none grayscale")}>
                
                <div className="flex border-b border-slate-800">
                    <button onClick={() => setActiveTab('properties')} className={cn("flex-1 py-3 text-xs font-bold uppercase transition-colors border-b-2", activeTab === 'properties' ? "border-blue-500 text-white bg-slate-800" : "border-transparent text-slate-500 hover:text-slate-300")}>Properti</button>
                    <button onClick={() => setActiveTab('layers')} className={cn("flex-1 py-3 text-xs font-bold uppercase transition-colors border-b-2", activeTab === 'layers' ? "border-blue-500 text-white bg-slate-800" : "border-transparent text-slate-500 hover:text-slate-300")}>Layers ({canvasObjects.length})</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'properties' && (
                        <>
                            <div className="space-y-3">
                                <Label>Warna Latar</Label>
                                <div className="flex gap-2">
                                    <Input type="color" className="w-12 h-10 p-1" value={activeSide==='front'?bgFront:bgBack} onChange={(e) => updateBackgroundColor(e.target.value)} disabled={isLocked} />
                                    <Input type="text" value={activeSide==='front'?bgFront:bgBack} onChange={(e) => updateBackgroundColor(e.target.value)} disabled={isLocked} />
                                </div>
                            </div>
                            
                            {!selectedObject && (
                                <div className="space-y-6 animate-in fade-in pt-4 border-t border-slate-800">
                                     <div>
                                         <div className="flex items-center justify-between mb-2"><Label className="flex items-center gap-2 text-blue-400 font-bold"><Grip size={14}/> Teks Pola</Label><input type="checkbox" checked={config.enablePattern} onChange={(e) => setConfig({...config, enablePattern: e.target.checked})} className="accent-blue-600 w-4 h-4"/></div>
                                         <div className={cn("space-y-3 p-3 bg-slate-800/50 rounded-lg", !config.enablePattern && "opacity-50 pointer-events-none")}>
                                             <Input value={config.patternText} onChange={(e) => setConfig({...config, patternText: e.target.value})} className="h-8"/>
                                             <input type="range" min="0.01" max="0.5" step="0.01" className="w-full accent-blue-600" value={config.patternOpacity} onChange={(e) => setConfig({...config, patternOpacity: parseFloat(e.target.value)})} />
                                         </div>
                                     </div>
                                </div>
                            )}

                            {selectedObject && (
                                <>
                                    <div className="h-px bg-slate-800 my-4" />
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center">
                                            <Label className="uppercase text-xs text-blue-400 font-bold">{selectedObject.type}</Label>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" onClick={handleDuplicate} title="Duplikat"><Copy size={12}/></Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 bg-slate-800 p-2 rounded-lg">
                                            <Button size="icon" variant="secondary" className="h-8 w-full" onClick={() => handleAlignment('centerH')}><AlignCenter size={14}/></Button>
                                            <Button size="icon" variant="secondary" className="h-8 w-full" onClick={() => handleAlignment('centerV')}><AlignVerticalJustifyCenter size={14}/></Button>
                                            <Button size="icon" variant="secondary" className="h-8 w-full" onClick={() => handleLayer('front')}><Layers size={14} className="rotate-180"/></Button>
                                            <Button size="icon" variant="secondary" className="h-8 w-full" onClick={() => handleLayer('back')}><Layers size={14}/></Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1"><Label className="text-xs">Opasitas</Label><Input type="number" min="0" max="1" step="0.1" value={selectedObject.opacity ?? 1} onChange={(e) => updateSelectedObject('opacity', safeFloat(e.target.value))} /></div>
                                            <div className="space-y-1"><Label className="text-xs">Sudut</Label><Input type="number" value={Math.round(selectedObject.angle || 0)} onChange={(e) => updateSelectedObject('angle', safeInt(e.target.value))} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1"><Label className="text-xs">Kiri</Label><Input type="number" value={Math.round(selectedObject.left || 0)} onChange={(e) => updateSelectedObject('left', safeInt(e.target.value))} /></div>
                                            <div className="space-y-1"><Label className="text-xs">Atas</Label><Input type="number" value={Math.round(selectedObject.top || 0)} onChange={(e) => updateSelectedObject('top', safeInt(e.target.value))} /></div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Skala</Label>
                                            <input type="range" min="0.1" max="2.0" step="0.05" className="w-full accent-blue-600 h-1.5 bg-slate-800 rounded-lg" value={selectedObject.scaleX || 1} onChange={(e) => { const val = parseFloat(e.target.value); selectedObject.set({ scaleX: val, scaleY: val }); fabricCanvas.current?.requestRenderAll(); saveCanvasState(fabricCanvas.current!); setRefreshKey(prev => prev + 1); }} />
                                        </div>

                                        {(selectedObject.type === 'i-text' || selectedObject.type === 'textbox') && (
                                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                                <div className="space-y-2"><Label>Konten</Label><textarea className="flex w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm" rows={3} value={(selectedObject as any).text} onChange={(e) => updateSelectedObject('text', e.target.value)} /></div>
                                                <div className="space-y-2">
                                                    <Label>Jenis Font</Label>
                                                    <Select value={(selectedObject as any).fontFamily || 'Arial'} onChange={(e) => updateSelectedObject('fontFamily', e.target.value)}>
                                                        {AVAILABLE_FONTS.map(font => (
                                                            <option key={font} value={font} style={{fontFamily: font}}>{font}</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div className="space-y-2"><Label>Warna</Label><Input type="color" className="h-10 p-1" value={(selectedObject as any).fill as string} onChange={(e) => updateSelectedObject('fill', e.target.value)} /></div>
                                                <div className="space-y-2">
                                                    <Label>Sumber Data</Label>
                                                    <Select value={(selectedObject as any).dataField || ''} onChange={(e) => updateSelectedObject('dataField', e.target.value)}>
                                                        <option value="">Teks Statis (Manual)</option>
                                                        <optgroup label="Data Pegawai">
                                                            <option value="fullName">Nama Lengkap</option>
                                                            <option value="role">Jabatan</option>
                                                            <option value="employeeId">NIP / ID</option>
                                                            <option value="department">Departemen</option>
                                                            <option value="joinedDate">Tanggal Bergabung</option>
                                                            <option value="expiryDate">Tanggal Kadaluarsa</option>
                                                        </optgroup>
                                                        <optgroup label="Data Instansi (Pengaturan)">
                                                            <option value="name">Nama Instansi</option>
                                                            <option value="secondaryName">Nama Sekunder</option>
                                                            <option value="address">Alamat Lengkap</option>
                                                            <option value="disclaimer">Disclaimer (Belakang)</option>
                                                            <option value="regulations">Peraturan</option>
                                                        </optgroup>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(selectedObject.type === 'image' || selectedObject.type === 'fabric-image') && (
                                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                                <Label>Sumber Data</Label>
                                                <Select value={(selectedObject as any).dataField || ''} onChange={(e) => updateSelectedObject('dataField', e.target.value)}><option value="">Gambar Statis</option><option value="photoUrl">Foto Pegawai</option><option value="qr_code">QR Code</option></Select>
                                                
                                                {/* --- MASKING / CLIPPING SECTION --- */}
                                                {(selectedObject.dataField !== 'qr_code') && (
                                                    <div className="space-y-3 pt-2">
                                                        <Label className="flex items-center gap-2 text-cyan-400"><Scissors size={14}/> Masking / Clipping</Label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <Button size="icon" variant="outline" className="h-8 w-full border-slate-700" onClick={() => applyMask('none')} title="Hapus Masking">
                                                                <Ban size={14} className="text-red-400"/>
                                                            </Button>
                                                            <Button size="icon" variant="outline" className="h-8 w-full border-slate-700" onClick={() => applyMask('circle')} title="Lingkaran">
                                                                <Circle size={14}/>
                                                            </Button>
                                                            <Button size="icon" variant="outline" className="h-8 w-full border-slate-700" onClick={() => applyMask('rect')} title="Kotak">
                                                                <Square size={14}/>
                                                            </Button>
                                                            <Button size="icon" variant="outline" className="h-8 w-full border-slate-700" onClick={() => applyMask('rounded')} title="Rounded">
                                                                <div className="w-3.5 h-3.5 border-2 border-current rounded-md"></div>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {(selectedObject as any).dataField === 'qr_code' && (
                                                    <div className="space-y-4 pt-2">
                                                        <Label className="text-xs text-blue-400">Preset QR Cepat</Label>
                                                        <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-800">{Object.entries(QR_PRESETS).map(([k,v]:[string, any])=><Button key={k} size="sm" variant="outline" onClick={()=>applyQRPreset(k)} className="text-[10px] h-6 px-1">{v.name}</Button>)}</div>
                                                        
                                                        <div className="space-y-4">
                                                            <h4 className="text-xs font-bold text-slate-300">Gaya & Bentuk</h4>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] text-slate-400">Pola Titik (Dots)</Label>
                                                                <Select value={selectedObject.qrDotStyle || 'square'} onChange={(e) => updateSelectedObject('qrDotStyle', e.target.value)}>
                                                                    <option value="square">Kotak (Square)</option>
                                                                    <option value="dots">Titik (Dots)</option>
                                                                    <option value="rounded">Bulat (Rounded)</option>
                                                                    <option value="extra-rounded">Sangat Bulat</option>
                                                                    <option value="classy">Classy</option>
                                                                    <option value="classy-rounded">Classy Rounded</option>
                                                                </Select>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-slate-400">Sudut Luar</Label>
                                                                    <Select value={selectedObject.qrCornerStyle || 'square'} onChange={(e) => updateSelectedObject('qrCornerStyle', e.target.value)}>
                                                                        <option value="square">Kotak</option>
                                                                        <option value="dot">Titik</option>
                                                                        <option value="extra-rounded">Bulat</option>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-slate-400">Sudut Dalam</Label>
                                                                    <Select value={selectedObject.qrCornerDotStyle || 'square'} onChange={(e) => updateSelectedObject('qrCornerDotStyle', e.target.value)}>
                                                                        <option value="square">Kotak</option>
                                                                        <option value="dot">Titik</option>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 pt-2 border-t border-slate-800">
                                                             <h4 className="text-xs font-bold text-slate-300 flex justify-between">Warna & Gradien <Palette size={12}/></h4>
                                                             <div className="flex gap-2">
                                                                 <button onClick={() => updateSelectedObject('qrColorType', 'single')} className={cn("flex-1 text-[10px] py-1 rounded border", selectedObject.qrColorType !== 'gradient' ? "bg-blue-600 border-blue-500 text-white" : "border-slate-700 text-slate-400")}>Solid</button>
                                                                 <button onClick={() => updateSelectedObject('qrColorType', 'gradient')} className={cn("flex-1 text-[10px] py-1 rounded border", selectedObject.qrColorType === 'gradient' ? "bg-blue-600 border-blue-500 text-white" : "border-slate-700 text-slate-400")}>Gradien</button>
                                                             </div>
                                                             
                                                             <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                     <Label className="text-[10px]">Warna Utama</Label>
                                                                     <div className="flex gap-1"><Input type="color" className="p-0.5 h-8 w-8" value={selectedObject.qrColor1 || '#000000'} onChange={(e) => updateSelectedObject('qrColor1', e.target.value)} /><Input value={selectedObject.qrColor1 || '#000000'} className="h-8 text-[10px]" onChange={(e) => updateSelectedObject('qrColor1', e.target.value)} /></div>
                                                                </div>
                                                                {selectedObject.qrColorType === 'gradient' && (
                                                                     <div className="space-y-1 animate-in fade-in">
                                                                         <Label className="text-[10px]">Warna Kedua</Label>
                                                                         <div className="flex gap-1"><Input type="color" className="p-0.5 h-8 w-8" value={selectedObject.qrColor2 || '#000000'} onChange={(e) => updateSelectedObject('qrColor2', e.target.value)} /><Input value={selectedObject.qrColor2 || '#000000'} className="h-8 text-[10px]" onChange={(e) => updateSelectedObject('qrColor2', e.target.value)} /></div>
                                                                     </div>
                                                                )}
                                                             </div>

                                                             <div className="space-y-1">
                                                                <Label className="text-[10px]">Background</Label>
                                                                <div className="flex gap-1"><Input type="color" className="p-0.5 h-8 w-8" value={selectedObject.qrBgColor || '#ffffff'} onChange={(e) => updateSelectedObject('qrBgColor', e.target.value)} /><Input value={selectedObject.qrBgColor || 'transparent'} className="h-8 text-[10px]" onChange={(e) => updateSelectedObject('qrBgColor', e.target.value)} /></div>
                                                             </div>
                                                        </div>

                                                        <div className="space-y-4 pt-2 border-t border-slate-800">
                                                            <h4 className="text-xs font-bold text-slate-300">Logo Tengah</h4>
                                                            <div className="flex gap-2 items-center">
                                                                {selectedObject.qrLogoUrl ? <img src={selectedObject.qrLogoUrl} className="w-10 h-10 object-contain bg-white/10 rounded" alt="qr-logo"/> : <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center"><ImageIcon size={16} className="text-slate-500"/></div>}
                                                                <div className="flex-1">
                                                                     <input type="file" id="qr-logo-upload" className="hidden" accept="image/*" onChange={handleQRLogoUpload} />
                                                                     <Button size="sm" variant="secondary" className="w-full text-[10px] h-7" onClick={() => document.getElementById('qr-logo-upload')?.click()}>Upload Logo</Button>
                                                                </div>
                                                                {selectedObject.qrLogoUrl && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => updateSelectedObject('qrLogoUrl', '')}><Trash2 size={12}/></Button>}
                                                            </div>
                                                            {selectedObject.qrLogoUrl && (
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between text-[10px] text-slate-400"><span>Ukuran Logo</span><span>{Math.round((selectedObject.qrLogoSize || 0.4) * 100)}%</span></div>
                                                                    <input type="range" min="0.1" max="0.5" step="0.05" className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-600" value={selectedObject.qrLogoSize || 0.4} onChange={(e) => updateSelectedObject('qrLogoSize', parseFloat(e.target.value))} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'layers' && (
                        <div className="space-y-2 animate-in fade-in">
                            {canvasObjects.length === 0 ? <div className="text-center text-slate-500 text-xs py-8">Kosong</div> : canvasObjects.map((obj, i) => (
                                <div key={i} className={cn("flex items-center gap-3 p-2 rounded-lg border cursor-pointer", obj === selectedObject ? "bg-blue-900/30 border-blue-500/50" : "bg-slate-900 border-slate-800")} onClick={() => selectObjectFromLayer(obj)}>
                                    <div className="text-slate-500">{obj.type === 'i-text' || obj.type === 'textbox' ? <Type size={14}/> : (obj.type === 'rect' ? <Square size={14}/> : (obj.type === 'circle' ? <Circle size={14}/> : <Triangle size={14}/>))}</div>
                                    <div className="flex-1 truncate text-xs font-medium text-slate-300">{getObjectName(obj)}</div>
                                    <button className="text-slate-400 hover:text-white p-1" onClick={(e) => { e.stopPropagation(); deleteObject(obj); }}><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};