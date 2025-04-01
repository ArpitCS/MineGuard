import React from 'react';

const GloveIcon = ({ active = false, size = 24 }) => {
  const activeColor = "#059669";
  const inactiveColor = "#dc2626";
  const color = active ? activeColor : inactiveColor;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M7 14V3C7 2.45 7.45 2 8 2H13C13.55 2 14 2.45 14 3V7" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M9 14V5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M14 7C14 7 17 7 18 9C19 11 19 13 19 14C19 15 16.5 14.5 16.5 14.5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7 14C7 14 5 14 5 15.5C5 17 5 20 7 21.5C9 23 12 22 14 20.5C16 19 18 17 19 14" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill={active ? "rgba(5, 150, 105, 0.15)" : "rgba(220, 38, 38, 0.15)"}
      />
    </svg>
  );
};

export default GloveIcon;