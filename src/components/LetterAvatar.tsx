import React from 'react';

interface LetterAvatarProps {
  text: string;
  className?: string;
}

const LetterAvatar: React.FC<LetterAvatarProps> = ({ text, className = "" }) => {
  const firstLetter = text.charAt(0).toUpperCase();
  
  // Generate a consistent background color based on the text
  const getBackgroundColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  const bgColor = getBackgroundColor(text);

  return (
    <div 
      className={`flex items-center justify-center text-white font-bold select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {firstLetter}
    </div>
  );
};

export default LetterAvatar;
