"use client";

import { 
  Globe, Leaf, TreePine, Sun, Mountain, Waves, Bird, Flower,
  Droplets, Zap, Wheat, Sprout, Cloud, Wind, Recycle, Heart
} from "lucide-react";

interface ChatPatternBackgroundProps {
  botSlug: string;
  className?: string;
}

export default function ChatPatternBackground({ botSlug, className = "" }: ChatPatternBackgroundProps) {
  const getPatternIcons = (slug: string) => {
    switch (slug) {
      case "yaprak":
        // Green gradient: from-green-400 to-emerald-500 -> use green-400 (dominant)
        return [
          { Icon: Leaf, color: "text-green-400" },
          { Icon: TreePine, color: "text-green-400" },
          { Icon: Sprout, color: "text-green-400" },
          { Icon: Flower, color: "text-green-400" },
          { Icon: Recycle, color: "text-green-400" },
          { Icon: Heart, color: "text-green-400" },
        ];
      case "robi":
        // Orange gradient: from-yellow-400 to-orange-500 -> use orange-500 (dominant)
        return [
          { Icon: Zap, color: "text-orange-500" },
          { Icon: Sun, color: "text-orange-500" },
          { Icon: Wind, color: "text-orange-500" },
          { Icon: Cloud, color: "text-orange-500" },
          { Icon: Globe, color: "text-orange-500" },
          { Icon: Mountain, color: "text-orange-500" },
        ];
      case "bugday":
        // Yellow gradient: from-amber-400 to-yellow-500 -> use yellow-500 (dominant)
        return [
          { Icon: Wheat, color: "text-yellow-500" },
          { Icon: Sun, color: "text-yellow-500" },
          { Icon: Sprout, color: "text-yellow-500" },
          { Icon: Mountain, color: "text-yellow-500" },
          { Icon: Leaf, color: "text-yellow-500" },
          { Icon: Flower, color: "text-yellow-500" },
        ];
      case "damla":
        // Blue gradient: from-blue-400 to-cyan-500 -> use blue-400 (dominant)
        return [
          { Icon: Droplets, color: "text-blue-400" },
          { Icon: Waves, color: "text-blue-400" },
          { Icon: Cloud, color: "text-blue-400" },
          { Icon: Globe, color: "text-blue-400" },
          { Icon: Wind, color: "text-blue-400" },
          { Icon: Heart, color: "text-blue-400" },
        ];
      default:
        return [
          { Icon: Globe, color: "text-gray-300" },
          { Icon: Leaf, color: "text-gray-400" },
          { Icon: Sun, color: "text-gray-300" },
          { Icon: Flower, color: "text-gray-400" },
          { Icon: Bird, color: "text-gray-300" },
          { Icon: Mountain, color: "text-gray-400" },
        ];
    }
  };

  const icons = getPatternIcons(botSlug);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 opacity-30">
        {/* Create an organic scattered pattern with icons - no overlapping */}
        {(() => {
          const positions: Array<{x: number, y: number}> = [];
          const minDistance = 8; // Minimum distance between icons (in %)
          
          // Generate positions that don't overlap
          for (let i = 0; i < 100; i++) {
            let attempts = 0;
            let validPosition = false;
            let x = 0, y = 0;
            
            while (!validPosition && attempts < 50) {
              x = Math.random() * 100;
              y = Math.random() * 100;
              
              // Check if this position is far enough from existing positions
              validPosition = positions.every(pos => {
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                return distance >= minDistance;
              });
              
              attempts++;
            }
            
            if (validPosition) {
              positions.push({ x, y });
            }
          }
          
          return positions.map((pos, index) => {
            const iconIndex = index % icons.length;
            const { Icon, color } = icons[iconIndex];
            
            // Random sizes between 12-28px for organic feel
            const size = Math.random() * 16 + 12;
            
            // Random rotation for natural look
            const rotation = Math.random() * 360;
            
            // Random scale variation
            const scale = 0.8 + Math.random() * 0.4;
            
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                }}
              >
                <Icon 
                  size={size} 
                  className={color}
                />
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}