import React, { useEffect, useRef, useId } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { InstitutionConfig } from '../types';

// 1. Watermark & Pattern Component (Pure CSS/SVG for Print View)
export const CardBackground = ({ config, isBack = false }: { config: InstitutionConfig, isBack?: boolean }) => {
    const uniqueId = useId().replace(/:/g, ''); // Generate unique ID for the SVG pattern
    const patternId = `pattern-${uniqueId}-${isBack ? 'back' : 'front'}`;
    
    const wmOpacity = isBack ? config.watermarkOpacity * 0.7 : config.watermarkOpacity;
    const patternColor = config.patternColor || '#000000';
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
    let patternTransform = `rotate(${config.patternRotation})`;

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
                 <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                        <pattern id={patternId} width={tileWidth} height={tileHeight} patternUnits="userSpaceOnUse" patternTransform={patternTransform}>
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
                            transition: 'width 0.2s ease'
                        }} 
                        alt="watermark" 
                    />
                </div>
            )}
        </div>
    );
};

// 2. QR Code Renderer for Print View
export const QRCodeElement = ({ content, style, width, height }: { content: string, style: any, width: number, height: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        
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

        const qr = new QRCodeStyling({
            width, 
            height, 
            data: content,
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
    }, [content, width, height, style]);
    return <div ref={ref} />;
};