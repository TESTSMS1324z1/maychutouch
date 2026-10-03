/**
 * Python Math Execution Engine
 * Supports standard Python mathematical operations, standard math module,
 * built-in math functions, multi-line code, comprehensions, variables, and loops.
 * Seamlessly integrates Pyodide WebAssembly when available for 100% full CPython runtime.
 */

// Full Python math module implementation
export const pythonMathModule = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
  inf: Infinity,
  nan: NaN,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  pow: Math.pow,
  exp: Math.exp,
  expm1: Math.expm1,
  log: (x: number, base?: number) => {
    if (base !== undefined) return Math.log(x) / Math.log(base);
    return Math.log(x);
  },
  log2: Math.log2,
  log10: Math.log10,
  log1p: Math.log1p,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  ceil: Math.ceil,
  floor: Math.floor,
  trunc: Math.trunc,
  fabs: Math.abs,
  hypot: Math.hypot,
  degrees: (rad: number) => rad * (180 / Math.PI),
  radians: (deg: number) => deg * (Math.PI / 180),
  factorial: (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) throw new Error('factorial() only accepts non-negative integers');
    if (n > 170) return Infinity;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  },
  gcd: (...nums: number[]): number => {
    const _gcd = (a: number, b: number): number => {
      a = Math.abs(a);
      b = Math.abs(b);
      while (b) {
        const t = b;
        b = a % b;
        a = t;
      }
      return a;
    };
    if (nums.length === 0) return 0;
    return nums.reduce((acc, cur) => _gcd(acc, cur));
  },
  lcm: (...nums: number[]): number => {
    const _gcd = (a: number, b: number): number => {
      a = Math.abs(a);
      b = Math.abs(b);
      while (b) {
        const t = b;
        b = a % b;
        a = t;
      }
      return a;
    };
    const _lcm = (a: number, b: number) => (a === 0 || b === 0) ? 0 : Math.abs(a * b) / _gcd(a, b);
    if (nums.length === 0) return 0;
    return nums.reduce((acc, cur) => _lcm(acc, cur));
  },
  comb: (n: number, k: number): number => {
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;
    let res = 1;
    for (let i = 1; i <= k; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return Math.round(res);
  },
  perm: (n: number, k?: number): number => {
    if (k === undefined) k = n;
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) return 0;
    let res = 1;
    for (let i = 0; i < k; i++) {
      res *= (n - i);
    }
    return res;
  },
  dist: (p: number[], q: number[]): number => {
    return Math.hypot(...p.map((val, i) => val - (q[i] || 0)));
  },
  prod: (iterable: any): number => {
    const arr = Array.isArray(iterable) ? iterable : Array.from(iterable);
    return arr.reduce((acc: number, curr: any) => acc * Number(curr), 1);
  },
  isclose: (a: number, b: number, rel_tol = 1e-09, abs_tol = 0.0): boolean => {
    return Math.abs(a - b) <= Math.max(rel_tol * Math.max(Math.abs(a), Math.abs(b)), abs_tol);
  },
  isfinite: Number.isFinite,
  isinf: (x: number): boolean => x === Infinity || x === -Infinity,
  isnan: Number.isNaN,
  fmod: (x: number, y: number): number => x % y,
  copysign: (x: number, y: number): number => Math.sign(y) >= 0 ? Math.abs(x) : -Math.abs(x),
};

// Python range generator
export function pythonRange(start: number, stop?: number, step: number = 1): number[] {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }
  if (step === 0) throw new Error('range() arg 3 must not be zero');
  const res: number[] = [];
  if (step > 0) {
    for (let i = start; i < stop; i += step) res.push(i);
  } else {
    for (let i = start; i > stop; i += step) res.push(i);
  }
  return res;
}

