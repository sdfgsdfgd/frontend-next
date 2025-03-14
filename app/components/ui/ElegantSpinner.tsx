"use client";

import React from 'react';

export function ElegantSpinner({ size = 24, color = "rgba(138,101,52,0.8)" }) {
  return (
    <div className="elegant-spinner-container">
      <div 
        className="elegant-spinner"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: color,
          borderRightColor: 'transparent',
        }}
      />
      <div 
        className="elegant-spinner-shadow"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: 'rgba(138,101,52,0.3)',
          borderRightColor: 'transparent',
        }}
      />
      
      <style jsx>{`
        .elegant-spinner-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${size + 8}px;
          height: ${size + 8}px;
        }
        
        .elegant-spinner {
          position: absolute;
          border-radius: 50%;
          border-width: 2px;
          border-style: solid;
          animation: elegantSpin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        
        .elegant-spinner-shadow {
          position: absolute;
          border-radius: 50%;
          border-width: 2px;
          border-style: solid;
          animation: elegantSpin 1.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          opacity: 0.5;
          transform: scale(1.2);
        }
        
        @keyframes elegantSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// A more luxurious moon-inspired spinner
export function LunarSpinner({ size = 28 }) {
  return (
    <div className="lunar-spinner">
      <div className="moon">
        <div className="crater crater-1"></div>
        <div className="crater crater-2"></div>
        <div className="crater crater-3"></div>
      </div>
      <div className="orbit"></div>
      
      <style jsx>{`
        .lunar-spinner {
          position: relative;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .moon {
          width: ${size * 0.6}px;
          height: ${size * 0.6}px;
          background: linear-gradient(135deg, rgb(210, 180, 140), rgb(138, 101, 52));
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 ${size * 0.15}px rgba(138, 101, 52, 0.4);
          animation: glow 3s ease-in-out infinite alternate;
          z-index: 2;
        }
        
        .orbit {
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 1px solid rgba(138, 101, 52, 0.3);
          animation: orbit 3s linear infinite;
          box-shadow: 0 0 ${size * 0.1}px rgba(138, 101, 52, 0.2);
        }
        
        .crater {
          position: absolute;
          background: rgba(120, 90, 40, 0.3);
          border-radius: 50%;
        }
        
        .crater-1 {
          width: ${size * 0.15}px;
          height: ${size * 0.15}px;
          top: 15%;
          left: 20%;
        }
        
        .crater-2 {
          width: ${size * 0.1}px;
          height: ${size * 0.1}px;
          top: 55%;
          left: 65%;
        }
        
        .crater-3 {
          width: ${size * 0.12}px;
          height: ${size * 0.12}px;
          top: 40%;
          left: 30%;
        }
        
        @keyframes orbit {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes glow {
          0% {
            box-shadow: 0 0 ${size * 0.15}px rgba(138, 101, 52, 0.4);
          }
          100% {
            box-shadow: 0 0 ${size * 0.25}px rgba(138, 101, 52, 0.7);
          }
        }
      `}</style>
    </div>
  );
}

// A refined spinner that resembles a delicate timepiece or compass
export function LuxurySpinner({ size = 32 }) {
  return (
    <div className="luxury-spinner-container">
      <div className="luxury-spinner">
        <div className="inner-circle"></div>
        <div className="spinner-hand"></div>
        <div className="spinner-hand secondary"></div>
        <div className="center-dot"></div>
      </div>
      <div className="glimmer"></div>
      
      <style jsx>{`
        .luxury-spinner-container {
          position: relative;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .luxury-spinner {
          width: ${size}px;
          height: ${size}px;
          border: 1px solid rgba(138, 101, 52, 0.8);
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 ${size * 0.1}px rgba(138, 101, 52, 0.2);
          background: rgba(10, 10, 10, 0.2);
          backdrop-filter: blur(4px);
        }
        
        .inner-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.7}px;
          height: ${size * 0.7}px;
          border: 1px solid rgba(138, 101, 52, 0.4);
          border-radius: 50%;
        }
        
        .spinner-hand {
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${size * 0.35}px;
          height: 2px;
          background: linear-gradient(to right, rgba(138, 101, 52, 0.6), rgba(210, 180, 140, 0.9));
          transform-origin: left center;
          animation: rotateHand 2s linear infinite;
        }
        
        .spinner-hand.secondary {
          width: ${size * 0.25}px;
          height: 1px;
          background: rgba(210, 180, 140, 0.8);
          animation: rotateHand 6s linear infinite;
        }
        
        .center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.1}px;
          height: ${size * 0.1}px;
          background: rgba(138, 101, 52, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 ${size * 0.05}px rgba(138, 101, 52, 0.5);
        }
        
        .glimmer {
          position: absolute;
          top: -${size * 0.1}px;
          left: ${size * 0.7}px;
          width: ${size * 0.15}px;
          height: ${size * 0.15}px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          filter: blur(1px);
          animation: glimmerEffect 4s ease-in-out infinite;
        }
        
        @keyframes rotateHand {
          0% {
            transform: translateX(0) rotate(0deg);
          }
          100% {
            transform: translateX(0) rotate(360deg);
          }
        }
        
        @keyframes glimmerEffect {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
} 