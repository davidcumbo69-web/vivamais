import React from 'react';
import { cn } from '../../lib/utils';

interface AnatomicalHeartIconProps {
  className?: string;
}

export const AnatomicalHeartIcon = ({ className }: AnatomicalHeartIconProps) => {
  return (
    <svg 
      viewBox="0 0 500 650" 
      className={cn("drop-shadow-sm", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background/Base Shading */}
      
      {/* Main Muscle Body (Red) */}
      <path 
        d="M200,600 C150,590 80,510 70,400 C60,250 150,220 220,240 C280,260 380,350 360,500 C340,600 280,620 200,600 Z" 
        fill="#f37a7a" 
        stroke="#222" 
        strokeWidth="2.5"
      />
      
      {/* Hatching for Shading (Muscle) */}
      <g stroke="#222" strokeWidth="0.5" opacity="0.6">
        {/* Left side curve-matching hatch */}
        <path d="M85,450 Q90,480 100,510" fill="none" />
        <path d="M95,430 Q105,460 115,490" fill="none" />
        <path d="M110,410 Q125,440 140,470" fill="none" />
        {/* Bottom curve-matching hatch */}
        <path d="M180,580 L190,595" fill="none" />
        <path d="M210,585 L220,598" fill="none" />
        <path d="M240,570 L255,590" fill="none" />
      </g>

      {/* Vena Cava (Blue - Label K) */}
      <path 
        d="M170,180 L120,210 C100,230 110,340 150,340 L180,250 L170,180" 
        fill="#5a9bd5" 
        stroke="#222" 
        strokeWidth="2.5"
      />
      <ellipse cx="140" cy="190" rx="30" ry="20" fill="#3d7ab7" stroke="#222" strokeWidth="2" transform="rotate(-30, 140, 190)" />

      {/* Pulmonary Artery (Blue - Center) */}
      <path 
        d="M180,320 C220,300 350,250 380,270 L350,330 C300,350 250,370 200,380 Z" 
        fill="#4d89bc" 
        stroke="#222" 
        strokeWidth="2.5"
      />

      {/* Aorta Arch (Red - Label G, H) */}
      <path 
        d="M210,250 C210,180 180,100 250,80 C350,60 400,150 400,250 L360,350" 
        fill="#e53935" 
        stroke="#222" 
        strokeWidth="2.5"
      />
      {/* Top Branches (I, I) */}
      <path d="M220,80 L200,40 C190,20 160,20 150,40" fill="#e53935" stroke="#222" strokeWidth="2.5" />
      <path d="M250,80 L250,30 C250,10 270,10 270,30 L270,80" fill="#e53935" stroke="#222" strokeWidth="2.5" />
      <path d="M290,90 L330,50 C350,30 380,60 360,80" fill="#e53935" stroke="#222" strokeWidth="2.5" />

      {/* Auricles (Yellow/Textured - Label C, D) */}
      <path 
        d="M80,380 C40,350 50,280 100,280 C130,280 150,320 140,380 Z" 
        fill="#e6d5a7" 
        stroke="#222" 
        strokeWidth="2"
      />
      <path 
        d="M280,350 C310,320 360,350 360,400 C360,450 340,480 300,480 Z" 
        fill="#e6d5a7" 
        stroke="#222" 
        strokeWidth="2"
      />

      {/* Surface Vessels (Red and Blue) */}
      <path d="M150,390 Q180,450 220,530" fill="none" stroke="#2d598c" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      <path d="M170,370 Q210,420 280,500" fill="none" stroke="#b71c1c" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      
      {/* Surface vessel branches */}
      <path d="M180,450 L150,480" fill="none" stroke="#2d598c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M210,500 L190,540" fill="none" stroke="#2d598c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M240,460 L200,430" fill="none" stroke="#b71c1c" strokeWidth="2" strokeLinecap="round" />

      {/* Clinical Labels (Medical Textbook Look) */}
      <g fontFamily="serif" fontSize="18" fontStyle="italic" fill="#222">
        <text x="60" y="550">A</text>
        <text x="340" y="580">B</text>
        <text x="40" y="420">C</text>
        <text x="380" y="480">D</text>
        <text x="80" y="340">E</text>
        <text x="380" y="420">F</text>
        <text x="140" y="160">G</text>
        <text x="210" y="70">H</text>
        <text x="85" y="100">I</text>
        <text x="350" y="110">I</text>
        <text x="120" y="250">K</text>
        <text x="420" y="340">L</text>
      </g>
      
      {/* Horizontal indicator lines for labels */}
      <g stroke="#222" strokeWidth="0.5" strokeDasharray="3 3">
        <line x1="75" y1="545" x2="160" y2="530" />
        <line x1="330" y1="575" x2="280" y2="550" />
        <line x1="90" y1="335" x2="120" y2="340" />
        <line x1="375" y1="415" x2="310" y2="400" />
      </g>
    </svg>
  );
};