// Built-in Python functions
export function getPythonBuiltins(printOutput: string[]) {
  const sumFunc = (iterable: any, start: number = 0): number => {
    if (!iterable) return start;
    const arr = Array.isArray(iterable) ? iterable : Array.from(iterable);
    return arr.reduce((acc: number, curr: any) => acc + Number(curr), start);
  };

  return {
    math: pythonMathModule,
    // Direct math functions in global scope for convenience (like `from math import *`)
    sqrt: pythonMathModule.sqrt,
    cbrt: pythonMathModule.cbrt,
    sin: pythonMathModule.sin,
    cos: pythonMathModule.cos,
    tan: pythonMathModule.tan,
    asin: pythonMathModule.asin,
    acos: pythonMathModule.acos,
    atan: pythonMathModule.atan,
    atan2: pythonMathModule.atan2,
    pi: pythonMathModule.pi,
    e: pythonMathModule.e,
    tau: pythonMathModule.tau,
    factorial: pythonMathModule.factorial,
    gcd: pythonMathModule.gcd,
    lcm: pythonMathModule.lcm,
    comb: pythonMathModule.comb,
    perm: pythonMathModule.perm,
    degrees: pythonMathModule.degrees,
    radians: pythonMathModule.radians,
    ceil: pythonMathModule.ceil,
    floor: pythonMathModule.floor,
    trunc: pythonMathModule.trunc,
    exp: pythonMathModule.exp,
    log: pythonMathModule.log,
    log2: pythonMathModule.log2,
    log10: pythonMathModule.log10,
    hypot: pythonMathModule.hypot,
    // Python built-ins
    abs: Math.abs,
    round: (num: number, ndigits?: number): number => {
      if (ndigits === undefined || ndigits === 0) return Math.round(num);
      const factor = Math.pow(10, ndigits);
      return Math.round(num * factor) / factor;
    },
    min: (...args: any[]): number => {
      const flat = args.length === 1 && (Array.isArray(args[0]) || typeof args[0]?.[Symbol.iterator] === 'function')
        ? Array.from(args[0])
        : args;
      return Math.min(...flat.map(Number));
    },
    max: (...args: any[]): number => {
      const flat = args.length === 1 && (Array.isArray(args[0]) || typeof args[0]?.[Symbol.iterator] === 'function')
        ? Array.from(args[0])
        : args;
      return Math.max(...flat.map(Number));
    },
    sum: sumFunc,
    pow: (base: number, exp: number, mod?: number): number => {
      const res = Math.pow(base, exp);
      return mod !== undefined ? res % mod : res;
    },
    divmod: (a: number, b: number): [number, number] => [Math.floor(a / b), a % b],
    int: (val: any): number => parseInt(val, 10),
    float: (val: any): number => parseFloat(val),
    str: (val: any): string => String(val),
    bool: (val: any): boolean => Boolean(val),
    len: (val: any): number => (val ? (val.length !== undefined ? val.length : (val.size !== undefined ? val.size : 0)) : 0),
    range: pythonRange,
    list: (val: any): any[] => Array.from(val),
    sorted: (iterable: any, reverse = false): any[] => {
      const arr = Array.from(iterable);
      arr.sort((a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0));
      return reverse ? arr.reverse() : arr;
    },
    reversed: (iterable: any): any[] => Array.from(iterable).reverse(),
    all: (iterable: any): boolean => Array.from(iterable).every(Boolean),
    any: (iterable: any): boolean => Array.from(iterable).some(Boolean),
    enumerate: (iterable: any): [number, any][] => Array.from(iterable).map((val, idx) => [idx, val]),
    zip: (...iterables: any[]): any[][] => {
      const arrays = iterables.map(it => Array.from(it));
      const minLen = Math.min(...arrays.map(a => a.length));
      const res: any[][] = [];
      for (let i = 0; i < minLen; i++) {
        res.push(arrays.map(a => a[i]));
      }
      return res;
    },
    bin: (n: number): string => '0b' + (Number(n) >>> 0).toString(2),
    hex: (n: number): string => '0x' + (Number(n) >>> 0).toString(16),
    oct: (n: number): string => '0o' + (Number(n) >>> 0).toString(8),
    print: (...args: any[]) => {
      const str = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      printOutput.push(str);
      return str;
    },
    _py_floordiv: (a: any, b: any) => Math.floor(Number(a) / Number(b)),
    _py_comp: (fn: () => any) => fn(),
  };
}

/**
 * Transpiles Python mathematical code to executable JavaScript
 */
