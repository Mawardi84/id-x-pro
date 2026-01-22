import React, { useEffect, useRef, useId, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { InstitutionConfig, Member } from '../types';
import { cn } from './UIComponents';
import { RotateCw, Printer, Layers } from 'lucide-react';

// Helper to generate consistent hue from string
const stringToColor = (str: string) => {
    if (!str) return '#666666';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

const getSmartColor = (role: string, dept: string, type: 'ROLE' | 'DEPT') => {
    return stringToColor(type === 'ROLE' ? role : dept);
}

const stringToHue = (str: string) => {
    if(!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
};

// 1. Watermark & Pattern Component (Pure CSS/SVG for Print View)
export const CardBackground = ({ config, isBack = false, seedString = '' }: { config: InstitutionConfig, isBack?: boolean, seedString?: string }) => {
    const uniqueId = useId().replace(/:/g, ''); // Generate unique ID for the SVG pattern
    const patternId = `pattern-${uniqueId}-${isBack ? 'back' : 'front'}`;
    
    // Safety check for config
    if (!config) return null;

    const wmOpacity = isBack ? (config.watermarkOpacity || 0.05) * 0.7 : (config.watermarkOpacity || 0.05);
    
    // SMART FEATURE: Adaptive Pattern Color based on Seed (Department/Instansi)
    let patternColor = config.patternColor || '#000000';
    let patternTransform = `rotate(${config.patternRotation || 0})`;
    
    // If seedString is provided (e.g., Department Name), shift the hue of the pattern
    // This creates "Variable Micro-patterns per Instansi/Divisi"
    const hueShift = seedString ? stringToHue(seedString) : 0;
    const filterStyle = seedString ? { filter: `hue-rotate(${hueShift}deg)` } : {};

    const fontSize = config.patternFontSize || 12;
    const wmScale = config.watermarkScale || 0.6; 
    const layout = config.patternLayout || 'GRID';
    
    // Spacing now controls the gap directly.
    // Allow negative values for tighter packing via slider in UI.
    const spacing = config.patternSpacing ?? 5; 
    const wordGap = 10; // Fixed small horizontal gap between repeated words

    // Estimate Text Dimensions (Horizontal)
    // We assume standard Arial metrics approx 0.6 width/height ratio
    const textLength = config.patternText?.length || 0;
    const textWidth = textLength * (fontSize * 0.65); 
    const textHeight = fontSize;

    let tileWidth = textWidth + wordGap;
    let tileHeight = textHeight + spacing; // Vertical distance between lines
    
    // Pattern Content Logic
    // We construct the <pattern> content based on layout
    let patternContent = '';

    if (layout === 'V_GRID' || layout === 'V_BRICK') {
         // VERTICAL LAYOUTS
         // For vertical, we conceptually flip dimensions.
         // Text is rotated 90deg inside the tile, or we assume vertical flow.
         // Here we rotate the text 90deg using SVG transform inside the tile.
         tileWidth = textHeight + spacing; // Width becomes the line gap
         tileHeight = textWidth + wordGap; // Height becomes the text length
         
         const cx = tileWidth / 2;
         const cy = tileHeight / 2;

         if (layout === 'V_BRICK') {
             // Vertical Stagger
             tileWidth = (textHeight + spacing) * 2; // Double width for 2 columns
             const col1X = (textHeight + spacing) / 2;
             const col2X = col1X + (textHeight + spacing);
             
             patternContent = `
                <text x="${col1X}" y="0" transform="rotate(90, ${col1X}, 0)" 
                      text-anchor="start" dominant-baseline="middle" 
                      style="font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: ${patternColor}; font-weight: bold;">
                      ${config.patternText}
                </text>
                <text x="${col2X}" y="${tileHeight/2}" transform="rotate(90, ${col2X}, ${tileHeight/2})" 
                      text-anchor="start" dominant-baseline="middle" 
                      style="font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: ${patternColor}; font-weight: bold;">
                      ${config.patternText}
                </text>
             `;
         } else {
             // V_GRID
             patternContent = `
                <text x="${tileWidth/2}" y="0" transform="rotate(90, ${tileWidth/2}, 0)" 
                      text-anchor="start" dominant-baseline="middle" 
                      style="font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: ${patternColor}; font-weight: bold;">
                      ${config.patternText}
                </text>
             `;
         }

    } else {
        // HORIZONTAL LAYOUTS (GRID & BRICK)
        
        if (layout === 'BRICK') {
            // Horizontal Stagger (Standard Brick)
            // We need 2 rows in the tile
            tileHeight = (textHeight + spacing) * 2;
            const row1Y = (textHeight + spacing) / 2;
            const row2Y = row1Y + (textHeight + spacing);
            
            patternContent = `
                <text x="0" y="${row1Y}" text-anchor="middle" dominant-baseline="middle" 
                      style="font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: ${patternColor}; font-weight: bold;">
                      ${config.patternText}
                </text>
                <text x="${tileWidth/2}" y="${row2Y}" text-anchor="middle" dominant-baseline="middle" 
                      style="font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: ${patternColor}; font-weight: bold;">
                      ${config.patternText}
                </text>
            `;
        } else {
            // GRID (Standard)
            const cy = tileHeight / 2;
            patternContent = `
                <text x="${tileWidth/2}" y="${cy}" text-anchor="middle" dominant-baseline="middle" 
                      style="font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: ${patternColor}; font-weight: bold;">
                      ${config.patternText}
                </text>
            `;
        }
    }

    return (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
            {/* ONLY RENDER PATTERN IF ENABLED AND IS FRONT SIDE (isBack is false) */}
            {config.enablePattern && !isBack && (
                 <svg width="100%" height="100%" className="absolute inset-0 micro-pattern-anim" style={filterStyle}>
                    <defs>
                        <pattern id={patternId} width={tileWidth || 10} height={tileHeight || 10} patternUnits="userSpaceOnUse" patternTransform={patternTransform}>
                           <g dangerouslySetInnerHTML={{ __html: patternContent }} />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#${patternId})`} opacity={config.patternOpacity} />
                 </svg>
            )}
            
            {config.enableWatermark && config.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                        src={config.logoUrl} 
                        style={{ 
                            width: `${wmScale * 100}%`, 
                            opacity: wmOpacity, 
                            objectFit: 'contain',
                            transition: 'width 0.2s ease',
                            filter: 'grayscale(100%)'
                        }} 
                        alt="watermark" 
                    />
                </div>
            )}
            
            <style>{`
                /* Print-safe animation: Only animates on screen, static on print */
                @media screen {
                    .micro-pattern-anim rect {
                        animation: patternShift 60s linear infinite;
                    }
                }
                @keyframes patternShift {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(-50px, -50px); }
                }
            `}</style>
        </div>
    );
};

// 2. Security Overlay (UV / Microtext)
export const SecurityOverlay = ({ text, width, height }: { text: string, width: number, height: number }) => {
    // Generates a very fine repeating text layer
    // Simulated UV: Yellow/Blue tint that glows on screen
    const seed = useId();
    const patternId = `uv-${seed.replace(/:/g, '')}`;
    
    return (
        <div className="absolute inset-0 pointer-events-none z-[5] mix-blend-color-dodge opacity-60 print:opacity-0">
             <svg width="100%" height="100%">
                <defs>
                    <pattern id={patternId} width="100" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                        <text x="0" y="15" fontSize="6" fill="#fef08a" fontFamily="monospace" fontWeight="bold" style={{textShadow: '0 0 2px rgba(253, 224, 71, 0.8)'}}>
                            {text} {text}
                        </text>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
             </svg>
        </div>
    )
}

// 3. QR Code Renderer for Print View
export const QRCodeElement = ({ content, style, width, height }: { content: string, style: any, width: number, height: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        
        try {
            const dotsOptions: any = {
                type: style.qrDotStyle || 'square'
            };

            if (style.qrColorType === 'gradient' && style.qrColor2) {
                dotsOptions.gradient = {
                    type: 'linear',
                    rotation: (style.qrGradientRotation || 0) * (Math.PI / 180), // Convert degrees to radians for renderer
                    colorStops: [{ offset: 0, color: style.qrColor1 || '#000000' }, { offset: 1, color: style.qrColor2 }]
                };
            } else {
                 dotsOptions.color = style.qrColor1 || '#000000';
            }

            // Safe Dimensions
            const safeWidth = Number.isFinite(width) && width > 0 ? width : 100;
            const safeHeight = Number.isFinite(height) && height > 0 ? height : 100;
            
            // Safe content - QR code lib crashes if data is empty string
            const safeContent = content && content.length > 0 ? content : 'https://id-forge.app';

            // Safe Resolve QR Class (Handling potential ESM/CommonJS mismatch)
            // @ts-ignore
            const QRClass = (QRCodeStyling && QRCodeStyling.default) ? QRCodeStyling.default : QRCodeStyling;

            if (typeof QRClass !== 'function') {
                console.error("QRCodeStyling is not a constructor", QRClass);
                ref.current.innerHTML = '<span style="font-size:10px;color:red;">QR Lib Error</span>';
                return;
            }

            const qr = new QRClass({
                width: safeWidth, 
                height: safeHeight, 
                data: safeContent,
                image: style.qrLogoUrl,
                dotsOptions: dotsOptions,
                cornersSquareOptions: {
                    type: style.qrCornerStyle || 'square',
                    color: style.qrCornerColor || style.qrColor1 || '#000000'
                },
                cornersDotOptions: {
                    // Use explicit inner style if available, otherwise fallback to logic
                    type: style.qrCornerDotStyle || (style.qrCornerStyle === 'extra-rounded' ? 'dot' : (style.qrCornerStyle === 'dot' ? 'dot' : 'square')),
                    color: style.qrCornerColor || style.qrColor1 || '#000000'
                },
                backgroundOptions: { color: style.qrBgColor || 'transparent' },
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: 5,
                    imageSize: style.qrLogoSize || 0.4
                }
            });
            ref.current.innerHTML = '';
            qr.append(ref.current);
        } catch (e) {
            console.error("QR Code Render Error:", e);
            if (ref.current) ref.current.innerHTML = '<span style="font-size:10px;color:red;">QR Error</span>';
        }
    }, [content, width, height, style]);
    return <div ref={ref} />;
};

