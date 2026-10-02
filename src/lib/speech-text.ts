/**
 * Math-aware text preparation for speech and display.
 *
 * Pure functions, no DOM and no "use client", so they can run on the server
 * during lesson generation and on the client during playback, and are
 * directly unit-testable.
 *
 * The core problem this solves: narrating a lesson that contains LaTeX makes
 * a text-to-speech engine read markup verbatim. Given
 *
 *   $$a^2 + b^2 = c^2$$
 *
 * an engine with no maths awareness says "dollar dollar a caret two plus b
 * caret two equals c caret two dollar dollar". `latexToSpeech` turns that
 * into "a squared plus b squared equals c squared" so the narration is
 * comprehensible regardless of which voice engine renders it.
 */

const MATH_MARKERS = /[$\\^_{}]/;

/** Quick check for whether a string contains anything LaTeX-shaped. */
export function hasMathNotation(text: string): boolean {
  return MATH_MARKERS.test(text);
}

/** True when the text carries at least one inline or display math block. */
export function hasMathBlock(text: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/.test(text);
}

/**
 * Read a brace-delimited group starting at `text[start]`, which must be `{`.
 * Returns the inner content plus the index just past the closing brace.
 */
function readGroup(
  text: string,
  start: number
): { body: string; end: number } {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { body: text.slice(start + 1, i), end: i + 1 };
    }
  }
  // Unbalanced input: treat the remainder as the body rather than throwing.
  return { body: text.slice(start + 1), end: text.length };
}

/** Read a single unbraced argument (e.g. the "n" in `\sqrt[n]{x}`). */
function readSingle(text: string, start: number): { body: string; end: number } {
  if (text[start] === "{") return readGroup(text, start);
  // A backslash means a command follows, so consume the whole command name
  // rather than a single character. Without this, `^\circ` is read as `\`.
  if (text[start] === "\\") {
    const rest = text.slice(start + 1);
    const name = /^[a-zA-Z]+/.exec(rest);
    if (name) return { body: `\\${name[0]}`, end: start + 1 + name[0].length };
  }
  const ch = text[start];
  if (ch === undefined) return { body: "", end: start };
  return { body: ch, end: start + 1 };
}

const SYMBOLS: Record<string, string> = {
  times: "times",
  cdot: "times",
  div: "divided by",
  ast: "times",
  pm: "plus or minus",
  mp: "minus or plus",
  leq: "is less than or equal to",
  le: "is less than or equal to",
  geq: "is greater than or equal to",
  ge: "is greater than or equal to",
  neq: "is not equal to",
  ne: "is not equal to",
  approx: "is approximately",
  equiv: "is equivalent to",
  sim: "is similar to",
  cong: "is congruent to",
  propto: "is proportional to",
  parallel: "is parallel to",
  perp: "is perpendicular to",
  infty: "infinity",
  in: "in",
  notin: "is not in",
  subset: "is a subset of",
  cup: "union",
  cap: "intersection",
  forall: "for all",
  exists: "there exists",
  therefore: "therefore",
  because: "because",
  implies: "implies",
  ldots: "dot dot dot",
  cdots: "dot dot dot",
  vdots: "vertical dots",
  ddots: "diagonal dots",
  angle: "angle",
  triangle: "triangle",
  square: "square",
  degree: "degrees",
  celsius: "degrees celsius",
  pi: "pi",
  theta: "theta",
  alpha: "alpha",
  beta: "beta",
  gamma: "gamma",
  delta: "delta",
  epsilon: "epsilon",
  zeta: "zeta",
  eta: "eta",
  lambda: "lambda",
  mu: "mu",
  nu: "nu",
  rho: "rho",
  sigma: "sigma",
  tau: "tau",
  phi: "phi",
  chi: "chi",
  psi: "psi",
  omega: "omega",
  ell: "l",
  prime: "prime",
  circ: "degrees",
  half: "one half",
  quarter: "one quarter",
  log: "log",
  ln: "natural log",
  sin: "sine",
  cos: "cosine",
  tan: "tangent",
  max: "maximum",
  min: "minimum",
  left: "",
  right: "",
  big: "",
  Big: "",
  bigl: "",
  bigr: "",
  displaystyle: "",
  textstyle: "",
  limits: "",
  quad: " ",
  qquad: " ",
  ":": " ",
  ";": " ",
};

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
  "11": "eleven",
  "12": "twelve",
  "13": "thirteen",
  "14": "fourteen",
  "15": "fifteen",
  "16": "sixteen",
  "17": "seventeen",
  "18": "eighteen",
  "19": "nineteen",
  "20": "twenty",
};

/** Spoken index names, so `\sqrt[3]{x}` reads as "cube root" not "three root". */
const ROOT_INDEX_WORDS: Record<string, string> = {
  "2": "square",
  "3": "cube",
  "4": "fourth",
  "5": "fifth",
  "6": "sixth",
  "7": "seventh",
  "8": "eighth",
  "9": "ninth",
  "10": "tenth",
};