export function transpilePythonToJs(pyCode: string): string {
  // 1. Extract string literals to avoid regex replacement inside strings
  const stringLiterals: string[] = [];
  let code = pyCode.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, (match) => {
    const idx = stringLiterals.length;
    stringLiterals.push(match);
    return `__PY_STR_${idx}__`;
  });

  // 2. Remove comments (# ...)
  code = code.replace(/#.*$/gm, '');

  const lines = code.split('\n');
  const indentStack: number[] = [0];
  const transformedLines: string[] = [];
  const declaredVars = new Set<string>(['result']);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue; // skip blank lines

    // Calculate indent
    const leadingSpaces = rawLine.match(/^\s*/)?.[0].length || 0;
    const trimmed = rawLine.trim();

    // Check dedents
    while (indentStack.length > 1 && leadingSpaces < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      transformedLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    // Skip import statements (math is already globally in scope)
    if (/^import\s+math\b/i.test(trimmed) || /^from\s+math\s+import\b/i.test(trimmed)) {
      continue;
    }

    let line = trimmed;

    // Floor division operator: //= and //
    line = line.replace(/(\w+)\s*\/\/=\s*([^;]+)/g, '$1 = _py_floordiv($1, ($2))');
    
    // Replace binary // with _py_floordiv
    // Simple expression replacement:
    let prevLine = '';
    while (line !== prevLine && line.includes('//')) {
      prevLine = line;
      line = line.replace(/([a-zA-Z0-9_().]+)\s*\/\/\s*([a-zA-Z0-9_().]+)/g, '_py_floordiv($1, $2)');
    }

    // Replace Python boolean/None
    line = line.replace(/\bTrue\b/g, 'true');
    line = line.replace(/\bFalse\b/g, 'false');
    line = line.replace(/\bNone\b/g, 'null');

    // Replace Python logic operators with boundaries
    line = line.replace(/\band\b/g, '&&');
    line = line.replace(/\bor\b/g, '||');
    line = line.replace(/\bnot\s+/g, '!');
    line = line.replace(/\bis\s+not\b/g, '!==');
    line = line.replace(/\bis\b/g, '===');

    // Handle Python ternary: `expr if condition else other`
    line = line.replace(/(.+?)\s+if\s+(.+?)\s+else\s+(.+)/, '($2 ? $1 : $3)');

    // Handle List Comprehensions: [expr for item in iterable if condition] or [expr for item in iterable]
    line = line.replace(/\[\s*(.+?)\s+for\s+([a-zA-Z0-9_]+)\s+in\s+(.+?)(?:\s+if\s+(.+?))?\s*\]/g, 
      (_m, expr, item, iterable, cond) => {
        if (cond) {
          return `_py_comp(() => { const _res = []; for (const ${item} of ${iterable}) { if (${cond}) _res.push(${expr}); } return _res; })`;
        }
        return `_py_comp(() => { const _res = []; for (const ${item} of ${iterable}) { _res.push(${expr}); } return _res; })`;
      }
    );

    // Check block statements ending with ':'
    if (line.endsWith(':')) {
      const header = line.slice(0, -1).trim();

      if (/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/.test(header)) {
        line = header.replace(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/, 'function $1($2) {');
      } else if (/^for\s+([a-zA-Z0-9_,\s]+)\s+in\s+(.+)/.test(header)) {
        line = header.replace(/^for\s+([a-zA-Z0-9_,\s]+)\s+in\s+(.+)/, 'for (const $1 of $2) {');
      } else if (/^while\s+(.+)/.test(header)) {
        line = header.replace(/^while\s+(.+)/, 'while ($1) {');
      } else if (/^if\s+(.+)/.test(header)) {
        line = header.replace(/^if\s+(.+)/, 'if ($1) {');
      } else if (/^elif\s+(.+)/.test(header)) {
        line = header.replace(/^elif\s+(.+)/, '} else if ($1) {');
      } else if (/^else\b/.test(header)) {
        line = '} else {';
      } else {
        line = header + ' {';
      }

      indentStack.push(leadingSpaces + 2);
    } else {
      // Check variable assignment
      // e.g. `x = 10` or `a, b = 1, 2`
      const isAssign = /^[a-zA-Z_][a-zA-Z0-9_]*\s*=[^=]/.test(line);
      const assignVarMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=[^=]/);
      const assignVar = assignVarMatch ? assignVarMatch[1] : null;

      if (isAssign && assignVar) {
        if (!declaredVars.has(assignVar)) {
          declaredVars.add(assignVar);
          line = 'let ' + line;
        }
      }

      // If it's the last non-empty line
      const isLastLine = i === lines.length - 1 || lines.slice(i + 1).every(l => !l.trim());
      if (isLastLine) {
        if (isAssign && assignVar) {
          // Return the assigned variable
          line = line + '; return ' + assignVar;
        } else if (!line.startsWith('return') && !line.startsWith('let ') && !line.startsWith('const ') && !line.startsWith('function') && !line.startsWith('for') && !line.startsWith('while') && !line.startsWith('if')) {
          line = 'return (' + line + ')';
        }
      }
    }

    transformedLines.push(' '.repeat(leadingSpaces) + line + (line.endsWith('{') || line.endsWith('}') ? '' : ';'));
  }

  // Close remaining indentation blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    transformedLines.push('}');
  }

  let finalJs = transformedLines.join('\n');

  // Restore string literals
  stringLiterals.forEach((str, idx) => {
    finalJs = finalJs.replace(new RegExp(`__PY_STR_${idx}__`, 'g'), str);
  });

  return finalJs;
}

