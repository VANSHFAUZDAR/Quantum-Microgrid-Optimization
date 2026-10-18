/**
 * Volumetric God Rays (Light Shafts) Shader Pass for Three.js
 * Radial blur shader centered on the screen-space position of the Sun.
 */

const VolumetricSunRaysShader = {
    uniforms: {
        tDiffuse: { value: null },
        lightPositionOnScreen: { value: new THREE.Vector2(0.5, 0.5) },
        exposure: { value: 0.65 },
        decay: { value: 0.94 },
        density: { value: 0.82 },
        weight: { value: 0.45 },
        sunColor: { value: new THREE.Color(1.0, 0.85, 0.45) },
        intensity: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 lightPositionOnScreen;
        uniform float exposure;
        uniform float decay;
        uniform float density;
        uniform float weight;
        uniform vec3 sunColor;
        uniform float intensity;
        varying vec2 vUv;

        const int NUM_SAMPLES = 48;

        void main() {
            vec4 baseColor = texture2D(tDiffuse, vUv);
            if (intensity <= 0.001) {
                gl_FragColor = baseColor;
                return;
            }

            vec2 deltaTextCoord = (vUv - lightPositionOnScreen);
            deltaTextCoord *= 1.0 / float(NUM_SAMPLES) * density;
            vec2 textCoo = vUv;
            float illuminationDecay = 1.0;
            vec3 rays = vec3(0.0);

            for(int i = 0; i < NUM_SAMPLES; i++) {
                textCoo -= deltaTextCoord;
                vec4 samp = texture2D(tDiffuse, textCoo);
                
                // Extract highlights/bright areas (sun, reflections)
                float luminance = dot(samp.rgb, vec3(0.299, 0.587, 0.114));
                vec3 sampleColor = clamp((samp.rgb - 0.5) / 0.5, 0.0, 1.0);
                
                sampleColor *= illuminationDecay * weight;
                rays += sampleColor;
                illuminationDecay *= decay;
            }

            vec3 godRayColor = rays * exposure * sunColor * intensity;
            // Screen / additive blend with base scene
            gl_FragColor = vec4(baseColor.rgb + godRayColor, baseColor.a);
        }
    `
};

window.VolumetricSunRaysShader = VolumetricSunRaysShader;