const SUPERSCRIPT_WORDS: Record<string, string> = {
  "0": "to the zeroth",
  "1": "to the first",
  "2": "squared",
  "3": "cubed",
  "4": "to the fourth",
  "5": "to the fifth",
  "6": "to the sixth",
  "7": "to the seventh",
  "8": "to the eighth",
  "9": "to the ninth",
  "n": "to the n",
  "+": "plus",
  "-": "minus",
};

const SUBSCRIPT_WORDS: Record<string, string> = {
  "0": "sub zero",
  "1": "sub one",
  "2": "sub two",
  "3": "sub three",
  "4": "sub four",
  "5": "sub five",
  "6": "sub six",
  "7": "sub seven",
  "8": "sub eight",
  "9": "sub nine",
  "n": "sub n",
  "i": "sub i",
  "j": "sub j",
  "k": "sub k",
  "x": "sub x",
  "y": "sub y",
  "1/2": "sub one half",
};

function verbalize(value: string): string {
  const trimmed = value.trim();
  const word = NUMBER_WORDS[trimmed];
  return word ?? trimmed;
}

/**
 * Replace `\frac{A}{B}` and `\dfrac` / `\tfrac` with spoken English.
 * Recurses so nested fractions work.
 */
function expandFractions(text: string): string {
  let out = text;
  // Loop because each pass can uncover more nested fractions.
  for (let pass = 0; pass < 8; pass++) {
    const match = /\\([dt]?frac)\s*/.exec(out);
    if (!match) break;
    const cmdStart = match.index;
    let cursor = cmdStart + match[0].length;
    const num = readGroup(out, cursor);
    if (num.end <= cursor) break;
    cursor = num.end;
    while (cursor < out.length && /\s/.test(out[cursor])) cursor++;
    if (out[cursor] !== "{") {
      // Malformed: drop the command and keep the text.
      out = out.slice(0, cmdStart) + out.slice(cmdStart + match[0].length);
      continue;
    }
    const den = readGroup(out, cursor);
    const replacement = ` ${verbalize(expandFractions(num.body))} over ${verbalize(
      expandFractions(den.body)
    )} `;
    out = out.slice(0, cmdStart) + replacement + out.slice(den.end);
  }
  return out;
}

/** Expand `\sqrt{x}`, `\sqrt[n]{x}` and `\sum` / `\prod` style operators. */
function expandRoots(text: string): string {
  let out = text;
  for (let pass = 0; pass < 8; pass++) {
    const match = /\\sqrt\s*/.exec(out);
    if (!match) break;
    const start = match.index;
    let cursor = start + match[0].length;
    let indexExpr: string | null = null;
    if (out[cursor] === "[") {
      const close = out.indexOf("]", cursor);
      if (close !== -1) {
        indexExpr = out.slice(cursor + 1, close);
        cursor = close + 1;
      }
    }
    while (cursor < out.length && /\s/.test(out[cursor])) cursor++;
    const arg = readGroup(out, cursor);
    const inner = verbalize(expandRoots(arg.body));
    const spoken = indexExpr
      ? ` the ${ROOT_INDEX_WORDS[indexExpr.trim()] ?? verbalize(expandRoots(indexExpr))} root of ${inner} `
      : ` the square root of ${inner} `;
    out = out.slice(0, start) + spoken + out.slice(arg.end);
  }
  return out;
}

/** Strip LaTeX display environments, keeping their contents. */
function stripEnvironments(text: string): string {
  return text
    .replace(/\\begin\{[a-zA-Z*]+\}/g, " ")
    .replace(/\\end\{[a-zA-Z*]+\}/g, " ")
    .replace(/&/g, " ")
    .replace(/\\\\\s*(\[[^\]]*\])?/g, ". ");
}

