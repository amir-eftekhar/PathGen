'use strict';

class Vector {
  constructor(x, y, data = 0, data2 = 0) {
    this.x = x;
    this.y = y;
    this.data = data;
    this.data2 = data2;
  }

  static add(v1, v2) {
    return new Vector(v1.x + v2.x, v1.y + v2.y, 0);
  }

  static subtract(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y, 0);
  }

  static multiply(v, s) {
    return new Vector(v.x * s, v.y * s, 0);
  }

  static divide(v, s) {
    if (s === 0) throw new Error('Divide by 0');
    return new Vector(v.x / s, v.y / s, 0);
  }

  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  static distance(v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
  }

  static interpolate(d, v1, v2) {
    const angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    const x = (d * Math.cos(angle)) + v1.x;
    const y = (d * Math.sin(angle)) + v1.y;
    return new Vector(x, y);
  }

  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}
