/**
 * Components - ParticleSphere
 * WebGL 粒子球可视化组件
 * 独立展示，不与 Canvas 2D 重叠
 * 放置于侧边栏顶部
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAIStatusStore, type AIStatus } from '@/store/aiStatusStore';

// Vertex Shader
const VERTEX_SHADER = `
  precision mediump float;
  
  attribute vec3 a_position;
  attribute float a_size;
  attribute float a_alpha;
  
  uniform float u_time;
  uniform float u_status; // 0=idle, 1=thinking, 2=typing
  
  varying float v_alpha;
  
  void main() {
    // 旋转效果
    float angle = u_time * 0.5 * (0.5 + u_status * 0.3);
    float c = cos(angle);
    float s = sin(angle);
    
    vec3 pos = a_position;
    pos.x = a_position.x * c - a_position.z * s;
    pos.z = a_position.x * s + a_position.z * c;
    pos.y = a_position.y * (1.0 + 0.1 * sin(u_time));
    
    gl_Position = vec4(pos * 0.8, 1.0);
    gl_PointSize = a_size * (1.0 + 0.2 * sin(u_time * 2.0 + a_position.x));
    v_alpha = a_alpha;
  }
`;

// Fragment Shader
const FRAGMENT_SHADER = `
  precision mediump float;
  
  varying float v_alpha;
  uniform float u_status;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) discard;
    
    // 径向渐变
    float alpha = (1.0 - dist * 2.0) * v_alpha;
    
    // 根据状态变色
    vec3 color;
    if (u_status < 0.5) {
      // idle - 蓝色
      color = vec3(0.23, 0.51, 0.96);
    } else if (u_status < 1.5) {
      // thinking - 紫色
      color = vec3(0.55, 0.36, 0.96);
    } else {
      // typing - 青色
      color = vec3(0.02, 0.71, 0.83);
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
}

export function ParticleSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);

  const status = useAIStatusStore((state) => state.status);

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

    // 编译着色器
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // 创建程序
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    programRef.current = program;

    // 初始化粒子 - 球形分布
    initParticles();

    // 启用混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }, []);

  // 创建着色器
  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  // 创建程序
  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  // 初始化粒子 - 球形分布
  const initParticles = () => {
    const particles: Particle[] = [];
    const particleCount = 50;

    // 斐波那契球面分布
    const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; // y 从 1 到 -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      particles.push({
        x: Math.cos(theta) * radius * 0.7,
        y: y * 0.7,
        z: Math.sin(theta) * radius * 0.7,
        size: 8 + Math.random() * 6,
        alpha: 0.4 + Math.random() * 0.4,
      });
    }

    particlesRef.current = particles;
  };

  // 渲染循环
  const render = useCallback((time: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    // 清空
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // 状态值
    let statusValue = 0;
    if (status === 'thinking') statusValue = 1;
    else if (status === 'typing') statusValue = 2;

    // 设置 uniforms
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(timeLocation, time * 0.001);

    const statusLocation = gl.getUniformLocation(program, 'u_status');
    gl.uniform1f(statusLocation, statusValue);

    // 准备数据
    const particles = particlesRef.current;
    const positions: number[] = [];
    const sizes: number[] = [];
    const alphas: number[] = [];

    for (const p of particles) {
      positions.push(p.x, p.y, p.z);
      sizes.push(p.size);
      alphas.push(p.alpha);
    }

    // 绑定位置
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // 绑定大小
    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    const sizeLoc = gl.getAttribLocation(program, 'a_size');
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);

    // 绑定透明度
    const alphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW);
    const alphaLoc = gl.getAttribLocation(program, 'a_alpha');
    gl.enableVertexAttribArray(alphaLoc);
    gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0);

    // 绘制
    gl.drawArrays(gl.POINTS, 0, particles.length);

    animationRef.current = requestAnimationFrame(render);
  }, [status]);

  // 初始化和清理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置尺寸
    canvas.width = 120;
    canvas.height = 120;

    initWebGL();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initWebGL, render]);

  return (
    <div className="flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="particle-sphere"
        style={{
          width: '80px',
          height: '80px',
        }}
      />
    </div>
  );
}
