"use client";

import React, { useRef, useEffect } from 'react';
import useVisibilityState from '@/app/hooks/useVisibilityState';

// Simplified version that will pass TypeScript checks during build time
export default function GlassEffect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  
  // Use shared visibility hook
  const { isVisible, opacity } = useVisibilityState(2000);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Dynamic import of Three.js to avoid SSR issues
    const initThree = async () => {
      try {
        // Import Three.js and postprocessing dynamically
        const THREE = await import('three');
        const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
        const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
        const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
        const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');

        // Initialize scene, camera, renderer
        const container = containerRef.current;
        if (!container) return; // Extra safety check
        
        // Determine if we should use dark theme based on prefers-color-scheme
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.z = 5;
        cameraRef.current = camera;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ 
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Add custom fragment shader for transparency control
        const customShader = {
          uniforms: {
            'tDiffuse': { value: null },
            'opacity': { value: 1.0 }
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
            uniform float opacity;
            varying vec2 vUv;
            void main() {
              vec4 texel = texture2D(tDiffuse, vUv);
              gl_FragColor = texel * opacity;
            }
          `
        };
        
        // Create post-processing setup
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // Add bloom effect
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(container.clientWidth, container.clientHeight),
          prefersDarkScheme ? 0.5 : 0.3,  // Reduced strength for subtler glow
          1.0,  // Slightly increased radius for softer bloom
          0.45  // Higher threshold to reduce bloom on darker elements
        );
        composer.addPass(bloomPass);
        
        // Add opacity shader as final pass
        const opacityPass = new ShaderPass(customShader);
        opacityPass.renderToScreen = true;
        composer.addPass(opacityPass);
        
        composerRef.current = composer;
        
        // Create a grid of moving spheres
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        // Darker color and reduced intensity for the spheres
        const baseColor = prefersDarkScheme ? 0x3B1193 : 0x6941C6; // Darker purple in both modes
        const material = new THREE.MeshBasicMaterial({ 
          color: baseColor,
          transparent: true, 
          opacity: 0.5, // Reduced opacity to dim the effect
        });
        
        // Create a grid of spheres
        const rows = 10;
        const cols = 10;
        const spacing = 1.5;
        
        // Calculate total width and height of grid
        const totalWidth = (cols - 1) * spacing;
        const totalHeight = (rows - 1) * spacing;
        
        // Center the grid
        const startX = -totalWidth / 2;
        const startY = -totalHeight / 2;
        
        // Create animation data for each sphere
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const sphere = new THREE.Mesh(geometry, material.clone());
            
            // Set initial position
            sphere.position.x = startX + j * spacing;
            sphere.position.y = startY + i * spacing;
            sphere.position.z = 0;
            
            // Randomize size - make overall size smaller for less dominating effect
            const scale = THREE.MathUtils.randFloat(0.4, 1.2);
            sphere.scale.set(scale, scale, scale);
            
            // Add random animation parameters to the sphere - slow down movement
            sphere.userData.animation = {
              phase: Math.random() * Math.PI * 2,
              speed: THREE.MathUtils.randFloat(0.3, 0.8), // Slower speed for more subtle movement
              amplitude: THREE.MathUtils.randFloat(0.1, 0.5), // Lower amplitude for less dramatic movement
              direction: THREE.MathUtils.randFloatSpread(2) > 0 ? 1 : -1,
            };
            
            scene.add(sphere);
          }
        }
        
        // Handle window resize
        const handleResize = () => {
          if (!containerRef.current) return;
          
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          
          renderer.setSize(width, height);
          composer.setSize(width, height);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Animation loop
        const animate = (time: number) => {
          time *= 0.001; // Convert to seconds
          
          // Update sphere positions
          scene.children.forEach((object: any) => {
            if (object instanceof THREE.Mesh && object.userData.animation) {
              const anim = object.userData.animation;
              
              // Add sinusoidal movement
              object.position.z = Math.sin(time * anim.speed + anim.phase) * anim.amplitude;
              
              // Add slight rotation
              object.rotation.x = time * 0.2 * anim.direction;
              object.rotation.y = time * 0.3 * anim.direction;
            }
          });
          
          // Update opacity uniform
          if (composerRef.current) {
            const lastPass = composerRef.current.passes[composerRef.current.passes.length - 1];
            if (lastPass.uniforms?.opacity) {
              lastPass.uniforms.opacity.value = opacity;
            }
          }
          
          // Render the scene with composer
          composerRef.current.render();
          
          // Continue animation loop if we're visible or fading
          if (isVisible || opacity > 0) {
            animFrameRef.current = requestAnimationFrame(animate);
          }
        };
        
        // Start animation loop
        animFrameRef.current = requestAnimationFrame(animate);
        
        // Cleanup function
        return () => {
          cancelAnimationFrame(animFrameRef.current);
          window.removeEventListener('resize', handleResize);
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };
      } catch (error) {
        console.error('Error initializing Three.js:', error);
      }
    };

    // Initialize Three.js
    initThree();
    
    // Clean up
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
} 