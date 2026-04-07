'use client';

import { useEffect, useRef } from 'react';

export default function LightningManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleClick = (e: MouseEvent) => {
      if (!ctx || !canvas) return;
      
      const targetX = e.clientX;
      const targetY = e.clientY;
      const startX = targetX + (Math.random() - 0.5) * 200;
      const startY = 0;
      
      ctx.strokeStyle = 'rgba(235, 99, 37, 0.9)'; // Amber-Red for Admin
      ctx.lineWidth = 4;
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#eb3d25';
      
      let curX = startX;
      let curY = startY;
      
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      
      while (curY < targetY) {
        curX += (Math.random() - 0.5) * 60;
        curY += Math.random() * 60;
        ctx.lineTo(curX, curY);
      }
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      
      // Admin Flash
      const flash = document.createElement('div');
      Object.assign(flash.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: 'rgba(235, 61, 37, 0.05)', pointerEvents: 'none', zIndex: '9999',
        transition: 'opacity 0.2s ease-out'
      });
      document.body.appendChild(flash);
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => document.body.removeChild(flash), 200);
      }, 50);

      setTimeout(() => {
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 150);
    };

    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[10000]"
    />
  );
}
