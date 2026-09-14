import React, { useEffect, useMemo } from 'react';
import { PenTool, FileText, BookOpen, GraduationCap, Calculator, Award, ClipboardList } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const EXAM_ICONS = [PenTool, FileText, BookOpen, GraduationCap, Calculator, Award, ClipboardList];

const AttractingIcon = ({ mouseX, mouseY, initialX, initialY, iconIndex }: any) => {
  const xTarget = useMotionValue(initialX);
  const yTarget = useMotionValue(initialY);
  const springConfig = { damping: 20, stiffness: 120, mass: 0.5 };
  const x = useSpring(xTarget, springConfig);
  const y = useSpring(yTarget, springConfig);
  
  useEffect(() => {
    const unsub = mouseX.onChange((mx: number) => {
      const my = mouseY.get();
      const dx = mx - initialX;
      const dy = my - initialY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 250 && dist > 0) {
        const force = Math.pow((250 - dist) / 250, 1.2);
        xTarget.set(initialX + dx * force * 0.9);
        yTarget.set(initialY + dy * force * 0.9);
      } else {
        xTarget.set(initialX);
        yTarget.set(initialY);
      }
    });
    return unsub;
  }, [mouseX, mouseY, initialX, initialY, xTarget, yTarget]);

  const Icon = EXAM_ICONS[iconIndex % EXAM_ICONS.length];
  
  const driftX = useMemo(() => Math.random() * 80 - 40, []);
  const driftY = useMemo(() => Math.random() * 80 - 40, []);
  const animDuration = useMemo(() => 15 + Math.random() * 20, []);
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-40 flex items-center justify-center z-0"
      style={{ x, y, left: 0, top: 0 }}
    >
      <motion.div
        animate={{ 
          x: [0, driftX, 0],
          y: [0, driftY, 0],
          scale: [1, 1.15, 1], 
          rotate: [0, 15, -15, 0] 
        }}
        transition={{ duration: animDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={24 + Math.random()*24} className="text-amber-700/20 drop-shadow-sm" strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
};

const FloatingIconsBackground = ({ count = 120 }) => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.pageX);
      mouseY.set(e.pageY);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  const icons = useMemo(() => {
    const arr = [];
    // Calculate an optimal grid to fit the requested count
    const ratio = window.innerWidth / window.innerHeight;
    const cols = Math.ceil(Math.sqrt(count * ratio));
    const rows = Math.ceil(count / cols);
    
    const cellWidth = window.innerWidth / cols;
    const cellHeight = window.innerHeight / rows;

    let id = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (id >= count) break;
        
        // Base position is the center of the grid cell
        const baseX = col * cellWidth + cellWidth / 2;
        const baseY = row * cellHeight + cellHeight / 2;
        
        // Jitter position by up to 60% of cell size for randomness, keeping them strictly apart
        const jitterX = (Math.random() - 0.5) * (cellWidth * 0.6);
        const jitterY = (Math.random() - 0.5) * (cellHeight * 0.6);
        
        arr.push({ 
          id: id++, 
          x: baseX + jitterX, 
          y: baseY + jitterY, 
          iconIndex: Math.floor(Math.random() * EXAM_ICONS.length) 
        });
      }
    }
    
    // Optional: shuffle array so icons aren't strictly generated top-left to bottom-right
    return arr.sort(() => Math.random() - 0.5);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {icons.map((icon) => (
        <AttractingIcon 
          key={icon.id} 
          initialX={icon.x} 
          initialY={icon.y} 
          mouseX={mouseX} 
          mouseY={mouseY}
          iconIndex={icon.iconIndex}
        />
      ))}
    </div>
  );
};

export default FloatingIconsBackground;
