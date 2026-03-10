/**
 * Components - AIAuraVisualizer
 * Canvas AI 光环可视化组件 (增强版)
 * 展示图形学编程能力 - 粒子系统 + 连线网络 + 波纹动画
 * 知识网络可视化效果
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAIStatusStore, type AIStatus } from '@/store/aiStatusStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  hue: number;
  pulsePhase: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  hue: number;
}

interface MousePosition {
  x: number;
  y: number;
  active: boolean;
}

// 颜色配置
const COLORS = [
  { hex: '#3b82f6', hue: 217 }, // Blue
  { hex: '#8b5cf6', hue: 265 }, // Purple
  { hex: '#06b6d4', hue: 187 }, // Cyan
  { hex: '#6366f1', hue: 239 }, // Indigo
  { hex: '#10b981', hue: 160 }, // Emerald
  { hex: '#f59e0b', hue: 38 },  // Amber
];

export function AIAuraVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastTimeRef = useRef<number>(0);
  const streamRateRef = useRef<number>(0);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0, active: false });
  const ctxScaleRef = useRef<number>(1);

  const status = useAIStatusStore((state) => state.status);
  const streamRate = useAIStatusStore((state) => state.streamRate);

  // 更新流速参考值
  useEffect(() => {
    streamRateRef.current = streamRate;
  }, [streamRate]);

  // 初始化粒子
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
      const colorConfig = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1.5,
        baseRadius: Math.random() * 2 + 1.5,
        alpha: Math.random() * 0.4 + 0.2,
        baseAlpha: Math.random() * 0.4 + 0.2,
        color: colorConfig.hex,
        hue: colorConfig.hue,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  // 绘制连接线 (知识网络效果)
  const drawConnections = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    maxDistance: number
  ) => {
    const particles = particlesRef.current;
    const connectionAlpha = status === 'typing' ? 0.15 : status === 'thinking' ? 0.08 : 0.05;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * connectionAlpha;
          const gradient = ctx.createLinearGradient(
            particles[i].x, particles[i].y,
            particles[j].x, particles[j].y
          );
          gradient.addColorStop(0, `hsla(${particles[i].hue}, 70%, 60%, ${alpha})`);
          gradient.addColorStop(1, `hsla(${particles[j].hue}, 70%, 60%, ${alpha})`);
          
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }, [status]);

  // 绘制粒子 (带发光效果)
  const drawParticles = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    status: AIStatus,
    time: number
  ) => {
    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    
    // 根据状态调整参数
    let speedMultiplier = 0.5;
    let glowIntensity = 1;
    let pulseSpeed = 1;

    if (status === 'thinking') {
      speedMultiplier = 0.3;
      glowIntensity = 1.5;
      pulseSpeed = 0.5;
    } else if (status === 'typing') {
      speedMultiplier = 1 + streamRateRef.current * 0.15;
      glowIntensity = 2;
      pulseSpeed = 2;
    }

    for (const particle of particles) {
      // 更新位置
      particle.x += particle.vx * speedMultiplier;
      particle.y += particle.vy * speedMultiplier;

      // 鼠标交互
      if (mouse.active) {
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          particle.x += (dx / dist) * force * 2;
          particle.y += (dy / dist) * force * 2;
        }
      }

      // 边界反弹
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      // 脉冲效果
      particle.pulsePhase += 0.02 * pulseSpeed;
      const pulse = Math.sin(particle.pulsePhase) * 0.3 + 1;
      particle.radius = particle.baseRadius * pulse;

      // 绘制发光效果
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 4
      );
      gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${particle.alpha * glowIntensity})`);
      gradient.addColorStop(0.4, `hsla(${particle.hue}, 70%, 50%, ${particle.alpha * glowIntensity * 0.5})`);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 绘制核心
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${particle.hue}, 90%, 70%, ${particle.alpha})`;
      ctx.fill();
    }
  }, []);

  // 绘制波纹 (thinking 状态)
  const drawRipples = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    deltaTime: number
  ) => {
    const ripples = ripplesRef.current;
    const centerX = width / 2;
    const centerY = height / 2;

    // 定期生成新波纹
    if (Math.random() < 0.015) {
      const colorConfig = COLORS[Math.floor(Math.random() * COLORS.length)];
      ripples.push({
        x: centerX + (Math.random() - 0.5) * width * 0.6,
        y: centerY + (Math.random() - 0.5) * height * 0.6,
        radius: 0,
        maxRadius: Math.min(width, height) * 0.35,
        alpha: 0.4,
        hue: colorConfig.hue,
      });
    }

    // 更新和绘制波纹
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.radius += deltaTime * 0.04;
      ripple.alpha -= deltaTime * 0.0008;

      if (ripple.alpha <= 0 || ripple.radius > ripple.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      // 多层波纹
      for (let j = 0; j < 3; j++) {
        const layerRadius = ripple.radius - j * 20;
        if (layerRadius > 0) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, layerRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${ripple.hue}, 70%, 60%, ${ripple.alpha * (1 - j * 0.3)})`;
          ctx.lineWidth = 1.5 - j * 0.3;
          ctx.stroke();
        }
      }
    }
  }, []);

  // 绘制背景
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height);

    // 多层径向渐变
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );

    if (status === 'typing') {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.08)');
      gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.04)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    } else if (status === 'thinking') {
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
      gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.06)');
      gradient.addColorStop(0.6, 'rgba(99, 102, 241, 0.03)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      gradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.03)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, [status]);

  // 主渲染循环
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = Math.min(time - lastTimeRef.current, 50); // 限制最大 deltaTime
    lastTimeRef.current = time;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 应用缩放
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // 绘制背景
    drawBackground(ctx, width, height);

    // 绘制连接线
    const connectionDistance = status === 'typing' ? 150 : status === 'thinking' ? 120 : 100;
    drawConnections(ctx, width, height, connectionDistance);

    // 绘制粒子
    drawParticles(ctx, width, height, status, time);

    // 绘制波纹 (仅 thinking 状态)
    if (status === 'thinking') {
      drawRipples(ctx, width, height, deltaTime);
    }

    ctx.restore();

    // 继续动画循环
    animationRef.current = requestAnimationFrame(render);
  }, [status, drawBackground, drawConnections, drawParticles, drawRipples]);

  // 初始化 Canvas 和处理 Retina
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    ctxScaleRef.current = dpr;

    // 设置实际尺寸
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // 设置显示尺寸
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // 初始化粒子
    initParticles(rect.width, rect.height);

    // 启动渲染循环
    animationRef.current = requestAnimationFrame(render);

    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, render]);

  // 鼠标交互
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // 重新初始化粒子
      initParticles(rect.width, rect.height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="aura-canvas"
      aria-hidden="true"
    />
  );
}
