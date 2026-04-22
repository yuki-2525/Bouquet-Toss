"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: "easeOut",
    });

    // 文字列として表示するために transform の結果を state に同期
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}
