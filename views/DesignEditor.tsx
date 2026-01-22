// GIT TEST: This line added for Git verification
console.log("Git is working!");


import React, { useState, useRef, useEffect } from 'react';
import * as fabricImport from 'fabric';
import * as QRCodeStylingModule from 'qr-code-styling';
type QRCodeStylingType = typeof QRCodeStylingModule.default | typeof QRCodeStylingModule;
import { 
    Type, Square, Circle, Triangle, Image as ImageIcon, QrCode, Trash2, Save, PenTool, 
    Sparkles, Upload, X, Copy, Lock, Unlock, 
    AlignCenter, AlignVerticalJustifyCenter, Layers, Grip, Fingerprint,
    CheckCircle, Download, Palette, AlertTriangle, Loader2, RefreshCcw,
    Undo, Redo, Scissors, Ban, ZoomIn, ZoomOut, Maximize, Move, Wand2, Shield, Box,
    Layout, Ruler, MonitorCheck
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button, Input, Label, Select, cn } from '../components/UIComponents';
import { analyzeDesign } from '../services/geminiService';
import { CardTemplate, InstitutionConfig, Member } from '../types';
import { CardBackground, SmartCardPreview } from '../components/CardRenderers';

// --- CONSTANTS ---
const CR80_WIDTH = 350;
const CR80_HEIGHT = 555;
const SAFE_MARGIN = 20;

