"use client";
import React, { useEffect, useRef } from "react";

export default function CursorTexture() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouse = { x: width / 2, y: height / 2 };

    canvas.width = width;
    canvas.height = height;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      // Draw subtle noise
      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const dist = Math.hypot(x - mouse.x, y - mouse.y);
        const alpha = Math.max(0.04, 0.18 - dist / 600);
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.08})`;
        ctx.fillRect(x, y, 1, 1);
      }
      // Draw interactive ripple
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 80, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 32;
      ctx.stroke();
    }

    function animate() {
      draw();
      requestAnimationFrame(animate);
    }
    animate();

    function handleMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("resize", () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });
    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.7,
        mixBlendMode: "multiply",
      }}
      aria-hidden="true"
    />
  );
}