// 4. Static Card Renderer (Reused logic for Preview and Print)
export const StaticCardRenderer = ({ json, member, config, bgColor, isBack = false }: { json: any, member: Member, config: InstitutionConfig, bgColor: string, isBack?: boolean }) => {
    
    // Defensive Check: Ensure json.objects exists and is an array
    if (!json || !json.objects || !Array.isArray(json.objects)) return null;

    return (
        <div className="relative overflow-hidden w-full h-full shadow-inner" style={{ backgroundColor: bgColor }}>
            <CardBackground config={config} seedString={member.department} isBack={isBack} />
            {json.objects.map((obj: any, idx: number) => {
                // Defensive Check: Skip if obj is somehow null/undefined
                if (!obj) return null;

                // Ensure dimensions are numbers
                const width = Number(obj.width) || 0;
                const height = Number(obj.height) || 0;
                const scaleX = Number(obj.scaleX) || 1;
                const scaleY = Number(obj.scaleY) || 1;

                const style: React.CSSProperties = {
                    position: 'absolute', left: obj.left, top: obj.top,
                    width: width * scaleX, height: height * scaleY,
                    transform: `rotate(${obj.angle}deg)`, transformOrigin: 'top left', zIndex: idx,
                };

                let finalColor = obj.fill || '#000000'; // Default black if undefined
                if (obj.smartType === 'ROLE_COLOR') finalColor = getSmartColor(member.role, member.department, 'ROLE');
                else if (obj.smartType === 'DEPT_COLOR') finalColor = getSmartColor(member.role, member.department, 'DEPT');

                if (obj.type === 'i-text' || obj.type === 'textbox') {
                    let text = obj.text;
                    if (obj.dataField) {
                        if ((member as any)[obj.dataField]) {
                            text = (member as any)[obj.dataField];
                        } else if ((config as any)[obj.dataField]) {
                            text = (config as any)[obj.dataField];
                        }
                    }

                    if (obj.smartType === 'UV_TEXT') {
                        return <div key={idx} style={{...style, zIndex: 50}}><SecurityOverlay text={member.employeeId || 'SECURE'} width={300} height={50} /></div>;
                    }

                    let fontSize = obj.fontSize;
                    let fontWeight = obj.fontWeight;

                    if (obj.smartType === 'VAR_TYPO' && text) {
                        if (text.length > 20) fontSize = fontSize * 0.7;
                        if (text.length > 30) fontSize = fontSize * 0.6;
                        if (['Kepala', 'Chief', 'Direktur', 'Manager'].some((k: string) => text.includes(k))) fontWeight = 'bold';
                    }

                    // Handle masking simulation for text (not fully supported in HTML render but basic styles apply)
                    return <div key={idx} style={{...style, fontSize: fontSize, fontFamily: obj.fontFamily, color: finalColor, fontWeight: fontWeight, whiteSpace: 'pre-wrap', lineHeight: 1.2}}>{text || ''}</div>;
                
                } else if (obj.type === 'image' || obj.type === 'fabric-image') {
                    // Handle ClipPath (Basic Circle/Rounded support for HTML preview)
                    const clipStyle: React.CSSProperties = {};
                    if (obj.clipPath) {
                        if (obj.clipPath.type === 'circle') clipStyle.borderRadius = '50%';
                        else if (obj.clipPath.rx) clipStyle.borderRadius = `${obj.clipPath.rx}px`;
                    }

                    if (obj.dataField === 'photoUrl') return <img key={idx} src={member.photoUrl} style={{...style, objectFit: 'cover', ...clipStyle}} alt="profile" />;
                    else if (obj.dataField === 'qr_code') return <div key={idx} style={style}><QRCodeElement content={`https://id-forge.app/v/${member.employeeId || '0000'}`} width={style.width * (obj.scaleX || 1)} height={style.height * (obj.scaleY || 1)} style={obj} /></div>;
                    else return <img key={idx} src={obj.src} style={style} alt="static" />;
                } else if (obj.type === 'rect') return <div key={idx} style={{...style, backgroundColor: finalColor, borderRadius: `${obj.rx || 0}px`}}></div>;
                else if (obj.type === 'circle') return <div key={idx} style={{...style, backgroundColor: finalColor, borderRadius: '50%'}}></div>;
                else if (obj.type === 'triangle') return <div key={idx} style={{...style, width:0, height:0, borderLeft: `${width/2}px solid transparent`, borderRight: `${width/2}px solid transparent`, borderBottom: `${height}px solid ${finalColor}`, backgroundColor: 'transparent'}}></div>; // Simplified Triangle
                
                return null;
            })}
        </div>
    );
};

