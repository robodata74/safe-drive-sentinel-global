import { interpolatePoint, Point } from "./driverMotion";

export class SmoothDriverBuffer {
  private current: Point;
  private target: Point;
  private frames = 12;
  private step = 0;

  constructor(initial: Point) {
    this.current = initial;
    this.target = initial;
  }

  updateTarget(next: Point) {
    this.current = this.getCurrent();
    this.target = next;
    this.step = 0;
  }

  getCurrent(): Point {
    const t = Math.min(this.step / this.frames, 1);

    return interpolatePoint(this.current, this.target, t);
  }

  tick(): Point {
    if (this.step < this.frames) {
      this.step++;
    }

    return this.getCurrent();
  }
}