// Global Pyodide state
let pyodideLoadingPromise: Promise<any> | null = null;
let pyodideInstance: any = null;

export function loadPyodideAsync(): Promise<any> {
  if (pyodideInstance) return Promise.resolve(pyodideInstance);
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    try {
      if (typeof window === 'undefined') return null;
      if (!(window as any).loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      const py = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });
      pyodideInstance = py;
      return py;
    } catch (e) {
      console.warn('Pyodide CDN not available or blocked, falling back to local Python engine', e);
      return null;
    }
  })();

  return pyodideLoadingPromise;
}

/**
 * Execute Python code synchronously using the built-in fast Python engine
 */
export function runPythonSync(code: string): { success: boolean; result: any; error?: string; stdout?: string } {
  const trimmed = code.trim();
  if (!trimmed) {
    return { success: true, result: 0 };
  }

  const printOutput: string[] = [];
  const builtins = getPythonBuiltins(printOutput);

  try {
    const jsCode = transpilePythonToJs(trimmed);
    const scopeKeys = Object.keys(builtins);
    const scopeValues = Object.values(builtins);

    // Create function runner
    const runner = new Function(...scopeKeys, `
      try {
        var result = undefined;
        ${jsCode}
        if (typeof result !== 'undefined') return result;
        return undefined;
      } catch (e) {
        throw e;
      }
    `);

    let res = runner(...scopeValues);

    // If result is undefined, check if printOutput has anything
    if (res === undefined && printOutput.length > 0) {
      const lastLine = printOutput[printOutput.length - 1];
      const num = Number(lastLine);
      res = !isNaN(num) ? num : lastLine;
    }

    if (res === undefined) {
      res = 0;
    }

    // Format output
    let finalResult = res;
    if (typeof res === 'number') {
      // Clean precision if reasonable
      if (Number.isFinite(res) && !Number.isInteger(res)) {
        finalResult = Number(res.toFixed(6).replace(/\.?0+$/, ''));
      }
    } else if (Array.isArray(res)) {
      finalResult = JSON.stringify(res);
    } else if (typeof res === 'object' && res !== null) {
      finalResult = JSON.stringify(res);
    }

    return {
      success: true,
      result: finalResult,
      stdout: printOutput.join('\n'),
    };
  } catch (err: any) {
    return {
      success: false,
      result: 0,
      error: err?.message || 'Error executing Python code',
    };
  }
}

/**
 * Execute Python code asynchronously (tries Pyodide if loaded, otherwise falls back to fast local runner)
 */
export async function runPythonAsync(code: string): Promise<{ success: boolean; result: any; error?: string; stdout?: string }> {
  // If Pyodide is already available, use it for 100% CPython compatibility
  if (pyodideInstance) {
    try {
      let stdout = '';
      pyodideInstance.setStdout({
        batched: (msg: string) => {
          stdout += (stdout ? '\n' : '') + msg;
        }
      });

      const pyResult = await pyodideInstance.runPythonAsync(code);
      let res = pyResult;

      if (res !== undefined && res !== null && typeof res.toJs === 'function') {
        res = res.toJs();
      }

      if ((res === undefined || res === null) && stdout) {
        const lastLine = stdout.trim().split('\n').pop() || '';
        const num = Number(lastLine);
        res = !isNaN(num) ? num : lastLine;
      }

      if (res === undefined || res === null) {
        res = 0;
      }

      let finalResult = res;
      if (typeof res === 'number') {
        if (Number.isFinite(res) && !Number.isInteger(res)) {
          finalResult = Number(res.toFixed(6).replace(/\.?0+$/, ''));
        }
      } else if (typeof res === 'object') {
        finalResult = JSON.stringify(res);
      }

      return {
        success: true,
        result: finalResult,
        stdout,
      };
    } catch (err: any) {
      // If Pyodide throws, return error
      return {
        success: false,
        result: 0,
        error: err?.message || String(err),
      };
    }
  }

  // Fallback to synchronous fast engine
  return runPythonSync(code);
}
