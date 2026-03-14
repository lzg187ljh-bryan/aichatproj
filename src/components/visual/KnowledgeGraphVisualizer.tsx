/**
 * Components - KnowledgeGraphVisualizer
 * WebGL 知识图谱可视化组件
 * 使用原生 WebGL 实现高性能粒子系统
 * 与 Canvas AIAuraVisualizer 互补，展示图形学深度
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAIStatusStore, type AIStatus } from '@/store/aiStatusStore';

// WebGL Shader Sources
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute vec3 a_color;
  attribute float a_alpha;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  
  varying vec3 v_color;
  varying float v_alpha;
  
  void main() {
    // 将坐标从像素空间转换到裁剪空间
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    
    // 动态大小
    gl_PointSize = a_size * (1.0 + 0.2 * sin(u_time * 2.0 + a_position.x * 0.01));
    
    v_color = a_color;
    v_alpha = a_alpha;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec3 v_color;
  varying float v_alpha;
  
  void main() {
    // 圆形粒子
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    // 柔和边缘
    float alpha = v_alpha * (1.0 - smoothstep(0.3, 0.5, dist));
    gl_FragColor = vec4(v_color, alpha);
  }
`;

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  color: [number, number, number];
  alpha: number;
}

interface Connection {
  from: number;
  to: number;
  alpha: number;
}

export function KnowledgeGraphVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const lastTimeRef = useRef<number>(0);

  const status = useAIStatusStore((state) => state.status);
  const streamRate = useAIStatusStore((state) => state.streamRate);

  // 初始化 WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // 编译 Shader
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // 创建 Program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    programRef.current = program;

    // 初始化粒子
    initParticles(canvas.width, canvas.height);

    // 启用混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  }, []);

  // 创建 Shader
  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  // 创建 Program
  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  // 初始化粒子
  const initParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    const connections: Connection[] = [];

    // 中心节点
    particles.push({
      x: width / 2,
      y: height / 2,
      z: 0,
      vx: 0,
      vy: 0,
      size: 20,
      color: [0.23, 0.51, 0.96], // #3b82f6
      alpha: 1.0,
    });

    // 周围节点 - 知识图谱
    const topics = [
      { x: -150, y: -100, color: [0.55, 0.36, 0.96] as [number, number, number] }, // Purple
      { x: 150, y: -80, color: [0.02, 0.71, 0.83] as [number, number, number] },  // Cyan
      { x: -120, y: 120, color: [0.06, 0.72, 0.51] as [number, number, number] }, // Emerald
      { x: 130, y: 100, color: [0.96, 0.62, 0.04] as [number, number, number] },  // Amber
      { x: 0, y: -180, color: [0.39, 0.39, 0.95] as [number, number, number] },   // Indigo
      { x: -180, y: 0, color: [0.96, 0.26, 0.21] as [number, number, number] },  // Red
      { x: 180, y: 20, color: [0.83, 0.69, 0.22] as [number, number, number] },   // Yellow
      { x: 0, y: 180, color: [0.61, 0.15, 0.69] as [number, number, number] },    // Pink
    ];

    topics.forEach((topic) => {
      particles.push({
        x: width / 2 + topic.x,
        y: height / 2 + topic.y,
        z: 0,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 12 + Math.random() * 8,
        color: topic.color,
        alpha: 0.8,
      });
    });

    // 创建连接
    for (let i = 1; i < particles.length; i++) {
      connections.push({
        from: 0,
        to: i,
        alpha: 0.3,
      });
    }

    particlesRef.current = particles;
    connectionsRef.current = connections;
  };

  // 渲染循环
  const render = useCallback((time: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // 清空画布
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // 设置分辨率
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // 设置时间
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(timeLocation, time * 0.001);

    // 更新粒子位置
    const particles = particlesRef.current;
    let speedMultiplier = 0.5;

    if (status === 'thinking') {
      speedMultiplier = 0.3;
    } else if (status === 'typing') {
      speedMultiplier = 1 + streamRate * 0.1;
    }

    for (const particle of particles) {
      particle.x += particle.vx * speedMultiplier;
      particle.y += particle.vy * speedMultiplier;

      // 边界反弹
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
    }

    // 准备顶点数据
    const positions: number[] = [];
    const sizes: number[] = [];
    const colors: number[] = [];
    const alphas: number[] = [];

    for (const particle of particles) {
      positions.push(particle.x, particle.y);
      sizes.push(particle.size);
      colors.push(...particle.color);
      alphas.push(particle.alpha);
    }

    // 绑定位置属性
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 绑定大小属性
    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);

    const sizeLocation = gl.getAttribLocation(program, 'a_size');
    gl.enableVertexAttribArray(sizeLocation);
    gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

    // 绑定颜色属性
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const colorLocation = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    // 绑定透明度属性
    const alphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW);

    const alphaLocation = gl.getAttribLocation(program, 'a_alpha');
    gl.enableVertexAttribArray(alphaLocation);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

    // 绘制粒子
    gl.drawArrays(gl.POINTS, 0, particles.length);

    // 继续动画循环
    animationRef.current = requestAnimationFrame(render);
  }, [status, streamRate]);

  // 初始化和清理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置 Canvas 尺寸
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    initWebGL();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initWebGL, render]);

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

      initParticles(rect.width, rect.height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="knowledge-graph-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
