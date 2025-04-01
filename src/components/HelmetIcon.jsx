import React from 'react';

const HelmetIcon = ({ active = false, size = 24 }) => {
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
        d="M12 2C6.48 2 2 6.48 2 12V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V12C22 6.48 17.52 2 12 2Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill={active ? "rgba(5, 150, 105, 0.15)" : "rgba(220, 38, 38, 0.15)"}
      />
      <path 
        d="M7 20V22M17 20V22" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 2V6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HelmetIcon;