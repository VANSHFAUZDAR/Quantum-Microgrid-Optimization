/**
 * ============================================================================
 * Procedural PBR Texture Generator for Realistic Miniature City
 * Generates high-fidelity canvas textures for asphalt, grass, bricks, shingles,
 * solar cells, concrete, windows, helipad, and vehicles.
 * 100% offline, zero external image assets required.
 * ============================================================================
 */

const CityTextures = (function () {
    'use strict';

    function createAsphaltTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark charcoal asphalt base
        ctx.fillStyle = '#1C2027';
        ctx.fillRect(0, 0, 512, 512);

        // Asphalt fine speckling / aggregate noise
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 18;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        // Yellow side curb lines (muted architectural gold)
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(14, 512);
        ctx.moveTo(498, 0);
        ctx.lineTo(498, 512);
        ctx.stroke();

        // White dashed center line
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 8;
        ctx.setLineDash([32, 24]);
        ctx.beginPath();
        ctx.moveTo(256, 0);
        ctx.lineTo(256, 512);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Solid rich green turf gradient
        const grad = ctx.createLinearGradient(0, 0, 512, 512);
        grad.addColorStop(0, '#2D5E23');
        grad.addColorStop(0.5, '#386F2B');
        grad.addColorStop(1, '#295420');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        // Grass blade noise / micro-texture
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 22;
            data[i] = Math.min(255, Math.max(0, data[i] + noise * 0.7));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5));
        }
        ctx.putImageData(imgData, 0, 0);

        // Subtle manicured lawn striping
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        for (let x = 0; x < 512; x += 64) {
            ctx.fillRect(x, 0, 32, 512);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Mortar background
        ctx.fillStyle = '#C4BBB0';
        ctx.fillRect(0, 0, 512, 512);

        const brickW = 48;
        const brickH = 20;
        const mortar = 3;

        for (let y = 0; y < 512; y += brickH + mortar) {
            const isOffset = Math.floor(y / (brickH + mortar)) % 2 === 1;
            const startX = isOffset ? -brickW / 2 : 0;

            for (let x = startX; x < 512 + brickW; x += brickW + mortar) {
                // Subtle color variation in bricks (terracotta, crimson, brown)
                const r = 160 + Math.floor(Math.random() * 45);
                const g = 60 + Math.floor(Math.random() * 25);
                const b = 45 + Math.floor(Math.random() * 20);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, brickW, brickH);

                // Highlight top and left edge of brick
                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.fillRect(x, y, brickW, 2);
                ctx.fillRect(x, y, 2, brickH);

                // Shadow bottom and right edge of brick
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(x, y + brickH - 2, brickW, 2);
                ctx.fillRect(x + brickW - 2, y, 2, brickH);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createRoofShingleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Charcoal slate base
        ctx.fillStyle = '#20252C';
        ctx.fillRect(0, 0, 512, 512);

        const shingleW = 32;
        const shingleH = 18;

        for (let y = 0; y < 512; y += shingleH) {
            const isOffset = Math.floor(y / shingleH) % 2 === 1;
            const startX = isOffset ? -shingleW / 2 : 0;

            for (let x = startX; x < 512 + shingleW; x += shingleW) {
                const shade = 40 + Math.floor(Math.random() * 30);
                ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 10})`;
                ctx.fillRect(x + 1, y + 1, shingleW - 2, shingleH - 2);

                // Shingle bottom bevel / drop shadow
                ctx.fillStyle = '#101317';
                ctx.fillRect(x, y + shingleH - 3, shingleW, 3);

                // Shingle top highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x + 1, y + 1, shingleW - 2, 2);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createSolarPanelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark silicon crystalline blue
        ctx.fillStyle = '#0F2644';
        ctx.fillRect(0, 0, 512, 512);

        // Photovoltaic wafer grid cells (6 x 10 cells)
        const cellW = 512 / 6;
        const cellH = 512 / 10;

        for (let x = 0; x < 6; x++) {
            for (let y = 0; y < 10; y++) {
                const cx = x * cellW;
                const cy = y * cellH;

                // Cell gradient (anti-reflective coating sheen)
                const cGrad = ctx.createLinearGradient(cx, cy, cx + cellW, cy + cellH);
                cGrad.addColorStop(0, '#0E2E56');
                cGrad.addColorStop(0.5, '#091C35');
                cGrad.addColorStop(1, '#113563');
                ctx.fillStyle = cGrad;
                ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);

                // Silver micro-busbars (thin horizontal lines)
                ctx.strokeStyle = 'rgba(200, 220, 245, 0.45)';
                ctx.lineWidth = 1;
                for (let b = 1; b < 6; b++) {
                    ctx.beginPath();
                    ctx.moveTo(cx + 3, cy + (cellH * b) / 6);
                    ctx.lineTo(cx + cellW - 3, cy + (cellH * b) / 6);
                    ctx.stroke();
                }

                // Vertical main silver collectors
                ctx.strokeStyle = '#D4DFEE';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx + cellW * 0.33, cy + 2);
                ctx.lineTo(cx + cellW * 0.33, cy + cellH - 2);
                ctx.moveTo(cx + cellW * 0.66, cy + 2);
                ctx.lineTo(cx + cellW * 0.66, cy + cellH - 2);
                ctx.stroke();
            }
        }

        // Aluminum module outer frame border
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 506);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    function createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Realistic architectural concrete grey (non-washed out)
        ctx.fillStyle = '#8C95A3';
        ctx.fillRect(0, 0, 512, 512);

        // Concrete fine pore texture
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 20;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        // Expansion seams (paving slab grid)
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let p = 128; p < 512; p += 128) {
            ctx.moveTo(p, 0);
            ctx.lineTo(p, 512);
            ctx.moveTo(0, p);
            ctx.lineTo(512, p);
        }
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    function createHelipadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark grey deck
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 0, 512, 512);

        // Perimeter yellow hazard stripes
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 14;
        ctx.strokeRect(10, 10, 492, 492);

        // White perimeter circular landing guide
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(256, 256, 200, 0, Math.PI * 2);
        ctx.stroke();

        // Red cross accent circle
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(256, 256, 175, 0, Math.PI * 2);
        ctx.fill();

        // Inner grey circle
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(256, 256, 155, 0, Math.PI * 2);
        ctx.fill();

        // Bold white 'H' in the center
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(176, 160, 32, 192); // Left vertical bar
        ctx.fillRect(304, 160, 32, 192); // Right vertical bar
        ctx.fillRect(176, 238, 160, 36);  // Crossbar

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    function createWindowFacadeTexture(isNight) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark wall framework
        ctx.fillStyle = '#1E2530';
        ctx.fillRect(0, 0, 512, 512);

        const rows = 8;
        const cols = 8;
        const winW = 512 / cols;
        const winH = 512 / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const wx = c * winW + 5;
                const wy = r * winH + 5;
                const ww = winW - 10;
                const wh = winH - 10;

                if (isNight) {
                    // Random lit windows at night (warm office or hospital glow)
                    const isLit = Math.random() > 0.35;
                    if (isLit) {
                        const isWarm = Math.random() > 0.4;
                        ctx.fillStyle = isWarm ? '#FDE68A' : '#E0F2FE';
                        ctx.fillRect(wx, wy, ww, wh);

                        // Horizontal Venetian blind shadows
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                        for (let b = 4; b < wh; b += 6) {
                            ctx.fillRect(wx, wy + b, ww, 2);
                        }
                    } else {
                        ctx.fillStyle = '#0D1117';
                        ctx.fillRect(wx, wy, ww, wh);
                    }
                } else {
                    // Daytime dark architectural tinted glass with subtle realistic reflection
                    const glassGrad = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
                    glassGrad.addColorStop(0, '#1E293B');
                    glassGrad.addColorStop(0.5, '#0F172A');
                    glassGrad.addColorStop(1, '#253549');
                    ctx.fillStyle = glassGrad;
                    ctx.fillRect(wx, wy, ww, wh);

                    // Delicate specular sun sheen
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.beginPath();
                    ctx.moveTo(wx, wy + wh * 0.4);
                    ctx.lineTo(wx + ww * 0.4, wy);
                    ctx.lineTo(wx + ww * 0.6, wy);
                    ctx.lineTo(wx, wy + wh * 0.6);
                    ctx.fill();
                }

                // Window mullions (frames)
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.strokeRect(wx, wy, ww, wh);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    return {
        createAsphaltTexture,
        createGrassTexture,
        createBrickTexture,
        createRoofShingleTexture,
        createSolarPanelTexture,
        createConcreteTexture,
        createHelipadTexture,
        createWindowFacadeTexture
    };
})();

window.CityTextures = CityTextures;
