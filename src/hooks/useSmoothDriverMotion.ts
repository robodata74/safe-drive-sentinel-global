import {
    createMotionState,
    stepMotion,
    updateTarget,
    type DriverMotionState,
    type Point,
} from "@/lib/dispatch/gps/smoothPhysics";
import { useEffect, useRef } from "react";

interface UseSmoothDriverMotionProps {
  driverId: string;
  target?: Point;
  velocity?: number;
  onUpdate: (p: Point) => void;
}

/**
 * =========================
 * UBER SMOOTH DRIVER HOOK
 * =========================
 */
export function useSmoothDriverMotion({
  driverId,
  target,
  velocity = 0.08,
  onUpdate,
}: UseSmoothDriverMotionProps) {
  const stateRef = useRef<DriverMotionState | null>(null);
  const frameRef = useRef<number | null>(null);

  /**
   * INIT / RESET DRIVER STATE
   */
  useEffect(() => {
    if (!target) return;

    stateRef.current = createMotionState(target, velocity);
  }, [driverId]);

  /**
   * UPDATE TARGET FROM WEBSOCKET
   */
  useEffect(() => {
    if (!target || !stateRef.current) return;

    stateRef.current = updateTarget(stateRef.current, target);
  }, [target]);

  /**
   * UBER SMOOTH ANIMATION LOOP
   */
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const state = stateRef.current;

      if (state) {
        const delta = Math.min((time - lastTime) / 16, 3); // normalize frame delta

        const next = stepMotion(state, delta);

        stateRef.current = {
          ...state,
          current: next,
        };

        onUpdate(next);
      }

      lastTime = time;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
    };
  }, [driverId, onUpdate]);
}
