/**
 * ============================================================================
 * Quantum Computing Optimization Engine — Photorealistic Miniature 3D City
 * High-Fidelity Architectural Diorama with PBR Physical Materials,
 * Realistic Miniature Buildings, Vehicles, Animated Hydro Dam, Dynamic Day/Night
 * Lighting, AR Power Overlays, Smart Zoom & Qubit Customization
 * ============================================================================
 */

(function () {
    'use strict';

    // Global App Configuration & State
    const CONFIG = {
        defaultDashboardUrl: 'http://localhost:8501',
        // Nighttime Post-Processing (High-tech Dark Mode)
        bloomThresholdNight: 0.30,
        bloomStrengthNight: 1.20,
        bloomRadiusNight: 0.55,
        exposureNight: 1.05,
        // Daytime Post-Processing (70% Lower Bloom, High Threshold to Prevent Washout, Crisp Exposure)
        bloomThresholdDay: 0.90,
        bloomStrengthDay: 0.36, // 70% reduction from 1.20
        bloomRadiusDay: 0.20,
        exposureDay: 0.78
    };

    const STATE = {
        isDay: false, // Default: nighttime aesthetic with glowing AR power lines
        timeTransition: 0.0, // 0.0 = Night, 1.0 = Day
        isTransitioning: false,
        transitionProgress: 0.0,
        transitionDuration: 2.8,
        transitionDirection: 1,
        isCinematicMovieActive: false,
        activeCameraView: 'iso',
        hoveredObject: null,
        soundEnabled: true,
        dashboardUrl: localStorage.getItem('quantum_dashboard_url') || CONFIG.defaultDashboardUrl,

        // Reactive Qubit Infrastructure Nodes (Solid Dark Core + Bright Neon Outline)
        qubitNodes: [
            {
                id: 'hospital',
                qubitIndex: 0,
                name: 'Memorial Medical Center (Emergency)',
                category: 'hospital',
                priority: 'Very High',
                weight: 100,
                requiredPower: 30.0,
                workingHours: '24/7',
                coreColorHex: 0x7A000A,    // Solid Dark Crimson Core (Visible against bright daylight)
                neonColorHex: 0xFF1744,    // Bright Vivid Neon Red Outline
                colorHex: 0xFF1744,
                lightColorHex: 0xFF1744,
                allocatedPower: 30.0,
                isOnline: true,
                position: new THREE.Vector3(16, 0, 14),
                meshGroup: null,
                hitMesh: null,
                powerLine: null,
                isCustom: false
            },
            {
                id: 'school',
                qubitIndex: 1,
                name: 'Oakridge Community Academy',
                category: 'school',
                priority: 'High',
                weight: 50,
                requiredPower: 20.0,
                workingHours: '08:00 - 15:00',
                coreColorHex: 0x7C2D12,    // Solid Dark Burnt Orange Core
                neonColorHex: 0xFF7700,    // Bright Vivid Neon Orange Outline
                colorHex: 0xFF7700,
                lightColorHex: 0xFF7700,
                allocatedPower: 0.0,      // Night mode curfew initially
                isOnline: false,
                position: new THREE.Vector3(-16, 0, 14),
                meshGroup: null,
                hitMesh: null,
                powerLine: null,
                isCustom: false
            },
            {
                id: 'commercial',
                qubitIndex: 2,
                name: 'Metro Corporate Commerce Tower',
                category: 'commercial',
                priority: 'Medium',
                weight: 30,
                requiredPower: 15.0,
                workingHours: '09:00 - 21:00',
                coreColorHex: 0x034563,    // Solid Dark Navy Cyan Core
                neonColorHex: 0x00F0FF,    // Bright Electric Cyan Outline
                colorHex: 0x00F0FF,
                lightColorHex: 0x00F0FF,
                allocatedPower: 15.0,
                isOnline: true,
                position: new THREE.Vector3(19, 0, -1),
                meshGroup: null,
                hitMesh: null,
                powerLine: null,
                isCustom: false
            },
            {
                id: 'houses',
                qubitIndex: 3,
                name: 'Greenfield Residential Suburb',
                category: 'residential',
                priority: 'Low',
                weight: 10,
                requiredPower: 10.0,
                workingHours: '24/7 (Base + Peak 17:00–23:00)',
                coreColorHex: 0x0C4A6E,    // Solid Dark Cobalt Blue Core
                neonColorHex: 0x38BDF8,    // Bright Sky Blue Outline
                colorHex: 0x38BDF8,
                lightColorHex: 0x38BDF8,
                allocatedPower: 10.0,
                isOnline: true,
                isBaseline: false,
                position: new THREE.Vector3(-19, 0, -1),
                meshGroup: null,
                hitMesh: null,
                powerLine: null,
                isCustom: false
            }
        ],

        activeEditingNode: null,
        focusedQubitId: null,
        selectedBuildingNode: null,
        isEnergyFlowActive: false,
        selectedAddTemplate: 'factory'
    };

    // Available Island Grid Coordinates for Dynamic Qubit Additions
    const AVAILABLE_SPAWN_SLOTS = [
        { pos: new THREE.Vector3(14, 0, -10), used: false },
        { pos: new THREE.Vector3(-14, 0, -10), used: false },
        { pos: new THREE.Vector3(8, 0, 18), used: false },
        { pos: new THREE.Vector3(-8, 0, 18), used: false },
        { pos: new THREE.Vector3(22, 0, 8), used: false },
        { pos: new THREE.Vector3(-22, 0, 8), used: false },
        { pos: new THREE.Vector3(0, 0, 20), used: false }
    ];

    // Three.js Core Globals
    let scene, camera, renderer, composer, controls;
    let bloomPass;
    let clock = new THREE.Clock();
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2(-999, -999);
    let screenMouse = { x: 0, y: 0 };

    // Smart Precision Zoom State
    const smartZoom = {
        targetPos: new THREE.Vector3(0, 0, 0),
        isZoomingToNode: false,
        activeNode: null,
        lerpFactor: 0.08
    };

    // Dynamic Collections
    const animatedObjects = {
        windTurbineBlades: [],
        quantumRings: [],
        quantumCoreCore: null,
        waterParticles: null,
        waterMesh: null,
        powerLines: [],
        pulsingLights: [],
        streetLights: [],
        windowMaterials: [],
        beaconLight: null,
        shockwaves: [],
        selectionOutline: null
    };

    const interactiveMeshes = [];
    let sunLight, moonLight, ambientLight, hemiLight;

    // Camera preset positions
    const CAMERA_PRESETS = {
        iso: { pos: new THREE.Vector3(44, 42, 44), target: new THREE.Vector3(0, 0, 0) },
        top: { pos: new THREE.Vector3(0, 68, 0.1), target: new THREE.Vector3(0, 0, 0) },
        center: { pos: new THREE.Vector3(14, 12, 14), target: new THREE.Vector3(0, 2, 0) },
        hospital: { pos: new THREE.Vector3(28, 16, 26), target: new THREE.Vector3(16, 2, 14) }
    };

    // Shared Procedural Textures Cache
    let textures = {};

    // =========================================================================
    // Initialization Entry Point
    // =========================================================================
    function init() {
        const container = document.getElementById('canvas-container');
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Generate PBR Procedural Textures
        initProceduralTextures();

        // 2. Scene Setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080C16);
        scene.fog = new THREE.FogExp2(0x080C16, 0.0035);

        // 3. Camera Setup (Isometric style perspective with narrow FOV)
        camera = new THREE.PerspectiveCamera(28, width / height, 1, 1000);
        camera.position.copy(CAMERA_PRESETS.iso.pos);
        camera.lookAt(CAMERA_PRESETS.iso.target);

        // 4. Renderer Setup (Realistic Shadows & PBR Tone Mapping)
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = CONFIG.exposureNight;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 5. Orbit Controls (Full 360-Degree Rotation & Pitch)
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = 0.05;
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.minDistance = 6;
        controls.maxDistance = 160;
        controls.target.copy(CAMERA_PRESETS.iso.target);

        // 6. Postprocessing Pipeline
        setupPostProcessing(width, height);

        // 7. Environment & Realistic Directional Sun/Moon Lighting (No celestial spheres or stars)
        buildRealisticCelestialLights();

        // 8. Miniature City Terrain, Roads, Sidewalks, River & Foliage
        buildRealisticCityTerrain();

        // 9. Realistic Architectural Structures
        buildRealisticHospital();
        buildRealisticSchool();
        buildRealisticCommercial();
        buildRealisticResidential();
        buildRealisticCentralHub();

        // 10. Realistic Power Generation Plants
        buildRealisticHydroDam();
        buildRealisticSolarFarm();
        buildRealisticWindTurbines();
        buildRealisticBatteryStorage();

        // 11. Augmented Reality Holographic Power Routing Lines
        buildARPowerLines();

        // 12. Smart Precision Zoom
        setupSmartZoom();

        // 13. Event Listeners & UI Binding
        setupEventListeners();
        setupUI();

        // 14. Initial Microgrid Dispatch
        recalculateMicrogridDispatch();

        // 15. Start Render Loop
        animate();
    }

    // =========================================================================
    // Procedural PBR Textures
    // =========================================================================
    function initProceduralTextures() {
        if (window.CityTextures) {
            textures.asphalt = CityTextures.createAsphaltTexture();
            textures.grass = CityTextures.createGrassTexture();
            textures.brick = CityTextures.createBrickTexture();
            textures.roof = CityTextures.createRoofShingleTexture();
            textures.solar = CityTextures.createSolarPanelTexture();
            textures.concrete = CityTextures.createConcreteTexture();
            textures.helipad = CityTextures.createHelipadTexture();
            textures.windowsDay = CityTextures.createWindowFacadeTexture(false);
            textures.windowsNight = CityTextures.createWindowFacadeTexture(true);
        }
    }

    // =========================================================================
    // Post-Processing Pipeline (Unreal Bloom)
    // =========================================================================
    function setupPostProcessing(width, height) {
        composer = new THREE.EffectComposer(renderer);
        
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(width, height),
            CONFIG.bloomStrengthNight,
            CONFIG.bloomRadiusNight,
            CONFIG.bloomThresholdNight
        );
        bloomPass.renderToScreen = true;
        composer.addPass(bloomPass);
    }

    // =========================================================================
    // Digital Twin Lighting & Global Illumination (No physical celestial objects)
    // =========================================================================
    function buildRealisticCelestialLights() {
        ambientLight = new THREE.AmbientLight(0x283548, 0.25);
        scene.add(ambientLight);

        hemiLight = new THREE.HemisphereLight(0x8CB0D4, 0x243320, 0.3);
        scene.add(hemiLight);

        // Primary Directional Light (Sun) — Strong 45-degree angle, sharp building shadows
        sunLight = new THREE.DirectionalLight(0xFFF9EE, 0.0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 5;
        sunLight.shadow.camera.far = 160;
        sunLight.shadow.camera.left = -44;
        sunLight.shadow.camera.right = 44;
        sunLight.shadow.camera.top = 44;
        sunLight.shadow.camera.bottom = -44;
        sunLight.shadow.bias = -0.0003;
        sunLight.shadow.normalBias = 0.025;
        scene.add(sunLight);
        scene.add(sunLight.target);
        sunLight.target.position.set(0, 0, 0);

        // Nocturnal Directional Light (Moonlight) — Ambient night illumination
        moonLight = new THREE.DirectionalLight(0x60A5FA, 0.9);
        moonLight.position.set(-35, 45, -35);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        moonLight.shadow.camera.near = 5;
        moonLight.shadow.camera.far = 160;
        moonLight.shadow.camera.left = -44;
        moonLight.shadow.camera.right = 44;
        moonLight.shadow.camera.top = 44;
        moonLight.shadow.camera.bottom = -44;
        scene.add(moonLight);
        scene.add(moonLight.target);
        moonLight.target.position.set(0, 0, 0);

        updateCelestialPositions(0.0);
    }

    function updateCelestialPositions(t) {
        // Strong Primary Sun Light pointing down at 45-degree angle in Day Mode
        const sunElevX = THREE.MathUtils.lerp(65, 36, t);
        const sunElevY = THREE.MathUtils.lerp(-10, 50.9, t); // 45° angle: atan2(50.9, sqrt(36^2+36^2)) = 45°
        const sunElevZ = THREE.MathUtils.lerp(-40, 36, t);
        sunLight.position.set(sunElevX, sunElevY, sunElevZ);
        sunLight.intensity = THREE.MathUtils.lerp(0.0, 2.3, t); // Crisp primary sunlight with ground shadows

        moonLight.intensity = THREE.MathUtils.lerp(0.9, 0.0, t);

        // Realistic Soft Blue Daytime Sky & Night Background (Clean digital twin atmosphere, no stars)
        const nightBg = new THREE.Color(0x080C16);
        const sunriseBg = new THREE.Color(0x2D223B);
        const dayBg = new THREE.Color(0x82A4C8); // Soft realistic powder-blue sky

        let curBg = new THREE.Color();
        if (t < 0.5) {
            curBg.lerpColors(nightBg, sunriseBg, t * 2.0);
        } else {
            curBg.lerpColors(sunriseBg, dayBg, (t - 0.5) * 2.0);
        }

        scene.background.copy(curBg);
        scene.fog.color.copy(curBg);

        // Ambient & Hemisphere fill kept balanced to preserve sharp, dark shadows
        ambientLight.intensity = THREE.MathUtils.lerp(0.20, 0.40, t);
        hemiLight.intensity = THREE.MathUtils.lerp(0.25, 0.35, t);

        // Bloom & Camera Exposure Overhaul: 70% reduction in Day Mode to prevent blowout
        if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(CONFIG.bloomStrengthNight, CONFIG.bloomStrengthDay, t);
            bloomPass.threshold = THREE.MathUtils.lerp(CONFIG.bloomThresholdNight, CONFIG.bloomThresholdDay, t);
            bloomPass.radius = THREE.MathUtils.lerp(CONFIG.bloomRadiusNight, CONFIG.bloomRadiusDay, t);
        }

        if (renderer) {
            renderer.toneMappingExposure = THREE.MathUtils.lerp(CONFIG.exposureNight, CONFIG.exposureDay, t);
        }

        // Update streetlights and building window illumination based on time
        animatedObjects.streetLights.forEach(sl => {
            sl.intensity = THREE.MathUtils.lerp(1.5, 0.0, t);
            if (sl.userData.glowMesh) {
                sl.userData.glowMesh.material.opacity = THREE.MathUtils.lerp(0.9, 0.0, t);
            }
        });

        // Window lighting shift: interior lights turn off in daytime, slight reflection only
        if (textures.windowsDay && textures.windowsNight) {
            animatedObjects.windowMaterials.forEach(mat => {
                mat.map = t > 0.4 ? textures.windowsDay : textures.windowsNight;
                mat.emissiveIntensity = THREE.MathUtils.lerp(0.65, 0.0, t);
                mat.needsUpdate = true;
            });
        }
    }

    // =========================================================================
    // Miniature Realistic City Base (Lush Grass, Asphalt Streets, Sidewalks)
    // =========================================================================
    function buildRealisticCityTerrain() {
        const cityBase = new THREE.Group();

        // 1. Architectural Display Tabletop Slab (Floating Miniature Diorama Plinth)
        const dioramaRadius = 34;
        const dioramaHeight = 4.0;
        const plinth = new THREE.Mesh(
            new THREE.CylinderGeometry(dioramaRadius, dioramaRadius + 1.2, dioramaHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x1A212C, roughness: 0.85, metalness: 0.2 })
        );
        plinth.position.y = -dioramaHeight * 0.5;
        plinth.receiveShadow = true;
        cityBase.add(plinth);

        // 2. Main Terrain Surface: Lush Solid Green Landscaped Turf (Opaque PBR, Non-Glowing)
        const terrainGeo = new THREE.CylinderGeometry(dioramaRadius - 0.2, dioramaRadius - 0.2, 0.2, 8);
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x386D28,
            map: textures.grass,
            roughness: 0.88,
            metalness: 0.02
        });
        if (textures.grass) {
            textures.grass.repeat.set(8, 8);
        }
        const terrain = new THREE.Mesh(terrainGeo, grassMat);
        terrain.position.y = 0.1;
        terrain.receiveShadow = true;
        cityBase.add(terrain);

        // 3. Realistic Paved Asphalt Road Network (Solid Dark Asphalt, Opaque PBR)
        // Ring road connecting all facilities
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x1E232A,
            map: textures.asphalt,
            roughness: 0.85,
            metalness: 0.08
        });
        if (textures.asphalt) {
            textures.asphalt.repeat.set(1, 12);
        }

        // Circular perimeter avenue
        const roadRing = new THREE.Mesh(
            new THREE.RingGeometry(17.5, 21.5, 64),
            roadMat
        );
        roadRing.rotation.x = -Math.PI / 2;
        roadRing.position.y = 0.22;
        roadRing.receiveShadow = true;
        cityBase.add(roadRing);

        // Central cross avenues connecting districts
        const crossAve1 = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.22, 38), roadMat);
        crossAve1.position.set(0, 0.11, 0);
        crossAve1.receiveShadow = true;
        cityBase.add(crossAve1);

        const crossAve2 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.22, 4.0), roadMat);
        crossAve2.position.set(0, 0.11, 0);
        crossAve2.receiveShadow = true;
        cityBase.add(crossAve2);

        // Concrete curbs and sidewalks framing the avenues (Realistic Grey Concrete)
        const sidewalkMat = new THREE.MeshStandardMaterial({
            color: 0x8C95A3,
            map: textures.concrete,
            roughness: 0.80,
            metalness: 0.10
        });
        const sidewalk1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 38), sidewalkMat);
        sidewalk1.position.set(2.4, 0.14, 0);
        const sidewalk2 = sidewalk1.clone();
        sidewalk2.position.set(-2.4, 0.14, 0);
        cityBase.add(sidewalk1);
        cityBase.add(sidewalk2);

        // 4. Streetlamp Posts with Conical Night Lighting
        addStreetlight(cityBase, 2.8, 0.28, 8);
        addStreetlight(cityBase, -2.8, 0.28, 8);
        addStreetlight(cityBase, 2.8, 0.28, -8);
        addStreetlight(cityBase, -2.8, 0.28, -8);
        addStreetlight(cityBase, 12, 0.28, 14);
        addStreetlight(cityBase, -12, 0.28, 14);
        addStreetlight(cityBase, 15, 0.28, -2);
        addStreetlight(cityBase, -15, 0.28, -2);

        // 5. Landscaping Trees & Shrubs
        addRealisticTree(cityBase, -12, 0, 7, 'oak');
        addRealisticTree(cityBase, -14, 0, 9, 'maple');
        addRealisticTree(cityBase, 12, 0, 8, 'oak');
        addRealisticTree(cityBase, -18, 0, 8, 'pine');
        addRealisticTree(cityBase, -22, 0, -6, 'pine');
        addRealisticTree(cityBase, 20, 0, 7, 'oak');
        addRealisticTree(cityBase, 13, 0, 19, 'maple');

        scene.add(cityBase);
    }

    function addStreetlight(parent, x, y, z) {
        const postGroup = new THREE.Group();
        postGroup.position.set(x, y, z);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
        );
        pole.position.y = 1.6;
        pole.castShadow = true;
        postGroup.add(pole);

        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.08, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
        );
        arm.position.set(-0.35, 3.2, 0);
        postGroup.add(arm);

        const lampHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.1, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8 })
        );
        lampHead.position.set(-0.7, 3.15, 0);
        postGroup.add(lampHead);

        // Glowing Lamp Bulb
        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xFFF3C4, transparent: true, opacity: 0.9 })
        );
        bulb.position.set(-0.7, 3.08, 0);
        postGroup.add(bulb);

        // Conical PointLight casting pool onto asphalt
        const light = new THREE.PointLight(0xFFF1B8, 1.5, 12, 1.8);
        light.position.set(-0.7, 3.0, 0);
        light.userData.glowMesh = bulb;
        postGroup.add(light);
        animatedObjects.streetLights.push(light);

        parent.add(postGroup);
    }

    function addRealisticTree(parent, x, y, z, type) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, y, z);

        const trunkHeight = type === 'pine' ? 1.6 : 1.8;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.35, trunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.95 })
        );
        trunk.position.y = trunkHeight * 0.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        if (type === 'pine') {
            for (let i = 0; i < 3; i++) {
                const layer = new THREE.Mesh(
                    new THREE.ConeGeometry(1.8 - i * 0.4, 2.0, 7),
                    new THREE.MeshStandardMaterial({ color: 0x1B4D24, roughness: 0.85 })
                );
                layer.position.y = 1.6 + i * 1.1;
                layer.castShadow = true;
                treeGroup.add(layer);
            }
        } else {
            // Deciduous lush canopy cluster
            const leafMat = new THREE.MeshStandardMaterial({
                color: type === 'maple' ? 0x8C5220 : 0x2E6B20,
                roughness: 0.75
            });
            const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), leafMat);
            c1.position.set(0, 2.6, 0);
            c1.castShadow = true;
            const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), leafMat);
            c2.position.set(0.6, 3.1, 0.4);
            c2.castShadow = true;
            const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), leafMat);
            c3.position.set(-0.5, 2.9, -0.3);
            c3.castShadow = true;
            treeGroup.add(c1);
            treeGroup.add(c2);
            treeGroup.add(c3);
        }

        parent.add(treeGroup);
    }

    // =========================================================================
    // Hospital (Qubit 0 / Very High Priority) — Detailed Modern Medical Campus
    // =========================================================================
    function buildRealisticHospital() {
        const hospitalGroup = new THREE.Group();
        hospitalGroup.position.set(16, 0, 14);

        // Concrete Foundation Plaza & Parking (Realistic Grey Concrete)
        const plaza = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.3, 12),
            new THREE.MeshStandardMaterial({ color: 0x8C95A3, map: textures.concrete, roughness: 0.80 })
        );
        plaza.position.y = 0.15;
        plaza.receiveShadow = true;
        hospitalGroup.add(plaza);

        // Main Inpatient 6-Story Tower (Modern Architectural Grey Composite, Non-Glowing)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x9BA7B7, roughness: 0.65, metalness: 0.15 });
        const mainTower = new THREE.Mesh(new THREE.BoxGeometry(8.5, 7.5, 6.0), wallMat);
        mainTower.position.set(0, 3.9, 0);
        mainTower.castShadow = true;
        mainTower.receiveShadow = true;
        hospitalGroup.add(mainTower);

        // Glass Curtain Facade (Dark Tinted Glass, Non-Glowing in Day, Warm in Night)
        const winMat = new THREE.MeshStandardMaterial({
            map: textures.windowsNight,
            roughness: 0.10,
            metalness: 0.75,
            emissive: 0x000000,
            emissiveIntensity: 0.0
        });
        animatedObjects.windowMaterials.push(winMat);

        const glassFacadeFront = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 6.2), winMat);
        glassFacadeFront.position.set(0, 4.0, 3.02);
        hospitalGroup.add(glassFacadeFront);

        const glassFacadeRear = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 6.2), winMat);
        glassFacadeRear.position.set(0, 4.0, -3.02);
        glassFacadeRear.rotation.y = Math.PI;
        hospitalGroup.add(glassFacadeRear);

        // Emergency Trauma Wing (2-Story Extension)
        const traumaWing = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.6, 5.0), wallMat);
        traumaWing.position.set(-6.2, 1.95, 0.5);
        traumaWing.castShadow = true;
        hospitalGroup.add(traumaWing);

        // Ambulance Bay Drive-Through Portico
        const porticoRoof = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 0.35, 4.2),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
        );
        porticoRoof.position.set(-6.2, 3.2, 4.8);
        hospitalGroup.add(porticoRoof);

        const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.0, 8), wallMat);
        col1.position.set(-8.4, 1.5, 6.5);
        const col2 = col1.clone();
        col2.position.set(-4.0, 1.5, 6.5);
        hospitalGroup.add(col1);
        hospitalGroup.add(col2);

        // Illuminated 3D Red Cross & Emergency Signage
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 0.2), crossMat);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.2), crossMat);
        crossV.position.set(0, 6.2, 3.12);
        crossH.position.set(0, 6.2, 3.12);
        hospitalGroup.add(crossV);
        hospitalGroup.add(crossH);

        const emgSign = new THREE.Mesh(
            new THREE.BoxGeometry(3.6, 0.6, 0.15),
            new THREE.MeshBasicMaterial({ color: 0xDC2626 })
        );
        emgSign.position.set(-6.2, 2.9, 6.95);
        hospitalGroup.add(emgSign);

        // Rooftop Helipad Deck with PBR Helipad Texture
        const helipadDeck = new THREE.Mesh(
            new THREE.CylinderGeometry(3.2, 3.2, 0.4, 32),
            new THREE.MeshStandardMaterial({
                map: textures.helipad,
                roughness: 0.65,
                metalness: 0.2
            })
        );
        helipadDeck.position.set(0, 7.85, 0);
        hospitalGroup.add(helipadDeck);

        // Helipad Perimeter LED Boundary Lights (Red & White)
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const led = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xEF4444 })
            );
            led.position.set(Math.cos(ang) * 3.0, 8.1, Math.sin(ang) * 3.0);
            hospitalGroup.add(led);
        }

        // Parked Detailed Ambulances in Bay
        addRealisticAmbulance(hospitalGroup, -5.2, 0.3, 4.8);
        addRealisticAmbulance(hospitalGroup, -7.2, 0.3, 4.8);

        // Interactive Bounding Mesh for Click & Smart Zoom
        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(15, 10, 13),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 5;
        hitMesh.userData = {
            interactiveId: 'hospital',
            qubitId: 'hospital',
            isQubitNode: true
        };
        hospitalGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        const qNode = STATE.qubitNodes.find(n => n.id === 'hospital');
        if (qNode) {
            qNode.meshGroup = hospitalGroup;
            qNode.hitMesh = hitMesh;
        }

        scene.add(hospitalGroup);
    }

    function addRealisticAmbulance(parent, x, y, z) {
        const amb = new THREE.Group();
        amb.position.set(x, y, z);

        // White Van Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 1.4, 3.2),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3, metalness: 0.1 })
        );
        body.position.y = 0.9;
        body.castShadow = true;
        amb.add(body);

        // Red Side Emergency Stripe
        const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 3.1), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
        stripeL.position.set(-0.71, 0.9, 0);
        const stripeR = stripeL.clone();
        stripeR.position.x = 0.71;
        amb.add(stripeL);
        amb.add(stripeR);

        // Windshield
        const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 0.5, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.1 })
        );
        win.position.set(0, 1.1, 1.55);
        amb.add(win);

        // Rooftop Red/Blue Emergency Lightbar
        const barR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.2), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
        barR.position.set(-0.3, 1.7, 0.4);
        const barB = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.2), new THREE.MeshBasicMaterial({ color: 0x3B82F6 }));
        barB.position.set(0.3, 1.7, 0.4);
        amb.add(barR);
        amb.add(barB);

        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12), wheelMat);
        w1.rotation.z = Math.PI / 2;
        w1.position.set(-0.72, 0.28, 0.9);
        const w2 = w1.clone();
        w2.position.set(0.72, 0.28, 0.9);
        const w3 = w1.clone();
        w3.position.set(-0.72, 0.28, -0.9);
        const w4 = w1.clone();
        w4.position.set(0.72, 0.28, -0.9);
        amb.add(w1);
        amb.add(w2);
        amb.add(w3);
        amb.add(w4);

        parent.add(amb);
    }

    // =========================================================================
    // School (Qubit 1 / High Priority) — Brick-and-Glass Campus, Buses, Playground
    // =========================================================================
    function buildRealisticSchool() {
        const schoolGroup = new THREE.Group();
        schoolGroup.position.set(-16, 0, 14);

        // Concrete School Campus Courtyard (Realistic Grey Concrete)
        const campusPlaza = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.3, 13),
            new THREE.MeshStandardMaterial({ color: 0x8C95A3, map: textures.concrete, roughness: 0.85 })
        );
        campusPlaza.position.y = 0.15;
        campusPlaza.receiveShadow = true;
        schoolGroup.add(campusPlaza);

        // Academic Building Wings (Solid Textured Red Brick, Opaque PBR, Non-Glowing)
        const brickMat = new THREE.MeshStandardMaterial({
            color: 0x8F3D2A,
            map: textures.brick,
            roughness: 0.88,
            metalness: 0.04
        });
        if (textures.brick) {
            textures.brick.repeat.set(3, 2);
        }

        const mainWing = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.5, 4.8), brickMat);
        mainWing.position.set(-0.5, 2.4, 0);
        mainWing.castShadow = true;
        schoolGroup.add(mainWing);

        // Modern Large Classroom Glass Windows (Dark Architectural Glass)
        const schoolWinMat = new THREE.MeshStandardMaterial({
            map: textures.windowsDay,
            color: 0x182433,
            roughness: 0.15,
            metalness: 0.70,
            emissive: 0x000000,
            emissiveIntensity: 0.0
        });
        animatedObjects.windowMaterials.push(schoolWinMat);

        const winFront = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 3.4), schoolWinMat);
        winFront.position.set(-0.5, 2.4, 2.42);
        schoolGroup.add(winFront);

        // Historic Clock Tower
        const tower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 2.4), brickMat);
        tower.position.set(4.2, 4.4, 0.6);
        tower.castShadow = true;
        schoolGroup.add(tower);

        const clockDial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24),
            new THREE.MeshBasicMaterial({ color: 0xFDE68A })
        );
        clockDial.rotation.x = Math.PI / 2;
        clockDial.position.set(4.2, 7.2, 1.82);
        schoolGroup.add(clockDial);

        // School Bus Loading Zone with 2 Detailed Yellow School Buses
        addRealisticSchoolBus(schoolGroup, -3.2, 0.3, 5.0);
        addRealisticSchoolBus(schoolGroup, 2.2, 0.3, 5.0);

        // Athletic Sports Playground (Basketball Court & Turf Area)
        const court = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 0.08, 4.5),
            new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.7 })
        );
        court.position.set(-3.5, 0.32, -3.8);
        schoolGroup.add(court);

        const courtLines = new THREE.Mesh(
            new THREE.BoxGeometry(6.2, 0.09, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
        );
        courtLines.position.set(-3.5, 0.33, -3.8);
        schoolGroup.add(courtLines);

        // Basketball Hoop Post
        const hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
        hoopPole.position.set(-0.4, 1.5, -3.8);
        const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.2), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        backboard.position.set(-0.4, 2.5, -3.8);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
        rim.rotation.x = Math.PI / 2;
        rim.position.set(-0.6, 2.3, -3.8);
        schoolGroup.add(hoopPole);
        schoolGroup.add(backboard);
        schoolGroup.add(rim);

        // Interactive Bounding Mesh
        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(16, 10, 14),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 5;
        hitMesh.userData = {
            interactiveId: 'school',
            qubitId: 'school',
            isQubitNode: true
        };
        schoolGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        const qNode = STATE.qubitNodes.find(n => n.id === 'school');
        if (qNode) {
            qNode.meshGroup = schoolGroup;
            qNode.hitMesh = hitMesh;
        }

        scene.add(schoolGroup);
    }

    function addRealisticSchoolBus(parent, x, y, z) {
        const bus = new THREE.Group();
        bus.position.set(x, y, z);

        // Classic School Bus Yellow Body
        const busBody = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 1.4, 4.0),
            new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.35, metalness: 0.2 })
        );
        busBody.position.y = 0.95;
        busBody.castShadow = true;
        bus.add(busBody);

        // White Roof Cap
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(1.35, 0.15, 3.9),
            new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.4 })
        );
        roof.position.y = 1.7;
        bus.add(roof);

        // Black Side Window Bands
        const winBandL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 3.4), new THREE.MeshBasicMaterial({ color: 0x0F172A }));
        winBandL.position.set(-0.71, 1.2, 0);
        const winBandR = winBandL.clone();
        winBandR.position.x = 0.71;
        bus.add(winBandL);
        bus.add(winBandR);

        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), wheelMat);
        w1.rotation.z = Math.PI / 2;
        w1.position.set(-0.72, 0.3, 1.2);
        const w2 = w1.clone();
        w2.position.set(0.72, 0.3, 1.2);
        const w3 = w1.clone();
        w3.position.set(-0.72, 0.3, -1.2);
        const w4 = w1.clone();
        w4.position.set(0.72, 0.3, -1.2);
        bus.add(w1);
        bus.add(w2);
        bus.add(w3);
        bus.add(w4);

        parent.add(bus);
    }

    // =========================================================================
    // Commercial Building (Qubit 2 / Medium Priority) — Stepped Glass Towers
    // =========================================================================
    function buildRealisticCommercial() {
        const commGroup = new THREE.Group();
        commGroup.position.set(19, 0, -1);

        const commPlaza = new THREE.Mesh(
            new THREE.BoxGeometry(11, 0.3, 10),
            new THREE.MeshStandardMaterial({ color: 0x8C95A3, map: textures.concrete, roughness: 0.80 })
        );
        commPlaza.position.y = 0.15;
        commPlaza.receiveShadow = true;
        commGroup.add(commPlaza);

        // Ground Floor Retail Concourse (Dark Polished Granite)
        const podium = new THREE.Mesh(
            new THREE.BoxGeometry(8.2, 2.8, 7.2),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.60, roughness: 0.40 })
        );
        podium.position.y = 1.55;
        podium.castShadow = true;
        commGroup.add(podium);

        // Upper Glass Tower (Dark Tinted Glass, Opaque PBR, Non-Glowing)
        const tower = new THREE.Mesh(
            new THREE.BoxGeometry(6.4, 7.2, 5.4),
            new THREE.MeshStandardMaterial({ color: 0x0F1B2A, metalness: 0.82, roughness: 0.12 })
        );
        tower.position.y = 6.4;
        tower.castShadow = true;
        commGroup.add(tower);

        // Floor-to-ceiling dark glass panel facades
        const commWinMat = new THREE.MeshStandardMaterial({
            map: textures.windowsNight,
            color: 0x162234,
            roughness: 0.10,
            metalness: 0.75,
            emissive: 0x000000,
            emissiveIntensity: 0.0
        });
        animatedObjects.windowMaterials.push(commWinMat);

        const glassF = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 6.4), commWinMat);
        glassF.position.set(0, 6.4, 2.72);
        commGroup.add(glassF);

        // Rooftop HVAC & Satellite Up-link
        const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.8), new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.8 }));
        hvac.position.set(-1.4, 10.5, 0);
        commGroup.add(hvac);

        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9 }));
        dish.position.set(1.4, 10.6, 0.8);
        dish.rotation.x = -0.5;
        commGroup.add(dish);

        // Parked Commuter Cars in Lot
        addRealisticCar(commGroup, 3.8, 0.3, 3.2, 0xDC2626); // Red Sedan
        addRealisticCar(commGroup, 3.8, 0.3, 0.8, 0x2563EB); // Blue Sedan

        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(11, 12, 10),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 6;
        hitMesh.userData = {
            interactiveId: 'commercial',
            qubitId: 'commercial',
            isQubitNode: true
        };
        commGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        const qNode = STATE.qubitNodes.find(n => n.id === 'commercial');
        if (qNode) {
            qNode.meshGroup = commGroup;
            qNode.hitMesh = hitMesh;
        }

        scene.add(commGroup);
    }

    // =========================================================================
    // Residential Area (Qubit 3 / Low Priority) — Houses, Shingles, Driveways, Cars
    // =========================================================================
    function buildRealisticResidential() {
        const resGroup = new THREE.Group();
        resGroup.position.set(-19, 0, -1);

        // Neighborhood Lawn Base with Solid Green Grass
        const nHoodBase = new THREE.Mesh(
            new THREE.BoxGeometry(13, 0.28, 12),
            new THREE.MeshStandardMaterial({ color: 0x386D28, map: textures.grass, roughness: 0.88 })
        );
        nHoodBase.position.y = 0.14;
        nHoodBase.receiveShadow = true;
        resGroup.add(nHoodBase);

        // 4 Varied Suburban Homes with Visible Roof Shingles, Lap Siding & Porches
        const housesConfig = [
            { x: -3.2, z: -2.8, wallColor: 0x8A96A5, shingleColor: 0x242A33, rot: 0 },
            { x: 3.0, z: -2.8, wallColor: 0x9D8F7F, shingleColor: 0x1E242C, rot: 0 },
            { x: -3.2, z: 2.8, wallColor: 0x7E8D7F, shingleColor: 0x242A33, rot: Math.PI },
            { x: 3.0, z: 2.8, wallColor: 0x939EA8, shingleColor: 0x1E242C, rot: Math.PI }
        ];

        housesConfig.forEach((cfg) => {
            const h = new THREE.Group();
            h.position.set(cfg.x, 0.28, cfg.z);
            h.rotation.y = cfg.rot;

            // Concrete Driveway (Realistic Grey Concrete)
            const driveway = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 0.05, 3.4),
                new THREE.MeshStandardMaterial({ color: 0x8C95A3, roughness: 0.80 })
            );
            driveway.position.set(1.8, 0.02, 1.8);
            h.add(driveway);

            // House Walls (Lap Siding, Solid Opaque PBR, Non-Glowing)
            const walls = new THREE.Mesh(
                new THREE.BoxGeometry(3.6, 2.4, 3.2),
                new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.75 })
            );
            walls.position.set(0, 1.2, 0);
            walls.castShadow = true;
            h.add(walls);

            // Pitched Roof with Visible Layered Shingles Texture (Dark Charcoal Slate)
            const roofMat = new THREE.MeshStandardMaterial({
                color: cfg.shingleColor,
                map: textures.roof,
                roughness: 0.85
            });
            const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.5, 4), roofMat);
            roof.rotation.y = Math.PI / 4;
            roof.position.set(0, 3.1, 0);
            roof.castShadow = true;
            h.add(roof);

            // Brick Chimney
            const chimney = new THREE.Mesh(
                new THREE.BoxGeometry(0.45, 1.6, 0.45),
                new THREE.MeshStandardMaterial({ map: textures.brick, roughness: 0.88 })
            );
            chimney.position.set(0.8, 3.4, 0.6);
            h.add(chimney);

            // Front Covered Porch
            const porch = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.15, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.7 })
            );
            porch.position.set(0, 0.1, 1.8);
            h.add(porch);

            // Window (Dark in daytime, warm glow at night)
            const winMat = new THREE.MeshStandardMaterial({
                color: 0x1E293B,
                emissive: 0x000000,
                emissiveIntensity: 0.0,
                roughness: 0.2
            });
            animatedObjects.windowMaterials.push(winMat);

            const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.08), winMat);
            win1.position.set(-0.9, 1.3, 1.62);
            h.add(win1);

            // Parked Civilian Car in Driveway
            addRealisticCar(h, 1.8, 0.05, 1.8, Math.random() > 0.5 ? 0x0284C7 : 0x475569);

            resGroup.add(h);
        });

        // White Picket Fences along properties
        for (let fx = -5.5; fx <= 5.5; fx += 1.4) {
            const fencePost = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.8, 0.08),
                new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
            );
            fencePost.position.set(fx, 0.7, 0);
            resGroup.add(fencePost);
        }

        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(14, 6, 13),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 3;
        hitMesh.userData = {
            interactiveId: 'houses',
            qubitId: 'houses',
            isQubitNode: true
        };
        resGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        const qNode = STATE.qubitNodes.find(n => n.id === 'houses');
        if (qNode) {
            qNode.meshGroup = resGroup;
            qNode.hitMesh = hitMesh;
        }

        scene.add(resGroup);
    }

    function addRealisticCar(parent, x, y, z, carColor) {
        const car = new THREE.Group();
        car.position.set(x, y, z);

        // Chassis & Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.5, 2.4),
            new THREE.MeshStandardMaterial({ color: carColor, roughness: 0.3, metalness: 0.6 })
        );
        body.position.y = 0.45;
        body.castShadow = true;
        car.add(body);

        // Cabin with Tinted Glass
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.45, 1.3),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.1, metalness: 0.8 })
        );
        cabin.position.set(0, 0.85, -0.1);
        car.add(cabin);

        // Headlights (Warm at night)
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0xFFFBEB }));
        hlL.position.set(-0.4, 0.45, 1.22);
        const hlR = hlL.clone();
        hlR.position.x = 0.4;
        car.add(hlL);
        car.add(hlR);

        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95 });
        const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12), wheelMat);
        w1.rotation.z = Math.PI / 2;
        w1.position.set(-0.62, 0.24, 0.65);
        const w2 = w1.clone();
        w2.position.set(0.62, 0.24, 0.65);
        const w3 = w1.clone();
        w3.position.set(-0.62, 0.24, -0.65);
        const w4 = w1.clone();
        w4.position.set(0.62, 0.24, -0.65);
        car.add(w1);
        car.add(w2);
        car.add(w3);
        car.add(w4);

        parent.add(car);
    }

    // =========================================================================
    // Central Hub (Microgrid Control Center / Quantum Optimization Engine)
    // =========================================================================
    function buildRealisticCentralHub() {
        const hubGroup = new THREE.Group();
        hubGroup.position.set(0, 0, 0);

        // Polished Granite & Concrete Plaza
        const basePlaza = new THREE.Mesh(
            new THREE.CylinderGeometry(6.6, 7.2, 0.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5, metalness: 0.5 })
        );
        basePlaza.position.y = 0.3;
        hubGroup.add(basePlaza);

        // Contemporary Curved Architectural Shell (Brushed Titanium Slate, Non-Glowing)
        const shellMat = new THREE.MeshStandardMaterial({ color: 0x8F9CAB, metalness: 0.50, roughness: 0.40 });
        const shellLeft = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.0, 7.5, 16, 1, false, 0, Math.PI * 0.7), shellMat);
        shellLeft.position.y = 4.05;
        shellLeft.castShadow = true;
        hubGroup.add(shellLeft);

        const shellRight = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.0, 7.5, 16, 1, false, Math.PI, Math.PI * 0.7), shellMat);
        shellRight.position.y = 4.05;
        shellRight.castShadow = true;
        hubGroup.add(shellRight);

        // Large Panoramic Glass Observation Atrium (Dark Tinted Glass Showing Quantum Hardware Inside)
        const glassMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(4.6, 4.6, 7.4, 24, 1, true),
            new THREE.MeshPhysicalMaterial({
                color: 0x162D42,
                transparent: true,
                opacity: 0.60,
                roughness: 0.08,
                metalness: 0.3,
                transmission: 0.70,
                ior: 1.5,
                thickness: 1.2
            })
        );
        glassMesh.position.y = 4.05;
        hubGroup.add(glassMesh);

        // Visible Interior Quantum Dilution Refrigerator (Gold Cryostat Chandelier)
        const cryoGroup = new THREE.Group();
        cryoGroup.position.y = 6.8;

        const goldPlateMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.95, roughness: 0.15 });
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.2, 24), goldPlateMat);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.18, 24), goldPlateMat);
        const p3 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.15, 24), goldPlateMat);
        p2.position.y = -1.2;
        p3.position.y = -2.3;
        cryoGroup.add(p1);
        cryoGroup.add(p2);
        cryoGroup.add(p3);

        // QPU Quantum Processor Chip
        const qpuBase = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.2, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x050C16, metalness: 0.9, roughness: 0.1 })
        );
        qpuBase.position.y = -3.2;
        cryoGroup.add(qpuBase);

        const qpuCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0x00F0FF })
        );
        qpuCore.position.y = -3.2;
        cryoGroup.add(qpuCore);
        animatedObjects.quantumCoreCore = qpuCore;

        hubGroup.add(cryoGroup);

        // Rotating Concentric Quantum Rings (Bloch Rings)
        const ringSizes = [3.0, 2.4, 1.8];
        const ringColors = [0x00F0FF, 0x0077FF, 0xDC2626];
        ringSizes.forEach((sz, idx) => {
            const qRing = new THREE.Mesh(
                new THREE.TorusGeometry(sz, 0.07, 16, 64),
                new THREE.MeshBasicMaterial({ color: ringColors[idx] })
            );
            qRing.position.y = 4.0;
            hubGroup.add(qRing);
            animatedObjects.quantumRings.push({
                mesh: qRing,
                rotSpeedX: 0.012 * (idx + 1),
                rotSpeedY: 0.016 * (idx + 1),
                rotSpeedZ: 0.008 * (idx + 1)
            });
        });

        // Rooftop Quantum Satellite Dish & Spire
        const roofRoof = new THREE.Mesh(
            new THREE.CylinderGeometry(4.2, 4.6, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.7 })
        );
        roofRoof.position.y = 8.2;
        hubGroup.add(roofRoof);

        const spire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.2, 4.0, 8),
            new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.9 })
        );
        spire.position.y = 10.4;
        hubGroup.add(spire);

        const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00F0FF })
        );
        beacon.position.y = 12.5;
        hubGroup.add(beacon);
        animatedObjects.beaconLight = beacon;

        // Interactive Hit Volume
        const hitMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(5.8, 6.5, 13, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 6.5;
        hitMesh.userData = {
            interactiveId: 'center_hub',
            name: 'Microgrid Control Center',
            type: 'Quantum Optimization Engine',
            isCenterHub: true
        };
        hubGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        animatedObjects.plantGroups = animatedObjects.plantGroups || {};
        animatedObjects.plantGroups.hub = hubGroup;
        scene.add(hubGroup);
    }

    // =========================================================================
    // Realistic Power Plants (Hydro Dam, Solar Farm, Wind Turbines, BESS)
    // =========================================================================

    // 1. Hydroelectric Dam with Animated Flowing Water through Spillway Gates
    function buildRealisticHydroDam() {
        const hydroGroup = new THREE.Group();
        hydroGroup.position.set(17, 0, -17);

        // Mountain Rock Plateau Elevation
        const cliff = new THREE.Mesh(
            new THREE.CylinderGeometry(7.5, 9.5, 5.0, 8),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95, metalness: 0.05 })
        );
        cliff.position.y = 2.5;
        cliff.receiveShadow = true;
        cliff.castShadow = true;
        hydroGroup.add(cliff);

        // Concrete Curved Dam Wall Structure
        const damMat = new THREE.MeshStandardMaterial({
            color: 0xCBD5E1,
            map: textures.concrete,
            roughness: 0.85
        });
        const damWall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.8, 3.6), damMat);
        damWall.position.set(0, 3.4, 1.2);
        damWall.castShadow = true;
        damWall.receiveShadow = true;
        hydroGroup.add(damWall);

        // Crest Roadway with Guardrails
        const crest = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.4, 2.2), damMat);
        crest.position.set(0, 5.9, 1.2);
        hydroGroup.add(crest);

        // 3 Spillway Radial Chute Gates
        for (let g = -1; g <= 1; g++) {
            const pier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 2.4), damMat);
            pier.position.set(g * 2.4, 4.4, 1.8);
            hydroGroup.add(pier);

            const gate = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 1.4, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
            );
            gate.position.set(g * 2.4, 4.6, 2.8);
            hydroGroup.add(gate);
        }

        // Animated Spilling Water Mesh flowing down through the gates
        const spillwayWaterGeo = new THREE.PlaneGeometry(6.6, 5.5, 16, 16);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0284C7,
            roughness: 0.1,
            metalness: 0.85,
            transparent: true,
            opacity: 0.85
        });
        const spillwayWater = new THREE.Mesh(spillwayWaterGeo, waterMat);
        spillwayWater.position.set(0, 3.2, 3.5);
        spillwayWater.rotation.x = Math.PI * 0.32;
        hydroGroup.add(spillwayWater);
        animatedObjects.waterMesh = spillwayWater;

        // Cascading White Foam / Water Splash Particles
        const pCount = 120;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
            pPos[i * 3] = (Math.random() - 0.5) * 6.0;
            pPos[i * 3 + 1] = 0.6 + Math.random() * 1.8;
            pPos[i * 3 + 2] = 4.8 + Math.random() * 2.5;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const waterParticles = new THREE.Points(
            pGeo,
            new THREE.PointsMaterial({ color: 0xE0F2FE, size: 0.35, transparent: true, opacity: 0.85 })
        );
        hydroGroup.add(waterParticles);
        animatedObjects.waterParticles = waterParticles;

        // Heavy Steel Intake Penstock Pipe & Generator Powerhouse
        const penstock = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 6.0, 16),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.9, roughness: 0.2 })
        );
        penstock.position.set(-3.2, 2.2, 3.6);
        penstock.rotation.x = 0.55;
        hydroGroup.add(penstock);

        const powerhouse = new THREE.Mesh(
            new THREE.BoxGeometry(4.2, 2.6, 3.4),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
        );
        powerhouse.position.set(-3.2, 1.3, 6.2);
        powerhouse.castShadow = true;
        hydroGroup.add(powerhouse);

        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(11, 8, 12),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.set(0, 3.5, 3);
        hitMesh.userData = {
            interactiveId: 'hydro_gen',
            name: 'Hydropower Dam & Reservoir',
            type: '25 kW Continuous Base Load',
            timing: '24/7 Run-of-River Generation'
        };
        hydroGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        animatedObjects.plantGroups = animatedObjects.plantGroups || {};
        animatedObjects.plantGroups.hydro = hydroGroup;
        scene.add(hydroGroup);
    }

    // 2. Photovoltaic Solar Array with Physical Sun Reflectivity
    function buildRealisticSolarFarm() {
        const solarGroup = new THREE.Group();
        solarGroup.position.set(0, 0, -19);

        // Crushed Gravel Substation Pad
        const pad = new THREE.Mesh(
            new THREE.BoxGeometry(17, 0.2, 9),
            new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.95 })
        );
        pad.position.y = 0.1;
        pad.receiveShadow = true;
        solarGroup.add(pad);

        // Highly Detailed Solar Panels with Reflective Glass Material
        const panelMat = new THREE.MeshStandardMaterial({
            map: textures.solar,
            roughness: 0.04,   // Physically catches bright sunlight reflections!
            metalness: 0.88,
            envMapIntensity: 2.0
        });

        const frameMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.9, roughness: 0.2 });

        const rackCoords = [
            [-5.4, -2.2], [0, -2.2], [5.4, -2.2],
            [-5.4, 2.0],  [0, 2.0],  [5.4, 2.0]
        ];

        rackCoords.forEach(pos => {
            const rack = new THREE.Group();
            rack.position.set(pos[0], 0, pos[1]);

            // Galvanized Steel Mounting Legs
            const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), frameMat);
            l1.position.set(-1.8, 0.7, -0.6);
            const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), frameMat);
            l2.position.set(-1.8, 0.4, 0.6);
            const l3 = l1.clone();
            l3.position.x = 1.8;
            const l4 = l2.clone();
            l4.position.x = 1.8;
            rack.add(l1);
            rack.add(l2);
            rack.add(l3);
            rack.add(l4);

            // PV Table Top (Tilted toward sun)
            const table = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 2.0), panelMat);
            table.position.set(0, 1.0, 0);
            table.rotation.x = -0.38;
            table.castShadow = true;
            table.receiveShadow = true;
            rack.add(table);

            solarGroup.add(rack);
        });

        // Inverter Substation Kiosk & Weather Sensor Mast
        const inv = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 1.4), new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.7 }));
        inv.position.set(8.5, 0.8, 0);
        solarGroup.add(inv);

        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(19, 4, 11),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 2;
        hitMesh.userData = {
            interactiveId: 'solar_pv',
            name: 'Photovoltaic Solar Farm',
            type: '35 kW Peak Generation (Daylight Dependent)',
            timing: 'Daylight Only (06:00 - 18:00)'
        };
        solarGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        animatedObjects.plantGroups = animatedObjects.plantGroups || {};
        animatedObjects.plantGroups.solar = solarGroup;
        scene.add(solarGroup);
    }

    // 3. Realistic Metal-Textured Wind Turbines with Smooth Rotation
    function buildRealisticWindTurbines() {
        const turbineGroup = new THREE.Group();
        turbineGroup.position.set(-17, 0, -17);

        // Concrete Foundation Pad
        const fdn = new THREE.Mesh(
            new THREE.CylinderGeometry(2.4, 2.8, 0.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x64748B, map: textures.concrete, roughness: 0.9 })
        );
        fdn.position.y = 0.3;
        turbineGroup.add(fdn);

        // Tubular Tapered White Metal Steel Tower
        const metalTowerMat = new THREE.MeshStandardMaterial({
            color: 0xF1F5F9,
            metalness: 0.55,
            roughness: 0.25
        });
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.0, 16.5, 24), metalTowerMat);
        tower.position.y = 8.5;
        tower.castShadow = true;
        turbineGroup.add(tower);

        // Streamlined Nacelle
        const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 3.4), metalTowerMat);
        nacelle.position.set(0, 16.8, 0.4);
        turbineGroup.add(nacelle);

        // Hub & 3 Twisted Airfoil Rotor Blades
        const hub = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 16), metalTowerMat);
        hub.geometry.rotateX(Math.PI / 2);
        hub.position.set(0, 16.8, 2.2);
        turbineGroup.add(hub);

        const bladeGroup = new THREE.Group();
        bladeGroup.position.set(0, 16.8, 2.25);
        const bladeLength = 7.8;
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.2, metalness: 0.3 });

        for (let i = 0; i < 3; i++) {
            const singleBlade = new THREE.Group();
            singleBlade.rotation.z = (i / 3) * Math.PI * 2;

            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, bladeLength, 0.12), bladeMat);
            bMesh.geometry.translate(0, bladeLength * 0.5, 0);
            bMesh.castShadow = true;

            // Red warning tip
            const tipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.2, 0.14), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
            tipMesh.geometry.translate(0, bladeLength - 0.6, 0);

            singleBlade.add(bMesh);
            singleBlade.add(tipMesh);
            bladeGroup.add(singleBlade);
        }
        turbineGroup.add(bladeGroup);
        animatedObjects.windTurbineBlades.push(bladeGroup);

        // Red Flashing FAA Aviation Beacon
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
        beacon.position.set(0, 17.8, -0.8);
        turbineGroup.add(beacon);

        const hitMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 3.5, 20, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 10;
        hitMesh.userData = {
            interactiveId: 'wind_turbine',
            name: 'High-Capacity Wind Turbine',
            type: '15–20 kW Variable Wind Generation',
            timing: '24/7 Wind Dependent'
        };
        turbineGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        animatedObjects.plantGroups = animatedObjects.plantGroups || {};
        animatedObjects.plantGroups.turbine = turbineGroup;
        scene.add(turbineGroup);
    }

    // 4. Realistic Battery Storage (BESS Megapacks)
    function buildRealisticBatteryStorage() {
        const bessGroup = new THREE.Group();
        bessGroup.position.set(0, 0, 8.2);

        const pad = new THREE.Mesh(
            new THREE.BoxGeometry(10.5, 0.4, 4.2),
            new THREE.MeshStandardMaterial({ color: 0xCBD5E1, map: textures.concrete, roughness: 0.85 })
        );
        pad.position.y = 0.2;
        bessGroup.add(pad);

        const containerMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.4, roughness: 0.3 });
        for (let i = 0; i < 4; i++) {
            const posX = -3.75 + i * 2.5;
            const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 3.2), containerMat);
            box.position.set(posX, 1.5, 0);
            box.castShadow = true;
            bessGroup.add(box);

            const vent = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.6), new THREE.MeshStandardMaterial({ color: 0x334155 }));
            vent.position.set(posX, 2.65, 0);
            bessGroup.add(vent);

            for (let s = 0; s < 5; s++) {
                const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.08), new THREE.MeshBasicMaterial({ color: 0x10B981 }));
                led.position.set(posX + 0.6, 0.8 + s * 0.32, 1.62);
                bessGroup.add(led);
            }
        }

        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(11, 4, 5),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 1.8;
        hitMesh.userData = {
            interactiveId: 'bess_battery',
            name: 'Energy Storage System (BESS)',
            type: '120 kWh Grid Battery Reserve',
            timing: 'Day: Absorbs Solar (+15kW) | Night: Discharges (-25kW)'
        };
        bessGroup.add(hitMesh);
        interactiveMeshes.push(hitMesh);

        animatedObjects.plantGroups = animatedObjects.plantGroups || {};
        animatedObjects.plantGroups.bess = bessGroup;
        scene.add(bessGroup);
    }

    // =========================================================================
    // Augmented Reality (AR) Holographic Power Routing Lines
    // =========================================================================
    // Helper to calculate dark core color for any custom hex
    function darkenColorHex(hexColor, factor = 0.28) {
        const c = new THREE.Color(hexColor);
        c.r *= factor;
        c.g *= factor;
        c.b *= factor;
        return c.getHex();
    }

    // =========================================================================
    // Augmented Reality (AR) Holographic Power Routing Lines
    // Multi-Layer Dual Conduit: Solid, Dark-Colored Core + Bright Neon Outline
    // =========================================================================
    function createARPowerLine(spec) {
        const curve = new THREE.CatmullRomCurve3(spec.points);
        
        const coreColor = spec.coreColor !== undefined ? spec.coreColor : (spec.color ? darkenColorHex(spec.color, 0.25) : 0x1C2027);
        const neonColor = spec.neonColor !== undefined ? spec.neonColor : (spec.color || 0x00F0FF);

        // 1. Solid, Dark-Colored Core Conduit (High-contrast, non-washed out against daytime terrain/sky)
        const coreGeo = new THREE.TubeGeometry(curve, 80, 0.18, 12, false);
        const coreMat = new THREE.MeshBasicMaterial({
            color: coreColor,
            transparent: false,
            opacity: 1.0,
            depthTest: true
        });
        const coreTube = new THREE.Mesh(coreGeo, coreMat);
        coreTube.renderOrder = 3;
        scene.add(coreTube);

        // 2. Bright Neon Outline Sheath (Surrounds the dark core with a crisp glowing neon stroke)
        const outlineGeo = new THREE.TubeGeometry(curve, 80, 0.28, 12, false);
        const outlineMat = new THREE.MeshBasicMaterial({
            color: neonColor,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.95,
            depthTest: true
        });
        const outlineTube = new THREE.Mesh(outlineGeo, outlineMat);
        outlineTube.renderOrder = 2;
        scene.add(outlineTube);

        // 3. Ethereal Soft Outer Aura (Bloom in Night, Subdued in Day)
        const auraGeo = new THREE.TubeGeometry(curve, 80, 0.44, 8, false);
        const auraMat = new THREE.MeshBasicMaterial({
            color: neonColor,
            side: THREE.BackSide,
            transparent: true,
            opacity: STATE.isDay ? 0.08 : 0.35
        });
        const auraMesh = new THREE.Mesh(auraGeo, auraMat);
        auraMesh.renderOrder = 1;
        scene.add(auraMesh);

        // 4. Flowing White-Hot Photon Energy Pulses
        const particles = [];
        const particleCount = spec.particleCount || 14;
        for (let i = 0; i < particleCount; i++) {
            const pGeo = new THREE.SphereGeometry(0.22, 10, 10);
            const pMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.renderOrder = 4;
            scene.add(pMesh);
            particles.push({
                mesh: pMesh,
                offset: i / particleCount
            });
        }

        // 5. Subtle Micro-Utility Cable Risers along Street Curbs
        const pylonGroup = new THREE.Group();
        if (spec.points.length > 2 && spec.id !== 'battery_bus') {
            spec.points.slice(1, -1).forEach(pt => {
                const pylon = new THREE.Group();
                pylon.position.set(pt.x, 0, pt.z);

                const mast = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.1, pt.y, 8),
                    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 })
                );
                mast.position.y = pt.y * 0.5;
                pylon.add(mast);

                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(0.24, 0.04, 8, 16),
                    new THREE.MeshBasicMaterial({ color: neonColor })
                );
                ring.rotation.y = Math.PI / 2;
                ring.position.y = pt.y;
                pylon.add(ring);

                pylonGroup.add(pylon);
            });
            scene.add(pylonGroup);
        }

        const lineObj = {
            spec: spec,
            curve: curve,
            coreTube: coreTube,
            outlineTube: outlineTube,
            tube: coreTube, // backward compatibility
            glow: outlineTube, // backward compatibility
            aura: auraMesh,
            particles: particles,
            pylons: pylonGroup,
            currentSpeed: spec.baseSpeed || 0.32,
            currentOpacity: 1.0,
            remove: function() {
                scene.remove(coreTube);
                scene.remove(outlineTube);
                scene.remove(auraMesh);
                scene.remove(pylonGroup);
                particles.forEach(p => scene.remove(p.mesh));
            }
        };

        animatedObjects.powerLines.push(lineObj);
        return lineObj;
    }

    function buildARPowerLines() {
        // Generation Sources -> Center (Solid Dark Core + Bright Neon Outline)
        createARPowerLine({
            id: 'wind_to_center',
            name: 'Wind Generation Inflow',
            coreColor: 0x064E3B,    // Solid Dark Emerald Core
            neonColor: 0x10B981,    // Bright Neon Emerald Outline
            color: 0x10B981,
            points: [
                new THREE.Vector3(-17.0, 0.6, -17.0),
                new THREE.Vector3(-11.0, 0.8, -11.0),
                new THREE.Vector3(-6.0, 0.9, -6.0),
                new THREE.Vector3(-3.5, 1.2, -3.5)
            ],
            particleCount: 14,
            baseSpeed: 0.32
        });

        createARPowerLine({
            id: 'solar_to_center',
            name: 'Solar Generation Inflow',
            coreColor: 0x78350F,    // Solid Dark Amber Core
            neonColor: 0xFBBF24,    // Bright Neon Gold Outline
            color: 0xFBBF24,
            points: [
                new THREE.Vector3(0, 0.6, -19.0),
                new THREE.Vector3(0, 0.8, -13.0),
                new THREE.Vector3(0, 0.9, -8.0),
                new THREE.Vector3(0, 1.2, -4.5)
            ],
            particleCount: 16,
            baseSpeed: 0.38,
            powersDownAtNight: true
        });

        createARPowerLine({
            id: 'hydro_to_center',
            name: 'Hydro Generation Inflow',
            coreColor: 0x0C4A6E,    // Solid Dark Blue Core
            neonColor: 0x0284C7,    // Bright Neon Blue Outline
            color: 0x0284C7,
            points: [
                new THREE.Vector3(17.0, 1.4, -17.0),
                new THREE.Vector3(11.0, 1.2, -11.0),
                new THREE.Vector3(6.0, 0.9, -6.0),
                new THREE.Vector3(3.5, 1.2, -3.5)
            ],
            particleCount: 14,
            baseSpeed: 0.34
        });

        createARPowerLine({
            id: 'battery_bus',
            name: 'BESS Heavy Power Busway',
            coreColor: 0x064E3B,    // Solid Dark Emerald Core
            neonColor: 0x10B981,    // Bright Neon Green Outline
            color: 0x10B981,
            points: [
                new THREE.Vector3(0, 0.4, 6.0),
                new THREE.Vector3(0, 0.6, 4.0),
                new THREE.Vector3(0, 0.8, 2.5)
            ],
            particleCount: 10,
            baseSpeed: 0.3
        });

        // Center -> Destination Qubit Nodes (Running along streets)
        STATE.qubitNodes.forEach(node => {
            wireARPowerLineForNode(node);
        });
    }

    function wireARPowerLineForNode(node) {
        if (node.powerLine) return;

        const startPt = new THREE.Vector3(
            node.position.x > 0 ? 3.5 : -3.5,
            1.2,
            node.position.z > 0 ? 3.5 : -0.5
        );
        const midPt1 = new THREE.Vector3(
            node.position.x * 0.45,
            0.6,
            node.position.z * 0.45
        );
        const midPt2 = new THREE.Vector3(
            node.position.x * 0.78,
            0.6,
            node.position.z * 0.78
        );
        const endPt = new THREE.Vector3(
            node.position.x,
            0.8,
            node.position.z
        );

        const pl = createARPowerLine({
            id: `line_${node.id}`,
            name: `${node.name} AR Conduit`,
            coreColor: node.coreColorHex,
            neonColor: node.neonColorHex || node.colorHex,
            color: node.neonColorHex || node.colorHex,
            qubitId: node.id,
            points: [startPt, midPt1, midPt2, endPt],
            particleCount: 14,
            baseSpeed: 0.35
        });

        node.powerLine = pl;
    }

    // =========================================================================
    // Precision Smart Zoom
    // =========================================================================
    function setupSmartZoom() {
        // Natural OrbitControls navigation handles standard mouse wheel zooming
        // without altering controls.target to buildings. Zoom/Fly-To is reserved strictly for UI cards.
    }

    // =========================================================================
    // Dynamic Day/Night Cycle & Theme Engine
    // =========================================================================
    function toggleTimeOfDay() {
        setTimeOfDay(!STATE.isDay);
    }

    function setTimeOfDay(isDay) {
        if (STATE.isDay === isDay && !STATE.isTransitioning) return;
        
        STATE.isDay = isDay;
        STATE.isTransitioning = true;
        STATE.transitionProgress = 0.0;
        STATE.transitionDirection = isDay ? 1 : -1;

        if (isDay) {
            document.body.classList.add('theme-light');
        } else {
            document.body.classList.remove('theme-light');
        }

        if (window.soundEngine) {
            window.soundEngine.playTransition(isDay);
        }

        showCinematicBanner(isDay);
        updateDayNightToggleBtn();
        recalculateMicrogridDispatch();
    }

    function showCinematicBanner(isDay) {
        const banner = document.getElementById('cinematic-banner');
        const icon = document.getElementById('banner-icon');
        const title = document.getElementById('banner-title');
        const desc = document.getElementById('banner-desc');

        banner.className = 'cinematic-banner visible ' + (isDay ? 'day-banner' : 'night-banner');
        if (isDay) {
            icon.textContent = '☀️';
            title.textContent = 'DAYTIME LIGHT THEME // REALISTIC GLOBAL SUNLIGHT';
            desc.textContent = 'Solar Farm Generating 35 kW | AR Power Overlays active along city streets.';
        } else {
            icon.textContent = '🌙';
            title.textContent = 'NIGHTTIME DARK THEME // STREETLIGHTS & INTERIORS ON';
            desc.textContent = 'Curfew active -> Power diverted intensely to Memorial Hospital (Qubit 0).';
            if (window.soundEngine) {
                setTimeout(() => window.soundEngine.playDivertAlert(), 1200);
            }
        }

        clearTimeout(banner._timeout);
        banner._timeout = setTimeout(() => {
            banner.classList.remove('visible');
        }, 4500);
    }

    function updateDayNightToggleBtn() {
        const btn = document.getElementById('day-night-btn');
        const text = document.getElementById('day-night-text');
        const icon = document.getElementById('day-night-icon');

        if (STATE.isDay) {
            btn.classList.add('day-mode');
            icon.textContent = '☀️';
            text.textContent = 'DAY MODE (LIGHT)';
        } else {
            btn.classList.remove('day-mode');
            icon.textContent = '🌙';
            text.textContent = 'NIGHT MODE (DARK)';
        }
    }

    // =========================================================================
    // Microgrid Power Routing & QAOA Optimization Engine
    // =========================================================================
    function isNodeActiveAtTime(workingHoursStr, isDayTime, nodeId) {
        // Residential infrastructure operates continuously (maintains 24/7 baseline power)
        if (nodeId === 'houses' || (workingHoursStr && workingHoursStr.toLowerCase().includes('residential'))) {
            return true;
        }
        if (!workingHoursStr) return true;
        const str = workingHoursStr.trim().toLowerCase();
        if (str.includes('24/7') || str.includes('continuous') || str.includes('all-day')) {
            return true;
        }

        const match = str.match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
        if (match) {
            const startH = parseInt(match[1], 10);
            const endH = parseInt(match[3], 10);
            const currentSimHour = isDayTime ? 12 : 22;

            if (startH <= endH) {
                return currentSimHour >= startH && currentSimHour < endH;
            } else {
                return currentSimHour >= startH || currentSimHour < endH;
            }
        }

        if (str.includes('night') || str.includes('peak')) return !isDayTime;
        if (str.includes('day')) return isDayTime;
        return true;
    }

    function recalculateMicrogridDispatch() {
        const solarGen = STATE.isDay ? 35.0 : 0.0;
        const windGen = STATE.isDay ? 15.0 : 20.0;
        const hydroGen = 25.0;
        const totalRenewable = solarGen + windGen + hydroGen;

        // 1. Determine active online nodes
        let totalActiveDemand = 0;
        STATE.qubitNodes.forEach(node => {
            node.isOnline = isNodeActiveAtTime(node.workingHours, STATE.isDay, node.id);
            if (node.isOnline) {
                totalActiveDemand += parseFloat(node.requiredPower) || 0;
            }
        });

        // 2. Battery Storage Dispatch
        const maxBatteryDischarge = 35.0;
        let availablePower = totalRenewable;
        let batteryFlow = 0;

        if (totalActiveDemand > availablePower) {
            const deficit = totalActiveDemand - availablePower;
            const discharge = Math.min(deficit, maxBatteryDischarge);
            availablePower += discharge;
            batteryFlow = discharge;
        } else {
            const surplus = availablePower - totalActiveDemand;
            const charge = Math.min(surplus, 20.0);
            batteryFlow = -charge;
        }

        // 3. Power Allocation Rules:
        // Rule A: If Total Generation >= Total Demand, all active qubits receive 100% requested power
        // Rule B: If Demand > Generation, Qubit 3 (Residential) drops to a guaranteed "Baseline Allocation" (4.0 kW / 10.0 kW) before ever hitting zero
        if (availablePower >= totalActiveDemand) {
            STATE.qubitNodes.forEach(node => {
                if (!node.isOnline) {
                    node.allocatedPower = 0.0;
                    node.isBaseline = false;
                } else {
                    node.allocatedPower = parseFloat(node.requiredPower) || 0;
                    node.isBaseline = false;
                }
            });
        } else {
            // Deficit Allocation: Reserve baseline power for Residential (Q3)
            const residentialNode = STATE.qubitNodes.find(n => n.id === 'houses' || n.category === 'residential');
            let reservedBaseline = 0;
            if (residentialNode && residentialNode.isOnline) {
                const req = parseFloat(residentialNode.requiredPower) || 10.0;
                reservedBaseline = Math.min(req, 4.0);
            }

            let poolForPriority = Math.max(0, availablePower - reservedBaseline);
            const sortedNodes = [...STATE.qubitNodes].sort((a, b) => (b.weight || 0) - (a.weight || 0));

            sortedNodes.forEach(node => {
                if (!node.isOnline) {
                    node.allocatedPower = 0.0;
                    node.isBaseline = false;
                    return;
                }

                if (node.id === 'houses' || node.category === 'residential') {
                    // Residential will receive reserved baseline + leftover surplus
                    return;
                }

                const req = parseFloat(node.requiredPower) || 0;
                if (poolForPriority >= req) {
                    node.allocatedPower = req;
                    poolForPriority -= req;
                    node.isBaseline = false;
                } else {
                    node.allocatedPower = Math.max(0, poolForPriority);
                    poolForPriority = 0;
                    node.isBaseline = node.allocatedPower > 0;
                }
            });

            if (residentialNode && residentialNode.isOnline) {
                const req = parseFloat(residentialNode.requiredPower) || 10.0;
                const totalGiven = Math.min(req, reservedBaseline + poolForPriority);
                residentialNode.allocatedPower = Math.max(reservedBaseline, totalGiven);
                residentialNode.isBaseline = residentialNode.allocatedPower < (req - 0.05);
            }
        }

        // Visually update all AR power lines
        STATE.qubitNodes.forEach(node => {
            updateARPowerLineVisual(node);
        });

        const solarLine = animatedObjects.powerLines.find(pl => pl.spec.id === 'solar_to_center');
        if (solarLine) {
            solarLine.currentOpacity = STATE.isDay ? 1.0 : 0.2;
            if (solarLine.coreTube) solarLine.coreTube.material.opacity = solarLine.currentOpacity;
            if (solarLine.outlineTube) solarLine.outlineTube.material.opacity = solarLine.currentOpacity * 0.9;
            if (solarLine.aura) solarLine.aura.material.opacity = STATE.isDay ? 0.08 : 0.0;
            solarLine.particles.forEach(p => p.mesh.visible = STATE.isDay);
        }

        updateDispatchMetricsUI(solarGen, windGen, hydroGen, batteryFlow, totalActiveDemand);
    }

    function updateARPowerLineVisual(node) {
        if (!node.powerLine) return;
        const pl = node.powerLine;
        const isOnline = node.isOnline && node.allocatedPower > 0;
        const reqPower = parseFloat(node.requiredPower) || 10.0;

        const activeCoreColor = node.coreColorHex !== undefined ? node.coreColorHex : (node.colorHex ? darkenColorHex(node.colorHex, 0.28) : 0x1C2027);
        const activeNeonColor = node.neonColorHex || node.colorHex;

        if (!isOnline) {
            // Powered down state (e.g. School outside working hours at night)
            if (pl.coreTube) {
                pl.coreTube.material.color.setHex(0x1C2027);
                pl.coreTube.material.opacity = 0.35;
            }
            if (pl.outlineTube) {
                pl.outlineTube.material.color.setHex(0x334155);
                pl.outlineTube.material.opacity = 0.25;
            }
            if (pl.aura) {
                pl.aura.material.opacity = 0.0;
            }
            pl.currentSpeed = 0.0;
            pl.particles.forEach(p => p.mesh.visible = false);
        } else {
            // Fully energized routing state: Solid dark core + bright neon outline!
            const powerRatio = Math.min(2.0, Math.max(0.5, node.allocatedPower / 20.0));
            if (pl.coreTube) {
                pl.coreTube.material.color.setHex(activeCoreColor);
                pl.coreTube.material.opacity = 1.0;
            }
            if (pl.outlineTube) {
                pl.outlineTube.material.color.setHex(activeNeonColor);
                pl.outlineTube.material.opacity = 0.95;
            }
            if (pl.aura) {
                pl.aura.material.color.setHex(activeNeonColor);
                pl.aura.material.opacity = STATE.isDay ? 0.08 : 0.35;
            }

            pl.currentSpeed = pl.spec.baseSpeed * (0.8 + powerRatio * 0.5);

            const thicknessScale = Math.min(2.0, Math.max(0.75, Math.sqrt(reqPower / 20.0)));
            if (pl.coreTube) pl.coreTube.scale.set(thicknessScale, thicknessScale, 1);
            if (pl.outlineTube) pl.outlineTube.scale.set(thicknessScale, thicknessScale, 1);
            if (pl.aura) pl.aura.scale.set(thicknessScale, thicknessScale, 1);

            pl.particles.forEach(p => {
                p.mesh.visible = true;
                const pScale = 0.8 + powerRatio * 0.4;
                p.mesh.scale.set(pScale, pScale, pScale);
            });
        }
    }

    function updateDispatchMetricsUI(solarGen, windGen, hydroGen, batteryFlow, totalActiveDemand) {
        if (solarGen === undefined) {
            solarGen = STATE.isDay ? 35.0 : 0.0;
            windGen = STATE.isDay ? 15.0 : 20.0;
            hydroGen = 25.0;
            batteryFlow = STATE.isDay ? -15.0 : 25.0;
            totalActiveDemand = STATE.qubitNodes.reduce((acc, n) => acc + (n.isOnline ? parseFloat(n.requiredPower) : 0), 0);
        }

        const totalGen = solarGen + windGen + hydroGen + Math.max(0, batteryFlow);

        document.getElementById('metric-total-gen').textContent = totalGen.toFixed(1) + ' kW';
        document.getElementById('metric-total-load').textContent = totalActiveDemand.toFixed(1) + ' kW';
        
        document.getElementById('val-solar').textContent = solarGen.toFixed(1) + ' kW';
        document.getElementById('val-wind').textContent = windGen.toFixed(1) + ' kW';
        document.getElementById('val-hydro').textContent = hydroGen.toFixed(1) + ' kW';
        document.getElementById('val-battery').textContent = (batteryFlow > 0 ? '+' : '') + batteryFlow.toFixed(1) + ' kW (' + (batteryFlow > 0 ? 'Discharging' : 'Charging') + ')';

        const ratio = totalGen > 0 ? Math.min(100, Math.round((totalActiveDemand / totalGen) * 100)) : 100;
        const pFill = document.getElementById('progress-gen-load');
        if (pFill) pFill.style.width = ratio + '%';

        renderQuantumRegisterHUD();
    }

    function renderQuantumRegisterHUD() {
        const grid = document.getElementById('qubit-register-grid');
        if (!grid) return;

        grid.innerHTML = '';

        let vectorStr = '|';
        STATE.qubitNodes.forEach(node => {
            const req = parseFloat(node.requiredPower) || 0;
            const allocated = parseFloat(node.allocatedPower) || 0;
            const isFullPower = allocated >= (req - 0.05) && allocated > 0;
            const isBaseline = !isFullPower && allocated > 0;
            const isEnergized = node.isOnline && allocated > 0;
            const isFocused = STATE.focusedQubitId === node.id;

            let stateSymbol = '0';
            let stateTagText = '|0⟩ CURFEW';
            let stateTagClass = 'curfew';

            if (isFullPower) {
                stateSymbol = '1';
                stateTagText = '|1⟩ ACTIVE';
                stateTagClass = 'active';
            } else if (isBaseline) {
                stateSymbol = 'ψ';
                stateTagText = '|ψ⟩ BASELINE';
                stateTagClass = 'baseline';
            }

            vectorStr += stateSymbol + ' ';

            // Fulfillment Metric Determinations based on active routing logic
            let fulfillmentClass = 'fulfillment-cut';
            let fulfillmentStatusText = 'Power Cut / Requirement Not Met';
            let fulfillmentIcon = '🔴';

            if (isFullPower) {
                fulfillmentClass = 'fulfillment-met';
                fulfillmentStatusText = '100% Requirement Met';
                fulfillmentIcon = '🟢';
            } else if (isBaseline) {
                fulfillmentClass = 'fulfillment-partial';
                fulfillmentStatusText = 'Baseline Power Supplied';
                fulfillmentIcon = '🟡';
            }

            const fulfillmentPercent = req > 0 ? Math.min(100, Math.round((allocated / req) * 100)) : 0;

            const card = document.createElement('div');
            const nodeClass = node.id === 'hospital' ? 'q0' : (node.id === 'school' ? 'q1' : (node.id === 'commercial' ? 'q2' : (node.id === 'houses' ? 'q3' : 'q0')));
            card.className = `qubit-card ${nodeClass} ${isEnergized ? '' : 'offline'} ${isBaseline ? 'baseline-card' : ''} ${isFocused ? 'card-expanded' : ''}`;
            card.style.cursor = 'pointer';
            card.title = isFocused ? 'Click to re-focus camera' : 'Click to focus 3D camera & expand fulfillment metrics';
            if (node.isCustom) {
                card.style.borderLeft = `3px solid ${hexStr}`;
            }

            const colorCode = STATE.isDay ? (node.lightColorHex || node.colorHex) : node.colorHex;
            const hexStr = '#' + colorCode.toString(16).padStart(6, '0');

            const powerDisplay = isBaseline
                ? `${allocated.toFixed(1)} kW / ${req.toFixed(1)} kW (Baseline)`
                : `${allocated.toFixed(1)} kW / ${req.toFixed(1)} kW`;

            const displayName = node.name.length > 22 ? node.name.slice(0, 22).toUpperCase() + '…' : node.name.toUpperCase();

            let cardContent = `
                <div class="qubit-top">
                    <span class="qubit-id" style="color: ${hexStr};">Q${node.qubitIndex}: ${displayName}</span>
                    <span class="qubit-state-tag ${stateTagClass}">${stateTagText}</span>
                </div>
                <div class="qubit-target">${node.category.toUpperCase()} • ${node.priority} Priority</div>
                <div class="qubit-kw">${powerDisplay}</div>
            `;

            // Expand data when card is clicked and camera focuses on building
            if (isFocused) {
                cardContent += `
                    <div class="qubit-fulfillment-panel">
                        <div class="fulfillment-header">
                            <span class="fulfillment-title">POWER FULFILLMENT</span>
                            <span class="fulfillment-status-badge ${fulfillmentClass}">${fulfillmentPercent}% MET</span>
                        </div>
                        
                        <div class="fulfillment-bar-bg">
                            <div class="fulfillment-bar-fill ${fulfillmentClass}" style="width: ${fulfillmentPercent}%;"></div>
                        </div>

                        <div class="fulfillment-metrics-grid">
                            <div class="metric-row">
                                <span class="m-label">Required Power:</span>
                                <span class="m-val">${req.toFixed(1)} kW</span>
                            </div>
                            <div class="metric-row">
                                <span class="m-label">Supplied Power:</span>
                                <span class="m-val ${fulfillmentClass}">${allocated.toFixed(1)} kW</span>
                            </div>
                            <div class="metric-row status-highlight">
                                <span class="m-label">Status:</span>
                                <span class="m-status-text ${fulfillmentClass}">${fulfillmentIcon} ${fulfillmentStatusText}</span>
                            </div>
                        </div>

                        <div class="card-action-row">
                            <button class="card-edit-btn" onclick="event.stopPropagation(); window.openQubitEditModalById('${node.id}');">
                                <span>⚙️</span> Edit Parameters
                            </button>
                            <button class="card-reset-btn" onclick="event.stopPropagation(); window.resetCameraView();">
                                <span>↩️</span> Reset View
                            </button>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = cardContent;

            // Clicking card triggers cinematic camera focus, outline highlight, and expansion
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                STATE.focusedQubitId = node.id;
                applyBuildingSelectionOutline(node);
                flyCameraToNode(node);
                renderQuantumRegisterHUD();
            });

            grid.appendChild(card);
        });

        vectorStr = vectorStr.trim() + '⟩';
        const vDisplay = document.getElementById('qubit-vector-display');
        if (vDisplay) vDisplay.textContent = `State: ${vectorStr}`;
    }

    window.openQubitEditModalById = function (nodeId) {
        const node = STATE.qubitNodes.find(n => n.id === nodeId);
        if (node) {
            applyBuildingSelectionOutline(node);
            openQubitEditModal(node);
        }
    };

    // =========================================================================
    // Global Modal Control Functions (Reliable Dismissal & Canvas Restoration)
    // =========================================================================
    window.closeQubitEditModal = function (e) {
        if (e) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
        }
        const modal = document.getElementById('qubit-edit-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        STATE.activeEditingNode = null;
        clearBuildingSelectionOutline();
        if (controls) controls.enabled = true;
    };

    window.closeAddQubitModal = function (e) {
        if (e) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
        }
        const modal = document.getElementById('add-qubit-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        if (controls) controls.enabled = true;
    };

    window.closeDashboardModal = function (e) {
        if (e) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
        }
        const modal = document.getElementById('dashboard-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        if (controls) controls.enabled = true;
    };

    // =========================================================================
    // 3D Building Selection Outline & Emissive Highlight System
    // =========================================================================
    function clearBuildingSelectionOutline() {
        if (animatedObjects.selectionOutline) {
            const { group } = animatedObjects.selectionOutline;
            if (group && group.parent) {
                group.parent.remove(group);
            }
            animatedObjects.selectionOutline = null;
        }

        if (STATE.selectedBuildingNode && STATE.selectedBuildingNode.meshGroup) {
            STATE.selectedBuildingNode.meshGroup.traverse(child => {
                if (child.isMesh && child.material && child.userData.origEmissive) {
                    child.material.emissive.copy(child.userData.origEmissive);
                    child.material.emissiveIntensity = child.userData.origEmissiveIntensity;
                    delete child.userData.origEmissive;
                    delete child.userData.origEmissiveIntensity;
                }
            });
        }
        STATE.selectedBuildingNode = null;
    }

    function applyBuildingSelectionOutline(node) {
        clearBuildingSelectionOutline();
        if (!node || !node.meshGroup) return;

        STATE.selectedBuildingNode = node;
        const group = new THREE.Group();
        group.name = 'building_selection_outline';

        const neonColor = node.neonColorHex || (node.id === 'hospital' ? 0xFF1744 : (node.id === 'school' ? 0xFF7700 : (node.id === 'commercial' ? 0x00F0FF : 0x38BDF8)));

        // 1. Determine bounding dimensions from hitMesh or meshGroup
        let bWidth = 12, bHeight = 8, bDepth = 12;
        let bCenter = new THREE.Vector3(0, 4, 0);

        if (node.hitMesh && node.hitMesh.geometry) {
            const geo = node.hitMesh.geometry;
            if (geo.parameters) {
                bWidth = (geo.parameters.width || (geo.parameters.radiusTop ? geo.parameters.radiusTop * 2 : 12)) + 0.8;
                bHeight = (geo.parameters.height || 8) + 0.8;
                bDepth = (geo.parameters.depth || (geo.parameters.radiusBottom ? geo.parameters.radiusBottom * 2 : 12)) + 0.8;
            }
            bCenter.copy(node.hitMesh.position);
        } else {
            const box = new THREE.Box3().setFromObject(node.meshGroup);
            const size = new THREE.Vector3();
            box.getSize(size);
            bWidth = size.x + 0.8;
            bHeight = size.y + 0.8;
            bDepth = size.z + 0.8;
            box.getCenter(bCenter);
            bCenter.sub(node.meshGroup.position);
        }

        // 2. Crisp, Bright Glowing Edges (Emissive Stroke)
        const boxGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({
            color: neonColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.95
        });
        const edgeLines = new THREE.LineSegments(edgesGeo, lineMat);
        edgeLines.position.copy(bCenter);
        group.add(edgeLines);

        // 3. Holographic Semi-Transparent Wireframe Cage with Bloom Additive Blending
        const cageMat = new THREE.MeshBasicMaterial({
            color: neonColor,
            wireframe: true,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const cageMesh = new THREE.Mesh(boxGeo, cageMat);
        cageMesh.position.copy(bCenter);
        group.add(cageMesh);

        // 4. Glowing Sci-Fi Corner Brackets (Thick Emissive Tubes along the 8 Corners)
        const bracketLen = Math.min(bWidth, bDepth, bHeight) * 0.22;
        const bracketRadius = 0.12;
        const bracketMat = new THREE.MeshBasicMaterial({
            color: neonColor,
            transparent: true,
            opacity: 1.0
        });

        const hw = bWidth / 2;
        const hh = bHeight / 2;
        const hd = bDepth / 2;

        const corners = [
            [hw, hh, hd], [-hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd],
            [hw, -hh, hd], [-hw, -hh, hd], [hw, -hh, -hd], [-hw, -hh, -hd]
        ];

        corners.forEach(([cx, cy, cz]) => {
            const sx = cx > 0 ? -1 : 1;
            const sy = cy > 0 ? -1 : 1;
            const sz = cz > 0 ? -1 : 1;

            const armX = new THREE.Mesh(new THREE.CylinderGeometry(bracketRadius, bracketRadius, bracketLen, 8), bracketMat);
            armX.rotation.z = Math.PI / 2;
            armX.position.set(cx + (sx * bracketLen / 2), cy, cz);
            armX.position.add(bCenter);
            group.add(armX);

            const armY = new THREE.Mesh(new THREE.CylinderGeometry(bracketRadius, bracketRadius, bracketLen, 8), bracketMat);
            armY.position.set(cx, cy + (sy * bracketLen / 2), cz);
            armY.position.add(bCenter);
            group.add(armY);

            const armZ = new THREE.Mesh(new THREE.CylinderGeometry(bracketRadius, bracketRadius, bracketLen, 8), bracketMat);
            armZ.rotation.x = Math.PI / 2;
            armZ.position.set(cx, cy, cz + (sz * bracketLen / 2));
            armZ.position.add(bCenter);
            group.add(armZ);
        });

        // 5. Glowing Ground Projection Reticle / Ring
        const groundRadius = Math.max(bWidth, bDepth) * 0.72;
        const groundRingGeo = new THREE.RingGeometry(groundRadius - 0.4, groundRadius + 0.4, 48);
        const groundRingMat = new THREE.MeshBasicMaterial({
            color: neonColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
        groundRing.rotation.x = -Math.PI / 2;
        groundRing.position.set(bCenter.x, 0.08, bCenter.z);
        group.add(groundRing);

        const innerRingGeo = new THREE.RingGeometry(groundRadius * 0.45, groundRadius * 0.48, 32);
        const innerRingMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.set(bCenter.x, 0.09, bCenter.z);
        group.add(innerRing);

        // 6. Architectural Mesh Emissive Glow Boost
        node.meshGroup.traverse(child => {
            if (child.isMesh && child !== node.hitMesh && child.material) {
                if (child.material.emissive) {
                    if (!child.userData.origEmissive) {
                        child.userData.origEmissive = child.material.emissive.clone();
                        child.userData.origEmissiveIntensity = child.material.emissiveIntensity;
                    }
                    child.material.emissive.setHex(neonColor);
                    child.material.emissiveIntensity = 0.45;
                }
            }
        });

        node.meshGroup.add(group);
        animatedObjects.selectionOutline = {
            group: group,
            groundRing: groundRing,
            innerRing: innerRing,
            cageMesh: cageMesh
        };
    }

    // =========================================================================
    // Qubit Customization / Click-to-Edit Modal
    // =========================================================================
    function openQubitEditModal(node) {
        STATE.activeEditingNode = node;
        
        document.getElementById('modal-node-title').textContent = `Configure Qubit ${node.qubitIndex}: ${node.name}`;
        document.getElementById('edit-node-name').value = node.name;
        document.getElementById('edit-node-priority').value = node.priority;
        document.getElementById('edit-node-power-input').value = node.requiredPower;
        document.getElementById('edit-node-power-slider').value = Math.min(100, Math.max(5, node.requiredPower));
        document.getElementById('edit-power-val-label').textContent = `${parseFloat(node.requiredPower).toFixed(1)} kW`;
        document.getElementById('edit-node-hours').value = node.workingHours;
        document.getElementById('modal-qubit-id').textContent = `QUBIT ${node.qubitIndex}`;

        const req = parseFloat(node.requiredPower) || 0;
        const isFullPower = node.allocatedPower >= (req - 0.05);
        const isBaseline = node.isBaseline || (node.allocatedPower > 0 && !isFullPower);

        if (isFullPower) {
            document.getElementById('modal-dispatch-status').textContent = `⚡ Status: ${node.allocatedPower.toFixed(1)} kW (100% Demand Met)`;
        } else if (isBaseline) {
            document.getElementById('modal-dispatch-status').textContent = `⚡ Status: ${node.allocatedPower.toFixed(1)} kW / ${req.toFixed(1)} kW (Guaranteed Baseline Allocation)`;
        } else {
            document.getElementById('modal-dispatch-status').textContent = `🌙 Status: Outside Working Hours (Power Diverted)`;
        }

        const delBtn = document.getElementById('btn-delete-node');
        delBtn.style.display = node.isCustom ? 'flex' : 'none';

        if (window.soundEngine) window.soundEngine.playHover();
        const modal = document.getElementById('qubit-edit-modal');
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    function saveQubitEdit() {
        const node = STATE.activeEditingNode;
        if (!node) return;

        const newName = document.getElementById('edit-node-name').value.trim();
        const newPriority = document.getElementById('edit-node-priority').value;
        const newPower = parseFloat(document.getElementById('edit-node-power-input').value) || 10.0;
        const newHours = document.getElementById('edit-node-hours').value.trim() || '24/7';

        node.name = newName || node.name;
        node.priority = newPriority;
        node.requiredPower = newPower;
        node.workingHours = newHours;

        const weightMap = { 'Very High': 100, 'High': 50, 'Medium': 30, 'Low': 10 };
        node.weight = weightMap[newPriority] || 20;

        recalculateMicrogridDispatch();

        if (window.soundEngine) window.soundEngine.playQuantumClick();
        window.closeQubitEditModal();

        showTemporaryToast(`⚡ Updated ${node.name}: ${newPower.toFixed(1)} kW (${newHours})`);
    }

    function deleteActiveQubit() {
        const node = STATE.activeEditingNode;
        if (!node || !node.isCustom) return;

        if (node.powerLine) {
            node.powerLine.remove();
            const plIdx = animatedObjects.powerLines.indexOf(node.powerLine);
            if (plIdx > -1) animatedObjects.powerLines.splice(plIdx, 1);
        }

        if (node.meshGroup) {
            scene.remove(node.meshGroup);
        }

        if (node.hitMesh) {
            const hIdx = interactiveMeshes.indexOf(node.hitMesh);
            if (hIdx > -1) interactiveMeshes.splice(hIdx, 1);
        }

        const slot = AVAILABLE_SPAWN_SLOTS.find(s => s.pos.distanceTo(node.position) < 2.0);
        if (slot) slot.used = false;

        const nIdx = STATE.qubitNodes.indexOf(node);
        if (nIdx > -1) STATE.qubitNodes.splice(nIdx, 1);

        window.closeQubitEditModal();
        recalculateMicrogridDispatch();

        showTemporaryToast(`🗑️ Removed ${node.name} from microgrid.`);
    }

    // =========================================================================
    // Dynamic Qubit Addition ("+ Add Qubit")
    // =========================================================================
    function openAddQubitModal() {
        if (window.soundEngine) window.soundEngine.playHover();
        const modal = document.getElementById('add-qubit-modal');
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    function confirmAddQubit() {
        const name = document.getElementById('add-node-name').value.trim() || 'Custom Facility';
        const power = parseFloat(document.getElementById('add-node-power').value) || 20.0;
        const hours = document.getElementById('add-node-hours').value.trim() || '24/7';
        const priority = document.getElementById('add-node-priority').value;

        const availableSlot = AVAILABLE_SPAWN_SLOTS.find(s => !s.used);
        if (!availableSlot) {
            alert('All available microgrid construction slots on the island are currently occupied!');
            return;
        }
        availableSlot.used = true;

        const weightMap = { 'Very High': 100, 'High': 50, 'Medium': 30, 'Low': 10 };
        const newIndex = STATE.qubitNodes.length;

        const palette = [
            { core: 0x4C1D95, neon: 0xA855F7 }, // Purple
            { core: 0x064E3B, neon: 0x10B981 }, // Emerald Green
            { core: 0x78350F, neon: 0xF59E0B }, // Amber
            { core: 0x831843, neon: 0xEC4899 }  // Pink
        ];
        const colorPair = palette[newIndex % palette.length];

        const newNode = {
            id: `qubit_${Date.now()}`,
            qubitIndex: newIndex,
            name: name,
            category: STATE.selectedAddTemplate,
            priority: priority,
            weight: weightMap[priority] || 30,
            requiredPower: power,
            workingHours: hours,
            coreColorHex: colorPair.core,
            neonColorHex: colorPair.neon,
            colorHex: colorPair.neon,
            lightColorHex: colorPair.neon,
            allocatedPower: power,
            isOnline: true,
            position: availableSlot.pos.clone(),
            meshGroup: null,
            hitMesh: null,
            powerLine: null,
            isCustom: true
        };

        const buildingGroup = buildRealisticDynamicNodeMesh(STATE.selectedAddTemplate, newNode.position);
        newNode.meshGroup = buildingGroup;

        const hitMesh = buildingGroup.userData.hitMesh;
        hitMesh.userData = {
            interactiveId: newNode.id,
            qubitId: newNode.id,
            isQubitNode: true
        };
        newNode.hitMesh = hitMesh;
        interactiveMeshes.push(hitMesh);

        wireARPowerLineForNode(newNode);
        STATE.qubitNodes.push(newNode);

        window.closeAddQubitModal();
        recalculateMicrogridDispatch();

        if (window.soundEngine) window.soundEngine.playQuantumClick();
        animateCameraToFocus(newNode.position);

        showTemporaryToast(`⚡ Deployed ${newNode.name} as Qubit ${newNode.qubitIndex} (${power.toFixed(1)} kW)`);
    }

    function buildRealisticDynamicNodeMesh(templateKey, position) {
        const group = new THREE.Group();
        group.position.copy(position);

        const fdn = new THREE.Mesh(
            new THREE.CylinderGeometry(3.6, 4.0, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0xCBD5E1, map: textures.concrete, roughness: 0.8 })
        );
        fdn.position.y = 0.2;
        group.add(fdn);

        if (templateKey === 'factory') {
            // Industrial Sawtooth Factory with Brick & Metal
            const mainBody = new THREE.Mesh(
                new THREE.BoxGeometry(5.5, 3.2, 4.2),
                new THREE.MeshStandardMaterial({ map: textures.brick, roughness: 0.85 })
            );
            mainBody.position.y = 1.8;
            mainBody.castShadow = true;
            group.add(mainBody);

            const roof1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 4), new THREE.MeshStandardMaterial({ map: textures.roof }));
            roof1.position.set(-1.4, 3.8, 0);
            roof1.rotation.y = Math.PI / 4;
            const roof2 = roof1.clone();
            roof2.position.x = 1.4;
            group.add(roof1);
            group.add(roof2);

            const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8), new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.8 }));
            stack.position.set(2.2, 3.2, 1.2);
            group.add(stack);
        } else if (templateKey === 'datacenter') {
            // High-Tech AI Compute Data Center Block
            const serverBlock = new THREE.Mesh(
                new THREE.BoxGeometry(4.8, 5.0, 4.8),
                new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.75, roughness: 0.2 })
            );
            serverBlock.position.y = 2.7;
            serverBlock.castShadow = true;
            group.add(serverBlock);

            for (let i = 0; i < 4; i++) {
                const strip = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 4.2, 0.35),
                    new THREE.MeshBasicMaterial({ color: 0x00F0FF })
                );
                strip.position.set(-1.8 + i * 1.2, 2.7, 2.45);
                group.add(strip);
            }
        } else if (templateKey === 'evhub') {
            // Modern Canopied EV Fast-Charging Hub
            const canopy = new THREE.Mesh(
                new THREE.BoxGeometry(6.5, 0.3, 4.5),
                new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.8, roughness: 0.2 })
            );
            canopy.position.y = 3.6;
            group.add(canopy);

            const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.4, 8), new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8 }));
            pillar1.position.set(-2.5, 1.7, 0);
            const pillar2 = pillar1.clone();
            pillar2.position.x = 2.5;
            group.add(pillar1);
            group.add(pillar2);

            for (let i = 0; i < 3; i++) {
                const charger = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
                charger.position.set(-1.8 + i * 1.8, 0.95, 0);
                const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x10B981 }));
                led.position.set(-1.8 + i * 1.8, 1.1, 0.28);
                group.add(charger);
                group.add(led);
            }
        } else if (templateKey === 'water') {
            // Water Treatment Tanks & Facility
            const tank1 = new THREE.Mesh(
                new THREE.CylinderGeometry(1.6, 1.6, 3.2, 24),
                new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.7, roughness: 0.3 })
            );
            tank1.position.set(-1.4, 1.8, 0);
            const tank2 = tank1.clone();
            tank2.position.x = 1.4;
            group.add(tank1);
            group.add(tank2);
        } else {
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(4.4, 4.0, 4.4),
                new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.7, roughness: 0.3 })
            );
            cube.position.y = 2.2;
            group.add(cube);
        }

        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(7, 6, 7),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 3;
        group.add(hitMesh);
        group.userData.hitMesh = hitMesh;

        scene.add(group);
        return group;
    }

    // =========================================================================
    // Raycasting & Interaction
    // =========================================================================
    let mouseDownPos = { x: 0, y: 0 };
    let isMouseDragging = false;

    function setupEventListeners() {
        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('click', onMouseClick, false);
        window.addEventListener('dblclick', onMouseDoubleClick, false);
    }

    function onMouseDown(event) {
        mouseDownPos.x = event.clientX;
        mouseDownPos.y = event.clientY;
        isMouseDragging = false;
    }

    function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        composer.setSize(width, height);
    }

    function onMouseMove(event) {
        screenMouse.x = event.clientX;
        screenMouse.y = event.clientY;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y) > 6) {
            isMouseDragging = true;
        }
    }

    function updateRaycastHover() {
        // Disabled per specification: no tooltip popups or text panels trigger on cursor hover
        const tooltip = document.getElementById('hud-tooltip');
        if (tooltip && tooltip.classList.contains('visible')) {
            tooltip.classList.remove('visible');
            tooltip.style.display = 'none';
        }
    }

    function renderTooltipContent(data) {
        const tooltip = document.getElementById('hud-tooltip');
        const title = document.getElementById('tt-title');
        const badge = document.getElementById('tt-badge');
        const typeVal = document.getElementById('tt-type-val');
        const timingVal = document.getElementById('tt-timing-val');
        const powerVal = document.getElementById('tt-power-val');
        const clickHint = document.getElementById('tt-click-hint');

        tooltip.className = 'interactive-ui visible';

        if (data.isCenterHub) {
            tooltip.classList.add('center-hub');
            badge.className = 'tooltip-badge';
            badge.style.background = 'rgba(0, 240, 255, 0.2)';
            badge.style.color = '#00F0FF';
            badge.textContent = 'Quantum Optimization Engine';
            title.textContent = 'Microgrid Control Center';
            typeVal.textContent = 'QPU Master Dispatcher';
            timingVal.textContent = '24/7 Coherent Operation';

            const totalGen = STATE.qubitNodes.reduce((acc, n) => acc + (n.isOnline ? n.allocatedPower : 0), 0);
            const activeCount = STATE.qubitNodes.filter(n => n.isOnline).length;
            powerVal.innerHTML = `Active Load: <strong>${totalGen.toFixed(1)} kW</strong><br>` +
                                 `Supplying <strong>${activeCount} of ${STATE.qubitNodes.length} Qubits</strong>`;
            clickHint.textContent = '⚡ DOUBLE-CLICK TO LAUNCH QUANTUM SIMULATION DASHBOARD';
            clickHint.style.display = 'block';
            return;
        }

        const node = STATE.qubitNodes.find(n => n.id === data.interactiveId || n.id === data.qubitId);
        if (node) {
            title.textContent = node.name;
            badge.className = `tooltip-badge ${node.id === 'hospital' ? 'red' : (node.id === 'school' ? 'orange' : 'blue')}`;
            badge.textContent = `Qubit ${node.qubitIndex} | ${node.priority} Priority`;
            typeVal.textContent = `${node.category.toUpperCase()} INFRASTRUCTURE`;
            timingVal.textContent = node.workingHours;
            
            const isOnline = node.isOnline && node.allocatedPower > 0;
            powerVal.innerHTML = `Demanded: <strong>${parseFloat(node.requiredPower).toFixed(1)} kW</strong><br>` +
                                 `Allocated: <span style="color: ${isOnline ? '#10B981' : '#EF4444'}; font-weight:700;">${node.allocatedPower.toFixed(1)} kW (${isOnline ? 'Active' : 'Curfew Diverted'})</span>`;
            
            clickHint.textContent = '⚡ DOUBLE-CLICK TO CONFIGURE PROPERTIES';
            clickHint.style.display = 'block';
            return;
        }

        title.textContent = data.name;
        badge.className = 'tooltip-badge';
        badge.textContent = 'Grid Resource';
        typeVal.textContent = data.type;
        timingVal.textContent = data.timing;
        powerVal.textContent = data.blackoutPower || data.type;
        clickHint.style.display = 'none';
    }

    function onMouseClick(event) {
        // If mouse moved more than drag threshold, it was an orbit/pan drag - do not trigger click actions
        if (isMouseDragging || Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y) > 6) {
            return;
        }

        if (event.target.closest('#ui-overlay') && !event.target.closest('#canvas-container')) {
            return;
        }

        // Single clicks on the canvas are reserved purely for camera navigation / orbiting without opening modals or launching simulator
    }

    function onMouseDoubleClick(event) {
        if (event.target.closest('#ui-overlay') && !event.target.closest('#canvas-container')) {
            return;
        }

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const data = hit.userData;

            if (data.isCenterHub) {
                triggerCenterHubClick();
                return;
            }

            const node = STATE.qubitNodes.find(n => n.id === data.interactiveId || n.id === data.qubitId);
            if (node) {
                applyBuildingSelectionOutline(node);
                openQubitEditModal(node);
            }
        }
    }

    function triggerCenterHubClick() {
        if (window.soundEngine) window.soundEngine.playQuantumClick();
        spawnQuantumShockwave();

        const targetUrl = STATE.dashboardUrl;
        window.dispatchEvent(new CustomEvent('microgrid:open-quantum-dashboard', { detail: { url: targetUrl } }));

        try {
            const win = window.open(targetUrl, '_blank');
            if (!win || win.closed || typeof win.closed === 'undefined') {
                showDashboardModal(targetUrl);
            }
        } catch (e) {
            showDashboardModal(targetUrl);
        }
    }

    function spawnQuantumShockwave() {
        const waveGeo = new THREE.RingGeometry(0.5, 1.2, 32);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0x00F0FF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.rotation.x = Math.PI / 2;
        wave.position.set(0, 1.2, 0);
        scene.add(wave);

        animatedObjects.shockwaves.push({
            mesh: wave,
            radius: 1.2,
            maxRadius: 28.0,
            opacity: 1.0
        });
    }

    function showDashboardModal(url) {
        const modal = document.getElementById('dashboard-modal');
        const urlInput = document.getElementById('modal-url-input');
        urlInput.value = url;
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    function showTemporaryToast(message) {
        const banner = document.getElementById('cinematic-banner');
        const icon = document.getElementById('banner-icon');
        const title = document.getElementById('banner-title');
        const desc = document.getElementById('banner-desc');

        icon.textContent = '⚡';
        title.textContent = 'OPTIMIZATION ENGINE DISPATCH';
        desc.textContent = message;
        banner.className = 'cinematic-banner visible day-banner';

        clearTimeout(banner._timeout);
        banner._timeout = setTimeout(() => {
            banner.classList.remove('visible');
        }, 3800);
    }

    // =========================================================================
    // UI Controls, Modal Bindings & Camera Animations
    // =========================================================================
    function setupUI() {
        document.getElementById('day-night-btn').addEventListener('click', toggleTimeOfDay);
        document.getElementById('cinematic-movie-btn').addEventListener('click', toggleCinematicMovie);

        const energyFlowBtn = document.getElementById('btn-energy-flow');
        if (energyFlowBtn) energyFlowBtn.addEventListener('click', toggleEnergyFlowSequence);

        const addBtnNav = document.getElementById('btn-add-qubit-nav');
        if (addBtnNav) addBtnNav.addEventListener('click', openAddQubitModal);

        const addBtnDock = document.getElementById('btn-add-qubit-dock');
        if (addBtnDock) addBtnDock.addEventListener('click', openAddQubitModal);

        // Edit Qubit Modal Closing & Saving Listeners
        const closeEditBtn = document.getElementById('btn-close-edit-modal');
        if (closeEditBtn) closeEditBtn.addEventListener('click', window.closeQubitEditModal);

        const cancelEditBtn = document.getElementById('btn-cancel-edit');
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', window.closeQubitEditModal);

        const editModal = document.getElementById('qubit-edit-modal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) window.closeQubitEditModal(e);
            });
        }

        document.getElementById('btn-save-edit').addEventListener('click', saveQubitEdit);
        document.getElementById('btn-delete-node').addEventListener('click', deleteActiveQubit);

        // Add Qubit Modal Closing & Submitting Listeners
        const closeAddBtn = document.getElementById('btn-close-add-modal');
        if (closeAddBtn) closeAddBtn.addEventListener('click', window.closeAddQubitModal);

        const cancelAddBtn = document.getElementById('btn-cancel-add');
        if (cancelAddBtn) cancelAddBtn.addEventListener('click', window.closeAddQubitModal);

        const addModal = document.getElementById('add-qubit-modal');
        if (addModal) {
            addModal.addEventListener('click', (e) => {
                if (e.target === addModal) window.closeAddQubitModal(e);
            });
        }

        document.getElementById('btn-confirm-add').addEventListener('click', confirmAddQubit);

        // Dashboard Modal Closing Listeners
        const closeDashBtn = document.getElementById('btn-close-modal');
        if (closeDashBtn) closeDashBtn.addEventListener('click', window.closeDashboardModal);

        const dashModal = document.getElementById('dashboard-modal');
        if (dashModal) {
            dashModal.addEventListener('click', (e) => {
                if (e.target === dashModal) window.closeDashboardModal(e);
            });
        }

        // Global Keyboard Handler (Escape closes active modals)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeQubitEditModal();
                window.closeAddQubitModal();
                window.closeDashboardModal();
            }
        });

        const powerSlider = document.getElementById('edit-node-power-slider');
        const powerInput = document.getElementById('edit-node-power-input');
        const powerLabel = document.getElementById('edit-power-val-label');

        powerSlider.addEventListener('input', (e) => {
            powerInput.value = e.target.value;
            powerLabel.textContent = `${parseFloat(e.target.value).toFixed(1)} kW`;
        });
        powerInput.addEventListener('input', (e) => {
            powerSlider.value = e.target.value;
            powerLabel.textContent = `${parseFloat(e.target.value).toFixed(1)} kW`;
        });

        document.querySelectorAll('#qubit-edit-modal .chip-btn').forEach(chip => {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#qubit-edit-modal .chip-btn').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('edit-node-hours').value = this.dataset.hours;
            });
        });

        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', function () {
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                STATE.selectedAddTemplate = this.dataset.template;

                const nameInput = document.getElementById('add-node-name');
                const powerInput = document.getElementById('add-node-power');
                const hoursInput = document.getElementById('add-node-hours');

                if (this.dataset.template === 'factory') {
                    nameInput.value = 'Industrial Smart Factory';
                    powerInput.value = '25.0';
                    hoursInput.value = '07:00 - 17:00';
                } else if (this.dataset.template === 'datacenter') {
                    nameInput.value = 'Quantum AI Data Center';
                    powerInput.value = '35.0';
                    hoursInput.value = '24/7';
                } else if (this.dataset.template === 'evhub') {
                    nameInput.value = 'EV Supercharging Station';
                    powerInput.value = '25.0';
                    hoursInput.value = '06:00 - 22:00';
                } else if (this.dataset.template === 'water') {
                    nameInput.value = 'Water Purification Facility';
                    powerInput.value = '18.0';
                    hoursInput.value = '24/7';
                }
            });
        });

        const soundToggleBtn = document.getElementById('btn-sound-toggle');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', function () {
                if (window.soundEngine) {
                    const isEnabled = window.soundEngine.toggle();
                    this.classList.toggle('active', isEnabled);
                    this.querySelector('.label').textContent = isEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
                }
            });
        }

        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const presetKey = this.dataset.preset;
                STATE.focusedQubitId = null;
                showResetViewButton(false);
                animateCameraToPreset(presetKey);
                renderQuantumRegisterHUD();
            });
        });

        document.getElementById('btn-launch-dashboard').addEventListener('click', () => {
            window.open(STATE.dashboardUrl, '_blank');
        });

        document.getElementById('btn-save-url').addEventListener('click', () => {
            const input = document.getElementById('modal-url-input');
            STATE.dashboardUrl = input.value.trim() || CONFIG.defaultDashboardUrl;
            localStorage.setItem('quantum_dashboard_url', STATE.dashboardUrl);
            window.open(STATE.dashboardUrl, '_blank');
            window.closeDashboardModal();
        });
    }

    function animateCameraToPreset(presetKey) {
        const target = CAMERA_PRESETS[presetKey];
        if (!target) return;
        animateCameraTo(target.pos, target.target, 1.2);
    }

    function flyCameraToNode(node) {
        if (!node || !node.position) return;
        if (window.soundEngine) window.soundEngine.playHover();

        // Calculate elevated lookAt target directly on the building structure
        const lookAtTarget = new THREE.Vector3(node.position.x, node.position.y + 2.4, node.position.z);
        
        // Compute an aesthetically angled cinematic camera offset
        const camPos = new THREE.Vector3(
            node.position.x + (node.position.x >= 0 ? 12 : -12),
            node.position.y + 11,
            node.position.z + 13
        );

        showResetViewButton(true, node.name);

        // Smooth cinematic fly-to animation with focus lock upon completion
        animateCameraTo(camPos, lookAtTarget, 1.3, () => {
            controls.target.copy(lookAtTarget);
            controls.enabled = true; // Orbit locked around this structure!
        });

        showTemporaryToast(`🔭 Camera focused on ${node.name} (Qubit ${node.qubitIndex})`);
    }

    function showResetViewButton(show, nodeName) {
        const btn = document.getElementById('btn-reset-view');
        if (!btn) return;
        if (show) {
            btn.classList.add('visible');
            const txt = document.getElementById('reset-view-text');
            if (txt) {
                txt.textContent = `RESET VIEW (${nodeName ? nodeName.slice(0, 16).toUpperCase() : 'BUILDING'})`;
            }
        } else {
            btn.classList.remove('visible');
        }
    }

    window.resetCameraView = function () {
        STATE.focusedQubitId = null;
        showResetViewButton(false);
        clearBuildingSelectionOutline();

        animateCameraTo(CAMERA_PRESETS.iso.pos, CAMERA_PRESETS.iso.target, 1.2, () => {
            controls.target.copy(CAMERA_PRESETS.iso.target);
            controls.enabled = true;
        });

        document.querySelectorAll('.cam-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.preset === 'iso');
        });

        renderQuantumRegisterHUD();

        if (window.soundEngine) window.soundEngine.playHover();
        showTemporaryToast('🗺️ Returned to Full-City Isometric View');
    };

    function animateCameraToFocus(targetWorldPos) {
        const camPos = new THREE.Vector3(
            targetWorldPos.x + 14,
            targetWorldPos.y + 12,
            targetWorldPos.z + 14
        );
        animateCameraTo(camPos, targetWorldPos, 1.4);
    }

    function animateCameraTo(targetPos, lookAtTarget, duration, onComplete) {
        if (!controls) return;
        controls.enabled = false; // Temporarily disable manual orbit during flight
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        let elapsed = 0;

        function stepCam() {
            elapsed += clock.getDelta();
            const progress = Math.min(1.0, elapsed / duration);
            const ease = 0.5 - Math.cos(progress * Math.PI) * 0.5;

            camera.position.lerpVectors(startPos, targetPos, ease);
            controls.target.lerpVectors(startTarget, lookAtTarget, ease);
            controls.update();

            if (progress < 1.0) {
                requestAnimationFrame(stepCam);
            } else {
                camera.position.copy(targetPos);
                controls.target.copy(lookAtTarget);
                controls.update();
                controls.enabled = true; // Focus locked on target: user can orbit around this building
                if (onComplete) onComplete();
            }
        }
        stepCam();
    }

    function toggleCinematicMovie() {
        STATE.isCinematicMovieActive = !STATE.isCinematicMovieActive;
        const btn = document.getElementById('cinematic-movie-btn');
        if (btn) {
            btn.classList.toggle('active', STATE.isCinematicMovieActive);
            if (STATE.isCinematicMovieActive) {
                btn.innerHTML = '<span>🏙️</span> STOP OVERVIEW';
            } else {
                btn.innerHTML = '<span>🏙️</span> City Overview';
            }
        }
    }

    // =========================================================================
    // Silent Cinematic Energy Flow System (5-Phase Visual Sequence)
    // 100% Silent: Zero audio, purely visual high-tech holographic simulation
    // =========================================================================

    const energyFlowState = {
        active: false,
        phase: 0,
        outlines: [],
        packets: [],
        panels: [],
        animatingPackets: [],
        timeouts: [],
        isFading: false,
        fadeStartTime: 0,
        fadeDuration: 5000
    };

    // Helper: Create Glowing Sci-Fi Outline Mesh Group for any 3D structure
    function createStructureGlowingOutline(group, width, height, depth, centerOffset, colorHex = 0x00F0FF) {
        if (!group) return null;
        const outlineGroup = new THREE.Group();
        outlineGroup.name = 'structure_energy_outline';

        const materials = [];

        // 1. Edges line segments
        const boxGeo = new THREE.BoxGeometry(width, height, depth);
        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({
            color: colorHex,
            linewidth: 2,
            transparent: true,
            opacity: 0.95
        });
        materials.push(lineMat);
        const edgeLines = new THREE.LineSegments(edgesGeo, lineMat);
        edgeLines.position.copy(centerOffset);
        outlineGroup.add(edgeLines);

        // 2. Holographic semi-transparent wireframe cage
        const cageMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        materials.push(cageMat);
        const cageMesh = new THREE.Mesh(boxGeo, cageMat);
        cageMesh.position.copy(centerOffset);
        outlineGroup.add(cageMesh);

        // 3. Sci-Fi Corner Brackets
        const bracketLen = Math.min(width, depth, height) * 0.22;
        const bracketRadius = 0.09;
        const cornerMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.95
        });
        materials.push(cornerMat);

        const cornerOffsets = [
            [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]
        ];

        cornerOffsets.forEach(([sx, sy, sz]) => {
            const cx = centerOffset.x + (sx * width * 0.5);
            const cy = centerOffset.y + (sy * height * 0.5);
            const cz = centerOffset.z + (sz * depth * 0.5);

            // X-arm
            const tubeX = new THREE.Mesh(
                new THREE.CylinderGeometry(bracketRadius, bracketRadius, bracketLen, 8),
                cornerMat
            );
            tubeX.rotation.z = Math.PI / 2;
            tubeX.position.set(cx - sx * bracketLen * 0.5, cy, cz);
            outlineGroup.add(tubeX);

            // Y-arm
            const tubeY = new THREE.Mesh(
                new THREE.CylinderGeometry(bracketRadius, bracketRadius, bracketLen, 8),
                cornerMat
            );
            tubeY.position.set(cx, cy - sy * bracketLen * 0.5, cz);
            outlineGroup.add(tubeY);

            // Z-arm
            const tubeZ = new THREE.Mesh(
                new THREE.CylinderGeometry(bracketRadius, bracketRadius, bracketLen, 8),
                cornerMat
            );
            tubeZ.rotation.x = Math.PI / 2;
            tubeZ.position.set(cx, cy, cz - sz * bracketLen * 0.5);
            outlineGroup.add(tubeZ);
        });

        // 4. Ground base halo ring
        const groundRadius = Math.max(width, depth) * 0.65;
        const haloGeo = new THREE.TorusGeometry(groundRadius, 0.12, 8, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });
        materials.push(haloMat);
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.position.set(centerOffset.x, 0.12, centerOffset.z);
        outlineGroup.add(haloMesh);

        group.add(outlineGroup);

        const outlineObj = {
            group: outlineGroup,
            materials: materials,
            baseOpacities: materials.map(m => m.opacity),
            setOpacity: function (alpha) {
                this.materials.forEach((m, idx) => {
                    m.opacity = this.baseOpacities[idx] * alpha;
                });
            },
            remove: function () {
                if (outlineGroup.parent) {
                    outlineGroup.parent.remove(outlineGroup);
                }
            }
        };

        energyFlowState.outlines.push(outlineObj);
        return outlineObj;
    }

    // Helper: Create outline for node based on its hitMesh or meshGroup
    function createStructureGlowingOutlineForNode(node) {
        if (!node || !node.meshGroup) return null;
        let bWidth = 12, bHeight = 8, bDepth = 12;
        let bCenter = new THREE.Vector3(0, 4, 0);

        if (node.hitMesh && node.hitMesh.geometry) {
            const geo = node.hitMesh.geometry;
            if (geo.parameters) {
                bWidth = (geo.parameters.width || (geo.parameters.radiusTop ? geo.parameters.radiusTop * 2 : 12)) + 0.8;
                bHeight = (geo.parameters.height || 8) + 0.8;
                bDepth = (geo.parameters.depth || (geo.parameters.radiusBottom ? geo.parameters.radiusBottom * 2 : 12)) + 0.8;
            }
            bCenter.copy(node.hitMesh.position);
        } else {
            const box = new THREE.Box3().setFromObject(node.meshGroup);
            const size = new THREE.Vector3();
            box.getSize(size);
            bWidth = size.x + 0.8;
            bHeight = size.y + 0.8;
            bDepth = size.z + 0.8;
            box.getCenter(bCenter);
            bCenter.sub(node.meshGroup.position);
        }

        const colorHex = node.neonColorHex || node.colorHex || 0x00F0FF;
        return createStructureGlowingOutline(node.meshGroup, bWidth, bHeight, bDepth, bCenter, colorHex);
    }

    // Helper: Create Cylindrical Packet of Light for Phase 3
    function createCylindricalLightPacket(colorHex = 0x00F0FF) {
        const group = new THREE.Group();
        group.name = 'energy_routing_packet';

        // Length = 2.2, Radius = 0.32, oriented along Z-axis
        const cylGeo = new THREE.CylinderGeometry(0.32, 0.32, 2.2, 16);
        cylGeo.rotateX(Math.PI / 2);

        // 1. Inner white-hot glowing cylinder
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 1.0
        });
        const coreMesh = new THREE.Mesh(cylGeo, coreMat);
        group.add(coreMesh);

        // 2. Outer neon energy sheath
        const sheathGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.4, 16);
        sheathGeo.rotateX(Math.PI / 2);
        const sheathMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.88,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const sheathMesh = new THREE.Mesh(sheathGeo, sheathMat);
        group.add(sheathMesh);

        // 3. Leading and trailing glow sphere caps
        const capGeo = new THREE.SphereGeometry(0.48, 12, 12);
        const capMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const capFront = new THREE.Mesh(capGeo, capMat);
        capFront.position.set(0, 0, 1.1);
        group.add(capFront);

        const capBack = new THREE.Mesh(capGeo, capMat);
        capBack.position.set(0, 0, -1.1);
        group.add(capBack);

        scene.add(group);

        const packetObj = {
            group: group,
            materials: [coreMat, sheathMat, capMat],
            baseOpacities: [1.0, 0.88, 0.9],
            setOpacity: function (alpha) {
                this.materials.forEach((m, idx) => {
                    m.opacity = this.baseOpacities[idx] * alpha;
                });
            },
            remove: function () {
                if (group.parent) group.parent.remove(group);
            }
        };

        energyFlowState.packets.push(packetObj);
        return packetObj;
    }

    // Helper: Create Floating 3D-Projected UI Information Panel
    function createFloatingEnergyPanel(type, worldPos, data = {}) {
        const container = document.getElementById('floating-energy-panels-container');
        if (!container) return null;

        const el = document.createElement('div');
        el.className = `floating-energy-badge floating-${type}-badge`;

        if (type === 'plant') {
            el.innerHTML = `
                <div class="badge-header">
                    <span class="badge-icon">${data.icon || '⚡'}</span>
                    <span class="badge-title">${data.title || 'POWER PLANT'}</span>
                </div>
                <div class="badge-single-metric">
                    Energy Provided: <strong>${data.power.toFixed(1)} kW</strong>
                </div>
            `;
        } else if (type === 'hub') {
            el.innerHTML = `
                <div class="badge-header">
                    <span class="badge-icon">⚛️</span>
                    <span class="badge-title">MICROGRID CONTROL CENTER</span>
                </div>
                <div class="badge-metric-grid">
                    <div class="badge-row">
                        <span class="badge-label">Total Power Received:</span>
                        <span class="badge-val highlight-green">${data.powerReceived.toFixed(1)} kW</span>
                    </div>
                    <div class="badge-row">
                        <span class="badge-label">Total Load Demand:</span>
                        <span class="badge-val highlight-cyan">${data.totalLoad.toFixed(1)} kW</span>
                    </div>
                    <div class="badge-row">
                        <span class="badge-label">Calculated Quantum State:</span>
                        <span class="badge-val highlight-purple">${data.quantumState || '|11101⟩'}</span>
                    </div>
                </div>
            `;
        } else if (type === 'qubit') {
            const fulfilled = data.fulfilled !== undefined ? data.fulfilled : 100;
            const qColor = fulfilled >= 100 ? 'highlight-green' : 'highlight-orange';
            el.innerHTML = `
                <div class="badge-header">
                    <span class="badge-icon">${data.icon || '⚡'}</span>
                    <span class="badge-title">${data.name.toUpperCase()} (QUBIT ${data.qubitIndex})</span>
                </div>
                <div class="badge-metric-grid">
                    <div class="badge-row">
                        <span class="badge-label">Demanded Power:</span>
                        <span class="badge-val highlight-cyan">${data.demanded.toFixed(1)} kW</span>
                    </div>
                    <div class="badge-row">
                        <span class="badge-label">Allocated Power:</span>
                        <span class="badge-val ${qColor}">${data.allocated.toFixed(1)} kW</span>
                    </div>
                    <div class="badge-row">
                        <span class="badge-label">Requirement Fulfilled:</span>
                        <span class="badge-val highlight-gold">${fulfilled}%</span>
                    </div>
                </div>
            `;
        }

        container.appendChild(el);

        const panelObj = {
            el: el,
            pos: worldPos.clone(),
            type: type,
            setFadeOutFast: function () {
                el.classList.add('fade-out-fast');
                setTimeout(() => {
                    if (el.parentNode) el.parentNode.removeChild(el);
                    const idx = energyFlowState.panels.indexOf(panelObj);
                    if (idx > -1) energyFlowState.panels.splice(idx, 1);
                }, 520);
            },
            setFadeOut5s: function () {
                el.classList.add('fade-out-5s');
            },
            remove: function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }
        };

        energyFlowState.panels.push(panelObj);
        return panelObj;
    }

    // Update floating panels and packet positions in animate()
    function updateEnergyFlowSequence(delta) {
        if (!energyFlowState.active && energyFlowState.panels.length === 0 && energyFlowState.outlines.length === 0 && energyFlowState.packets.length === 0) {
            return;
        }

        // 1. Update Floating UI Panels 3D-to-2D Screen Projections
        if (energyFlowState.panels.length > 0) {
            const wHalf = window.innerWidth * 0.5;
            const hHalf = window.innerHeight * 0.5;

            energyFlowState.panels.forEach(p => {
                if (!p.el || !p.pos) return;
                const proj = p.pos.clone().project(camera);
                if (proj.z > -1.0 && proj.z < 1.0) {
                    const x = (proj.x * wHalf) + wHalf;
                    const y = -(proj.y * hHalf) + hHalf;
                    p.el.style.display = 'flex';
                    p.el.style.left = `${x}px`;
                    p.el.style.top = `${y}px`;
                } else {
                    p.el.style.display = 'none';
                }
            });
        }

        // 2. Update Cylindrical Light Packets travelling along curves (Phase 3)
        if (energyFlowState.animatingPackets.length > 0) {
            const now = performance.now();
            energyFlowState.animatingPackets.forEach(item => {
                const elapsed = now - item.startTime;
                const rawProgress = Math.min(elapsed / item.duration, 1.0);
                const p = rawProgress * rawProgress * (3 - 2 * rawProgress); // smoothstep
                const clampedT = Math.min(Math.max(p, 0.001), 0.999);

                const pos = item.curve.getPointAt(clampedT);
                const tangent = item.curve.getTangentAt(clampedT).normalize();
                item.packet.group.position.copy(pos);
                item.packet.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

                if (rawProgress >= 1.0 && !item.completed) {
                    item.completed = true;
                    if (item.onArrival) item.onArrival();
                }
            });
        }

        // 3. Update Phase 5 (5-Second Fade-Out Interpolation)
        if (energyFlowState.isFading) {
            const now = performance.now();
            const elapsed = now - energyFlowState.fadeStartTime;
            const progress = Math.min(elapsed / energyFlowState.fadeDuration, 1.0);
            const alpha = Math.max(0, 1.0 - progress);

            energyFlowState.outlines.forEach(o => o.setOpacity(alpha));
            energyFlowState.packets.forEach(p => p.setOpacity(alpha));
        }
    }

    function toggleEnergyFlowSequence() {
        if (STATE.isEnergyFlowActive) {
            stopEnergyFlowSequence();
            return;
        }

        STATE.isEnergyFlowActive = true;
        energyFlowState.active = true;
        energyFlowState.phase = 1;
        energyFlowState.isFading = false;

        const btn = document.getElementById('btn-energy-flow');
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<span class="bolt-icon">⚡</span> STOP FLOW';
        }

        // 1. Force Daytime (Light Theme) state for the entire sequence (No nighttime version)
        if (!STATE.isDay) {
            toggleTimeOfDay();
        }

        // 2. Clear any lingering outlines, panels, packets, or timeouts
        clearBuildingSelectionOutline();
        stopEnergyFlowSequence(true); // soft reset internal elements
        STATE.isEnergyFlowActive = true;
        energyFlowState.active = true;

        // Save original line speeds
        animatedObjects.powerLines.forEach(pl => {
            if (!pl._origSpeed) pl._origSpeed = pl.currentSpeed;
        });

        // Helper to show banners
        function showFlowBanner(icon, title, desc) {
            const banner = document.getElementById('cinematic-banner');
            const bIcon = document.getElementById('banner-icon');
            const bTitle = document.getElementById('banner-title');
            const bDesc = document.getElementById('banner-desc');
            if (!banner) return;
            bIcon.textContent = icon;
            bTitle.textContent = title;
            bDesc.textContent = desc;
            banner.className = 'cinematic-banner visible day-banner';
        }

        // Track power plant outlines & panels for Phase 1 -> Phase 2 transition
        let plantOutlines = [];
        let plantPanels = [];
        let hubOutline = null;
        let hubPanel = null;

        // =====================================================================
        // PHASE 1: POWER GENERATION (Start: 0.0s – 3.0s)
        // Bright electric blue glowing outline to all Power Plants (Hydro, Solar, Wind)
        // Smoothly animate floating UI Info Panels rising above each plant: "Energy Provided: [X] kW"
        // =====================================================================
        showFlowBanner('⚡', 'PHASE 1: POWER GENERATION', 'Hydro (25.0 kW), Solar (35.0 kW) & Wind (20.0 kW) Power Plants Actively Generating');

        // Electric Blue Glowing Outline on Power Plants
        const plants = animatedObjects.plantGroups || {};
        if (plants.hydro) {
            const hOutline = createStructureGlowingOutline(plants.hydro, 14, 9, 14, new THREE.Vector3(0, 4.0, 2), 0x00F0FF);
            if (hOutline) plantOutlines.push(hOutline);
        }
        if (plants.solar) {
            const sOutline = createStructureGlowingOutline(plants.solar, 19.5, 4.2, 11.5, new THREE.Vector3(0, 2.0, 0), 0x00F0FF);
            if (sOutline) plantOutlines.push(sOutline);
        }
        if (plants.turbine) {
            const tOutline = createStructureGlowingOutline(plants.turbine, 6.0, 20.0, 6.0, new THREE.Vector3(0, 10.0, 0), 0x00F0FF);
            if (tOutline) plantOutlines.push(tOutline);
        }

        // Floating UI Information Panels rising above each plant
        const hydroPanel = createFloatingEnergyPanel('plant', new THREE.Vector3(17, 10.0, -17), {
            icon: '🌊',
            title: 'HYDROPOWER DAM',
            power: 25.0
        });
        if (hydroPanel) plantPanels.push(hydroPanel);

        const solarPanel = createFloatingEnergyPanel('plant', new THREE.Vector3(0, 5.5, -19), {
            icon: '☀️',
            title: 'PV SOLAR ARRAY',
            power: 35.0
        });
        if (solarPanel) plantPanels.push(solarPanel);

        const windPanel = createFloatingEnergyPanel('plant', new THREE.Vector3(-17, 24.5, -17), {
            icon: '💨',
            title: 'WIND TURBINE',
            power: 20.0
        });
        if (windPanel) plantPanels.push(windPanel);

        // Accelerate inflow conduit lines
        const genLineIds = ['wind_to_center', 'solar_to_center', 'hydro_to_center', 'battery_bus'];
        animatedObjects.powerLines.forEach(pl => {
            if (genLineIds.includes(pl.spec.id)) {
                pl.currentSpeed = 2.0;
            }
        });
        animatedObjects.windTurbineSpeedMultiplier = 2.5;

        // =====================================================================
        // PHASE 2: QUANTUM PROCESSING (3.0s – 5.5s)
        // Electric blue glow on power plants & their UI panels smoothly fade out
        // Central Microgrid Hub begins to glow brightly
        // Central UI Info Panel rises from the hub displaying:
        // Total Power Received: 80.0 kW | Total Load Demand: [Y] kW | Calculated Quantum State: |11101⟩
        // =====================================================================
        energyFlowState.timeouts.push(setTimeout(() => {
            if (!STATE.isEnergyFlowActive) return;
            energyFlowState.phase = 2;

            showFlowBanner('⚛️', 'PHASE 2: QUANTUM PROCESSING', 'Microgrid Hub Computing QAOA Optimal Dispatch & Qubit State Allocation');

            // 1. Smoothly fade out power plant outlines and UI panels
            plantPanels.forEach(p => p.setFadeOutFast());
            plantPanels = [];

            // Lerp plant outlines opacity to 0
            const pFadeStart = performance.now();
            const pFadeInterval = setInterval(() => {
                const prog = Math.min((performance.now() - pFadeStart) / 480, 1.0);
                plantOutlines.forEach(o => o.setOpacity(1.0 - prog));
                if (prog >= 1.0) {
                    clearInterval(pFadeInterval);
                    plantOutlines.forEach(o => o.remove());
                    plantOutlines = [];
                }
            }, 16);

            // 2. Central Hub begins to glow brightly
            if (plants.hub) {
                hubOutline = createStructureGlowingOutline(plants.hub, 14, 14, 14, new THREE.Vector3(0, 6.5, 0), 0x00F0FF);
            }
            if (animatedObjects.quantumCoreCore) {
                animatedObjects.quantumCoreCore.scale.set(1.9, 1.9, 1.9);
            }
            spawnQuantumShockwave();

            // Compute metrics for the Hub UI panel
            const totalLoad = STATE.qubitNodes.reduce((sum, n) => sum + (n.requiredPower || 0), 0);
            const registerState = '|' + STATE.qubitNodes.map(n => n.isOnline ? '1' : '0').join('') + '⟩';

            // Central UI Info Panel rises from the hub
            hubPanel = createFloatingEnergyPanel('hub', new THREE.Vector3(0, 14.5, 0), {
                powerReceived: 80.0,
                totalLoad: totalLoad > 0 ? totalLoad : 70.0,
                quantumState: STATE.qubitNodes.length === 5 ? registerState : '|11101⟩'
            });

            // Restore generation inflow lines to steady speed
            animatedObjects.powerLines.forEach(pl => {
                if (genLineIds.includes(pl.spec.id)) {
                    pl.currentSpeed = 0.5;
                }
            });
            animatedObjects.windTurbineSpeedMultiplier = 1.0;
        }, 3000));

        // =====================================================================
        // PHASE 3: ENERGY ROUTING (5.5s – 7.8s)
        // Hub glow and its UI panel smoothly fade down
        // Cylindrical packets of light travel outward from central hub along routing lines
        // =====================================================================
        energyFlowState.timeouts.push(setTimeout(() => {
            if (!STATE.isEnergyFlowActive) return;
            energyFlowState.phase = 3;

            showFlowBanner('🚀', 'PHASE 3: ENERGY ROUTING', 'Cylindrical Energy Packets Routing Outward Along Dual-Conduits to Network Qubits');

            // 1. Hub glow and Hub UI panel smoothly fade down
            if (hubPanel) {
                hubPanel.setFadeOutFast();
                hubPanel = null;
            }
            if (hubOutline) {
                const hFadeStart = performance.now();
                const hFadeInterval = setInterval(() => {
                    const prog = Math.min((performance.now() - hFadeStart) / 480, 1.0);
                    if (hubOutline) hubOutline.setOpacity(1.0 - prog);
                    if (prog >= 1.0) {
                        clearInterval(hFadeInterval);
                        if (hubOutline) hubOutline.remove();
                        hubOutline = null;
                    }
                }, 16);
            }
            if (animatedObjects.quantumCoreCore) {
                animatedObjects.quantumCoreCore.scale.set(1.15, 1.15, 1.15);
            }

            // 2. Animated Cylindrical packets of light travel outward along routing lines
            const activeNodes = STATE.qubitNodes.filter(n => n.powerLine && n.powerLine.curve);
            const routingDuration = 2300; // packets reach destination at T = 5500 + 2300 = 7800ms
            const routingStart = performance.now();

            activeNodes.forEach((node, idx) => {
                const colorHex = node.neonColorHex || node.colorHex || 0x00F0FF;
                const packet = createCylindricalLightPacket(colorHex);

                energyFlowState.animatingPackets.push({
                    packet: packet,
                    curve: node.powerLine.curve,
                    startTime: routingStart,
                    duration: routingDuration,
                    completed: false,
                    onArrival: () => {
                        if (!STATE.isEnergyFlowActive) return;
                        // Phase 4 trigger for this destination building!
                        triggerNodeFulfillment(node, idx);
                    }
                });
            });
        }, 5500));

        // Phase 4 Node Fulfillment trigger function
        function triggerNodeFulfillment(node, index) {
            // 1. Building lights up with glowing outline
            createStructureGlowingOutlineForNode(node);

            // 2. Localized ground shockwave at node
            spawnLocalizedNodeShockwave(node.position, node.neonColorHex || node.colorHex || 0x00F0FF);

            // 3. Floating UI Information Panel rises above destination building
            let bHeight = 8;
            if (node.hitMesh && node.hitMesh.geometry && node.hitMesh.geometry.parameters) {
                bHeight = node.hitMesh.geometry.parameters.height || 8;
            }
            const panelPos = new THREE.Vector3(node.position.x, bHeight + 2.8, node.position.z);

            const iconMap = {
                hospital: '🏥',
                school: '🏫',
                commercial: '🏢',
                residential: '🏡',
                factory: '🏭',
                datacenter: '🖥️',
                evhub: '⚡',
                water: '💧'
            };
            const icon = iconMap[node.id] || iconMap[node.category] || '🏛️';
            const fulfilled = Math.round(((node.allocatedPower || node.requiredPower) / (node.requiredPower || 1)) * 100);

            createFloatingEnergyPanel('qubit', panelPos, {
                icon: icon,
                name: node.name,
                qubitIndex: index,
                demanded: node.requiredPower,
                allocated: node.allocatedPower || node.requiredPower,
                fulfilled: fulfilled
            });
        }

        // =====================================================================
        // PHASE 4: NODE FULFILLMENT (7.8s – 11.0s)
        // Banners update as packets reach destination nodes and buildings are lit
        // =====================================================================
        energyFlowState.timeouts.push(setTimeout(() => {
            if (!STATE.isEnergyFlowActive) return;
            energyFlowState.phase = 4;
            showFlowBanner('✅', 'PHASE 4: NODE CAPACITY FULFILLMENT', 'All Municipal & Critical Qubits 100% Satisfied via Optimal Power Allocation');
        }, 7800));

        // =====================================================================
        // PHASE 5: SEQUENCE FADE-OUT (11.0s – 16.0s)
        // Smoothly fades out over EXACTLY 5 seconds returning city to standard default state
        // =====================================================================
        energyFlowState.timeouts.push(setTimeout(() => {
            if (!STATE.isEnergyFlowActive) return;
            energyFlowState.phase = 5;

            showFlowBanner('🔄', 'PHASE 5: SYSTEM STABILIZATION', 'Sequence Smoothly Fading Out Over 5 Seconds to Default Microgrid State');

            // 1. Trigger CSS 5-second fade-out on all active floating panels
            energyFlowState.panels.forEach(p => p.setFadeOut5s());

            // 2. Trigger 3D materials opacity lerp over exactly 5000ms
            energyFlowState.isFading = true;
            energyFlowState.fadeStartTime = performance.now();
            energyFlowState.fadeDuration = 5000;
        }, 11000));

        // Sequence Full Completion at exactly 16.0s (11.0s + 5.0s = 16000ms)
        energyFlowState.timeouts.push(setTimeout(() => {
            if (!STATE.isEnergyFlowActive) return;
            stopEnergyFlowSequence();
        }, 16000));
    }

    function stopEnergyFlowSequence(softReset = false) {
        energyFlowState.timeouts.forEach(t => clearTimeout(t));
        energyFlowState.timeouts = [];

        // Remove all active outlines
        energyFlowState.outlines.forEach(o => o.remove());
        energyFlowState.outlines = [];

        // Remove all packets
        energyFlowState.packets.forEach(p => p.remove());
        energyFlowState.packets = [];
        energyFlowState.animatingPackets = [];

        // Remove all floating UI panels
        energyFlowState.panels.forEach(p => p.remove());
        energyFlowState.panels = [];

        const container = document.getElementById('floating-energy-panels-container');
        if (container) container.innerHTML = '';

        energyFlowState.isFading = false;
        energyFlowState.phase = 0;

        if (!softReset) {
            STATE.isEnergyFlowActive = false;
            energyFlowState.active = false;

            const btn = document.getElementById('btn-energy-flow');
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<span class="bolt-icon">⚡</span> Energy Flow';
            }

            // Restore baseline speeds
            animatedObjects.windTurbineSpeedMultiplier = 1.0;
            animatedObjects.powerLines.forEach(pl => {
                pl.currentSpeed = pl.spec.baseSpeed || 0.35;
                if (pl.outlineTube) {
                    pl.outlineTube.scale.set(1.0, 1.0, 1);
                }
            });

            // Hide banner after 2.5s
            setTimeout(() => {
                const banner = document.getElementById('cinematic-banner');
                if (banner && !STATE.isEnergyFlowActive) {
                    banner.classList.remove('visible');
                }
            }, 2500);
        }
    }

    function spawnLocalizedNodeShockwave(position, colorHex) {
        if (!position) return;
        const waveGeo = new THREE.RingGeometry(0.4, 0.9, 32);
        const waveMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.rotation.x = -Math.PI / 2;
        wave.position.set(position.x, 0.1, position.z);
        scene.add(wave);

        animatedObjects.shockwaves.push({
            mesh: wave,
            radius: 0.9,
            maxRadius: 10.0,
            opacity: 1.0
        });
    }

    // =========================================================================
    // Main Animation Loop
    // =========================================================================
    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // 1. Controls Update
        controls.update();

        // 2. Smart Precision Zoom Interpolation
        if (smartZoom.isZoomingToNode) {
            controls.target.lerp(smartZoom.targetPos, smartZoom.lerpFactor);
            if (controls.target.distanceTo(smartZoom.targetPos) < 0.08) {
                controls.target.copy(smartZoom.targetPos);
                smartZoom.isZoomingToNode = false;
            }
        }

        // 3. Day/Night Smooth Transition Interpolation
        if (STATE.isTransitioning) {
            STATE.transitionProgress += delta / STATE.transitionDuration;
            if (STATE.transitionProgress >= 1.0) {
                STATE.transitionProgress = 1.0;
                STATE.isTransitioning = false;
                STATE.timeTransition = STATE.isDay ? 1.0 : 0.0;
            } else {
                const ease = 0.5 - Math.cos(STATE.transitionProgress * Math.PI) * 0.5;
                STATE.timeTransition = STATE.isDay ? ease : (1.0 - ease);
            }
            updateCelestialPositions(STATE.timeTransition);
        }

        // Cinematic Movie Mode Camera Sweep
        if (STATE.isCinematicMovieActive) {
            const sweepAngle = elapsedTime * 0.2;
            const camRadius = 55;
            camera.position.x = Math.sin(sweepAngle) * camRadius;
            camera.position.z = Math.cos(sweepAngle) * camRadius;
            camera.position.y = 38 + Math.sin(elapsedTime * 0.3) * 8;
            camera.lookAt(0, 4, 0);
        }

        // 4. Wind Turbines Rotation
        if (animatedObjects.windTurbineBlades.length > 0) {
            const rotSpeed = THREE.MathUtils.lerp(1.8, 2.8, STATE.timeTransition) * (animatedObjects.windTurbineSpeedMultiplier || 1.0);
            animatedObjects.windTurbineBlades.forEach(bGroup => {
                bGroup.rotation.z -= delta * rotSpeed;
            });
        }

        // 5. Quantum Rings Rotation
        animatedObjects.quantumRings.forEach(item => {
            item.mesh.rotation.x += item.rotSpeedX;
            item.mesh.rotation.y += item.rotSpeedY;
            item.mesh.rotation.z += item.rotSpeedZ;
        });

        // 6. Quantum Core Pulsing
        if (animatedObjects.quantumCoreCore) {
            const scale = 1.0 + Math.sin(elapsedTime * 4.0) * 0.15;
            animatedObjects.quantumCoreCore.scale.set(scale, scale, scale);
        }

        // 7. Beacon Blinking
        if (animatedObjects.beaconLight) {
            const blink = (Math.sin(elapsedTime * 6.0) + 1.0) * 0.5;
            animatedObjects.beaconLight.material.opacity = blink;
        }

        // 8. Animated Hydro Spillway Water Ripple & Cascade Particles
        if (animatedObjects.waterParticles) {
            const posAttr = animatedObjects.waterParticles.geometry.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                let y = posAttr.getY(i);
                let z = posAttr.getZ(i);
                y -= delta * 3.5;
                z += delta * 2.8;
                if (y < 0.2 || z > 7.5) {
                    y = 2.4;
                    z = 4.8;
                }
                posAttr.setY(i, y);
                posAttr.setZ(i, z);
            }
            posAttr.needsUpdate = true;
        }

        // 9. Flowing Photon Energy Packets on AR Lines
        animatedObjects.powerLines.forEach(pl => {
            if (pl.currentSpeed > 0.001) {
                pl.particles.forEach(p => {
                    p.offset += delta * pl.currentSpeed;
                    if (p.offset > 1.0) p.offset -= 1.0;
                    const pos = pl.curve.getPointAt(p.offset);
                    p.mesh.position.copy(pos);
                });
            }
        });

        // 10. Shockwave Expansions
        for (let i = animatedObjects.shockwaves.length - 1; i >= 0; i--) {
            const sw = animatedObjects.shockwaves[i];
            sw.radius += delta * 24.0;
            sw.opacity = 1.0 - (sw.radius / sw.maxRadius);
            sw.mesh.scale.set(sw.radius, sw.radius, 1);
            sw.mesh.material.opacity = Math.max(0, sw.opacity);

            if (sw.radius >= sw.maxRadius) {
                scene.remove(sw.mesh);
                animatedObjects.shockwaves.splice(i, 1);
            }
        }

        // 11. Selection Outline Pulsing & Rotating Animation
        if (animatedObjects.selectionOutline) {
            const { groundRing, innerRing, cageMesh } = animatedObjects.selectionOutline;
            if (groundRing) groundRing.rotation.z += delta * 0.5;
            if (innerRing) innerRing.rotation.z -= delta * 0.8;
            if (cageMesh) {
                cageMesh.material.opacity = 0.25 + Math.sin(elapsedTime * 5.0) * 0.12;
            }
        }

        // 12. Raycast Hover Check
        updateRaycastHover();

        // 12b. Silent Cinematic Energy Flow Updates
        updateEnergyFlowSequence(delta);

        // 13. Render Scene with Postprocessing
        composer.render();
    }

    // Start App when DOM ready
    window.addEventListener('DOMContentLoaded', init);

})();