const JSON_KEYS = [
    'dataField', 'qrStyles', 'id', 'qrAnimation', 
    'qrDotStyle', 'qrColor1', 'qrColor2', 'qrColorType', 
    'qrCornerStyle', 'qrCornerDotStyle', 'qrCornerColor', 'qrBgColor', 
    'qrLogoUrl', 'qrLogoSize', 'qrGradientRotation',
    'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY',
    'selectable', 'evented', 'stroke', 'strokeWidth', 'rx', 'ry', 'fill', 'fontFamily',
    'clipPath', 'smartType' 
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

const MOCK_PREVIEW_MEMBER: Member = {
    id: 'preview',
    fullName: 'Nama Pegawai',
    role: 'JABATAN',
    department: 'Departemen',
    employeeId: '1234567890',
    employmentType: 'PNS',
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    joinedDate: '2024-01-01',
    expiryDate: '2029-01-01',
    photoUrl: 'https://via.placeholder.com/150 ',
    scanHistory: []
};

// --- RESOLVERS ---
const resolveFabric = () => {
    try {
        const lib = fabricImport as any;
        let fabricInstance = null;
        
        if (lib && lib.default && lib.default.Canvas) fabricInstance = lib.default;
        else if (lib && lib.Canvas) fabricInstance = lib;
        else if (lib && lib.fabric && lib.fabric.Canvas) fabricInstance = lib.fabric;
        else if (typeof window !== 'undefined' && (window as any).fabric) fabricInstance = (window as any).fabric;

        if (fabricInstance && typeof window !== 'undefined') {
            if (!(window as any).fabric) (window as any).fabric = fabricInstance;
        }
        
        return fabricInstance;
    } catch (e) {
        console.error("Fabric resolution error:", e);
    }
    return null;
};

const resolveQR = (): QRCodeStylingType => {
  try {
    const mod = QRCodeStylingModule as any;
    // Handle berbagai format export
    return mod.default || mod.QRCodeStyling || mod;
  } catch (e) {
    console.warn("QR module resolution failed:", e);
    return QRCodeStylingModule as any;
  }
};
// =================================================================
// [PERBAIKAN 1] SANITIZE JSON - HAPUS OBJEK MALFORMED
// =================================================================
const sanitizeJson = (json: any) => {
    if (!json || typeof json !== 'object') return json;
    if (!json.objects || !Array.isArray(json.objects)) return json;

    const cleanObjects = json.objects.filter((obj: any) => {
        if (!obj) return false;
        
        // FIX: Penyaringan path yang lebih dalam
        if (obj.type === 'path') {
            if (!obj.path || !Array.isArray(obj.path) || obj.path.length === 0) return false;
            
            const hasValidCommands = obj.path.some((cmd: any) => {
                if (!Array.isArray(cmd) || cmd.length === 0) return false;
                return typeof cmd[0] === 'string' && cmd.length >= 1;
            });
            
            if (!hasValidCommands) return false;
        }
        
        // Filter poligon kosong
        if (obj.type === 'polygon' || obj.type === 'polyline') {
            if (!obj.points || !Array.isArray(obj.points) || obj.points.length === 0) return false;
        }
        
        return true;
    });

    return { ...json, objects: cleanObjects };
};

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
    
    const [showSmartPreview, setShowSmartPreview] = useState(false);
    const [layoutScore, setLayoutScore] = useState(100);
    const [layoutIssues, setLayoutIssues] = useState<string[]>([]);
    
    // =================================================================
    // [PERBAIKAN 2] HISTORY STATE - TAMBAHKAN VALIDASI
    // =================================================================
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
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const isPanningRef = useRef(false);
    const isDraggingRef = useRef(false);
    const lastPosX = useRef(0);
    const lastPosY = useRef(0);

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
                    setIsFabricReady(true);
                }
            }
        }, 100);
        
        if (resolveFabric()) {
            setIsFabricReady(true);
            clearInterval(checkInterval);
        }

        return () => clearInterval(checkInterval);
    }, []);

    const calculateLayoutScore = (canvas: any) => {
        if (!canvas) return;
        try {
            if (typeof canvas.getObjects !== 'function') return;

            const objects = canvas.getObjects();
            let score = 100;
            const issues: string[] = [];

            if (objects.length === 0) {
                setLayoutScore(0);
                setLayoutIssues(["Kanvas kosong"]);
                return;
            }

            objects.forEach((obj: any) => {
                if(!obj) return;
                const tooLeft = obj.left < SAFE_MARGIN;
                const tooRight = (obj.left + (obj.width * (obj.scaleX || 1))) > (CR80_WIDTH - SAFE_MARGIN);
                const tooTop = obj.top < SAFE_MARGIN;
                const tooBottom = (obj.top + (obj.height * (obj.scaleY || 1))) > (CR80_HEIGHT - SAFE_MARGIN);

                if (tooLeft || tooRight || tooTop || tooBottom) {
                    if (obj.type !== 'rect' || (obj.width < CR80_WIDTH && obj.height < CR80_HEIGHT)) {
                        score -= 5;
                        if (!issues.includes("Objek terlalu dekat tepi (Bahaya Potong)")) issues.push("Objek terlalu dekat tepi (Bahaya Potong)");
                    }
                }

                if (obj.type === 'i-text' || obj.type === 'textbox') {
                    const effectiveSize = (obj.fontSize || 12) * (obj.scaleY || 1);
                    if (effectiveSize < 8) {
                        score -= 5;
                        if (!issues.includes("Teks terlalu kecil (< 8pt)")) issues.push("Teks terlalu kecil (< 8pt)");
                    }
                }
            });

            const photo = objects.find((o: any) => o.dataField === 'photoUrl');
            if (photo) {
                const centerX = photo.left + (photo.width * (photo.scaleX || 1)) / 2;
                const canvasCenter = CR80_WIDTH / 2;
                if (Math.abs(centerX - canvasCenter) > 10 && Math.abs(centerX - canvasCenter) < 50) {
                    score -= 5;
                    if (!issues.includes("Foto profil tidak tepat di tengah")) issues.push("Foto profil tidak tepat di tengah");
                }
            }

            setLayoutScore(Math.max(0, Math.round(score)));
            setLayoutIssues(issues);
        } catch(e) {
            console.debug("Layout calculation skipped", e);
        }
    };

    const handleAutoOptimize = () => {
        if (!fabricCanvas.current || isLocked) return;
        const canvas = fabricCanvas.current;
        const objects = canvas.getObjects();
        
        canvas.discardActiveObject();

        let modified = false;

        objects.forEach((obj: any) => {
            if(!obj) return;

            if (obj.type === 'image' && Math.abs((obj.scaleX || 1) - (obj.scaleY || 1)) > 0.01) {
                const avgScale = ((obj.scaleX || 1) + (obj.scaleY || 1)) / 2;
                obj.set({ scaleX: avgScale, scaleY: avgScale });
                modified = true;
            }

            if (obj.dataField === 'photoUrl') {
                const centerX = obj.left + (obj.width * (obj.scaleX || 1)) / 2;
                const canvasCenter = CR80_WIDTH / 2;
                if (Math.abs(centerX - canvasCenter) < (CR80_WIDTH * 0.2)) {
                    obj.set({ left: canvasCenter - (obj.width * (obj.scaleX || 1)) / 2 });
                    obj.setCoords();
                    modified = true;
                }
            }

            if (obj.type === 'i-text' || obj.type === 'textbox') {
                const width = obj.width * (obj.scaleX || 1);
                const height = obj.height * (obj.scaleY || 1);
                
                let newLeft = obj.left;
                let newTop = obj.top;

                if (obj.left < SAFE_MARGIN) newLeft = SAFE_MARGIN;
                else if (obj.left + width > CR80_WIDTH - SAFE_MARGIN) newLeft = CR80_WIDTH - SAFE_MARGIN - width;

                if (obj.top < SAFE_MARGIN) newTop = SAFE_MARGIN;
                else if (obj.top + height > CR80_HEIGHT - SAFE_MARGIN) newTop = CR80_HEIGHT - SAFE_MARGIN - height;

                if (newLeft !== obj.left || newTop !== obj.top) {
                    obj.set({ left: newLeft, top: newTop });
                    obj.setCoords();
                    modified = true;
                }
            }
        });

        if (modified) {
            canvas.renderAll();
            saveCanvasState(canvas);
            setRefreshKey(prev => prev + 1);
            calculateLayoutScore(canvas);
            alert("✨ Desain telah dioptimalkan otomatis!");
        } else {
            alert("Desain sudah optimal!");
        }
    };

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

                const rawJson = activeSide === 'front' ? frontJson : backJson;
                // =================================================================
                // [PERBAIKAN 3] PASTIKAN SANITIZE DILAKUKAN SEBELUM LOAD
                // =================================================================
                const currentJson = sanitizeJson(rawJson);
                
                if (currentJson && typeof currentJson === 'object' && Array.isArray(currentJson.objects)) {
                    historyProcessing.current = true;
                    
                    await new Promise<void>((resolve) => {
                         try {
                             canvas.loadFromJSON(currentJson, () => {
                                 resolve();
                             });
                         } catch (err) {
                             console.error("Error inside loadFromJSON", err);
                             resolve(); 
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
                
                // =================================================================
                // [PERBAIKAN 4] HISTORY INIT - TUNGGU CANVAS SIAP
                // =================================================================
                useEffect(() => {
                    if (!fabricCanvas.current || !isFabricReady) return;
                    
                    const canvas = fabricCanvas.current;
                    if (canvas.disposed) return;
                    
                    setTimeout(() => {
                        try {
                            setHistory(prev => {
                                const sideHistory = prev[activeSide];
                                if (sideHistory.stack.length > 0) return prev;
                                
                                const objs = canvas.getObjects() || [];
                                if (objs.length === 0) return prev;
                                
                                try {
                                    const initialJson = canvas.toJSON(JSON_KEYS);
                                    if (initialJson?.objects) {
                                        const newStack = [initialJson];
                                        return {
                                            ...prev,
                                            [activeSide]: { stack: newStack, index: 0 }
                                        };
                                    }
                                } catch (e) {
                                    console.warn("History init skipped:", e.message);
                                }
                                return prev;
                            });
                        } catch (e) {
                            console.warn("History init timeout error:", e);
                        }
                    }, 300);
                }, [fabricCanvas.current, isFabricReady, activeSide]);

                if(!isMounted) {
                    try { canvas.dispose(); } catch(e) {}
                    fabricCanvas.current = null;
                    initializingRef.current = false;
                    return;
                }

                canvas.requestRenderAll();
                updateLayerList(canvas);
                calculateLayoutScore(canvas);
                
                // --- EVENTS: ROBUST SELECTION HANDLER ---
                const updateSelection = (e: any) => {
                    if (!e) return;
                    let selected = null;
                    
                    try {
                        if (e.selected && Array.isArray(e.selected) && e.selected.length > 0) {
                            selected = e.selected[0];
                        } else if (e.target) {
                            selected = e.target;
                        }
                    } catch (err) {
                        console.warn("Selection error handled:", err);
                        selected = e.target || null;
                    }
                    
                    setSelectedObject(selected);
                    
                    if (selected) {
                        setActiveTab('properties'); 
                        setRefreshKey(prev => prev + 1);
                    }
                };

                const clearSelection = () => {
                    try {
                        if (canvas && !canvas.disposed && !canvas.getActiveObject()) {
                            setSelectedObject(null);
                            setRefreshKey(prev => prev + 1);
                        }
                    } catch(e) { console.warn("Clear selection error", e); }
                };

                const onModified = () => {
                    if (historyProcessing.current) return;
                    saveCanvasState(canvas);
                    updateLayerList(canvas);
                    calculateLayoutScore(canvas);
                    setRefreshKey(prev => prev + 1);
                };

                canvas.on('selection:created', updateSelection);
                canvas.on('selection:updated', updateSelection);
                canvas.on('selection:cleared', clearSelection);
                
                canvas.on('object:modified', onModified);
                canvas.on('object:added', onModified);
                canvas.on('object:removed', onModified);
                
                const onLiveUpdate = () => setRefreshKey(prev => prev + 1);
                canvas.on('object:moving', onLiveUpdate);
                canvas.on('object:scaling', onLiveUpdate);
                canvas.on('object:rotating', onLiveUpdate);
                
                canvas.on('mouse:down', (e: any) => {
                    if (isPanningRef.current || e.e.altKey) {
                        isDraggingRef.current = true;
                        canvas.selection = false;
                        lastPosX.current = e.e.clientX;
                        lastPosY.current = e.e.clientY;
                        canvas.setCursor('grabbing');
                        return;
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
            if(canvas.disposed) return;
            const objs = canvas.getObjects().slice().reverse(); 
            setCanvasObjects(objs);
        } catch (e) { console.error("Error updating layer list", e); }
    }

    const addToHistoryInternal = (json: any, side: 'front' | 'back') => {
        // =================================================================
        // [PERBAIKAN 5] TAMBAHKAN TRY-CATCH UNTUK SET HISTORY
        // =================================================================
        try {
            setHistory(prev => {
                if (!prev || !prev[side]) return prev; 
                const currentSide = prev[side];
                const newStack = currentSide.stack.slice(0, currentSide.index + 1);
                newStack.push(json);
                if (newStack.length > 20) newStack.shift();
                
                return {
                    ...prev,
                    [side]: {
                        stack: newStack,
                        index: newStack.length - 1
                    }
                };
            });
        } catch(e) {
            console.error("History set error:", e);
        }
    };

       const addToHistory = (json: any) => {
        addToHistoryInternal(json, activeSide);
    };
    // =================================================================
    // [PERBAIKAN 6] SAVE CANVAS STATE - SUPER SAFE VERSION
    // =================================================================
  const saveCanvasState = (canvas: any, skipHistory: boolean = false) => {
        if(!canvas || isLocked) return;
        try {
            if (canvas.disposed) return;
            
            let json;
            try {
                json = canvas.toJSON(JSON_KEYS);
            } catch (toJsonError) {
                console.error("toJSON crash, emergency cleanup...", toJsonError);
                
                const objects = canvas.getObjects() || [];
                const malformedObjects = objects.filter((obj: any) => {
                    if (obj.type === 'path') {
                        if (!obj.path || !Array.isArray(obj.path) || obj.path.length === 0) return true;
                        return obj.path.some((cmd: any) => !Array.isArray(cmd) || cmd.length === 0);
                    }
                    return false;
                });
                
                malformedObjects.forEach((obj: any) => {
                    try { canvas.remove(obj); } catch(e) {}
                });
                
                try {
                    json = canvas.toJSON(JSON_KEYS);
                } catch {
                    return; 
                }
            }
            
            if (activeSide === 'front') setFrontJson(json);
            else setBackJson(json);
            
            if (!skipHistory) addToHistory(json);
            
        } catch (e) {
            console.error("Save state error (non-fatal):", e);
        }
    };

    const handleUndo = () => {
        // =================================================================
        // [PERBAIKAN 7] VALIDASI HISTORY SEBELUNDO
        // =================================================================
        const sideHistory = history[activeSide];
        if (!sideHistory || sideHistory.index <= 0 || !fabricCanvas.current) return;
        
        const newIndex = sideHistory.index - 1;
        const json = sideHistory.stack[newIndex];
        
        historyProcessing.current = true;
        
        try {
            const sanitized = sanitizeJson(json);
            fabricCanvas.current.loadFromJSON(sanitized, () => {
                fabricCanvas.current.renderAll();
                historyProcessing.current = false;
                
                setHistory(prev => ({
                    ...prev,
                    [activeSide]: { ...prev[activeSide], index: newIndex }
                }));
                
                saveCanvasState(fabricCanvas.current, true);
                updateLayerList(fabricCanvas.current);
                calculateLayoutScore(fabricCanvas.current);
                setRefreshKey(prev => prev + 1);
            });
        } catch(e) {
            console.error("Undo error", e);
            historyProcessing.current = false;
        }
    };

    const handleRedo = () => {
        const sideHistory = history[activeSide];

  // =================================================================
        // [PERBAIKAN 8] VALIDASI HISTORY SEBELUM REDO
        // =================================================================
        if (!sideHistory || sideHistory.index >= sideHistory.stack.length - 1 || !fabricCanvas.current) return;
        
        const newIndex = sideHistory.index + 1;
        const json = sideHistory.stack[newIndex];
        
        historyProcessing.current = true;
        try {
            const sanitized = sanitizeJson(json);
            fabricCanvas.current.loadFromJSON(sanitized, () => {
                fabricCanvas.current.renderAll();
                historyProcessing.current = false;
                
                setHistory(prev => ({
                    ...prev,
                    [activeSide]: { ...prev[activeSide], index: newIndex }
                }));
                
                saveCanvasState(fabricCanvas.current, true);
                updateLayerList(fabricCanvas.current);
                calculateLayoutScore(fabricCanvas.current);
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
        if (!QRClass) return;

        if (qrDebounceRef.current) clearTimeout(qrDebounceRef.current);

        qrDebounceRef.current = setTimeout(() => {
            const SafeQRClass = resolveQR();
            if (!SafeQRClass) return;

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

            const qr = new SafeQRClass({
                width: 300, height: 300,
                data: 'https://id-forge.app ', 
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
         calculateLayoutScore(fabricCanvas.current);
    }

    const addText = () => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricCanvas.current || !fabricLib) return;
        const text = new fabricLib.IText('Teks Baru', { 
            left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center',
            fontSize: 16, fontFamily: 'Arial', fill: '#000000'
        });
        addObject(text);
    };

    const addShape = (type: 'rect' | 'circle' | 'triangle' = 'rect') => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricCanvas.current || !fabricLib) return;
        const opts = { left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center', fill: '#3b82f6' };
        let shape;
        if (type === 'rect') shape = new fabricLib.Rect({ ...opts, width: 100, height: 100 });
        else if (type === 'circle') shape = new fabricLib.Circle({ ...opts, radius: 50 });
        else if (type === 'triangle') shape = new fabricLib.Triangle({ ...opts, width: 100, height: 100 });
        if (shape) addObject(shape);
    };

    const addImage = async (url: string) => {
        if(isLocked) return;
        const fabricLib = resolveFabric();
        if (!fabricCanvas.current || !fabricLib) return;
        try {
            const ImageClass = fabricLib.FabricImage || fabricLib.Image;
            const imgOpts = url.startsWith('data:') ? {} : { crossOrigin: 'anonymous' };
            if (ImageClass.fromURL.length > 1) {
                ImageClass.fromURL(url, (img: any) => { if (img) setupImage(img); }, imgOpts);
            } else {
                const img = await ImageClass.fromURL(url, imgOpts);
                setupImage(img);
            }
        } catch (error) { console.error("Img error", error); }
    };
    
    const setupImage = (img: any) => {
        if (!img || img.width === 0) return;
        const maxWidth = CR80_WIDTH * 0.6;
        const scale = img.width > maxWidth ? (maxWidth / img.width) : 0.5;
        img.set({ 
            left: CR80_WIDTH / 2, top: CR80_HEIGHT / 2, originX: 'center', originY: 'center', 
            scaleX: scale, scaleY: scale
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
           dataField: 'qr_code', qrDotStyle: 'square', qrCornerStyle: 'square', qrColor1: '#000000', qrBgColor: 'transparent'
       });
       addObject(img);
    }

    const updateSelectedObject = async (key: string, value: any) => {
        if (!fabricCanvas.current || !selectedObject || isLocked) return;
        selectedObject.set(key, value);
        if (key === 'dataField') {
             if (value && (config as any)[value]) selectedObject.set('text', (config as any)[value]);
             else if (value === 'fullName') selectedObject.set('text', 'Nama Lengkap');
             else if (value === 'role') selectedObject.set('text', 'JABATAN');
        }
        if (selectedObject.dataField === 'qr_code') refreshQRCodeImage(selectedObject);
        else fabricCanvas.current.requestRenderAll();
        
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

    const handleDuplicate = async () => {
         if (!fabricCanvas.current || !selectedObject || isLocked) return;
         try {
            if (selectedObject.clone.length > 0) {
                 selectedObject.clone((cloned: any) => { finishDuplicate(cloned); });
            } else {
                 const cloned = await selectedObject.clone();
                 finishDuplicate(cloned);
            }
         } catch(e) {}
    };

    const finishDuplicate = (cloned: any) => {
        if(!fabricCanvas.current || fabricCanvas.current.disposed) return;
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
        } catch (error) { alert("Gagal mengunduh gambar."); }
    };

    const deleteObject = (obj: any) => {
         if (!fabricCanvas.current || isLocked) return;
         fabricCanvas.current.remove(obj);
         setSelectedObject(null);
         saveCanvasState(fabricCanvas.current);
         updateLayerList(fabricCanvas.current);
         setRefreshKey(prev => prev + 1);
    };

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

    const handleZoom = (multiplier: number) => {
        if (!fabricCanvas.current) return;
        const canvas = fabricCanvas.current;
        let zoom = canvas.getZoom();
        zoom = zoom * multiplier;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.2) zoom = 0.2;
        canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, zoom);
        setZoomLevel(zoom);
        canvas.requestRenderAll();
    };

    const resetZoom = () => {
        if (!fabricCanvas.current) return;
        const canvas = fabricCanvas.current;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoomLevel(1);
        canvas.requestRenderAll();
    };

    const togglePanning = () => {
        const nextState = !isPanning;
        setIsPanning(nextState);
        isPanningRef.current = nextState;
        if (fabricCanvas.current) {
            fabricCanvas.current.selection = !nextState;
            fabricCanvas.current.defaultCursor = nextState ? 'grab' : 'default';
            if (nextState) {
                fabricCanvas.current.discardActiveObject();
                fabricCanvas.current.requestRenderAll();
                setSelectedObject(null);
            }
        }
    };

    if (loadError) return <div className="text-white p-8">Gagal memuat editor: {loadError}</div>;

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
                    if(fabricCanvas.current?.getActiveObject()) deleteObject(fabricCanvas.current.getActiveObject()!);
                }}><Trash2 size={20}/></Button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col relative">
                <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setActiveSide('front')} className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", activeSide === 'front' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200")}>DEPAN</button>
                            <button onClick={() => setActiveSide('back')} className={cn("px-4 py-1 text-xs font-bold rounded-md transition-all", activeSide === 'back' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200")}>BELAKANG</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <div className="flex gap-1 mr-2 border-r border-slate-700 pr-2">
                            <Button size="icon" variant="ghost" disabled={isLocked || !history[activeSide] || history[activeSide].index <= 0} onClick={handleUndo}><Undo size={16}/></Button>
                            <Button size="icon" variant="ghost" disabled={isLocked || !history[activeSide] || history[activeSide].index >= history[activeSide].stack.length - 1} onClick={handleRedo}><Redo size={16}/></Button>
                         </div>
                        <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400" onClick={handleDownloadImage}><Download size={16} className="mr-2"/> Unduh HD</Button>
                        <Button size="sm" className={isLocked ? "bg-slate-800 text-slate-300" : "bg-green-600 text-black"} onClick={() => setIsLocked(!isLocked)}>
                            {isLocked ? <><Unlock size={16} className="mr-2"/> Buka Kunci</> : <><CheckCircle size={16} className="mr-2"/> Kunci</>}
                        </Button>
                        {!isLocked && (
                            <>
                                <Button size="sm" variant="secondary" onClick={() => setShowSmartPreview(true)}><Box size={16} className="mr-2"/> Preview 3D</Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const name = prompt("Nama Templat:");
                                    if(name) {
                                        setTemplates([...templates, { 
                                            id: Date.now().toString(), name, category: 'CUSTOM', 
                                            layout: { front: { background: bgFront, elements: [], json: frontJson }, back: { background: bgBack, elements: [], json: backJson } },
                                            config: { enablePattern: config.enablePattern, patternText: config.patternText }
                                        } as any]);
                                        alert("Templat Disimpan!");
                                    }
                                }}><Save size={16} className="mr-2"/> Simpan</Button>
                            </>
                        )}
                    </div>
                </header>
                
                <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-950 flex items-center justify-center overflow-hidden p-8 relative"
                     onClick={(e) => {
                         if (e.target !== e.currentTarget) return;
                         if(fabricCanvas.current && !fabricCanvas.current.disposed) {
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

                        {!isLocked && layoutScore < 100 && (
                            <div className="absolute inset-0 pointer-events-none border border-red-500/30 border-dashed" style={{margin: SAFE_MARGIN}}></div>
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

                        {/* ZOOM CONTROLS */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-slate-900/80 backdrop-blur rounded-lg p-2 border border-slate-700 z-40 shadow-xl">
                            <Button size="icon" variant="ghost" onClick={() => handleZoom(1.1)} className="h-8 w-8 text-cyan-400"><ZoomIn size={16}/></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleZoom(0.9)} className="h-8 w-8 text-cyan-400"><ZoomOut size={16}/></Button>
                            <Button size="icon" variant="ghost" onClick={resetZoom} className="h-8 w-8 text-slate-400" title="Reset Zoom"><Maximize size={16}/></Button>
                            <div className="h-px bg-slate-700 my-1"/>
                            <Button size="icon" variant="ghost" onClick={togglePanning} className={cn("h-8 w-8", isPanning ? "bg-cyan-600 text-black" : "text-slate-400")} title="Mode Geser"><Move size={16}/></Button>
                            <div className="text-[10px] text-center font-mono text-slate-500 mt-1">{Math.round(zoomLevel * 100)}%</div>
                        </div>

                        {/* AI LAYOUT WIDGET */}
                        {!isLocked && (
                            <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
                                <div className={cn("p-3 rounded-xl backdrop-blur-md border shadow-xl transition-all w-64", layoutScore === 100 ? "bg-green-950/80 border-green-500/30" : "bg-slate-900/80 border-amber-500/30")}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <MonitorCheck size={16} className={layoutScore === 100 ? "text-green-400" : "text-amber-400"}/>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">Layout AI</span>
                                        </div>
                                        <div className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded", layoutScore === 100 ? "bg-green-500 text-black" : "bg-amber-500 text-black")}>
                                            {layoutScore}%
                                        </div>
                                    </div>
                                    {layoutScore < 100 ? (
                                        <div className="space-y-2">
                                            <div className="text-[10px] text-slate-300 bg-black/20 p-2 rounded border border-white/5">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {layoutIssues.slice(0, 3).map((issue, idx) => <li key={idx} className="text-amber-200">{issue}</li>)}
                                                </ul>
                                            </div>
                                            <Button size="sm" onClick={handleAutoOptimize} className="w-full bg-amber-600 hover:bg-amber-500 text-white border-0 text-[10px] font-bold h-8">
                                                <Wand2 size={12} className="mr-1.5"/> Auto-Optimize
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-green-200 flex items-center gap-1"><CheckCircle size={10}/> Desain optimal.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Smart Card Preview Modal */}
            {showSmartPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-4xl h-[90vh] flex flex-col p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2"><Box className="text-purple-400"/> 3D Preview</h2>
                            <button onClick={() => setShowSmartPreview(false)} className="text-slate-400 hover:text-white bg-slate-800/50 p-2 rounded-full"><X size={24}/></button>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <SmartCardPreview frontJson={frontJson} backJson={backJson} bgFront={bgFront} bgBack={bgBack} config={config} member={MOCK_PREVIEW_MEMBER} />
                        </div>
                    </div>
                </div>
            )}

            {/* Right Properties Sidebar */}
            {!isLocked && (
                <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col z-10">
                    <div className="flex border-b border-slate-800">
                        <button onClick={() => setActiveTab('properties')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider", activeTab === 'properties' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}>Properti</button>
                        <button onClick={() => setActiveTab('layers')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider", activeTab === 'layers' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}>Layer ({canvasObjects.length})</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {activeTab === 'properties' ? (
                            selectedObject ? (
                                <>
                                    <div className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Properti Objek</div>
                                    {selectedObject.type === 'i-text' && (
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Label>Konten Teks</Label>
                                                <Input value={selectedObject.text} onChange={e => updateSelectedObject('text', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Sumber Data (Dinamis)</Label>
                                                <Select value={selectedObject.dataField || ''} onChange={e => updateSelectedObject('dataField', e.target.value)}>
                                                    <option value="">Teks Statis</option>
                                                    <option value="fullName">Nama Lengkap</option>
                                                    <option value="role">Jabatan</option>
                                                    <option value="employeeId">NIP / ID</option>
                                                    <option value="department">Departemen</option>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Ukuran Font</Label>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => updateSelectedObject('fontSize', (selectedObject.fontSize || 20) - 2)}>-</Button>
                                                    <span className="flex-1 text-center bg-slate-800 py-2 rounded text-xs">{selectedObject.fontSize}</span>
                                                    <Button size="sm" variant="outline" onClick={() => updateSelectedObject('fontSize', (selectedObject.fontSize || 20) + 2)}>+</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Warna</Label>
                                                <div className="flex gap-2">
                                                    <Input type="color" value={selectedObject.fill} onChange={e => updateSelectedObject('fill', e.target.value)} className="w-10 p-0 overflow-hidden" />
                                                    <Input value={selectedObject.fill} onChange={e => updateSelectedObject('fill', e.target.value)} className="flex-1" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedObject.type !== 'i-text' && (
                                        <div className="space-y-3">
                                            {selectedObject.type === 'image' && (
                                                <div className="space-y-1">
                                                    <Label>Sumber Gambar</Label>
                                                    <Select value={selectedObject.dataField || ''} onChange={e => updateSelectedObject('dataField', e.target.value)}>
                                                        <option value="">Gambar Statis</option>
                                                        <option value="photoUrl">Foto Pegawai</option>
                                                        <option value="qr_code">QR Code Profil</option>
                                                    </Select>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <Label>Warna Isi</Label>
                                                <div className="flex gap-2">
                                                    <Input type="color" value={selectedObject.fill} onChange={e => updateSelectedObject('fill', e.target.value)} className="w-10 p-0 overflow-hidden" />
                                                    <Input value={selectedObject.fill} onChange={e => updateSelectedObject('fill', e.target.value)} className="flex-1" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Opacity</Label>
                                                <input type="range" min="0" max="1" step="0.1" value={selectedObject.opacity || 1} onChange={e => updateSelectedObject('opacity', parseFloat(e.target.value))} className="w-full accent-cyan-500" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-slate-800 space-y-2">
                                        <Button size="sm" variant="secondary" className="w-full" onClick={handleDuplicate}><Copy size={14} className="mr-2"/> Duplikat</Button>
                                        <Button size="sm" variant="destructive" className="w-full" onClick={() => deleteObject(selectedObject)}><Trash2 size={14} className="mr-2"/> Hapus</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-slate-500 text-sm mt-10">
                                    <p>Pilih objek di kanvas untuk mengedit properti.</p>
                                </div>
                            )
                        ) : (
                            // LAYERS TAB CONTENT
                            <div className="space-y-2">
                                {canvasObjects.map((obj, i) => (
                                    <div key={i} 
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded cursor-pointer border border-transparent", 
                                            selectedObject === obj ? "bg-cyan-900/30 border-cyan-500/30 text-cyan-200" : "hover:bg-slate-800 text-slate-400"
                                        )}
                                        onClick={() => {
                                            if(fabricCanvas.current) {
                                                fabricCanvas.current.setActiveObject(obj);
                                                fabricCanvas.current.requestRenderAll();
                                                setSelectedObject(obj);
                                            }
                                        }}
                                    >
                                        {obj.type === 'i-text' ? <Type size={14}/> : obj.type === 'image' ? <ImageIcon size={14}/> : <Square size={14}/>}
                                        <span className="text-xs truncate flex-1">{obj.type === 'i-text' ? (obj.text || 'Teks') : (obj.dataField || obj.type)}</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteObject(obj); }} className="text-slate-600 hover:text-red-400"><X size={12}/></button>
                                    </div>
                                ))}
                                {canvasObjects.length === 0 && <div className="text-center text-slate-600 text-xs italic py-4">Kosong</div>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};