/** Expand `\text{...}` and friends to their inner content. */
function unwrapTextCommands(text: string): string {
  const re = /\\(?:text|mathrm|mathbf|mathit|mathsf|mathtt|textbf|textit|operatorname)\s*\{/g;
  let out = text;
  for (let pass = 0; pass < 6; pass++) {
    re.lastIndex = 0;
    const match = re.exec(out);
    if (!match) break;
    const start = match.index;
    const group = readGroup(out, match.index + match[0].length - 1);
    out = out.slice(0, start) + group.body + out.slice(group.end);
  }
  return out;
}

/** Expand superscripts and subscripts. */
function expandScripts(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if ((ch === "^" || ch === "_") && i + 1 < text.length) {
      const { body, end } = readSingle(text, i + 1);
      const spoken = expandRoots(expandFractions(unwrapTextCommands(body))).trim();
      const table = ch === "^" ? SUPERSCRIPT_WORDS : SUBSCRIPT_WORDS;
      const word = table[spoken] ?? table[spoken.replace(/\s+/g, "")];
      out += word ? ` ${word} ` : ` ${ch === "^" ? "to the power of" : "sub"} ${verbalize(spoken)} `;
      i = end;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Replace known symbol commands with their spoken equivalents. */
function expandSymbols(text: string): string {
  return text.replace(/\\([a-zA-Z]+)/g, (whole, name: string) => {
    if (name in SYMBOLS) return SYMBOLS[name];
    return ` ${whole} `;
  });
}

function tidy(text: string): string {
  return (
    text
      // Remove any LaTeX we could not verbalise so it is never read aloud.
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/[{}]/g, " ")
      .replace(/\$/g, " ")
      .replace(/\\[([]/g, " ")
      .replace(/\\[,)\]]/g, " ")
      .replace(/~|\^/g, " ")
      // "3/4" in plain prose reads as "three slash four" without this.
      .replace(/(\d)\s*\/\s*(\d)/g, "$1 over $2")
      // Operators must be spoken as words, never read as symbols.
      .replace(/=/g, " equals ")
      .replace(/\+/g, " plus ")
      .replace(/</g, " is less than ")
      .replace(/>/g, " is greater than ")
      // Only a spaced hyphen is a minus sign; "well-known" stays a word.
      .replace(/(^|\s)-(\s|$)/g, "$1 minus $2")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/([,;:])(?=[a-zA-Z])/g, "$1 ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s+-\s+$/g, "")
      .replace(/\s+$/, "")
      .trim()
  );
}

/** Spell out small integers so short maths reads naturally. */
function spellNumbers(text: string): string {
  return text
    // A coefficient directly before a variable needs a separating space so
    // "3x" does not collapse into the single word "threex".
    .replace(/\b(\d{1,2})(?=[a-zA-Z])/g, (m, d: string) =>
      NUMBER_WORDS[d] ? `${NUMBER_WORDS[d]} ` : m
    )
    .replace(/\b(\d{1,2})\b/g, (m, d: string) => NUMBER_WORDS[d] ?? m);
}

/**
 * Handle constructs that must be rewritten before script expansion, because
 * they span a superscript or a LaTeX-only escape.
 */
function preprocess(text: string): string {
  return text
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, " degrees ")
    .replace(/\^\s*\{?\s*\\prime\s*\}?/g, " prime ")
    .replace(/\\%/g, " percent ")
    .replace(/\\&/g, " and ")
    .replace(/\\#/g, " number ")
    .replace(/\\\$/g, " dollars ")
    .replace(/\\:/g, " ");
}

/**
 * Convert text containing LaTeX into something a speech engine can read.
 * Text with no maths is returned unchanged apart from whitespace tidying.
 */
export function latexToSpeech(input: string): string {
  const text = (input ?? "").toString();
  if (!text.trim()) return "";
  if (!hasMathNotation(text)) return tidy(text);

  let out = text;
  out = stripEnvironments(out);
  out = preprocess(out);
  out = unwrapTextCommands(out);
  out = expandFractions(out);
  out = expandRoots(out);
  out = expandScripts(out);
  out = expandSymbols(out);
  return tidy(spellNumbers(out));
}

/**
 * Strip maths markup entirely, keeping only the surrounding prose.
 * Used when rendering narrative text that must not contain inline maths.
 */
export function stripLatexBlocks(input: string): string {
  let out = (input ?? "").toString();
  out = out.replace(/\$\$[\s\S]*?\$\$/g, " ");
  out = out.replace(/\\[[\s\S]*?\\\]/g, " ");
  out = out.replace(/\$[^$\n]*?\$/g, " ");
  out = out.replace(/\\\([\s\S]*?\\\)/g, " ");
  out = unwrapTextCommands(out);
  out = stripEnvironments(out);
  out = out.replace(/\\[a-zA-Z]+/g, " ");
  out = out.replace(/[{}]/g, " ");
  out = out.replace(/[ \t]+/g, " ");
  out = out.replace(/\s*\n\s*/g, "\n");
  out = out.replace(/[ \t]+\n/g, "\n");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Normalise an arbitrary narration string for a TTS request: LaTeX-aware,
 * whitespace-collapsed and length-bounded on a sentence boundary.
 */
export function toSpeechText(input: string, maxChars = 500): string[] {
  const spoken = latexToSpeech(input);
  if (!spoken) return [];
  if (spoken.length <= maxChars) return [spoken];

  const chunks: string[] = [];
  let remaining = spoken;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf(". ", maxChars);
    if (splitAt === -1 || splitAt < 40) splitAt = remaining.lastIndexOf(", ", maxChars);
    if (splitAt === -1 || splitAt < 40) splitAt = remaining.lastIndexOf(" ", maxChars);
    if (splitAt === -1 || splitAt < 40) splitAt = maxChars;
    chunks.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  return chunks.filter((c) => c.length > 0);
}