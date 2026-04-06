/**
 * Components - ParticleSphere
 * WebGL 粒子球可视化组件
 * 全屏背景版本，用于 Greeting 界面
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAIStatusStore } from '@/store/aiStatusStore';

// Vertex Shader
const VERTEX_SHADER = `
  precision mediump float;
  
  attribute vec3 a_position;
  attribute float a_size;
  attribute float a_alpha;
  
  uniform float u_time;
  uniform float u_status;
  uniform vec2 u_resolution;
  
  varying float v_alpha;
  
  void main() {
    // 旋转效果
    float angle = u_time * 0.3 * (0.5 + u_status * 0.2);
    float c = cos(angle);
    float s = sin(angle);
    
    vec3 pos = a_position;
    
    // Y轴旋转
    float newX = pos.x * c - pos.z * s;
    float newZ = pos.x * s + pos.z * c;
    pos.x = newX;
    pos.z = newZ;
    
    // X轴轻微旋转
    float angleX = u_time * 0.1;
    float cy = cos(angleX);
    float sy = sin(angleX);
    float tempY = pos.y * cy - pos.z * sy;
    float tempZ = pos.y * sy + pos.z * cy;
    pos.y = tempY;
    pos.z = tempZ;
    
    // 呼吸效果
    pos *= 1.0 + 0.05 * sin(u_time * 0.5);
    
    gl_Position = vec4(pos * 0.6, 1.0);
    
    // 根据分辨率缩放点大小
    float scale = min(u_resolution.x, u_resolution.y) / 400.0;
    gl_PointSize = a_size * scale * (1.0 + 0.3 * sin(u_time * 2.0 + a_position.x * 3.0));
    
    v_alpha = a_alpha;
  }
`;

// Fragment Shader
const FRAGMENT_SHADER = `
  precision mediump float;
  
  varying float v_alpha;
  uniform float u_status;
  uniform float u_time;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) discard;
    
    // 径向渐变
    float alpha = (1.0 - dist * 2.0) * v_alpha;
    
    // 根据状态变色
    vec3 color;
    if (u_status < 0.5) {
      // idle - 蓝紫渐变
      color = mix(vec3(0.23, 0.51, 0.96), vec3(0.55, 0.36, 0.96), sin(u_time * 0.5) * 0.5 + 0.5);
    } else if (u_status < 1.5) {
      // thinking - 紫色
      color = vec3(0.55, 0.36, 0.96);
    } else {
      // typing - 青色
      color = vec3(0.02, 0.71, 0.83);
    }
    
    gl_FragColor = vec4(color, alpha * 0.8);
  }
`;

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
}

interface ParticleSphereProps {
  className?: string;
}

export function ParticleSphere({ className = '' }: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

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
    const particleCount = 80; // 增加粒子数量

    // 斐波那契球面分布
    const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; // y 从 1 到 -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      particles.push({
        x: Math.cos(theta) * radius,
        y: y,
        z: Math.sin(theta) * radius,
        size: 10 + Math.random() * 8,
        alpha: 0.3 + Math.random() * 0.5,
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

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

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

    // 设置 canvas 尺寸为容器尺寸
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        if (glRef.current) {
          glRef.current.viewport(0, 0, canvas.width, canvas.height);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initWebGL();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initWebGL, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`particle-sphere ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}