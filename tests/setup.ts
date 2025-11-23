// Polyfill for DOMMatrix in jsdom environment
// jsdom doesn't provide DOMMatrix, so we need to polyfill it for tests

class DOMMatrixPolyfill {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  is2D: boolean;

  constructor(init?: string | number[]) {
    // Initialize as identity matrix
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    this.is2D = true;

    // Handle initialization from array or string if needed
    if (Array.isArray(init)) {
      if (init.length >= 6) {
        this.a = init[0];
        this.b = init[1];
        this.c = init[2];
        this.d = init[3];
        this.e = init[4];
        this.f = init[5];
      }
    }
  }

  translateSelf(tx: number, ty: number): DOMMatrixPolyfill {
    this.e += this.a * tx + this.c * ty;
    this.f += this.b * tx + this.d * ty;
    return this;
  }

  scaleSelf(scaleX: number, scaleY?: number): DOMMatrixPolyfill {
    const sy = scaleY !== undefined ? scaleY : scaleX;
    this.a *= scaleX;
    this.b *= scaleX;
    this.c *= sy;
    this.d *= sy;
    return this;
  }

  rotateSelf(angle: number): DOMMatrixPolyfill {
    // angle in degrees, convert to radians
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const a = this.a;
    const b = this.b;
    const c = this.c;
    const d = this.d;

    this.a = a * cos + c * sin;
    this.b = b * cos + d * sin;
    this.c = c * cos - a * sin;
    this.d = d * cos - b * sin;

    return this;
  }

  multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
    const result = new DOMMatrixPolyfill();

    result.a = this.a * other.a + this.c * other.b;
    result.b = this.b * other.a + this.d * other.b;
    result.c = this.a * other.c + this.c * other.d;
    result.d = this.b * other.c + this.d * other.d;
    result.e = this.a * other.e + this.c * other.f + this.e;
    result.f = this.b * other.e + this.d * other.f + this.f;

    return result;
  }

  inverse(): DOMMatrixPolyfill {
    const det = this.a * this.d - this.b * this.c;

    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible');
    }

    const result = new DOMMatrixPolyfill();
    result.a = this.d / det;
    result.b = -this.b / det;
    result.c = -this.c / det;
    result.d = this.a / det;
    result.e = (this.c * this.f - this.d * this.e) / det;
    result.f = (this.b * this.e - this.a * this.f) / det;

    return result;
  }
}

class DOMPointPolyfill {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  matrixTransform(matrix: DOMMatrixPolyfill): DOMPointPolyfill {
    const result = new DOMPointPolyfill();
    result.x = matrix.a * this.x + matrix.c * this.y + matrix.e;
    result.y = matrix.b * this.x + matrix.d * this.y + matrix.f;
    result.z = this.z;
    result.w = this.w;
    return result;
  }
}

// Install polyfills in the global scope for jsdom environment
declare global {
  // eslint-disable-next-line no-var
  var DOMMatrix: typeof DOMMatrixPolyfill;
  // eslint-disable-next-line no-var
  var DOMPoint: typeof DOMPointPolyfill;
}

if (typeof global !== 'undefined') {
  global.DOMMatrix = DOMMatrixPolyfill as any;
  global.DOMPoint = DOMPointPolyfill as any;
}

export {};