// 5. Smart 3D Card Preview
export const SmartCardPreview = ({ frontJson, backJson, bgFront, bgBack, config, member }: any) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isCMYK, setIsCMYK] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Tilt Effect
        const tiltX = ((y - centerY) / centerY) * -20; // Max 20deg tilt
        const tiltY = ((x - centerX) / centerX) * 20;

        setTilt({ x: tiltX, y: tiltY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900/50 p-8 rounded-xl relative overflow-hidden group/container">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none"></div>
            
            {/* Controls */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <button 
                    onClick={() => setIsFlipped(!isFlipped)} 
                    className="bg-black/40 hover:bg-cyan-600 hover:text-white text-cyan-400 p-2 rounded-full backdrop-blur-sm border border-cyan-500/30 transition-all shadow-lg"
                    title="Putar Kartu (Flip)"
                >
                    <RotateCw size={20} className={cn("transition-transform duration-500", isFlipped && "rotate-180")}/>
                </button>
                <button 
                    onClick={() => setIsCMYK(!isCMYK)} 
                    className={cn(
                        "p-2 rounded-full backdrop-blur-sm border transition-all shadow-lg",
                        isCMYK ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : "bg-black/40 text-slate-400 border-slate-600/30 hover:text-white"
                    )}
                    title="Simulasi Cetak CMYK"
                >
                    <Printer size={20}/>
                </button>
            </div>

            <div className="absolute top-4 right-4 z-20 text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Mode Preview</div>
                <div className="text-xs font-mono text-cyan-400">{isCMYK ? 'CMYK PRINT SIMULATION' : 'RGB DIGITAL DISPLAY'}</div>
            </div>

            {/* 3D Scene */}
            <div 
                className="perspective-container relative w-[350px] h-[555px] transition-all duration-300"
                style={{ perspective: '1200px' }}
                onMouseMove={handleMouseMove} 
                onMouseLeave={handleMouseLeave}
            >
                <div 
                    ref={cardRef}
                    className="w-full h-full relative transition-transform duration-100 ease-out preserve-3d"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${Number(tilt.x)}deg) rotateY(${Number(tilt.y) + (isFlipped ? 180 : 0)}deg)`
                    }}
                >
                    {/* Front Face */}
                    <div 
                        className={cn(
                            "absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl transition-all duration-500",
                            isCMYK ? "brightness-95 contrast-[0.9] sepia-[0.1]" : "brightness-105"
                        )}
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <StaticCardRenderer json={frontJson} config={config} bgColor={bgFront} member={member} />
                        
                        {/* Dynamic Glare/Sheen Effect */}
                        {!isCMYK && (
                            <div 
                                className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/30 via-transparent to-black/10 opacity-0 group-hover/container:opacity-100 transition-opacity duration-300 mix-blend-overlay"
                                style={{ transform: `translate(${Number(tilt.y) * 2}px, ${Number(tilt.x) * 2}px)` }}
                            />
                        )}
                    </div>

                    {/* Back Face */}
                    <div 
                        className={cn(
                            "absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl transition-all duration-500",
                            isCMYK ? "brightness-95 contrast-[0.9] sepia-[0.1]" : "brightness-105"
                        )}
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <StaticCardRenderer json={backJson} config={config} bgColor={bgBack} member={member} isBack />
                        
                        {/* Dynamic Glare */}
                        {!isCMYK && (
                            <div 
                                className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/30 via-transparent to-black/10 opacity-0 group-hover/container:opacity-100 transition-opacity duration-300 mix-blend-overlay"
                                style={{ transform: `translate(${Number(tilt.y) * -2}px, ${Number(tilt.x) * 2}px)` }}
                            />
                        )}
                    </div>
                    
                    {/* 3D Thickness Side (Simulated) */}
                    <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none"></div>
                </div>
                
                {/* Drop Shadow based on tilt */}
                <div 
                    className="absolute -bottom-10 left-10 right-10 h-6 bg-black/40 blur-xl rounded-[100%] transition-all duration-100"
                    style={{
                        transform: `translate(${Number(tilt.y) * -2}px) scale(${1 - Math.abs(Number(tilt.x))/90})`,
                        opacity: 0.6 - (Math.abs(Number(tilt.x))/60)
                    }}
                ></div>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-slate-500 text-xs flex items-center gap-2 justify-center">
                    <Layers size={14}/> Gerakkan mouse untuk efek 3D
                </p>
            </div>
        </div>
    );
};