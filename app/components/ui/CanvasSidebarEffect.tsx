"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CanvasSidebarEffectProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  width: number;
}

// Helper function to generate random number within a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

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

export default function CanvasSidebarEffect({ isOpen, toggleSidebar, width }: CanvasSidebarEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const fogParticlesRef = useRef<any[]>([]);
  const cursorTrailRef = useRef<any[]>([]);
  const animationProgressRef = useRef<number>(isOpen ? 1 : 0);
  const targetProgressRef = useRef<number>(isOpen ? 1 : 0);
  const frictionPointsRef = useRef<number[]>([0.3, 0.6, 0.9]);
  const lastMousePosRef = useRef<{x: number, y: number} | null>(null);
  const colorScheme = useRef({
    particleColors: ['#64ffda', '#4cffef', '#a5f3ff', '#7e8ce0', '#4354b9'],
    fogColors: ['rgba(30, 41, 59, 0.2)', 'rgba(45, 55, 72, 0.1)', 'rgba(15, 23, 42, 0.15)'],
    reflectionGradient: ['rgba(99, 102, 241, 0.6)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.6)']
  });
  
  // Animation state tracker - helps recover from page/visibility events
  const isVisibleRef = useRef<boolean>(true);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const isAnimatingRef = useRef<boolean>(false);

  // Handle mouse movement for cursor trails
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Add particle to cursor trail
    if (lastMousePosRef.current) {
      const { x: lastX, y: lastY } = lastMousePosRef.current;
      // Only add a new trail particle if mouse has moved significantly
      if (Math.hypot(x - lastX, y - lastY) > 5) {
        cursorTrailRef.current.push({
          x, 
          y,
          size: random(4, 7),
          alpha: 0.8,
          color: colorScheme.current.particleColors[
            Math.floor(random(0, colorScheme.current.particleColors.length))
          ],
          decay: random(0.02, 0.05)
        });
      }
    }
    
    lastMousePosRef.current = { x, y };
  }, []);

  // Handle visibility change - pause/resume animations when page is hidden/visible
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isVisibleRef.current = false;
      
      // Pause animation loop by canceling the frame
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        isAnimatingRef.current = false;
      }
    } else {
      isVisibleRef.current = true;
      
      // Resume animation loop if it was previously running but got paused
      if (!isAnimatingRef.current) {
        lastFrameTimeRef.current = performance.now(); // Reset timer to avoid huge time deltas
        requestRef.current = requestAnimationFrame(animate);
        isAnimatingRef.current = true;
      }
    }
  }, []);
  
  // Safely start the animation loop
  const startAnimationLoop = useCallback(() => {
    if (!isAnimatingRef.current && isVisibleRef.current) {
      lastFrameTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
      isAnimatingRef.current = true;
    }
  }, []);
  
  // Safely stop the animation loop
  const stopAnimationLoop = useCallback(() => {
    if (isAnimatingRef.current) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      isAnimatingRef.current = false;
    }
  }, []);

  // Initialize animation target when isOpen changes
  useEffect(() => {
    targetProgressRef.current = isOpen ? 1 : 0;
    
    // Update animation target
    if (isOpen !== (animationProgressRef.current === 1)) {
      // Reset particle system when toggling
      particlesRef.current = [];
    }
  }, [isOpen]);

  // Set up canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up visibility change detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Additional recovery methods for mobile and sleep scenarios
    window.addEventListener('focus', startAnimationLoop);
    window.addEventListener('blur', stopAnimationLoop);
    window.addEventListener('online', startAnimationLoop); // Resume when network reconnects
    window.addEventListener('resize', startAnimationLoop); // Resume on resize (common wake trigger)

    // Resize canvas to match device pixel ratio for sharpness
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    // Initialize fog particles
    const initFogParticles = () => {
      fogParticlesRef.current = [];
      const numParticles = 20;
      for (let i = 0; i < numParticles; i++) {
        fogParticlesRef.current.push({
          x: random(0, canvas.width),
          y: random(0, canvas.height),
          size: random(30, 120),
          speedX: random(-0.2, 0.2),
          speedY: random(-0.1, 0.1),
          alpha: random(0.02, 0.06),
          color: colorScheme.current.fogColors[
            Math.floor(random(0, colorScheme.current.fogColors.length))
          ]
        });
      }
    };

    // Listen for resize
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Initial setup
    resizeCanvas();
    initFogParticles();
    
    // Start animation loop
    lastFrameTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);
    isAnimatingRef.current = true;
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', startAnimationLoop);
      window.removeEventListener('blur', stopAnimationLoop);
      window.removeEventListener('online', startAnimationLoop);
      window.removeEventListener('resize', startAnimationLoop);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        isAnimatingRef.current = false;
      }
    };
  }, [handleMouseMove, handleVisibilityChange, startAnimationLoop, stopAnimationLoop]);

  // Animation function
  const animate = () => {
    if (!isVisibleRef.current) {
      isAnimatingRef.current = false;
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) {
      isAnimatingRef.current = false;
      return;
    }
    
    // Calculate time delta, capping it to prevent huge jumps after sleep
    const now = performance.now();
    const maxDelta = 100; // Cap at 100ms (prevents huge time jumps after sleep)
    const delta = Math.min(now - lastFrameTimeRef.current, maxDelta);
    lastFrameTimeRef.current = now;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate current position for animation
    const currentProgress = animationProgressRef.current;
    const targetProgress = targetProgressRef.current;
    
    // Smooth animation progress
    if (currentProgress !== targetProgress) {
      // Use delta time for smooth animation regardless of frame rate
      const speedFactor = 0.005; // Adjust this for animation speed
      const animDelta = (targetProgress - currentProgress) * speedFactor * (delta / 16.667);
      animationProgressRef.current += animDelta;
      
      // Prevent overshooting
      if ((targetProgress > currentProgress && animationProgressRef.current > targetProgress) ||
          (targetProgress < currentProgress && animationProgressRef.current < targetProgress)) {
        animationProgressRef.current = targetProgress;
      }
      
      // Check for friction points to trigger particles
      const currentProgressAdjusted = animationProgressRef.current > targetProgress 
        ? 1 - animationProgressRef.current 
        : animationProgressRef.current;
        
      frictionPointsRef.current.forEach(point => {
        // Create particle burst at friction points
        if (Math.abs(currentProgressAdjusted - point) < 0.01) {
          // Calculate physical position for particle emission
          const emitX = isOpen ? width * point : width * (1 - point);
          const particleBurst = 15;
          for (let i = 0; i < particleBurst; i++) {
            particlesRef.current.push({
              x: emitX,
              y: random(0, canvas.height),
              size: random(1, 3),
              speedX: random(-2, 2) * (isOpen ? 1 : -1),
              speedY: random(-1, 1),
              gravity: 0.02,
              alpha: 1,
              color: colorScheme.current.particleColors[
                Math.floor(random(0, colorScheme.current.particleColors.length))
              ],
              decay: random(0.01, 0.03)
            });
          }
          
          // Add reflection flash
          particlesRef.current.push({
            x: emitX,
            y: canvas.height / 2,
            size: canvas.height * 0.5,
            speedX: 0,
            speedY: 0,
            isReflection: true,
            alpha: 0.7,
            decay: 0.1
          });
        }
      });
    }
    
    // Scale animation speed by delta time for consistent speeds across devices
    const timeScale = delta / 16.667; // 16.667ms is ~60fps
    
    // Draw fog particles
    fogParticlesRef.current.forEach((particle) => {
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0, 
        particle.x, particle.y, particle.size
      );
      
      // Use our helper to correctly format the colors
      const innerColor = formatRGBA(particle.color, particle.alpha);
      const outerColor = formatRGBA(particle.color, 0);
      
      gradient.addColorStop(0, innerColor);
      gradient.addColorStop(1, outerColor);
      
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Move fog particles - scale by time delta for consistent speed
      particle.x += particle.speedX * timeScale;
      particle.y += particle.speedY * timeScale;
      
      // Wrap around canvas
      if (particle.x < -particle.size) particle.x = canvas.width + particle.size;
      if (particle.x > canvas.width + particle.size) particle.x = -particle.size;
      if (particle.y < -particle.size) particle.y = canvas.height + particle.size;
      if (particle.y > canvas.height + particle.size) particle.y = -particle.size;
    });
    
    // Draw cursor trail
    cursorTrailRef.current.forEach((particle, index) => {
      ctx.beginPath();
      
      // Use our helper to correctly format the color
      ctx.fillStyle = formatRGBA(particle.color, particle.alpha);
      
      // Gradient effect for trail
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0, 
        particle.x, particle.y, particle.size
      );
      
      gradient.addColorStop(0, formatRGBA(particle.color, particle.alpha));
      gradient.addColorStop(1, formatRGBA(particle.color, 0));
      
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Fade cursor trail - scaled by time delta
      particle.alpha -= particle.decay * timeScale;
      
      // Remove faded particles
      if (particle.alpha <= 0) {
        cursorTrailRef.current.splice(index, 1);
      }
    });
    
    // Draw friction particles
    particlesRef.current.forEach((particle, index) => {
      if (particle.isReflection) {
        // Draw light reflection/flare
        const gradient = ctx.createLinearGradient(
          particle.x - particle.size, particle.y,
          particle.x + particle.size, particle.y
        );
        
        colorScheme.current.reflectionGradient.forEach((color, i) => {
          gradient.addColorStop(i / (colorScheme.current.reflectionGradient.length - 1), 
            formatRGBA(color, particle.alpha));
        });
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
          particle.x, particle.y, 
          particle.size, particle.size * 0.2, 
          Math.PI / 4, 0, Math.PI * 2
        );
        ctx.fill();
      } else {
        // Draw regular particles
        ctx.beginPath();
        ctx.fillStyle = formatRGBA(particle.color, particle.alpha);
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Update particle position - scaled by time delta
      particle.x += particle.speedX * timeScale;
      particle.y += particle.speedY * timeScale;
      
      // Apply gravity - scaled by time delta
      if (particle.gravity) {
        particle.speedY += particle.gravity * timeScale;
      }
      
      // Fade particle - scaled by time delta
      particle.alpha -= particle.decay * timeScale;
      
      // Remove faded particles
      if (particle.alpha <= 0) {
        particlesRef.current.splice(index, 1);
      }
    });
    
    // Draw sidebar position indicator based on animation progress
    const sidebarWidth = width * animationProgressRef.current;
    
    // Draw light sweep effect - a horizontal light reflection that moves across the sidebar
    // Use a fixed-rate animation independent of sleep/wake
    const sweepProgress = ((now % 10000) / 10000); // 10-second cycle
    const sweepPosition = sweepProgress * canvas.width;
    
    if (animationProgressRef.current > 0.05) {
      const gradientWidth = width * 0.4;
      const lightGradient = ctx.createLinearGradient(
        sweepPosition - gradientWidth/2, 0,
        sweepPosition + gradientWidth/2, 0
      );
      lightGradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
      lightGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
      lightGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, sidebarWidth, canvas.height);
    }
    
    // Continue animation loop
    isAnimatingRef.current = true;
    requestRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Toggle Button with Glass Effect */}
      <motion.button
        className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full backdrop-blur-lg bg-opacity-20 bg-gray-800 flex items-center justify-center overflow-hidden group"
        style={{
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClick={toggleSidebar}
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' 
        }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 group-hover:opacity-100 opacity-60 transition-opacity duration-300" />
        <div className="relative">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
} 