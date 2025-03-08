"use client";

import React, { useCallback, useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'spark' | 'glow';
}

interface ParticleSystemProps {
  anchor?: 'left' | 'right';
  intensity?: number;
  colors?: string[];
  width?: number; 
  height?: number;
}

// Helper to properly format RGBA color strings
const formatRGBA = (baseColor: string, alpha: number): string => {
  // Handle rgba format
  if (baseColor.startsWith('rgba')) {
    // Extract the RGB components from rgba(r, g, b, a)
    const rgbParts = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/) || [];
    if (rgbParts.length >= 4) {
      return `rgba(${rgbParts[1]}, ${rgbParts[2]}, ${rgbParts[3]}, ${alpha})`;
    }
  }
  
  // Handle rgb format
  if (baseColor.startsWith('rgb')) {
    // Extract the RGB components from rgb(r, g, b)
    const rgbParts = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) || [];
    if (rgbParts.length >= 4) {
      return `rgba(${rgbParts[1]}, ${rgbParts[2]}, ${rgbParts[3]}, ${alpha})`;
    }
  }
  
  // Handle hex format - convert to rgba
  if (baseColor.startsWith('#')) {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Fallback
  return `rgba(100, 100, 100, ${alpha})`;
};

export default function ParticleSystem({
  anchor = 'left',
  intensity = 1,
  colors = ['#64ffda', '#4cffef', '#a5f3ff', '#7e8ce0', '#4354b9'],
  width = 100,
  height = 800
}: ParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Animation state tracking for recovery
  const isVisibleRef = useRef<boolean>(true);
  const isAnimatingRef = useRef<boolean>(false);
  
  // Helper function for random values
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  
  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isVisibleRef.current = false;
      // Pause animation when page is hidden
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        isAnimatingRef.current = false;
      }
    } else {
      isVisibleRef.current = true;
      // Resume animation when page becomes visible again
      if (!isAnimatingRef.current) {
        lastTimeRef.current = performance.now(); // Reset time to avoid huge jumps
        animFrameRef.current = requestAnimationFrame(animate);
        isAnimatingRef.current = true;
      }
    }
  }, []);
  
  // Safely start the animation loop
  const startAnimationLoop = useCallback(() => {
    if (!isAnimatingRef.current && isVisibleRef.current) {
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(animate);
      isAnimatingRef.current = true;
    }
  }, []);
  
  // Initialize canvasgithub

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    
    canvasRef.current = canvas;
    containerRef.current.appendChild(canvas);
    
    // Get canvas context
    ctxRef.current = canvas.getContext('2d');
    
    // Set up visibility change detection and recovery mechanisms
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', startAnimationLoop);
    window.addEventListener('blur', () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        isAnimatingRef.current = false;
      }
    });
    window.addEventListener('online', startAnimationLoop); // Recovery when network reconnects
    window.addEventListener('resize', startAnimationLoop); // Recovery on resize
    
    // Start animation loop
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);
    isAnimatingRef.current = true;
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', startAnimationLoop);
      window.removeEventListener('blur', () => {});
      window.removeEventListener('online', startAnimationLoop);
      window.removeEventListener('resize', startAnimationLoop);
      
      cancelAnimationFrame(animFrameRef.current);
      if (containerRef.current && canvas) {
        containerRef.current.removeChild(canvas);
      }
    };
  }, [anchor, width, height, handleVisibilityChange, startAnimationLoop]);
  
  // Generate particles periodically
  const generateParticles = (deltaTime: number) => {
    if (!canvasRef.current) return;
    
    // Calculate number of particles to generate based on intensity and frame time
    const particlesToGenerate = Math.floor(random(0, 2) * intensity * (deltaTime / 16));
    
    for (let i = 0; i < particlesToGenerate; i++) {
      // Determine x position based on anchor
      const x = anchor === 'left' 
        ? random(-10, 30) 
        : random(width - 30, width + 10);
      
      // Randomize particle type
      const type = Math.random() > 0.7 
        ? (Math.random() > 0.5 ? 'spark' : 'glow') 
        : 'dust';
        
      // Randomize properties based on particle type
      let size, speedX, speedY, alpha, decay, maxLife;
      
      switch (type) {
        case 'spark':
          size = random(1, 3);
          speedX = (anchor === 'left' ? 1 : -1) * random(1, 3);
          speedY = random(-0.5, 0.5);
          alpha = random(0.8, 1);
          decay = random(0.005, 0.015);
          maxLife = random(30, 60);
          break;
        case 'glow':
          size = random(5, 12);
          speedX = (anchor === 'left' ? 1 : -1) * random(0.2, 0.6);
          speedY = random(-0.2, 0.2);
          alpha = random(0.3, 0.5);
          decay = random(0.002, 0.008);
          maxLife = random(50, 100);
          break;
        case 'dust':
        default:
          size = random(0.5, 2);
          speedX = (anchor === 'left' ? 1 : -1) * random(0.3, 1);
          speedY = random(-0.3, 0.3);
          alpha = random(0.4, 0.7);
          decay = random(0.01, 0.02);
          maxLife = random(20, 40);
      }
      
      // Add new particle
      particlesRef.current.push({
        x,
        y: random(0, height),
        size,
        speedX,
        speedY,
        color: colors[Math.floor(random(0, colors.length))],
        alpha,
        decay,
        life: 0,
        maxLife,
        type
      });
    }
  };
  
  // Animation loop - separate function to allow for recovery
  function animate(timestamp: number) {
    if (!isVisibleRef.current) {
      isAnimatingRef.current = false;
      return;
    }
    
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    if (!ctx || !canvas) {
      isAnimatingRef.current = false;
      return;
    }
    
    // Calculate delta time, capping it to prevent huge jumps after sleep/wake cycles
    const now = timestamp;
    const maxDelta = 100; // Cap at 100ms (prevents huge time jumps after sleep)
    const deltaTime = Math.min(now - lastTimeRef.current, maxDelta);
    lastTimeRef.current = now;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate new particles - scaled to frame time
    generateParticles(deltaTime);
    
    // Calculate time scaling factor for consistent animation speeds
    const timeScale = deltaTime / 16.667; // 16.667ms is ~60fps
    
    // Update and draw particles
    particlesRef.current.forEach((particle, index) => {
      // Update position - scaled to frame time
      particle.x += particle.speedX * timeScale;
      particle.y += particle.speedY * timeScale;
      
      // Update life and alpha - scaled to frame time
      particle.life += timeScale;
      particle.alpha -= particle.decay * timeScale;
      
      // Remove dead particles
      if (particle.alpha <= 0 || particle.life >= particle.maxLife) {
        particlesRef.current.splice(index, 1);
        return;
      }
      
      // Draw particle based on type
      switch (particle.type) {
        case 'spark':
          // Draw as small sharp point
          ctx.beginPath();
          ctx.fillStyle = formatRGBA(particle.color, particle.alpha);
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'glow':
          // Draw as gradient glow
          const glowGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
          );
          glowGradient.addColorStop(0, formatRGBA(particle.color, particle.alpha * 1.2));
          glowGradient.addColorStop(1, formatRGBA(particle.color, 0));
          
          ctx.beginPath();
          ctx.fillStyle = glowGradient;
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'dust':
        default:
          // Draw as simple circle
          ctx.beginPath();
          ctx.fillStyle = formatRGBA(particle.color, particle.alpha);
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
      }
    });
    
    // Continue animation
    isAnimatingRef.current = true;
    animFrameRef.current = requestAnimationFrame(animate);
  }
  
  return (
    <div 
      ref={containerRef} 
      className="particle-system" 
      style={{
        position: 'absolute',
        top: 0,
        [anchor]: 0,
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 30
      }}
    />
  );
} 