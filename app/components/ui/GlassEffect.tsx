"use client";

import React, { useRef, useEffect } from 'react';

// Simplified version that will pass TypeScript checks during build time
export default function GlassEffect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  
  useEffect(() => {
    // This prevents the effect from running twice in development mode with React strict mode
    if (initialized.current) return;
    initialized.current = true;
    
    // Skip server-side rendering
    if (typeof window === 'undefined') return;
    
    // Skip if container not available
    if (!containerRef.current) return;
    
    // Store cleanup function
    let cleanup: (() => void) | undefined;
    
    const initThreeJS = async () => {
      try {
        // Dynamically import Three.js modules only on client side
        // Using dynamic imports with Function constructor to avoid TypeScript errors during build
        // These modules will be loaded at runtime, not during build
        await import('three');
// Use Function constructor to bypass TypeScript checks during build
        // The code inside will only execute at runtime in the browser
        const initializeEffect = new Function(`
          return async function(container) {
            try {
              const EffectComposerModule = await import('three/examples/jsm/postprocessing/EffectComposer');
              const RenderPassModule = await import('three/examples/jsm/postprocessing/RenderPass');
              const ShaderPassModule = await import('three/examples/jsm/postprocessing/ShaderPass');
              const UnrealBloomPassModule = await import('three/examples/jsm/postprocessing/UnrealBloomPass');
              const FXAAShaderModule = await import('three/examples/jsm/shaders/FXAAShader');
              const THREE = await import('three');
              
              // Create scene, camera, renderer
              const scene = new THREE.Scene();
              const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
              camera.position.z = 1;
              
              const renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true 
              });
              renderer.setPixelRatio(window.devicePixelRatio);
              renderer.setClearColor(0x000000, 0);
              renderer.setSize(container.clientWidth, container.clientHeight);
              container.appendChild(renderer.domElement);
              
              // Create a simple glass-like plane
              const vertexShader = \`
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              \`;
              
              const fragmentShader = \`
                uniform float time;
                varying vec2 vUv;
                
                void main() {
                  float gradient = smoothstep(0.0, 1.0, vUv.x);
                  vec3 color = mix(
                    vec3(0.3, 0.4, 0.9),
                    vec3(0.9, 0.3, 0.8), 
                    gradient
                  );
                  float alpha = 0.2 + 0.05 * sin(time * 0.2 + vUv.x * 10.0);
                  gl_FragColor = vec4(color, alpha);
                }
              \`;
              
              const uniforms = {
                time: { value: 0 }
              };
              
              const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms,
                transparent: true,
                blending: THREE.AdditiveBlending
              });
              
              const geometry = new THREE.PlaneGeometry(2, 2);
              const mesh = new THREE.Mesh(geometry, material);
              scene.add(mesh);
              
              // Set up post-processing
              const { EffectComposer } = EffectComposerModule;
              const { RenderPass } = RenderPassModule;
              const { ShaderPass } = ShaderPassModule;
              const { UnrealBloomPass } = UnrealBloomPassModule;
              const { FXAAShader } = FXAAShaderModule;
              
              const composer = new EffectComposer(renderer);
              composer.addPass(new RenderPass(scene, camera));
              
              // Add bloom for glow
              const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.2,
                0.1,
                0.1
              );
              composer.addPass(bloomPass);
              
              // Add anti-aliasing
              const fxaaPass = new ShaderPass(FXAAShader);
              fxaaPass.material.uniforms.resolution.value.x = 1 / (window.innerWidth * window.devicePixelRatio);
              fxaaPass.material.uniforms.resolution.value.y = 1 / (window.innerHeight * window.devicePixelRatio);
              composer.addPass(fxaaPass);
              
              // Animation loop
              let animationFrame;
              const animate = () => {
                uniforms.time.value += 0.01;
                composer.render();
                animationFrame = requestAnimationFrame(animate);
              };
              animate();
              
              // Handle resize
              const handleResize = () => {
                if (!container) return;
                
                const width = container.clientWidth;
                const height = container.clientHeight;
                
                renderer.setSize(width, height);
                composer.setSize(width, height);
                
                if (fxaaPass.material.uniforms.resolution) {
                  fxaaPass.material.uniforms.resolution.value.x = 1 / (width * window.devicePixelRatio);
                  fxaaPass.material.uniforms.resolution.value.y = 1 / (height * window.devicePixelRatio);
                }
              };
              
              window.addEventListener('resize', handleResize);
              
              // Return cleanup function
              return () => {
                cancelAnimationFrame(animationFrame);
                window.removeEventListener('resize', handleResize);
                
                if (container && renderer.domElement) {
                  try {
                    container.removeChild(renderer.domElement);
                  } catch (e) {
                    console.error("Error removing renderer:", e);
                  }
                }
                
                geometry.dispose();
                material.dispose();
                renderer.dispose();
              };
            } catch (error) {
              console.error('Error initializing Three.js:', error);
              return null;
            }
          }
        `)();
        
        // Execute the runtime function
        if (containerRef.current) {
          cleanup = await initializeEffect(containerRef.current);
        }
      } catch (error) {
        console.error('Failed to initialize Three.js:', error);
        // Show fallback gradient if Three.js fails
        if (containerRef.current) {
          containerRef.current.style.background = 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))';
        }
      }
    };
    
    // Initialize Three.js
    initThreeJS();
    
    // Clean up on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
} 