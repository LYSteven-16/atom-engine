// src/atoms/TextAtom.ts
var TextAtom = class {
  constructor(context, container, config) {
    this.capability = "text";
    this.context = context;
    this.id = config.id;
    this.text = config.text;
    this.size = config.size;
    this.color = config.color;
    this.position = config.position;
    this.writingMode = config.writingMode ?? "horizontal";
    this.fontWeight = config.fontWeight ?? "normal";
    this.fontStyle = config.fontStyle ?? "normal";
    this.textAlign = config.textAlign ?? "left";
    this.overflow = config.overflow ?? "visible";
    this.maxWidth = config.maxWidth;
    this.lineHeight = config.lineHeight;
    this.render(container);
  }
  render(container) {
    try {
      const element = document.createElement("div");
      element.setAttribute("data-atom-id", this.id);
      const writingModeCSS = this.writingMode === "vertical" ? "writing-mode: vertical-rl;" : "";
      const overflowCSS = this.overflow === "ellipsis" ? "overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" : this.overflow === "hidden" ? "overflow: hidden;" : "";
      const maxWidthCSS = this.maxWidth ? `max-width: ${this.maxWidth}px;` : "";
      const lineHeightCSS = this.lineHeight ? `line-height: ${this.lineHeight};` : "";
      element.style.cssText = `
        position: absolute;
        left: ${this.position?.x ?? 0}px;
        top: ${this.position?.y ?? 0}px;
        font-size: ${this.size}px;
        color: rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
        font-weight: ${this.fontWeight};
        font-style: ${this.fontStyle};
        text-align: ${this.textAlign};
        pointer-events: none;
        user-select: none;
        ${writingModeCSS}
        ${overflowCSS}
        ${maxWidthCSS}
        ${lineHeightCSS}
      `;
      element.textContent = this.text;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - TextAtom\u6E32\u67D3\u6210\u529F: "${this.text.substring(0, 20)}..."`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - TextAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
};

// src/atoms/ImageAtom.ts
var ImageAtom = class {
  constructor(context, container, config) {
    this.capability = "image";
    this.containerWidth = 0;
    this.containerHeight = 0;
    this.imageNaturalWidth = 0;
    this.imageNaturalHeight = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.currentOffsetX = 0;
    this.currentOffsetY = 0;
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }
  render(container, config) {
    try {
      const fitMode = config.fitMode ?? "scroll";
      if (fitMode === "stretch") {
        this.renderStretch(container, config);
      } else {
        this.renderWithContainer(container, config, fitMode);
      }
      console.log(`[Atom] ${this.context.bakerId} - ImageAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ImageAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  renderStretch(container, config) {
    const element = document.createElement("img");
    element.setAttribute("data-atom-id", this.id);
    element.src = config.src;
    element.width = config.width;
    element.height = config.height;
    if (config.alt) element.alt = config.alt;
    element.style.cssText = `
      position: absolute;
      left: ${config.position?.x ?? 0}px;
      top: ${config.position?.y ?? 0}px;
      width: ${config.width}px;
      height: ${config.height}px;
      object-fit: fill;
    `;
    container.appendChild(element);
    this.imageElement = element;
  }
  renderWithContainer(container, config, fitMode) {
    const scrollContainer = document.createElement("div");
    scrollContainer.setAttribute("data-atom-id", this.id);
    const initialOffsetX = config.offsetX ?? 0;
    const initialOffsetY = config.offsetY ?? 0;
    this.containerWidth = config.width;
    this.containerHeight = config.height;
    scrollContainer.style.cssText = `
      position: absolute;
      left: ${config.position?.x ?? 0}px;
      top: ${config.position?.y ?? 0}px;
      width: ${config.width}px;
      height: ${config.height}px;
      overflow: hidden;
    `;
    const element = document.createElement("img");
    element.src = config.src;
    if (config.alt) element.alt = config.alt;
    if (fitMode === "crop") {
      element.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      scrollContainer.appendChild(element);
      container.appendChild(scrollContainer);
      this.imageElement = element;
    } else {
      element.style.cssText = `
        position: absolute;
        left: ${initialOffsetX}px;
        top: ${initialOffsetY}px;
        cursor: grab;
        user-select: none;
        -webkit-user-drag: none;
      `;
      this.currentOffsetX = initialOffsetX;
      this.currentOffsetY = initialOffsetY;
      this.setupScrollHandlers(element);
      scrollContainer.appendChild(element);
      container.appendChild(scrollContainer);
      this.imageElement = element;
      element.onload = () => {
        this.imageNaturalWidth = element.naturalWidth;
        this.imageNaturalHeight = element.naturalHeight;
        this.clampOffset();
      };
    }
  }
  clampOffset() {
    const maxOffsetX = 0;
    const minOffsetX = this.containerWidth - this.imageNaturalWidth;
    const maxOffsetY = 0;
    const minOffsetY = this.containerHeight - this.imageNaturalHeight;
    this.currentOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.currentOffsetX));
    this.currentOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.currentOffsetY));
    if (this.imageElement) {
      this.imageElement.style.left = `${this.currentOffsetX}px`;
      this.imageElement.style.top = `${this.currentOffsetY}px`;
    }
  }
  setupScrollHandlers(element) {
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.dragStartX = e.clientX - this.currentOffsetX;
      this.dragStartY = e.clientY - this.currentOffsetY;
      element.style.cursor = "grabbing";
      e.preventDefault();
    };
    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      this.currentOffsetX = e.clientX - this.dragStartX;
      this.currentOffsetY = e.clientY - this.dragStartY;
      this.clampOffset();
      e.preventDefault();
    };
    const onMouseUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      element.style.cursor = "grab";
    };
    const onMouseLeave = () => {
      this.isDragging = false;
      element.style.cursor = "grab";
    };
    element.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    element.addEventListener("mouseleave", onMouseLeave);
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX - this.currentOffsetX;
      this.dragStartY = e.touches[0].clientY - this.currentOffsetY;
      e.preventDefault();
    };
    const onTouchMove = (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      this.currentOffsetX = e.touches[0].clientX - this.dragStartX;
      this.currentOffsetY = e.touches[0].clientY - this.dragStartY;
      this.clampOffset();
      e.preventDefault();
    };
    const onTouchEnd = () => {
      this.isDragging = false;
    };
    element.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
  }
  getOffset() {
    return { x: this.currentOffsetX, y: this.currentOffsetY };
  }
  setOffset(x, y) {
    this.currentOffsetX = x;
    this.currentOffsetY = y;
    this.clampOffset();
  }
};

// src/atoms/VideoAtom.ts
var VideoAtom = class {
  constructor(context, container, config) {
    this.capability = "video";
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }
  render(container, config) {
    try {
      const radius = config.radius ?? 0;
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${config.width ? `${config.width}px` : "100%"};
        height: ${config.height ? `${config.height}px` : "auto"};
        border-radius: ${radius}px;
        overflow: hidden;
      `;
      const element = document.createElement("video");
      element.setAttribute("data-atom-id", this.id);
      element.src = config.src;
      element.controls = config.controls !== false;
      if (config.autoplay) element.autoplay = true;
      if (config.loop) element.loop = true;
      if (config.muted) element.muted = true;
      element.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      `;
      wrapper.appendChild(element);
      container.appendChild(wrapper);
      console.log(`[Atom] ${this.context.bakerId} - VideoAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - VideoAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
};

// src/atoms/AudioAtom.ts
var AudioAtom = class {
  constructor(context, container, config) {
    this.capability = "audio";
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }
  render(container, config) {
    try {
      const element = document.createElement("audio");
      element.setAttribute("data-atom-id", this.id);
      element.src = config.src;
      element.controls = true;
      if (config.autoplay) element.autoplay = true;
      if (config.loop) element.loop = true;
      if (config.muted) element.muted = true;
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${config.width ?? 300}px;
        height: ${config.height ?? 42}px;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - AudioAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - AudioAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
};

// src/atoms/CodeAtom.ts
var KEYWORDS = [
  "const",
  "let",
  "var",
  "function",
  "class",
  "interface",
  "type",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "throw",
  "new",
  "this",
  "import",
  "export",
  "default",
  "from",
  "as",
  "async",
  "await",
  "static",
  "public",
  "private",
  "protected",
  "extends",
  "implements",
  "true",
  "false",
  "null",
  "undefined"
];
var LANGUAGE_KEYWORDS = {
  javascript: KEYWORDS,
  typescript: [...KEYWORDS, "interface", "type", "enum", "namespace", "declare", "abstract"],
  python: ["def", "class", "if", "elif", "else", "for", "while", "try", "except", "finally", "with", "as", "import", "from", "return", "yield", "lambda", "pass", "break", "continue", "and", "or", "not", "in", "is", "None", "True", "False", "self", "async", "await"],
  java: ["public", "private", "protected", "class", "interface", "extends", "implements", "static", "final", "void", "int", "long", "double", "float", "boolean", "char", "byte", "short", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "super", "return", "null", "true", "false", "import", "package"],
  go: ["func", "var", "const", "type", "struct", "interface", "map", "chan", "package", "import", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "return", "go", "defer", "select", "fallthrough", "nil", "true", "false", "make", "new", "len", "cap", "append", "copy"],
  rust: ["fn", "let", "mut", "const", "static", "struct", "enum", "impl", "trait", "type", "where", "pub", "priv", "mod", "use", "crate", "super", "self", "Self", "if", "else", "match", "for", "while", "loop", "break", "continue", "return", "as", "in", "ref", "move", "async", "await", "dyn", "unsafe", "extern", "true", "false", "Some", "None", "Ok", "Err"]
};
var CodeAtom = class {
  constructor(context, container, config) {
    this.capability = "code";
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }
  format(code, language) {
    const lang = language ?? "javascript";
    if (lang === "python") {
      return this.formatPython(code);
    }
    return this.formatCStyle(code);
  }
  formatPython(code) {
    const lines = code.split("\n");
    const result = [];
    let indent = 0;
    const indentStr = "    ";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith("#") || line.startsWith('"""') || line.startsWith("'''")) {
        result.push(rawLine);
        continue;
      }
      const trimmed = line.replace(/:$/, "");
      if (trimmed) {
        const dedent = line.match(/^(elif|else|except)\b/);
        if (dedent) indent = Math.max(0, indent - 1);
        result.push(indentStr.repeat(indent) + trimmed + ":");
        if (dedent) indent++;
        if (["if", "elif", "else", "for", "while", "try", "except", "finally", "def", "class", "with", "async"].some((k) => line.startsWith(k))) {
          indent++;
        }
      } else {
        result.push("");
      }
    }
    return result.join("\n");
  }
  formatCStyle(code) {
    const tokens = [];
    let i = 0;
    const src = code;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '"' || ch === "'") {
        let str = ch;
        i++;
        while (i < src.length && src[i] !== ch) {
          if (src[i] === "\\" && i + 1 < src.length) {
            str += src[i] + src[i + 1];
            i += 2;
          } else {
            str += src[i];
            i++;
          }
        }
        if (i < src.length) {
          str += src[i];
          i++;
        }
        tokens.push(str);
      } else if (ch === "/" && src[i + 1] === "/") {
        let cmt = "";
        while (i < src.length && src[i] !== "\n") {
          cmt += src[i];
          i++;
        }
        tokens.push(cmt);
      } else if (ch === "/" && src[i + 1] === "*") {
        let cmt = "";
        while (i < src.length - 1 && !(src[i] === "*" && src[i + 1] === "/")) {
          cmt += src[i];
          i++;
        }
        if (i < src.length - 1) {
          cmt += "*/";
          i += 2;
        }
        tokens.push(cmt);
      } else if (" 	\n\r".includes(ch)) {
        let ws = "";
        while (i < src.length && " 	\n\r".includes(src[i])) {
          ws += src[i];
          i++;
        }
        tokens.push(ws);
      } else if ("{};,+-*/%=<>!&|?:".includes(ch)) {
        tokens.push(ch);
        i++;
      } else {
        let word = "";
        while (i < src.length && !" 	\n\r{};,+-*/%=<>!&|?:".includes(src[i])) {
          word += src[i];
          i++;
        }
        tokens.push(word);
      }
    }
    const lines = [];
    let line = "";
    let indent = 0;
    let prevTok = "";
    const indentStr = "  ";
    for (const tok of tokens) {
      if (tok === "\n") {
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line);
        lines.push("");
        line = "";
        prevTok = "\n";
      } else if (tok.trim() === "") {
        if (prevTok !== " " && prevTok !== "\n") line += " ";
        prevTok = tok;
      } else if (tok === "{") {
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line);
        lines.push(indentStr.repeat(indent) + "{");
        indent++;
        line = "";
        prevTok = "{";
      } else if (tok === "}") {
        indent = Math.max(0, indent - 1);
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line);
        lines.push(indentStr.repeat(indent) + "}");
        line = "";
        prevTok = "}";
      } else if (tok === ";") {
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line + ";");
        line = "";
        prevTok = ";";
      } else if (tok === ",") {
        line = line.trimEnd();
        lines.push(indentStr.repeat(indent) + line + ",");
        line = "";
        prevTok = ",";
      } else {
        line += tok;
        prevTok = tok;
      }
    }
    line = line.trimEnd();
    if (line) lines.push(indentStr.repeat(indent) + line);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
  }
  detectLanguage(code) {
    const src = code.trim();
    if (/^(def |import |from |class |if __name__ |print\(|elif |except |yield |lambda |async def )/.test(src)) return "python";
    if (/^(fn |let mut |impl |pub fn |struct |enum |use std|mod \w+;|-> |#\[)/.test(src)) return "rust";
    if (/^(func |package |import \"|type \w+ struct|func \(|go |defer )/.test(src)) return "go";
    if (/^(public class|private |protected |void |System\.out|import java|\.jar|@Override)/.test(src)) return "java";
    if (/^(import |export |const |let |var |function |class |interface |=>|async )/.test(src)) return "javascript";
    if (/:\s*(string|number|boolean|interface|type)\b/.test(src) || /interface\s+\w+\s*{/.test(src)) return "typescript";
    return "javascript";
  }
  highlight(code, language) {
    let escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const keywords = language && LANGUAGE_KEYWORDS[language] ? LANGUAGE_KEYWORDS[language] : LANGUAGE_KEYWORDS["javascript"];
    for (const kw of keywords) {
      const regex = new RegExp(`\\b(${kw})\\b`, "g");
      escaped = escaped.replace(regex, '<span style="color:#d73a49;font-weight:500">$1</span>');
    }
    escaped = escaped.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span style="color:#32a852">$1</span>');
    escaped = escaped.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span style="color:#6a737d;font-style:italic">$1</span>');
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#005cc5">$1</span>');
    return escaped;
  }
  render(container, config) {
    try {
      const formatted = config.autoFormat !== false ? this.format(config.code, config.language) : config.code;
      const bg = config.backgroundColor ?? [30, 30, 30];
      const bgColor = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      const textColor = bg[0] * 0.299 + bg[1] * 0.587 + bg[2] * 0.114 > 150 ? "#1e1e1e" : "#d4d4d4";
      const badgeBg = `rgb(${Math.min(255, bg[0] + 20)},${Math.min(255, bg[1] + 20)},${Math.min(255, bg[2] + 20)})`;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.innerHTML = this.highlight(formatted, config.language);
      pre.appendChild(code);
      pre.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${bgColor};
        padding: 10px;
        padding-top: 32px;
        border-radius: 16px;
        overflow: auto;
        white-space: pre;
        word-break: normal;
        box-sizing: border-box;
      `;
      code.style.cssText = `
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        color: ${textColor};
      `;
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-atom-id", this.id);
      wrapper.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${config.width ?? 400}px;
        height: ${config.height ?? 200}px;
      `;
      wrapper.appendChild(pre);
      container.appendChild(wrapper);
      const lang = config.language ?? this.detectLanguage(config.code);
      if (lang) {
        const badge = document.createElement("div");
        badge.textContent = lang;
        badge.style.cssText = `
          position: absolute;
          top: 6px;
          right: 10px;
          background: ${badgeBg};
          color: ${textColor};
          padding: 2px 8px;
          border-radius: 16px;
          font-size: 11px;
          font-family: 'Consolas', monospace;
          opacity: 0.8;
        `;
        pre.appendChild(badge);
      }
      console.log(`[Atom] ${this.context.bakerId} - CodeAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CodeAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
};

// src/atoms/IconAtom.ts
var IconAtom = class {
  constructor(context, container, config) {
    this.capability = "icon";
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }
  render(container, config) {
    try {
      const element = document.createElement("div");
      element.setAttribute("data-atom-id", this.id);
      const size = config.size ?? 24;
      const color = config.color ?? [51, 51, 51];
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
      `;
      if (config.svg) {
        const svgContainer = document.createElement("div");
        svgContainer.innerHTML = config.svg;
        const svgElement = svgContainer.querySelector("svg");
        if (svgElement) {
          svgElement.setAttribute("width", `${size}px`);
          svgElement.setAttribute("height", `${size}px`);
          svgElement.style.fill = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          element.appendChild(svgElement);
        }
      } else if (config.svgUrl) {
        const img = document.createElement("img");
        img.src = config.svgUrl;
        img.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          filter: invert(${color[0] / 255}) invert(${color[1] / 255}) invert(${color[2] / 255});
        `;
        element.appendChild(img);
      } else if (config.icon) {
        element.textContent = config.icon;
        element.style.fontSize = `${size}px`;
      }
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - IconAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - IconAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
};

// src/atoms/CanvasAtom.ts
var CanvasAtom = class {
  constructor(context, container, config) {
    this.capability = "canvas";
    this.blackboardStyle = false;
    this.strokes = [];
    this.currentColor = [0, 0, 0];
    this.currentWidth = 2;
    this.isEraser = false;
    this.isDrawing = false;
    this.currentStroke = null;
    this.context = context;
    this.id = config.id;
    this.canvasWidth = config.width ?? 400;
    this.canvasHeight = config.height ?? 300;
    this.blackboardStyle = config.blackboardStyle ?? false;
    this.currentColor = config.strokeColor ?? [0, 0, 0];
    this.currentWidth = config.strokeWidth ?? 2;
    this.render(container, config);
  }
  render(container, config) {
    try {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-atom-id", this.id);
      wrapper.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        display: inline-block;
      `;
      const canvasWrapper = document.createElement("div");
      canvasWrapper.style.cssText = `
        position: relative;
        width: ${this.canvasWidth}px;
        height: ${this.canvasHeight}px;
        border-radius: 8px;
        overflow: hidden;
      `;
      const canvas = document.createElement("canvas");
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      canvas.style.cssText = `
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        cursor: crosshair;
      `;
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      if (config.blackboardStyle) {
        canvas.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)";
        this.ctx.fillStyle = "#2d5a2d";
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      } else if (config.backgroundColor) {
        this.ctx.fillStyle = `rgb(${config.backgroundColor[0]},${config.backgroundColor[1]},${config.backgroundColor[2]})`;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
      this.setupDrawing(canvas, config);
      canvasWrapper.appendChild(canvas);
      if (config.resizable) {
        this.setupResize(canvasWrapper, canvas, config);
      }
      if (config.showToolbar) {
        const toolbar = this.createToolbar(canvas, config);
        canvasWrapper.appendChild(toolbar);
      }
      wrapper.appendChild(canvasWrapper);
      container.appendChild(wrapper);
      console.log(`[Atom] ${this.context.bakerId} - CanvasAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CanvasAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  createToolbar(_canvas, config) {
    const widths = config.defaultWidths ?? [1, 2, 4, 6, 8, 12, 16, 20];
    const minW = widths[0];
    const maxW = widths[widths.length - 1];
    const toolbarScale = Math.min(1, Math.max(0.4, this.canvasWidth / 550));
    const toolbar = document.createElement("div");
    const toolbarWidth = Math.min(this.canvasWidth - 24, 400);
    toolbar.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%) scale(${toolbarScale});
      transform-origin: center bottom;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      width: ${toolbarWidth}px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.5);
      pointer-events: auto;
    `;
    const previewSize = Math.max(8, Math.min(Math.round(this.currentWidth * 2), 30));
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = `#${this.currentColor[0].toString(16).padStart(2, "0")}${this.currentColor[1].toString(16).padStart(2, "0")}${this.currentColor[2].toString(16).padStart(2, "0")}`;
    colorInput.style.cssText = `
      width: ${previewSize}px;
      height: ${previewSize}px;
      min-width: ${previewSize}px;
      min-height: ${previewSize}px;
      padding: 0;
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      background: rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]});
      cursor: pointer;
      flex-shrink: 0;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    `;
    colorInput.oninput = () => {
      const hex = colorInput.value.replace("#", "");
      this.currentColor = [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
      this.isEraser = false;
      colorInput.style.background = `rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]})`;
    };
    colorInput.onchange = () => {
      const hex = colorInput.value.replace("#", "");
      this.currentColor = [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
      this.isEraser = false;
      colorInput.style.background = `rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]})`;
    };
    toolbar.appendChild(colorInput);
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(minW);
    slider.max = String(maxW);
    slider.value = String(this.currentWidth);
    slider.step = "1";
    slider.style.cssText = `
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      outline: none;
      cursor: pointer;
      -webkit-appearance: none;
    `;
    slider.oninput = () => {
      this.currentWidth = Number(slider.value);
      this.isEraser = false;
      const s = Math.max(8, Math.min(Math.round(this.currentWidth * 2), 30));
      colorInput.style.width = `${s}px`;
      colorInput.style.height = `${s}px`;
      colorInput.style.minWidth = `${s}px`;
      colorInput.style.minHeight = `${s}px`;
    };
    toolbar.appendChild(slider);
    const svgBtn = (onClick, pathD, viewBox = "0 0 24 24") => {
      const btn = document.createElement("button");
      btn.style.cssText = `
        width: 30px;
        height: 30px;
        padding: 0;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      `;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="${viewBox}" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${pathD}"/></svg>`;
      btn.onclick = onClick;
      return btn;
    };
    const eraserBtn = svgBtn(
      () => {
        this.isEraser = !this.isEraser;
        eraserBtn.style.background = this.isEraser ? "#e8f0ff" : "#fff";
        eraserBtn.style.borderColor = this.isEraser ? "#007aff" : "rgba(0,0,0,0.15)";
      },
      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
    );
    toolbar.appendChild(eraserBtn);
    const clearBtn = svgBtn(
      () => {
        this.strokes = [];
        this.redraw();
      },
      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    );
    toolbar.appendChild(clearBtn);
    const saveBtn = svgBtn(
      () => {
        const link = document.createElement("a");
        link.download = "canvas.png";
        link.href = this.canvas.toDataURL("image/png");
        link.click();
      },
      "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    );
    toolbar.appendChild(saveBtn);
    return toolbar;
  }
  setupResize(canvasWrapper, canvas, config) {
    const handle = document.createElement("div");
    const minW = config.minWidth ?? 350;
    const minH = config.minHeight ?? 150;
    handle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
      background: linear-gradient(135deg, transparent 50%, #aaa 50%);
      border-radius: 0 0 8px 0;
    `;
    let startX = 0, startY = 0, startW = 0, startH = 0;
    const onMouseMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newW = Math.max(minW, startW + dx);
      const newH = Math.max(minH, startH + dy);
      canvasWrapper.style.width = `${newW}px`;
      canvasWrapper.style.height = `${newH}px`;
      canvas.width = newW;
      canvas.height = newH;
      this.canvasWidth = newW;
      this.canvasHeight = newH;
      this.redraw();
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startW = canvasWrapper.offsetWidth;
      startH = canvasWrapper.offsetHeight;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
    canvasWrapper.appendChild(handle);
  }
  setupDrawing(canvas, _config) {
    canvas.addEventListener("mousedown", (e) => {
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.currentStroke = {
        points: [{ x, y }],
        color: this.currentColor,
        width: this.currentWidth,
        isEraser: this.isEraser
      };
    });
    canvas.addEventListener("mousemove", (e) => {
      if (!this.isDrawing || !this.currentStroke) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.currentStroke.points.push({ x, y });
      this.redraw();
      this.drawStroke(this.currentStroke);
    });
    const stopDrawing = () => {
      if (this.isDrawing && this.currentStroke) {
        this.strokes.push(this.currentStroke);
        this.currentStroke = null;
      }
      this.isDrawing = false;
    };
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
  }
  redraw() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.blackboardStyle) {
      this.ctx.fillStyle = "#2d5a2d";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.strokes.forEach((s) => this.drawStroke(s));
  }
  drawStroke(stroke) {
    if (!this.ctx || stroke.points.length < 2) return;
    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.isEraser ? this.blackboardStyle ? "#2d5a2d" : "#ffffff" : `rgb(${stroke.color[0]},${stroke.color[1]},${stroke.color[2]})`;
    this.ctx.lineWidth = stroke.isEraser ? stroke.width * 3 : stroke.width;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    this.ctx.stroke();
  }
};

// src/atoms/BackgroundAtom.ts
var BackgroundAtom = class {
  constructor(context, container, config) {
    this.capability = "background";
    this.context = context;
    this.id = config.id;
    this.color = config.color;
    this.opacity = config.opacity;
    this.gradient = config.gradient;
    this.position = config.position;
    this.width = config.width;
    this.height = config.height;
    this.radius = config.radius;
    this.element = this.render(container);
  }
  render(container) {
    const el = document.createElement("div");
    el.setAttribute("data-atom-id", this.id);
    let background = "";
    if (this.gradient) {
      const colors = this.gradient.colors.map((c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`).join(", ");
      if (this.gradient.type === "linear") {
        background = `linear-gradient(${this.gradient.direction ?? "to right"}, ${colors})`;
      } else {
        background = `radial-gradient(${colors})`;
      }
    } else if (this.color) {
      background = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
    } else {
      background = "transparent";
    }
    el.style.cssText = `
      position: absolute;
      left: ${this.position?.x ?? 0}px;
      top: ${this.position?.y ?? 0}px;
      width: ${this.width ?? 100}px;
      height: ${this.height ?? 100}px;
      background: ${background};
      opacity: ${this.opacity ?? 1};
      border: transparent;
      box-shadow: transparent;
      border-radius: ${this.radius ?? 0}px;
      pointer-events: none;
    `;
    container.appendChild(el);
    return el;
  }
  updateSize(width, height) {
    this.width = width;
    this.height = height;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }
  updateRadius(radius) {
    this.radius = radius;
    this.element.style.borderRadius = `${radius}px`;
  }
  updateOpacity(opacity) {
    this.opacity = opacity;
    this.element.style.opacity = `${opacity}`;
  }
};

// src/atoms/BorderAtom.ts
var BorderAtom = class {
  constructor(context, container, config) {
    this.capability = "border";
    this.context = context;
    this.id = config.id;
    this.borderWidth = config.borderWidth;
    this.color = config.color;
    this.position = config.position;
    this.width = config.width;
    this.height = config.height;
    this.radius = config.radius;
    this.element = this.render(container);
  }
  render(container) {
    const el = document.createElement("div");
    el.setAttribute("data-atom-id", this.id);
    el.style.cssText = `
      position: absolute;
      left: ${this.position?.x ?? 0}px;
      top: ${this.position?.y ?? 0}px;
      width: ${this.width ?? 100}px;
      height: ${this.height ?? 100}px;
      border: ${this.borderWidth}px solid rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
      border-radius: ${this.radius ?? 0}px;
      background: transparent;
      box-shadow: transparent;
      pointer-events: none;
    `;
    container.appendChild(el);
    return el;
  }
  updateSize(width, height) {
    this.width = width;
    this.height = height;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }
  updateRadius(radius) {
    this.radius = radius;
    this.element.style.borderRadius = `${radius}px`;
  }
};

// src/atoms/ShadowAtom.ts
var ShadowAtom = class {
  constructor(context, container, config) {
    this.capability = "shadow";
    this.context = context;
    this.id = config.id;
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.shadowBlur = config.shadowBlur;
    this.color = config.color;
    this.shadowWidth = config.shadowWidth;
    this.position = config.position;
    this.width = config.width;
    this.height = config.height;
    this.radius = config.radius;
    this.element = this.render(container);
  }
  render(container) {
    const el = document.createElement("div");
    el.setAttribute("data-atom-id", this.id);
    el.style.cssText = `
      position: absolute;
      left: ${this.position?.x ?? 0}px;
      top: ${this.position?.y ?? 0}px;
      width: ${this.width ?? 100}px;
      height: ${this.height ?? 100}px;
      box-shadow: ${this.x}px ${this.y}px ${this.shadowBlur ?? 15}px ${this.shadowWidth ?? 1}px rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.5);
      border-radius: ${this.radius ?? 0}px;
      background: transparent;
      border: transparent;
      pointer-events: none;
    `;
    container.appendChild(el);
    return el;
  }
  updateSize(width, height) {
    this.width = width;
    this.height = height;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }
  updateRadius(radius) {
    this.radius = radius;
    this.element.style.borderRadius = `${radius}px`;
  }
};

// src/atoms/ResizeHandleAtom.ts
var ResizeHandleAtom = class {
  constructor(context, element, config) {
    this.capability = "resize-handle";
    this.handle = null;
    this.targetElements = [];
    this.fixedElementIds = [];
    this.originalStyles = /* @__PURE__ */ new Map();
    this.originalWidth = 0;
    this.originalHeight = 0;
    this.minWidth = 50;
    this.minHeight = 50;
    this.handleColor = [200, 200, 200];
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.originalWidth = config.initialWidth || element.offsetWidth || 400;
    this.originalHeight = config.initialHeight || element.offsetHeight || 300;
    this.minWidth = config.minWidth || 50;
    this.minHeight = config.minHeight || 50;
    this.handleColor = config.handleColor || [220, 220, 220];
    this.fixedElementIds = config.fixedAtomIds || [];
    this.findTargets(config.targetAtomIds || []);
    this.saveOriginalStyles();
    this.createHandle();
  }
  findTargets(targetAtomIds) {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const atomId = child.getAttribute("data-atom-id");
      if (atomId && targetAtomIds.includes(atomId)) {
        this.targetElements.push(child);
      }
    }
  }
  saveOriginalStyles() {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      this.originalStyles.set(child, {
        left: parseFloat(child.style.left) || 0,
        top: parseFloat(child.style.top) || 0,
        width: parseFloat(child.style.width) || child.offsetWidth || 0,
        height: parseFloat(child.style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(child.style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0
      });
    }
  }
  createHandle() {
    this.handle = document.createElement("div");
    this.handle.setAttribute("data-atom-id", this.id);
    let containerRadius = 0;
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const atomId = child.getAttribute("data-atom-id");
      if (atomId && (atomId.startsWith("bg-") || atomId.startsWith("border-") || atomId.startsWith("shadow-"))) {
        const radius = parseInt(child.style.borderRadius) || 0;
        if (radius > 0) {
          containerRadius = radius;
          break;
        }
      }
    }
    if (containerRadius === 0) {
      containerRadius = parseInt(this.element.style.borderRadius) || 0;
    }
    const color = this.handleColor;
    this.handle.style.cssText = `
      position: absolute;
      right: 0;
      bottom: 0;
      width: 20px;
      height: 20px;
      background: rgb(${color[0]}, ${color[1]}, ${color[2]});
      border-radius: 0 0 ${containerRadius}px 0;
      clip-path: polygon(100% 0, 100% 100%, 0 100%);
      cursor: se-resize;
      pointer-events: auto;
    `;
    this.element.appendChild(this.handle);
    this.setupDrag();
  }
  setupDrag() {
    if (!this.handle) return;
    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startWidth = 0;
    let startHeight = 0;
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startWidth = this.element.offsetWidth;
      startHeight = this.element.offsetHeight;
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      const newWidth = Math.max(this.minWidth, startWidth + dx);
      const newHeight = Math.max(this.minHeight, startHeight + dy);
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
      this.targetElements.forEach((el) => {
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
      });
      const scaleX = newWidth / this.originalWidth;
      const scaleY = newHeight / this.originalHeight;
      console.log("scaleX:", scaleX, "scaleY:", scaleY, "newWidth:", newWidth, "newHeight:", newHeight, "originalWidth:", this.originalWidth, "originalHeight:", this.originalHeight);
      const children = this.element.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child === this.handle) continue;
        const atomId = child.getAttribute("data-atom-id") || "";
        if (this.targetElements.includes(child)) continue;
        if (this.fixedElementIds.includes(atomId)) continue;
        const original = this.originalStyles.get(child);
        if (!original) continue;
        child.style.left = `${original.left * scaleX}px`;
        child.style.top = `${original.top * scaleY}px`;
        child.style.width = `${original.width * scaleX}px`;
        child.style.height = `${original.height * scaleY}px`;
        child.style.fontSize = `${original.fontSize * Math.min(scaleX, scaleY)}px`;
        console.log("Applied to", atomId, "left:", child.style.left, "width:", child.style.width, "fontSize:", child.style.fontSize);
      }
    };
    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
    };
    this.handle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
};

// src/atoms/DragAtom.ts
var DragAtom = class {
  constructor(context, _element, config, callbacks) {
    this.capability = "drag";
    this.onMouseDownHandler = null;
    this.onMouseMoveHandler = null;
    this.onMouseUpHandler = null;
    this.isDragging = false;
    this.context = context;
    this.id = callbacks.id;
    this.callbacks = callbacks;
    this.handle = config.handle ?? _element;
    this.apply();
  }
  apply() {
    try {
      this.onMouseDownHandler = (e) => {
        const mouseEvent = e;
        if (mouseEvent.button !== 0) return;
        mouseEvent.preventDefault();
        this.isDragging = true;
        this.callbacks.onDragStart?.({ clientX: mouseEvent.clientX, clientY: mouseEvent.clientY });
      };
      this.onMouseMoveHandler = (e) => {
        if (!this.isDragging) return;
        const mouseEvent = e;
        this.callbacks.onDragMove?.({ clientX: mouseEvent.clientX, clientY: mouseEvent.clientY });
      };
      this.onMouseUpHandler = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.callbacks.onDragEnd?.();
      };
      this.handle.addEventListener("mousedown", this.onMouseDownHandler);
      document.addEventListener("mousemove", this.onMouseMoveHandler);
      document.addEventListener("mouseup", this.onMouseUpHandler);
      console.log(`[Atom] ${this.context.bakerId} - DragAtom\u5E94\u7528\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - DragAtom\u5E94\u7528\u5931\u8D25:`, error);
    }
  }
  destroy() {
    if (this.onMouseDownHandler) {
      this.handle.removeEventListener("mousedown", this.onMouseDownHandler);
    }
    if (this.onMouseMoveHandler) {
      document.removeEventListener("mousemove", this.onMouseMoveHandler);
    }
    if (this.onMouseUpHandler) {
      document.removeEventListener("mouseup", this.onMouseUpHandler);
    }
    this.onMouseDownHandler = null;
    this.onMouseMoveHandler = null;
    this.onMouseUpHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - DragAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/ResizeAtom.ts
var ResizeAtom = class {
  constructor(context, element, config, callbacks) {
    this.capability = "resize";
    this.startWidth = 0;
    this.startHeight = 0;
    this.onMouseDownHandler = null;
    this.onMouseMoveHandler = null;
    this.onMouseUpHandler = null;
    this.isResizing = false;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.callbacks = callbacks;
    this.startWidth = element.style.width ? parseFloat(element.style.width) : 100;
    this.startHeight = element.style.height ? parseFloat(element.style.height) : 100;
    this.apply();
  }
  apply() {
    try {
      let startX = 0;
      let startY = 0;
      const minWidth = this.config.minWidth ?? 20;
      const minHeight = this.config.minHeight ?? 20;
      const maxWidth = this.config.maxWidth ?? Infinity;
      const maxHeight = this.config.maxHeight ?? Infinity;
      this.onMouseDownHandler = (e) => {
        const mouseEvent = e;
        if (mouseEvent.button !== 0) return;
        mouseEvent.preventDefault();
        this.isResizing = true;
        startX = mouseEvent.clientX;
        startY = mouseEvent.clientY;
        this.startWidth = this.element.style.width ? parseFloat(this.element.style.width) : 100;
        this.startHeight = this.element.style.height ? parseFloat(this.element.style.height) : 100;
        this.callbacks.onResizeStart?.({ width: this.startWidth, height: this.startHeight });
      };
      this.onMouseMoveHandler = (e) => {
        if (!this.isResizing) return;
        const mouseEvent = e;
        const dx = mouseEvent.clientX - startX;
        const dy = mouseEvent.clientY - startY;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, this.startWidth + dx));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, this.startHeight + dy));
        this.callbacks.onResize?.({ width: newWidth, height: newHeight });
      };
      this.onMouseUpHandler = () => {
        if (!this.isResizing) return;
        this.isResizing = false;
        const finalWidth = this.element.style.width ? parseFloat(this.element.style.width) : this.startWidth;
        const finalHeight = this.element.style.height ? parseFloat(this.element.style.height) : this.startHeight;
        this.callbacks.onResizeEnd?.({ width: finalWidth, height: finalHeight });
      };
      this.element.addEventListener("mousedown", this.onMouseDownHandler);
      document.addEventListener("mousemove", this.onMouseMoveHandler);
      document.addEventListener("mouseup", this.onMouseUpHandler);
      console.log(`[Atom] ${this.context.bakerId} - ResizeAtom\u5E94\u7528\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeAtom\u5E94\u7528\u5931\u8D25:`, error);
    }
  }
  destroy() {
    if (this.onMouseDownHandler) {
      this.element.removeEventListener("mousedown", this.onMouseDownHandler);
    }
    if (this.onMouseMoveHandler) {
      document.removeEventListener("mousemove", this.onMouseMoveHandler);
    }
    if (this.onMouseUpHandler) {
      document.removeEventListener("mouseup", this.onMouseUpHandler);
    }
    this.onMouseDownHandler = null;
    this.onMouseMoveHandler = null;
    this.onMouseUpHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - ResizeAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/ScrollAtom.ts
var ScrollAtom = class {
  constructor(context, element, config, callbacks) {
    this.capability = "scroll";
    this.scrollX = 0;
    this.scrollY = 0;
    this.onWheelHandler = null;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.callbacks = callbacks;
    this.apply();
  }
  apply() {
    try {
      this.element.style.overflow = "hidden";
      const maxScrollX = this.config.maxScrollX ?? Infinity;
      const maxScrollY = this.config.maxScrollY ?? Infinity;
      this.onWheelHandler = (e) => {
        e.preventDefault();
        if (this.config.direction === "horizontal" || this.config.direction === "both") {
          this.scrollX = Math.max(0, Math.min(maxScrollX, this.scrollX + e.deltaX + e.deltaY));
        }
        if (this.config.direction === "vertical" || this.config.direction === "both" || !this.config.direction) {
          this.scrollY = Math.max(0, Math.min(maxScrollY, this.scrollY + e.deltaY));
        }
        this.callbacks.onScroll?.({ scrollX: this.scrollX, scrollY: this.scrollY });
      };
      this.element.addEventListener("wheel", this.onWheelHandler, { passive: false });
      console.log(`[Atom] ${this.context.bakerId} - ScrollAtom\u5E94\u7528\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ScrollAtom\u5E94\u7528\u5931\u8D25:`, error);
    }
  }
  destroy() {
    if (this.onWheelHandler) {
      this.element.removeEventListener("wheel", this.onWheelHandler);
    }
    this.onWheelHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - ScrollAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/ClickAtom.ts
var ClickAtom = class {
  constructor(context, element, callbacks) {
    this.capability = "click";
    this.clickCount = 0;
    this.onClickHandler = null;
    this.onDoubleClickHandler = null;
    this.onMouseDownHandler = null;
    this.onMouseUpHandler = null;
    this.context = context;
    this.id = callbacks.id;
    this.element = element;
    this.callbacks = callbacks;
    this.apply();
  }
  apply() {
    try {
      if (this.callbacks.onClick) {
        this.onClickHandler = (e) => {
          this.clickCount++;
          this.callbacks.onClick?.(e, this.clickCount);
        };
        this.element.addEventListener("click", this.onClickHandler);
      }
      if (this.callbacks.onDoubleClick) {
        this.onDoubleClickHandler = (e) => {
          this.callbacks.onDoubleClick?.(e);
        };
        this.element.addEventListener("dblclick", this.onDoubleClickHandler);
      }
      if (this.callbacks.onMouseDown) {
        this.onMouseDownHandler = (e) => {
          this.callbacks.onMouseDown?.(e);
        };
        this.element.addEventListener("mousedown", this.onMouseDownHandler);
      }
      if (this.callbacks.onMouseUp) {
        this.onMouseUpHandler = (e) => {
          this.callbacks.onMouseUp?.(e);
        };
        this.element.addEventListener("mouseup", this.onMouseUpHandler);
      }
      console.log(`[Atom] ${this.context.bakerId} - ClickAtom\u5E94\u7528\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ClickAtom\u5E94\u7528\u5931\u8D25:`, error);
    }
  }
  destroy() {
    if (this.onClickHandler) {
      this.element.removeEventListener("click", this.onClickHandler);
    }
    if (this.onDoubleClickHandler) {
      this.element.removeEventListener("dblclick", this.onDoubleClickHandler);
    }
    if (this.onMouseDownHandler) {
      this.element.removeEventListener("mousedown", this.onMouseDownHandler);
    }
    if (this.onMouseUpHandler) {
      this.element.removeEventListener("mouseup", this.onMouseUpHandler);
    }
    this.onClickHandler = null;
    this.onDoubleClickHandler = null;
    this.onMouseDownHandler = null;
    this.onMouseUpHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - ClickAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/HoverAtom.ts
var HoverAtom = class {
  constructor(context, element, callbacks) {
    this.capability = "hover";
    this.onHoverStartHandler = null;
    this.onHoverEndHandler = null;
    this.context = context;
    this.id = callbacks.id;
    this.element = element;
    this.callbacks = callbacks;
    this.apply();
  }
  apply() {
    try {
      if (this.callbacks.onHoverStart) {
        this.onHoverStartHandler = (e) => {
          this.callbacks.onHoverStart?.(e);
        };
        this.element.addEventListener("mouseenter", this.onHoverStartHandler);
      }
      if (this.callbacks.onHoverEnd) {
        this.onHoverEndHandler = (e) => {
          this.callbacks.onHoverEnd?.(e);
        };
        this.element.addEventListener("mouseleave", this.onHoverEndHandler);
      }
      console.log(`[Atom] ${this.context.bakerId} - HoverAtom\u5E94\u7528\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - HoverAtom\u5E94\u7528\u5931\u8D25:`, error);
    }
  }
  destroy() {
    if (this.onHoverStartHandler) {
      this.element.removeEventListener("mouseenter", this.onHoverStartHandler);
    }
    if (this.onHoverEndHandler) {
      this.element.removeEventListener("mouseleave", this.onHoverEndHandler);
    }
    this.onHoverStartHandler = null;
    this.onHoverEndHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - HoverAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/ScaleAtom.ts
var ScaleAtom = class {
  constructor(context, element, config) {
    this.capability = "scale";
    this.currentScale = 1;
    this.targetScale = 1;
    this.startScale = 1;
    this.animationId = 0;
    this.animationStartTime = 0;
    this.originalStyles = /* @__PURE__ */ new Map();
    this.isActive = false;
    this.doubleClickCount = 0;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      defaultValue: 1,
      keepOnRelease: false,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.saveOriginalStyles();
    this.apply();
  }
  saveOriginalStyles() {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = child.style;
      const { width, style: borderStyle, color: borderColor } = this.parseBorder(style.border);
      const boxShadowParts = this.parseBoxShadow(style.boxShadow);
      this.originalStyles.set(child, {
        left: parseFloat(style.left) || 0,
        top: parseFloat(style.top) || 0,
        width: parseFloat(style.width) || child.offsetWidth || 0,
        height: parseFloat(style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0,
        borderRadius: parseFloat(style.borderRadius) || 0,
        borderWidth: width,
        borderStyle,
        borderColor,
        boxShadowX: boxShadowParts.x,
        boxShadowY: boxShadowParts.y,
        boxShadowBlur: boxShadowParts.blur,
        boxShadowSpread: boxShadowParts.spread,
        boxShadowColor: boxShadowParts.color
      });
    }
  }
  parseBorder(border) {
    if (!border || border === "transparent" || border === "none") {
      return { width: 0, style: "none", color: "transparent" };
    }
    const parts = border.split(" ");
    let width = 0;
    let style = "solid";
    let color = "rgb(0, 0, 0)";
    for (const part of parts) {
      if (part.endsWith("px")) {
        width = parseFloat(part);
      } else if (["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset", "none", "hidden"].includes(part)) {
        style = part;
      } else if (part.startsWith("rgb") || part.startsWith("#") || part === "transparent") {
        color = part;
      }
    }
    return { width, style, color };
  }
  parseBoxShadow(boxShadow) {
    if (!boxShadow || boxShadow === "none" || boxShadow === "transparent") {
      return { x: 0, y: 0, blur: 0, spread: 0, color: "rgba(0, 0, 0, 0.5)" };
    }
    const parts = boxShadow.split(" ");
    if (parts.length >= 5) {
      return {
        x: parseFloat(parts[0]) || 0,
        y: parseFloat(parts[1]) || 0,
        blur: parseFloat(parts[2]) || 0,
        spread: parseFloat(parts[3]) || 0,
        color: parts.slice(4).join(" ")
      };
    }
    return { x: 0, y: 0, blur: 0, spread: 0, color: "rgba(0, 0, 0, 0.5)" };
  }
  onHoverChange(isHovered) {
    if (this.config.trigger !== "hover") return;
    if (isHovered) {
      this.isActive = true;
      this.animateToScale(this.config.value);
    } else if (!this.config.keepOnRelease) {
      this.isActive = false;
      this.animateToScale(this.config.defaultValue ?? 1);
    }
  }
  onClickChange(isClicked, clickCount) {
    if (this.config.trigger !== "click") return;
    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToScale(this.config.value);
      } else {
        this.isActive = false;
        this.animateToScale(this.config.defaultValue ?? 1);
      }
    } else {
      if (isClicked) {
        this.isActive = true;
        this.animateToScale(this.config.value);
      } else if (!this.config.keepOnRelease) {
        this.isActive = false;
        this.animateToScale(this.config.defaultValue ?? 1);
      }
    }
  }
  onDoubleClick() {
    if (this.config.trigger !== "doubleclick") return;
    this.doubleClickCount++;
    if (this.config.toggleOnClick) {
      const isOddClick = this.doubleClickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToScale(this.config.value);
      } else {
        this.isActive = false;
        this.animateToScale(this.config.defaultValue ?? 1);
      }
    } else {
      this.isActive = true;
      this.animateToScale(this.config.value);
    }
  }
  animateToScale(targetScale) {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startScale = this.currentScale;
    this.targetScale = targetScale;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1e3;
    const animate = (currentTime) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentScale = this.startScale + (this.targetScale - this.startScale) * eased;
      this.apply();
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentScale = this.targetScale;
        this.apply();
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }
  reset() {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentScale = this.config.defaultValue ?? 1;
    this.isActive = false;
    this.apply();
  }
  apply() {
    const scale = this.currentScale;
    const containerCenterX = this.element.offsetWidth / 2;
    const containerCenterY = this.element.offsetHeight / 2;
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const original = this.originalStyles.get(child);
      if (!original) continue;
      const childCenterX = original.left + original.width / 2;
      const childCenterY = original.top + original.height / 2;
      const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scale;
      const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scale;
      child.style.left = `${newChildCenterX - original.width * scale / 2}px`;
      child.style.top = `${newChildCenterY - original.height * scale / 2}px`;
      child.style.width = `${original.width * scale}px`;
      child.style.height = `${original.height * scale}px`;
      child.style.fontSize = `${original.fontSize * scale}px`;
      child.style.borderRadius = `${original.borderRadius * scale}px`;
      if (original.borderWidth > 0) {
        child.style.border = `${original.borderWidth * scale}px ${original.borderStyle} ${original.borderColor}`;
      }
      const hasBoxShadow = original.boxShadowX !== 0 || original.boxShadowY !== 0 || original.boxShadowBlur !== 0 || original.boxShadowSpread !== 0;
      if (hasBoxShadow) {
        child.style.boxShadow = `${original.boxShadowX * scale}px ${original.boxShadowY * scale}px ${original.boxShadowBlur * scale}px ${original.boxShadowSpread * scale}px ${original.boxShadowColor}`;
      }
    }
  }
  getValue() {
    return this.currentScale;
  }
  getIsActive() {
    return this.isActive;
  }
};

// src/atoms/OpacityAtom.ts
var OpacityAtom = class {
  constructor(context, element, config) {
    this.capability = "opacity";
    this.currentOpacity = 1;
    this.targetOpacity = 1;
    this.startOpacity = 1;
    this.animationId = 0;
    this.animationStartTime = 0;
    this.isActive = false;
    this.doubleClickCount = 0;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      defaultValue: 1,
      keepOnRelease: false,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.apply();
  }
  onHoverChange(isHovered) {
    if (this.config.trigger !== "hover") return;
    if (isHovered) {
      this.isActive = true;
      this.animateToOpacity(this.config.value);
    } else if (!this.config.keepOnRelease) {
      this.isActive = false;
      this.animateToOpacity(this.config.defaultValue ?? 1);
    }
  }
  onClickChange(isClicked, clickCount) {
    if (this.config.trigger !== "click") return;
    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToOpacity(this.config.value);
      } else {
        this.isActive = false;
        this.animateToOpacity(this.config.defaultValue ?? 1);
      }
    } else {
      if (isClicked) {
        this.isActive = true;
        this.animateToOpacity(this.config.value);
      } else if (!this.config.keepOnRelease) {
        this.isActive = false;
        this.animateToOpacity(this.config.defaultValue ?? 1);
      }
    }
  }
  onDoubleClick() {
    if (this.config.trigger !== "doubleclick") return;
    this.doubleClickCount++;
    if (this.config.toggleOnClick) {
      const isOddClick = this.doubleClickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToOpacity(this.config.value);
      } else {
        this.isActive = false;
        this.animateToOpacity(this.config.defaultValue ?? 1);
      }
    } else {
      this.isActive = true;
      this.animateToOpacity(this.config.value);
    }
  }
  animateToOpacity(targetOpacity) {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startOpacity = this.currentOpacity;
    this.targetOpacity = targetOpacity;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1e3;
    const animate = (currentTime) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentOpacity = this.startOpacity + (this.targetOpacity - this.startOpacity) * eased;
      this.apply();
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentOpacity = this.targetOpacity;
        this.apply();
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }
  reset() {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentOpacity = this.config.defaultValue ?? 1;
    this.isActive = false;
    this.apply();
  }
  apply() {
    this.element.style.opacity = this.currentOpacity.toString();
  }
  getValue() {
    return this.currentOpacity;
  }
  getIsActive() {
    return this.isActive;
  }
};

// src/atoms/RotateAtom.ts
var RotateAtom = class {
  constructor(context, element, config) {
    this.capability = "rotate";
    this.currentRotate = 0;
    this.targetRotate = 0;
    this.startRotate = 0;
    this.animationId = 0;
    this.animationStartTime = 0;
    this.isActive = false;
    this.doubleClickCount = 0;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      defaultValue: 0,
      keepOnRelease: false,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.apply();
  }
  onHoverChange(isHovered) {
    if (this.config.trigger !== "hover") return;
    if (isHovered) {
      this.isActive = true;
      this.animateToRotate(this.config.value);
    } else if (!this.config.keepOnRelease) {
      this.isActive = false;
      this.animateToRotate(this.config.defaultValue ?? 0);
    }
  }
  onClickChange(isClicked, clickCount) {
    if (this.config.trigger !== "click") return;
    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToRotate(this.config.value);
      } else {
        this.isActive = false;
        this.animateToRotate(this.config.defaultValue ?? 0);
      }
    } else {
      if (isClicked) {
        this.isActive = true;
        this.animateToRotate(this.config.value);
      } else if (!this.config.keepOnRelease) {
        this.isActive = false;
        this.animateToRotate(this.config.defaultValue ?? 0);
      }
    }
  }
  onDoubleClick() {
    if (this.config.trigger !== "doubleclick") return;
    this.doubleClickCount++;
    if (this.config.toggleOnClick) {
      const isOddClick = this.doubleClickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToRotate(this.config.value);
      } else {
        this.isActive = false;
        this.animateToRotate(this.config.defaultValue ?? 0);
      }
    } else {
      this.isActive = true;
      this.animateToRotate(this.config.value);
    }
  }
  animateToRotate(targetRotate) {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startRotate = this.currentRotate;
    this.targetRotate = targetRotate;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1e3;
    const animate = (currentTime) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentRotate = this.startRotate + (this.targetRotate - this.startRotate) * eased;
      this.apply();
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentRotate = this.targetRotate;
        this.apply();
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }
  reset() {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentRotate = this.config.defaultValue ?? 0;
    this.isActive = false;
    this.apply();
  }
  apply() {
    this.element.style.transform = `rotate(${this.currentRotate}deg)`;
  }
  getValue() {
    return this.currentRotate;
  }
  getIsActive() {
    return this.isActive;
  }
};

// src/atoms/TranslateAtom.ts
var TranslateAtom = class {
  constructor(context, element, config, originPosition) {
    this.capability = "translate";
    this.originX = 0;
    this.originY = 0;
    this.elementStartX = 0;
    this.elementStartY = 0;
    this.mouseStartX = 0;
    this.mouseStartY = 0;
    this.isDragging = false;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      keepOnRelease: false,
      ...config
    };
    this.originX = originPosition.x;
    this.originY = originPosition.y;
  }
  onDragStart(mouse) {
    this.isDragging = true;
    this.mouseStartX = mouse.clientX;
    this.mouseStartY = mouse.clientY;
    this.elementStartX = parseFloat(this.element.style.left) || 0;
    this.elementStartY = parseFloat(this.element.style.top) || 0;
  }
  onDragMove(mouse) {
    if (!this.isDragging) return;
    const dx = mouse.clientX - this.mouseStartX;
    const dy = mouse.clientY - this.mouseStartY;
    const newX = this.elementStartX + dx;
    const newY = this.elementStartY + dy;
    this.element.style.left = `${newX}px`;
    this.element.style.top = `${newY}px`;
  }
  onDragEnd() {
    this.isDragging = false;
    if (!this.config.keepOnRelease) {
      this.element.style.left = `${this.originX}px`;
      this.element.style.top = `${this.originY}px`;
    }
  }
  updateOrigin(originPosition) {
    this.originX = originPosition.x;
    this.originY = originPosition.y;
  }
  getValue() {
    return {
      x: parseFloat(this.element.style.left) || 0,
      y: parseFloat(this.element.style.top) || 0
    };
  }
};

// src/atoms/HeightAtom.ts
var HeightAtom = class {
  constructor(context, element, config) {
    this.capability = "height";
    this.targetHeight = 0;
    this.startHeight = 0;
    this.animationId = 0;
    this.animationStartTime = 0;
    this.isExpanded = false;
    this.originalStyles = /* @__PURE__ */ new Map();
    this.doubleClickCount = 0;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      id: config.id,
      keepOnRelease: config.keepOnRelease ?? false,
      toggleOnClick: config.toggleOnClick ?? true,
      duration: config.duration ?? 0.15,
      collapsedValue: config.collapsedValue,
      moleculeHeight: config.moleculeHeight,
      trigger: config.trigger,
      hiddenAtomIds: config.hiddenAtomIds,
      fixedAtomIds: config.fixedAtomIds
    };
    this.collapsedHeight = this.config.collapsedValue;
    this.expandedHeight = this.config.moleculeHeight;
    this.currentHeight = this.collapsedHeight;
    this.isExpanded = false;
    this.saveOriginalStyles();
    this.apply();
  }
  saveOriginalStyles() {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = child.style;
      const isText = child.tagName === "DIV" && child.textContent && !child.querySelector("canvas, img, video, audio");
      const { width, style: borderStyle, color: borderColor } = this.parseBorder(style.border);
      const boxShadowParts = this.parseBoxShadow(style.boxShadow);
      const atomId = child.getAttribute("data-atom-id") || "";
      this.originalStyles.set(child, {
        top: parseFloat(style.top) || 0,
        height: parseFloat(style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0,
        borderRadius: parseFloat(style.borderRadius) || 0,
        borderWidth: width,
        borderStyle,
        borderColor,
        boxShadowX: boxShadowParts.x,
        boxShadowY: boxShadowParts.y,
        boxShadowBlur: boxShadowParts.blur,
        boxShadowSpread: boxShadowParts.spread,
        boxShadowColor: boxShadowParts.color,
        isText: !!isText,
        atomId
      });
    }
  }
  parseBorder(border) {
    if (!border || border === "transparent" || border === "none") {
      return { width: 0, style: "none", color: "transparent" };
    }
    const parts = border.split(" ");
    let width = 0;
    let style = "solid";
    let color = "rgb(0, 0, 0)";
    for (const part of parts) {
      if (part.endsWith("px")) {
        width = parseFloat(part);
      } else if (["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset", "none", "hidden"].includes(part)) {
        style = part;
      } else if (part.startsWith("rgb") || part.startsWith("#") || part === "transparent") {
        color = part;
      }
    }
    return { width, style, color };
  }
  parseBoxShadow(boxShadow) {
    if (!boxShadow || boxShadow === "none" || boxShadow === "transparent") {
      return { x: 0, y: 0, blur: 0, spread: 0, color: "rgba(0, 0, 0, 0.5)" };
    }
    const parts = boxShadow.split(" ");
    if (parts.length >= 5) {
      return {
        x: parseFloat(parts[0]) || 0,
        y: parseFloat(parts[1]) || 0,
        blur: parseFloat(parts[2]) || 0,
        spread: parseFloat(parts[3]) || 0,
        color: parts.slice(4).join(" ")
      };
    }
    return { x: 0, y: 0, blur: 0, spread: 0, color: "rgba(0, 0, 0, 0.5)" };
  }
  onHoverChange(isHovered) {
    if (this.config.trigger !== "hover") return;
    if (isHovered) {
      this.isExpanded = true;
      this.animateToHeight(this.expandedHeight);
    } else if (!this.config.keepOnRelease) {
      this.isExpanded = false;
      this.animateToHeight(this.collapsedHeight);
    }
  }
  onClickChange(isClicked, clickCount) {
    if (this.config.trigger !== "click") return;
    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      this.animateToHeight(isOddClick ? this.expandedHeight : this.collapsedHeight);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.animateToHeight(this.expandedHeight);
      } else if (!this.config.keepOnRelease) {
        this.isExpanded = false;
        this.animateToHeight(this.collapsedHeight);
      }
    }
  }
  onDoubleClick() {
    if (this.config.trigger !== "doubleclick") return;
    this.doubleClickCount++;
    const isOddClick = this.doubleClickCount % 2 === 1;
    this.isExpanded = isOddClick;
    this.animateToHeight(isOddClick ? this.expandedHeight : this.collapsedHeight);
  }
  animateToHeight(targetHeight) {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startHeight = this.currentHeight;
    this.targetHeight = targetHeight;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1e3;
    const animate = (currentTime) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentHeight = this.startHeight + (this.targetHeight - this.startHeight) * eased;
      this.apply();
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentHeight = this.targetHeight;
        this.apply();
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }
  apply() {
    const scaleY = this.currentHeight / this.expandedHeight;
    const hiddenAtomIds = this.config.hiddenAtomIds || [];
    const fixedAtomIds = this.config.fixedAtomIds || [];
    this.element.style.height = `${this.currentHeight}px`;
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const original = this.originalStyles.get(child);
      if (!original) continue;
      if (fixedAtomIds.includes(original.atomId)) {
        console.log(`[HeightAtom] fixed\u539F\u5B50\u8DF3\u8FC7: ${original.atomId}`);
        continue;
      }
      child.style.top = `${original.top * scaleY}px`;
      child.style.height = `${original.height * scaleY}px`;
      if (original.isText) {
        child.style.fontSize = `${original.fontSize * scaleY}px`;
      }
      if (original.borderWidth > 0) {
        child.style.border = `${original.borderWidth * scaleY}px ${original.borderStyle} ${original.borderColor}`;
      }
      const hasBoxShadow = original.boxShadowX !== 0 || original.boxShadowY !== 0 || original.boxShadowBlur !== 0 || original.boxShadowSpread !== 0;
      if (hasBoxShadow) {
        child.style.boxShadow = `${original.boxShadowX * scaleY}px ${original.boxShadowY * scaleY}px ${original.boxShadowBlur * scaleY}px ${original.boxShadowSpread * scaleY}px ${original.boxShadowColor}`;
      }
      if (hiddenAtomIds.includes(original.atomId)) {
        const progress = (this.currentHeight - this.collapsedHeight) / (this.expandedHeight - this.collapsedHeight);
        const opacity = Math.max(0, Math.min(1, progress));
        child.style.opacity = `${opacity}`;
        child.style.pointerEvents = opacity < 0.3 ? "none" : "auto";
      }
    }
  }
  reset() {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentHeight = this.collapsedHeight;
    this.isExpanded = false;
    this.apply();
  }
  getValue() {
    return this.currentHeight;
  }
  getIsExpanded() {
    return this.isExpanded;
  }
};

// src/atoms/WidthAtom.ts
var WidthAtom = class {
  constructor(context, element, config) {
    this.capability = "width";
    this.targetWidth = 0;
    this.startWidth = 0;
    this.animationId = 0;
    this.animationStartTime = 0;
    this.isExpanded = false;
    this.originalStyles = /* @__PURE__ */ new Map();
    this.doubleClickCount = 0;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      id: config.id,
      keepOnRelease: config.keepOnRelease ?? false,
      toggleOnClick: config.toggleOnClick ?? true,
      duration: config.duration ?? 0.15,
      collapsedValue: config.collapsedValue,
      moleculeWidth: config.moleculeWidth,
      trigger: config.trigger,
      hiddenAtomIds: config.hiddenAtomIds,
      fixedAtomIds: config.fixedAtomIds
    };
    this.collapsedWidth = this.config.collapsedValue;
    this.expandedWidth = this.config.moleculeWidth;
    this.currentWidth = this.collapsedWidth;
    this.isExpanded = false;
    this.saveOriginalStyles();
    this.apply();
  }
  saveOriginalStyles() {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = child.style;
      const isText = child.tagName === "DIV" && child.textContent && !child.querySelector("canvas, img, video, audio");
      const atomId = child.getAttribute("data-atom-id") || "";
      this.originalStyles.set(child, {
        left: parseFloat(style.left) || 0,
        width: parseFloat(style.width) || child.offsetWidth || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0,
        isText: !!isText,
        atomId
      });
    }
  }
  onHoverChange(isHovered) {
    if (this.config.trigger !== "hover") return;
    if (isHovered) {
      this.isExpanded = true;
      this.animateToWidth(this.expandedWidth);
    } else if (!this.config.keepOnRelease) {
      this.isExpanded = false;
      this.animateToWidth(this.collapsedWidth);
    }
  }
  onClickChange(isClicked, clickCount) {
    if (this.config.trigger !== "click") return;
    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      this.animateToWidth(isOddClick ? this.expandedWidth : this.collapsedWidth);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.animateToWidth(this.expandedWidth);
      } else if (!this.config.keepOnRelease) {
        this.isExpanded = false;
        this.animateToWidth(this.collapsedWidth);
      }
    }
  }
  onDoubleClick() {
    if (this.config.trigger !== "doubleclick") return;
    this.doubleClickCount++;
    const isOddClick = this.doubleClickCount % 2 === 1;
    this.isExpanded = isOddClick;
    this.animateToWidth(isOddClick ? this.expandedWidth : this.collapsedWidth);
  }
  animateToWidth(targetWidth) {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startWidth = this.currentWidth;
    this.targetWidth = targetWidth;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1e3;
    const animate = (currentTime) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentWidth = this.startWidth + (this.targetWidth - this.startWidth) * eased;
      this.apply();
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentWidth = this.targetWidth;
        this.apply();
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }
  apply() {
    const scaleX = this.currentWidth / this.expandedWidth;
    const hiddenAtomIds = this.config.hiddenAtomIds || [];
    const fixedAtomIds = this.config.fixedAtomIds || [];
    this.element.style.width = `${this.currentWidth}px`;
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const original = this.originalStyles.get(child);
      if (!original) continue;
      if (fixedAtomIds.includes(original.atomId)) {
        continue;
      }
      child.style.left = `${original.left * scaleX}px`;
      child.style.width = `${original.width * scaleX}px`;
      if (original.isText) {
        child.style.fontSize = `${original.fontSize * scaleX}px`;
      }
      if (hiddenAtomIds.includes(original.atomId)) {
        const progress = (this.currentWidth - this.collapsedWidth) / (this.expandedWidth - this.collapsedWidth);
        const opacity = Math.max(0, Math.min(1, progress));
        child.style.opacity = `${opacity}`;
        child.style.pointerEvents = opacity < 0.3 ? "none" : "auto";
      }
    }
  }
  reset() {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentWidth = this.collapsedWidth;
    this.isExpanded = false;
    this.apply();
  }
  getValue() {
    return this.currentWidth;
  }
  getIsExpanded() {
    return this.isExpanded;
  }
};

// src/atoms/CollapseAtom.ts
var CollapseAtom = class {
  constructor(context, element, config, collapsedGroups) {
    this.capability = "collapse";
    this.currentHeight = "auto";
    this.isCollapsed = false;
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.collapsedGroups = collapsedGroups;
    this.syncWithGroups();
  }
  syncWithGroups() {
    const isCollapsed = this.collapsedGroups.has(this.config.group);
    if (isCollapsed !== this.isCollapsed) {
      this.isCollapsed = isCollapsed;
      if (this.isCollapsed && this.config.collapsedValue !== void 0) {
        this.currentHeight = `${this.config.collapsedValue}px`;
      } else if (!this.isCollapsed && this.config.expandedValue !== void 0) {
        this.currentHeight = `${this.config.expandedValue}px`;
      } else {
        this.currentHeight = "auto";
      }
      this.apply();
    }
  }
  toggle() {
    if (this.isCollapsed) {
      this.collapsedGroups.delete(this.config.group);
      this.isCollapsed = false;
      if (this.config.expandedValue !== void 0) {
        this.currentHeight = `${this.config.expandedValue}px`;
      } else {
        this.currentHeight = "auto";
      }
    } else {
      this.collapsedGroups.add(this.config.group);
      this.isCollapsed = true;
      if (this.config.collapsedValue !== void 0) {
        this.currentHeight = `${this.config.collapsedValue}px`;
      } else {
        this.currentHeight = "auto";
      }
    }
    this.apply();
  }
  apply() {
    this.element.style.height = this.currentHeight;
  }
  getValue() {
    return this.currentHeight;
  }
  getIsCollapsed() {
    return this.isCollapsed;
  }
  getGroup() {
    return this.config.group;
  }
};

// src/atoms/InputAtom.ts
var InputAtom = class {
  constructor(context, container, config) {
    this.capability = "input";
    this.element = null;
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(container);
  }
  render(container) {
    try {
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("data-atom-id", this.id);
      if (this.config.value) {
        input.value = this.config.value;
      }
      if (this.config.placeholder) {
        input.placeholder = this.config.placeholder;
      }
      const size = this.config.size ?? 16;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 200;
      const height = this.config.height ?? 32;
      input.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
      `;
      input.addEventListener("change", (e) => {
        this.config.onChange?.(e.target.value);
      });
      input.addEventListener("input", (e) => {
        this.config.onInput?.(e.target.value);
      });
      container.appendChild(input);
      this.element = input;
      console.log(`[Atom] ${this.context.bakerId} - InputAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - InputAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  getValue() {
    return this.element?.value ?? "";
  }
  setValue(value) {
    if (this.element) {
      this.element.value = value;
    }
  }
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - InputAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/SelectAtom.ts
var SelectAtom = class {
  constructor(context, container, config) {
    this.capability = "select";
    this.element = null;
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(container);
  }
  render(container) {
    try {
      const select = document.createElement("select");
      select.setAttribute("data-atom-id", this.id);
      this.config.options.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        if (option.value === this.config.value) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      const size = this.config.size ?? 16;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 200;
      const height = this.config.height ?? 32;
      select.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
        background: white;
        cursor: pointer;
      `;
      select.addEventListener("change", (e) => {
        this.config.onChange?.(e.target.value);
      });
      container.appendChild(select);
      this.element = select;
      console.log(`[Atom] ${this.context.bakerId} - SelectAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - SelectAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  getValue() {
    return this.element?.value ?? "";
  }
  setValue(value) {
    if (this.element) {
      this.element.value = value;
    }
  }
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - SelectAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/CheckboxAtom.ts
var CheckboxAtom = class {
  constructor(context, element, config) {
    this.capability = "checkbox";
    this.container = null;
    this.checkbox = null;
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(element);
  }
  render(container) {
    try {
      const label = document.createElement("label");
      label.setAttribute("data-atom-id", this.id);
      label.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      `;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.config.checked ?? false;
      checkbox.style.cssText = `
        width: 16px;
        height: 16px;
        margin-right: 8px;
        cursor: pointer;
      `;
      checkbox.addEventListener("change", (e) => {
        this.config.onChange?.(e.target.checked);
      });
      label.appendChild(checkbox);
      if (this.config.label) {
        const span = document.createElement("span");
        span.textContent = this.config.label;
        const size = this.config.size ?? 14;
        const color = this.config.color ?? [51, 51, 51];
        span.style.cssText = `
          font-size: ${size}px;
          color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        `;
        label.appendChild(span);
      }
      container.appendChild(label);
      this.container = label;
      this.checkbox = checkbox;
      console.log(`[Atom] ${this.context.bakerId} - CheckboxAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CheckboxAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  isChecked() {
    return this.checkbox?.checked ?? false;
  }
  setChecked(checked) {
    if (this.checkbox) {
      this.checkbox.checked = checked;
    }
  }
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.checkbox = null;
    console.log(`[Atom] ${this.context.bakerId} - CheckboxAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/TextareaAtom.ts
var TextareaAtom = class {
  constructor(context, container, config) {
    this.capability = "textarea";
    this.element = null;
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(container);
  }
  render(container) {
    try {
      const textarea = document.createElement("textarea");
      textarea.setAttribute("data-atom-id", this.id);
      if (this.config.value) {
        textarea.value = this.config.value;
      }
      if (this.config.placeholder) {
        textarea.placeholder = this.config.placeholder;
      }
      if (this.config.rows) {
        textarea.rows = this.config.rows;
      }
      const size = this.config.size ?? 14;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 300;
      const height = this.config.height ?? 100;
      textarea.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
        resize: vertical;
        font-family: inherit;
      `;
      textarea.addEventListener("change", (e) => {
        this.config.onChange?.(e.target.value);
      });
      textarea.addEventListener("input", (e) => {
        this.config.onInput?.(e.target.value);
      });
      container.appendChild(textarea);
      this.element = textarea;
      console.log(`[Atom] ${this.context.bakerId} - TextareaAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - TextareaAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  getValue() {
    return this.element?.value ?? "";
  }
  setValue(value) {
    if (this.element) {
      this.element.value = value;
    }
  }
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - TextareaAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/EditableTextAtom.ts
var EditableTextAtom = class {
  constructor(context, container, config) {
    this.capability = "editable-text";
    this.element = null;
    this.isEditing = false;
    this.context = context;
    this.id = config.id;
    this.config = {
      editable: true,
      ...config
    };
    this.render(container);
  }
  render(container) {
    try {
      const div = document.createElement("div");
      div.setAttribute("data-atom-id", this.id);
      div.textContent = this.config.text;
      const size = this.config.size ?? 16;
      const color = this.config.color ?? [51, 51, 51];
      div.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 4px 8px;
        border: 1px solid transparent;
        border-radius: 4px;
        cursor: text;
        user-select: text;
        min-width: 50px;
        white-space: pre-wrap;
      `;
      if (this.config.editable) {
        div.addEventListener("dblclick", () => {
          this.startEditing();
          this.config.onDoubleClick?.();
        });
        div.addEventListener("blur", () => {
          this.stopEditing();
        });
        div.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.stopEditing();
          }
          if (e.key === "Escape") {
            this.stopEditing();
          }
        });
      }
      container.appendChild(div);
      this.element = div;
      console.log(`[Atom] ${this.context.bakerId} - EditableTextAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - EditableTextAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  startEditing() {
    if (!this.element || this.isEditing) return;
    this.isEditing = true;
    this.element.contentEditable = "true";
    this.element.style.border = "1px solid #007bff";
    this.element.style.outline = "none";
    this.element.focus();
  }
  stopEditing() {
    if (!this.element || !this.isEditing) return;
    this.isEditing = false;
    this.element.contentEditable = "false";
    this.element.style.border = "1px solid transparent";
    const newText = this.element.textContent ?? "";
    if (newText !== this.config.text) {
      this.config.text = newText;
      this.config.onChange?.(newText);
    }
  }
  getText() {
    return this.element?.textContent ?? "";
  }
  setText(text) {
    if (this.element) {
      this.element.textContent = text;
      this.config.text = text;
    }
  }
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - EditableTextAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/ScrollContainerAtom.ts
var ScrollContainerAtom = class {
  constructor(context, container, config) {
    this.capability = "scroll-container";
    this.element = null;
    this.context = context;
    this.id = config.id;
    this.config = {
      direction: "vertical",
      ...config
    };
    this.render(container);
  }
  render(container) {
    try {
      const scrollContainer = document.createElement("div");
      scrollContainer.setAttribute("data-atom-id", this.id);
      const width = this.config.width ?? 300;
      const height = this.config.height ?? 200;
      let overflow = "hidden";
      if (this.config.direction === "vertical") {
        overflow = "auto hidden";
      } else if (this.config.direction === "horizontal") {
        overflow = "hidden auto";
      } else {
        overflow = "auto";
      }
      scrollContainer.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        overflow: ${overflow};
        box-sizing: border-box;
      `;
      scrollContainer.addEventListener("scroll", (e) => {
        const target = e.target;
        this.config.onScroll?.({
          scrollX: target.scrollLeft,
          scrollY: target.scrollTop
        });
      });
      container.appendChild(scrollContainer);
      this.element = scrollContainer;
      console.log(`[Atom] ${this.context.bakerId} - ScrollContainerAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ScrollContainerAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  getElement() {
    return this.element;
  }
  getScrollPosition() {
    return {
      scrollX: this.element?.scrollLeft ?? 0,
      scrollY: this.element?.scrollTop ?? 0
    };
  }
  scrollTo(x, y) {
    this.element?.scrollTo(x, y);
  }
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - ScrollContainerAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/atoms/FlexAtom.ts
var FlexAtom = class {
  constructor(context, container, config) {
    this.capability = "flex";
    this.element = null;
    this.context = context;
    this.id = config.id;
    this.config = {
      direction: "row",
      gap: 0,
      align: "start",
      justify: "start",
      wrap: false,
      ...config
    };
    this.render(container);
  }
  render(container) {
    try {
      const flexContainer = document.createElement("div");
      flexContainer.setAttribute("data-atom-id", this.id);
      const width = this.config.width ?? 300;
      const height = this.config.height ?? 200;
      const alignMap = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
        stretch: "stretch"
      };
      const justifyMap = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
        "space-between": "space-between",
        "space-around": "space-around"
      };
      flexContainer.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: ${this.config.direction};
        gap: ${this.config.gap ?? 0}px;
        align-items: ${alignMap[this.config.align ?? "start"]};
        justify-content: ${justifyMap[this.config.justify ?? "start"]};
        flex-wrap: ${this.config.wrap ? "wrap" : "nowrap"};
        box-sizing: border-box;
      `;
      container.appendChild(flexContainer);
      this.element = flexContainer;
      console.log(`[Atom] ${this.context.bakerId} - FlexAtom\u6E32\u67D3\u6210\u529F`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - FlexAtom\u6E32\u67D3\u5931\u8D25:`, error);
    }
  }
  getElement() {
    return this.element;
  }
  addChild(child) {
    this.element?.appendChild(child);
  }
  removeChild(child) {
    if (child.parentNode === this.element) {
      this.element?.removeChild(child);
    }
  }
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - FlexAtom\u5DF2\u9500\u6BC1`);
  }
};

// src/Beaker.ts
var Beaker = class _Beaker {
  constructor(id, molecule, bakerIndex, onStateChange) {
    this.onStateChange = null;
    this.contentAtoms = [];
    this.atomIndexCounter = 0;
    this.decorationAtoms = {};
    this.animationAtoms = {};
    this.subBeakers = /* @__PURE__ */ new Map();
    this.originalSubBeakerStyles = /* @__PURE__ */ new Map();
    this.originalChildStyles = /* @__PURE__ */ new Map();
    this.id = id;
    this.bakerIndex = bakerIndex;
    this.molecule = molecule;
    this.onStateChange = onStateChange || null;
    this.element = document.createElement("div");
    this.element.id = `beaker-${molecule.id}`;
    this.element.style.position = "absolute";
    if (molecule.position) {
      this.element.style.left = `${molecule.position.x}px`;
      this.element.style.top = `${molecule.position.y}px`;
    }
    this.element.style.overflow = "visible";
    this.element.style.background = "transparent";
    this.element.style.border = "transparent";
    this.element.style.outline = "transparent";
    this.element.style.boxShadow = "transparent";
    this.element.style.cursor = "default";
    this.element.style.borderRadius = `${molecule.radius ?? 12}px`;
    if (molecule.className) {
      this.element.className = molecule.className;
    }
    if (molecule.visible === false) {
      this.element.style.display = "none";
    }
    if (molecule.disabled) {
      this.element.style.pointerEvents = "none";
      this.element.style.opacity = "0.5";
    }
    if (molecule.selected) {
      this.element.style.outline = "2px solid #007bff";
    }
    this.state = this.createInitialState(molecule);
    this.init();
    molecule.onMount?.(this.element);
  }
  createInitialState(molecule) {
    return {
      id: this.id,
      moleculeId: molecule.id,
      isHovered: false,
      isClicked: false,
      isDragging: false,
      isResizing: false,
      position: { ...molecule.position ?? { x: 0, y: 0 } },
      width: void 0,
      height: void 0,
      scrollX: 0,
      scrollY: 0,
      collapsedGroups: /* @__PURE__ */ new Set()
    };
  }
  init() {
    const atoms = [...this.molecule.atoms || []];
    const contentCapabilities = ["text", "image", "video", "audio", "code", "icon", "canvas"];
    const decorationCapabilities = ["background", "border", "shadow"];
    const animationCapabilities = ["scale", "opacity", "rotate", "translate", "height", "width", "collapse"];
    const contentAtoms = atoms.filter((a) => contentCapabilities.includes(a.capability));
    const decorationAtoms = atoms.filter((a) => decorationCapabilities.includes(a.capability));
    const animationAtomConfigs = atoms.filter((a) => animationCapabilities.includes(a.capability));
    const userDuration = animationAtomConfigs.find((a) => a.duration !== void 0)?.duration;
    const duration = userDuration !== void 0 ? userDuration : 0;
    this.element.style.transition = `width ${duration}s ease, height ${duration}s ease, transform ${duration}s ease, opacity ${duration}s ease`;
    const calculatedSize = this.calculateContainerSize(contentAtoms);
    let width = this.molecule.width ?? calculatedSize.width;
    let height = this.molecule.height ?? calculatedSize.height;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.state.width = width;
    this.state.height = height;
    this.createDecorationAtoms(decorationAtoms, width, height);
    this.createContentAtoms(contentAtoms);
    this.createAnimationAtoms(animationAtomConfigs);
    this.createInputAtoms(atoms);
    this.createResizeHandles(atoms.filter((a) => a.capability === "resize-handle"));
    if (this.molecule.molecules && this.molecule.molecules.length > 0) {
      this.createSubBeakers(this.molecule.molecules);
    }
  }
  createSubBeakers(molecules) {
    molecules.forEach((molecule, index) => {
      if (molecule.molecules && molecule.molecules.length > 0) {
        this.showError("\u4E0D\u652F\u6301\u5D4C\u5957\u5B50\u5206\u5B50\uFF1A\u5B50\u5206\u5B50\u4E2D\u4E0D\u80FD\u518D\u5305\u542B\u5B50\u5206\u5B50");
        return;
      }
      const subBakerId = `${this.id}-sub-${index}`;
      const subBeaker = new _Beaker(
        subBakerId,
        molecule,
        this.bakerIndex + index + 1,
        this.onStateChange ?? void 0
      );
      if (molecule.position) {
        subBeaker.element.style.left = `${molecule.position.x}px`;
        subBeaker.element.style.top = `${molecule.position.y}px`;
      }
      this.originalSubBeakerStyles.set(subBeaker.element, {
        left: molecule.position?.x ?? 0,
        top: molecule.position?.y ?? 0,
        width: molecule.width ?? 100,
        height: molecule.height ?? 100
      });
      this.saveChildStyles(subBeaker.element);
      this.subBeakers.set(subBakerId, subBeaker);
      this.element.appendChild(subBeaker.element);
    });
  }
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px 30px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
      errorDiv.remove();
    }, 3e3);
  }
  saveChildStyles(element) {
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = child.style;
      this.originalChildStyles.set(child, {
        left: parseFloat(style.left) || 0,
        top: parseFloat(style.top) || 0,
        width: parseFloat(style.width) || child.offsetWidth || 0,
        height: parseFloat(style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0
      });
    }
  }
  applyScale(scale) {
    this.subBeakers.forEach((subBeaker) => {
      const original = this.originalSubBeakerStyles.get(subBeaker.element);
      if (original) {
        const containerCenterX = this.element.offsetWidth / 2;
        const containerCenterY = this.element.offsetHeight / 2;
        const childCenterX = original.left + original.width / 2;
        const childCenterY = original.top + original.height / 2;
        const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scale;
        const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scale;
        subBeaker.element.style.left = `${newChildCenterX - original.width * scale / 2}px`;
        subBeaker.element.style.top = `${newChildCenterY - original.height * scale / 2}px`;
        subBeaker.element.style.width = `${original.width * scale}px`;
        subBeaker.element.style.height = `${original.height * scale}px`;
        this.scaleChildren(subBeaker.element, scale);
      }
      subBeaker.applyScale(scale);
    });
  }
  scaleChildren(element, scale) {
    const containerCenterX = element.offsetWidth / 2;
    const containerCenterY = element.offsetHeight / 2;
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const original = this.originalChildStyles.get(child);
      if (!original) continue;
      const childCenterX = original.left + original.width / 2;
      const childCenterY = original.top + original.height / 2;
      const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scale;
      const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scale;
      child.style.left = `${newChildCenterX - original.width * scale / 2}px`;
      child.style.top = `${newChildCenterY - original.height * scale / 2}px`;
      child.style.width = `${original.width * scale}px`;
      child.style.height = `${original.height * scale}px`;
      child.style.fontSize = `${original.fontSize * scale}px`;
    }
  }
  createContext() {
    return {
      bakerId: this.id,
      bakerIndex: this.bakerIndex,
      atomIndex: this.atomIndexCounter++
    };
  }
  calculateContainerSize(atoms) {
    let maxX = 0;
    let maxY = 0;
    atoms.forEach((atom) => {
      const x = atom.position?.x ?? 0;
      const y = atom.position?.y ?? 0;
      let atomWidth = 0;
      let atomHeight = 0;
      switch (atom.capability) {
        case "text":
          atomWidth = (atom.text?.length ?? 0) * (atom.size ?? 16) * 0.6 + 20;
          atomHeight = (atom.size ?? 16) + 10;
          break;
        case "image":
          atomWidth = atom.width || 100;
          atomHeight = atom.height || 100;
          break;
        case "video":
          atomWidth = atom.width || 300;
          atomHeight = atom.height || 200;
          break;
        case "audio":
          atomWidth = 200;
          atomHeight = 40;
          break;
        case "code":
          atomWidth = 300;
          atomHeight = 150;
          break;
        case "icon":
          atomWidth = atom.size || 24;
          atomHeight = atom.size || 24;
          break;
        case "canvas":
          atomWidth = atom.width || 100;
          atomHeight = atom.height || 100;
          break;
      }
      maxX = Math.max(maxX, x + atomWidth);
      maxY = Math.max(maxY, y + atomHeight);
    });
    const padding = 0;
    return {
      width: Math.max(maxX + padding, 50),
      height: Math.max(maxY + padding, 30)
    };
  }
  createDecorationAtoms(atoms, moleculeWidth, moleculeHeight) {
    const moleculeRadius = this.molecule.radius ?? 12;
    atoms.forEach((config) => {
      const context = this.createContext();
      try {
        switch (config.capability) {
          case "background":
            this.decorationAtoms.background = new BackgroundAtom(context, this.element, {
              id: config.id,
              color: config.color,
              opacity: config.opacity,
              gradient: config.gradient,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
          case "border":
            this.decorationAtoms.border = new BorderAtom(context, this.element, {
              id: config.id,
              borderWidth: config.borderWidth,
              color: config.color,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
          case "shadow":
            this.decorationAtoms.shadow = new ShadowAtom(context, this.element, {
              id: config.id,
              x: config.x,
              y: config.y,
              shadowBlur: config.shadowBlur,
              color: config.color,
              shadowWidth: config.shadowWidth,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
        }
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFA\u88C5\u9970\u539F\u5B50\u5931\u8D25:`, error);
      }
    });
  }
  createContentAtoms(atoms) {
    atoms.forEach((atomConfig) => {
      const context = this.createContext();
      try {
        switch (atomConfig.capability) {
          case "text":
            this.contentAtoms.push(new TextAtom(context, this.element, {
              id: atomConfig.id,
              text: atomConfig.text,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position,
              writingMode: atomConfig.writingMode,
              fontWeight: atomConfig.fontWeight,
              fontStyle: atomConfig.fontStyle,
              textAlign: atomConfig.textAlign,
              overflow: atomConfig.overflow,
              maxWidth: atomConfig.maxWidth,
              lineHeight: atomConfig.lineHeight
            }));
            break;
          case "image":
            this.contentAtoms.push(new ImageAtom(context, this.element, {
              id: atomConfig.id,
              src: atomConfig.src,
              width: atomConfig.width,
              height: atomConfig.height,
              alt: atomConfig.alt,
              position: atomConfig.position
            }));
            break;
          case "video":
            this.contentAtoms.push(new VideoAtom(context, this.element, {
              id: atomConfig.id,
              src: atomConfig.src,
              width: atomConfig.width,
              height: atomConfig.height,
              position: atomConfig.position,
              radius: atomConfig.radius,
              autoplay: atomConfig.autoplay,
              loop: atomConfig.loop,
              muted: atomConfig.muted,
              controls: atomConfig.controls
            }));
            break;
          case "audio":
            this.contentAtoms.push(new AudioAtom(context, this.element, {
              id: atomConfig.id,
              src: atomConfig.src,
              position: atomConfig.position
            }));
            break;
          case "code":
            this.contentAtoms.push(new CodeAtom(context, this.element, {
              id: atomConfig.id,
              code: atomConfig.code,
              language: atomConfig.language,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height,
              backgroundColor: atomConfig.backgroundColor,
              autoFormat: atomConfig.autoFormat
            }));
            break;
          case "icon":
            this.contentAtoms.push(new IconAtom(context, this.element, {
              id: atomConfig.id,
              icon: atomConfig.icon,
              size: atomConfig.size,
              position: atomConfig.position
            }));
            break;
          case "canvas":
            this.contentAtoms.push(new CanvasAtom(context, this.element, {
              id: atomConfig.id,
              width: atomConfig.width,
              height: atomConfig.height,
              position: atomConfig.position,
              strokeColor: atomConfig.strokeColor,
              strokeWidth: atomConfig.strokeWidth,
              backgroundColor: atomConfig.backgroundColor,
              blackboardStyle: atomConfig.blackboardStyle,
              defaultWidths: atomConfig.defaultWidths,
              showToolbar: atomConfig.showToolbar,
              resizable: atomConfig.resizable,
              minWidth: atomConfig.minWidth,
              minHeight: atomConfig.minHeight
            }));
            break;
          case "input":
            this.contentAtoms.push(new InputAtom(context, this.element, {
              id: atomConfig.id,
              value: atomConfig.value,
              placeholder: atomConfig.placeholder,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height,
              onChange: atomConfig.onChange,
              onInput: atomConfig.onInput
            }));
            break;
          case "select":
            this.contentAtoms.push(new SelectAtom(context, this.element, {
              id: atomConfig.id,
              value: atomConfig.value,
              options: atomConfig.options,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height,
              onChange: atomConfig.onChange
            }));
            break;
          case "checkbox":
            this.contentAtoms.push(new CheckboxAtom(context, this.element, {
              id: atomConfig.id,
              checked: atomConfig.checked,
              label: atomConfig.label,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position,
              onChange: atomConfig.onChange
            }));
            break;
          case "textarea":
            this.contentAtoms.push(new TextareaAtom(context, this.element, {
              id: atomConfig.id,
              value: atomConfig.value,
              placeholder: atomConfig.placeholder,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height,
              rows: atomConfig.rows,
              onChange: atomConfig.onChange,
              onInput: atomConfig.onInput
            }));
            break;
          case "editable-text":
            this.contentAtoms.push(new EditableTextAtom(context, this.element, {
              id: atomConfig.id,
              text: atomConfig.text,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position,
              editable: atomConfig.editable,
              onChange: atomConfig.onChange,
              onDoubleClick: atomConfig.onDoubleClick
            }));
            break;
          case "scroll-container":
            this.contentAtoms.push(new ScrollContainerAtom(context, this.element, {
              id: atomConfig.id,
              direction: atomConfig.direction,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height,
              onScroll: atomConfig.onScroll
            }));
            break;
          case "flex":
            this.contentAtoms.push(new FlexAtom(context, this.element, {
              id: atomConfig.id,
              direction: atomConfig.direction,
              gap: atomConfig.gap,
              align: atomConfig.align,
              justify: atomConfig.justify,
              wrap: atomConfig.wrap,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height
            }));
            break;
        }
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFAContentAtom\u5931\u8D25:`, error);
      }
    });
  }
  createAnimationAtoms(animationConfigs) {
    animationConfigs.forEach((config) => {
      const context = this.createContext();
      try {
        switch (config.capability) {
          case "scale":
            this.animationAtoms.scale = new ScaleAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 1,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case "opacity":
            this.animationAtoms.opacity = new OpacityAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 1,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case "rotate":
            this.animationAtoms.rotate = new RotateAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 0,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case "translate":
            this.animationAtoms.translate = new TranslateAtom(context, this.element, {
              id: config.id,
              trigger: config.trigger,
              keepOnRelease: config.keepOnRelease
            }, this.state.position);
            break;
          case "height":
            this.animationAtoms.height = new HeightAtom(context, this.element, {
              id: config.id,
              collapsedValue: config.collapsedValue,
              moleculeHeight: this.molecule.height ?? this.element.offsetHeight,
              trigger: config.trigger,
              hiddenAtomIds: config.hiddenAtomIds,
              fixedAtomIds: config.fixedAtomIds,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case "width":
            this.animationAtoms.width = new WidthAtom(context, this.element, {
              id: config.id,
              collapsedValue: config.collapsedValue,
              moleculeWidth: this.molecule.width ?? this.element.offsetWidth,
              trigger: config.trigger,
              hiddenAtomIds: config.hiddenAtomIds,
              fixedAtomIds: config.fixedAtomIds,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case "collapse":
            if (!this.animationAtoms.collapse) {
              this.animationAtoms.collapse = [];
            }
            this.animationAtoms.collapse.push(new CollapseAtom(
              context,
              this.element,
              {
                id: config.id,
                group: config.group,
                expandedValue: config.expandedValue,
                collapsedValue: config.collapsedValue
              },
              this.state.collapsedGroups
            ));
            break;
        }
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFA\u52A8\u753B\u539F\u5B50\u5931\u8D25:`, error);
      }
    });
  }
  createInputAtoms(atoms) {
    const clickConfig = atoms.find((a) => a.capability === "click");
    if (clickConfig) {
      const context = this.createContext();
      try {
        new ClickAtom(context, this.element, {
          id: clickConfig.id,
          onClick: (_e, clickCount) => {
            this.updateClickState(true, clickCount);
          },
          onMouseUp: () => {
            this.updateClickRelease();
          },
          onDoubleClick: (e) => {
            this.updateDoubleClick();
            clickConfig.onDoubleClick?.(e);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFAClickAtom\u5931\u8D25:`, error);
      }
    }
    const dragConfig = atoms.find((a) => a.capability === "drag");
    if (dragConfig) {
      const context = this.createContext();
      try {
        new DragAtom(context, this.element, {
          handle: dragConfig.handle
        }, {
          id: dragConfig.id,
          onDragStart: (mouse) => {
            this.updateDragStart(mouse);
          },
          onDragMove: (mouse) => {
            this.updateDragMove(mouse);
          },
          onDragEnd: () => {
            this.updateDragEnd();
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFADragAtom\u5931\u8D25:`, error);
      }
    }
    const resizeConfig = atoms.find((a) => a.capability === "resize");
    if (resizeConfig) {
      const context = this.createContext();
      try {
        new ResizeAtom(context, this.element, {
          id: resizeConfig.id,
          minWidth: resizeConfig.minWidth,
          minHeight: resizeConfig.minHeight,
          maxWidth: resizeConfig.maxWidth,
          maxHeight: resizeConfig.maxHeight
        }, {
          onResizeStart: (size) => {
            this.updateResizeStart(size);
            resizeConfig.onResizeStart?.(size);
          },
          onResize: (size) => {
            this.updateResizeMove(size);
            resizeConfig.onResize?.(size);
          },
          onResizeEnd: (size) => {
            this.updateResizeEnd(size);
            resizeConfig.onResizeEnd?.(size);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFAResizeAtom\u5931\u8D25:`, error);
      }
    }
    const scrollConfig = atoms.find((a) => a.capability === "scroll");
    if (scrollConfig) {
      const context = this.createContext();
      try {
        new ScrollAtom(context, this.element, {
          id: scrollConfig.id,
          direction: scrollConfig.direction,
          maxScrollX: scrollConfig.maxScrollX,
          maxScrollY: scrollConfig.maxScrollY
        }, {
          onScroll: (pos) => {
            this.updateScrollState(pos.scrollX, pos.scrollY);
            scrollConfig.onScroll?.(pos);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFAScrollAtom\u5931\u8D25:`, error);
      }
    }
    const hoverConfig = atoms.find((a) => a.capability === "hover");
    if (hoverConfig) {
      const context = this.createContext();
      try {
        new HoverAtom(context, this.element, {
          id: hoverConfig.id,
          onHoverStart: () => {
            this.updateHoverState(true);
          },
          onHoverEnd: () => {
            this.updateHoverState(false);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFAHoverAtom\u5931\u8D25:`, error);
      }
    }
    const collapseConfigs = atoms.filter((a) => a.capability === "collapse");
    collapseConfigs.forEach((config) => {
      this.element.addEventListener("click", () => {
        if (this.animationAtoms.collapse) {
          const collapseAtom = this.animationAtoms.collapse.find((c) => c.getGroup() === config.group);
          if (collapseAtom) {
            collapseAtom.toggle();
          }
        }
      });
    });
  }
  createResizeHandles(configs) {
    configs.forEach((config) => {
      const context = this.createContext();
      try {
        this.animationAtoms.resizeHandle = new ResizeHandleAtom(context, this.element, {
          id: config.id,
          targetAtomIds: config.targetAtomIds,
          fixedAtomIds: config.fixedAtomIds,
          initialWidth: this.molecule.width,
          initialHeight: this.molecule.height,
          minWidth: config.minWidth,
          minHeight: config.minHeight,
          handleColor: config.handleColor
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - \u521B\u5EFAResizeHandleAtom\u5931\u8D25:`, error);
      }
    });
  }
  notifyHoverChange(isHovered) {
    this.animationAtoms.scale?.onHoverChange(isHovered);
    this.animationAtoms.opacity?.onHoverChange(isHovered);
    this.animationAtoms.rotate?.onHoverChange(isHovered);
    this.animationAtoms.height?.onHoverChange(isHovered);
    this.animationAtoms.width?.onHoverChange(isHovered);
    if (this.animationAtoms.scale) {
      const scale = this.animationAtoms.scale.getValue();
      this.applyScale(scale);
    }
    this.subBeakers.forEach((subBeaker) => {
      subBeaker.notifyHoverChange(isHovered);
    });
  }
  notifyClickChange(isClicked, clickCount) {
    this.animationAtoms.scale?.onClickChange(isClicked, clickCount);
    this.animationAtoms.opacity?.onClickChange(isClicked, clickCount);
    this.animationAtoms.rotate?.onClickChange(isClicked, clickCount);
    this.animationAtoms.height?.onClickChange(isClicked, clickCount);
    this.animationAtoms.width?.onClickChange(isClicked, clickCount);
    if (this.animationAtoms.scale) {
      const scale = this.animationAtoms.scale.getValue();
      this.applyScale(scale);
    }
    this.subBeakers.forEach((subBeaker) => {
      subBeaker.notifyClickChange(isClicked, clickCount);
    });
  }
  notifyDoubleClick() {
    this.animationAtoms.scale?.onDoubleClick();
    this.animationAtoms.opacity?.onDoubleClick();
    this.animationAtoms.rotate?.onDoubleClick();
    this.animationAtoms.height?.onDoubleClick();
    this.animationAtoms.width?.onDoubleClick();
    if (this.animationAtoms.scale) {
      const scale = this.animationAtoms.scale.getValue();
      this.applyScale(scale);
    }
    this.subBeakers.forEach((subBeaker) => {
      subBeaker.notifyDoubleClick();
    });
  }
  emitStateChange(partialState) {
    if (this.onStateChange) {
      this.onStateChange(this.id, partialState);
    }
  }
  updateHoverState(isHovered) {
    this.state.isHovered = isHovered;
    this.notifyHoverChange(isHovered);
    this.emitStateChange({ isHovered });
  }
  updateClickState(isClicked, clickCount) {
    this.state.isClicked = isClicked;
    this.notifyClickChange(isClicked, clickCount);
    this.emitStateChange({ isClicked });
  }
  updateClickRelease() {
    this.state.isClicked = false;
    this.notifyClickChange(false, 0);
    this.emitStateChange({ isClicked: false });
  }
  updateDoubleClick() {
    this.notifyDoubleClick();
  }
  updateDragStart(mouse) {
    this.state.isDragging = true;
    this.animationAtoms.translate?.onDragStart(mouse);
    this.emitStateChange({ isDragging: true });
  }
  updateDragMove(mouse) {
    this.animationAtoms.translate?.onDragMove(mouse);
  }
  updateDragEnd() {
    this.state.isDragging = false;
    this.animationAtoms.translate?.onDragEnd();
    this.emitStateChange({ isDragging: false });
  }
  updateResizeStart(size) {
    this.state.isResizing = true;
    this.state.width = size.width;
    this.state.height = size.height;
    this.emitStateChange({ isResizing: true, width: size.width, height: size.height });
  }
  updateResizeMove(size) {
    this.state.width = size.width;
    this.state.height = size.height;
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;
    this.emitStateChange({ width: size.width, height: size.height });
  }
  updateResizeEnd(size) {
    this.state.isResizing = false;
    this.state.width = size.width;
    this.state.height = size.height;
    this.emitStateChange({ isResizing: false, width: size.width, height: size.height });
  }
  updateScrollState(scrollX, scrollY) {
    if (scrollX !== void 0) {
      this.state.scrollX = scrollX;
    }
    if (scrollY !== void 0) {
      this.state.scrollY = scrollY;
    }
    this.emitStateChange({ scrollX: this.state.scrollX, scrollY: this.state.scrollY });
  }
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.id, newState);
    }
  }
  getState() {
    return { ...this.state };
  }
  updatePosition(x, y) {
    this.state.position = { x, y };
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    if (this.animationAtoms.translate) {
      this.animationAtoms.translate.updateOrigin({ x, y });
    }
    if (this.onStateChange) {
      this.onStateChange(this.id, { position: { x, y } });
    }
  }
  show() {
    this.setVisible(true);
  }
  hide() {
    this.setVisible(false);
  }
  setVisible(visible) {
    this.state.visible = visible;
    this.element.style.display = visible ? "block" : "none";
    this.emitStateChange({ visible });
  }
  setSelected(selected) {
    this.state.selected = selected;
    if (selected) {
      this.element.style.outline = "2px solid #007bff";
    } else {
      this.element.style.outline = "transparent";
    }
    this.emitStateChange({ selected });
  }
  setDisabled(disabled) {
    this.state.disabled = disabled;
    this.element.style.pointerEvents = disabled ? "none" : "auto";
    this.element.style.opacity = disabled ? "0.5" : "1";
    this.emitStateChange({ disabled });
  }
  getElement() {
    return this.element;
  }
  destroy() {
    this.molecule.onDestroy?.();
    this.subBeakers.forEach((subBeaker) => {
      subBeaker.destroy();
    });
    this.subBeakers.clear();
    this.contentAtoms.forEach((atom) => {
      if (atom && typeof atom.destroy === "function") {
        atom.destroy();
      }
    });
    this.contentAtoms = [];
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.onStateChange = null;
    this.originalSubBeakerStyles.clear();
    this.originalChildStyles.clear();
    console.log(`[Beaker] ${this.id} \u5DF2\u9500\u6BC1`);
  }
};

// src/BeakerManager.ts
var BeakerManager = class {
  constructor(molecules, parentContainer, workplaceConfig) {
    this.bakers = /* @__PURE__ */ new Map();
    this.bakerStates = /* @__PURE__ */ new Map();
    this.bakerIdCounter = 0;
    this.workplaceConfig = {};
    this.parentContainer = parentContainer ?? document.body;
    this.workplaceConfig = {
      backgroundColor: "#ffffff",
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "#000000",
      showShadow: true,
      shadowBlur: 20,
      shadowSpread: 0,
      shadowColor: "rgba(0,0,0,0.1)",
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      clipContent: true,
      overflow: "visible",
      ...workplaceConfig
    };
    this.workplace = this.createWorkplace(this.workplaceConfig);
    molecules.forEach((molecule) => {
      this.addMolecule(molecule);
    });
  }
  createWorkplace(config) {
    const workplace = document.createElement("div");
    workplace.className = "atom-engine-workplace";
    this.workplace = workplace;
    this.parentContainer.appendChild(workplace);
    this.applyWorkplaceStyles(config);
    return workplace;
  }
  /**
   * 将值转换为像素单位。如果是数字或纯数字字符串，则添加 'px'。
   */
  applyWorkplaceStyles(config) {
    const style = this.workplace.style;
    const px = (v, def = "0px") => {
      if (v === void 0 || v === null) return def;
      if (typeof v === "number") return `${v}px`;
      if (/^\d+$/.test(v)) return `${v}px`;
      return v;
    };
    style.position = config.positionType ?? "absolute";
    style.left = px(config.position?.x);
    style.top = px(config.position?.y);
    style.width = typeof config.width === "number" ? `${config.width}px` : config.width || "100%";
    style.height = typeof config.height === "number" ? `${config.height}px` : config.height || "100%";
    if (config.backgroundColor) {
      style.backgroundColor = config.backgroundColor;
    }
    if (config.borderRadius !== void 0) {
      style.borderRadius = px(config.borderRadius);
    }
    if (config.borderWidth !== void 0) {
      style.borderWidth = px(config.borderWidth);
      style.borderStyle = (typeof config.borderWidth === "number" ? config.borderWidth : parseFloat(config.borderWidth)) > 0 ? "solid" : "none";
    }
    if (config.borderColor) {
      style.borderColor = config.borderColor;
    }
    if (config.showShadow === false) {
      style.boxShadow = "none";
    } else if (config.showShadow || config.shadowBlur !== void 0 || config.shadowSpread !== void 0 || config.shadowColor || config.shadowOffsetX !== void 0 || config.shadowOffsetY !== void 0) {
      const x = px(config.shadowOffsetX);
      const y = px(config.shadowOffsetY, "2px");
      const blur = px(config.shadowBlur, "20px");
      const spread = px(config.shadowSpread);
      const color = config.shadowColor ?? "rgba(0,0,0,0.1)";
      style.boxShadow = `${x} ${y} ${blur} ${spread} ${color}`;
    }
    if (config.gradientType && config.gradientType !== "none" && config.gradientColors && config.gradientColors.length > 0) {
      const colors = config.gradientColors;
      const stops = config.gradientStops;
      const colorStrs = colors.map((c, i) => stops && stops[i] !== void 0 ? `${c} ${stops[i] * 100}%` : c);
      if (config.gradientType === "linear") {
        const angle = config.gradientAngle ?? 180;
        style.backgroundImage = `linear-gradient(${angle}deg, ${colorStrs.join(", ")})`;
      } else if (config.gradientType === "radial") {
        style.backgroundImage = `radial-gradient(circle, ${colorStrs.join(", ")})`;
      }
    } else if (config.backgroundImage) {
      style.backgroundImage = `url(${config.backgroundImage})`;
      style.backgroundSize = config.backgroundSize ?? "cover";
      style.backgroundPosition = config.backgroundPosition ?? "center";
      style.backgroundRepeat = config.backgroundRepeat ?? "no-repeat";
    } else if (config.gradientType === "none") {
      style.backgroundImage = "none";
    }
    if (config.overflow) {
      style.overflow = config.overflow;
    }
    if (config.clipContent !== void 0) {
      style.overflow = config.clipContent ? "hidden" : config.overflow ?? "visible";
    }
  }
  addMolecule(molecule) {
    const bakerIndex = this.bakerIdCounter;
    const bakerId = `baker-${this.bakerIdCounter++}`;
    const baker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
    this.bakers.set(bakerId, baker);
    this.bakerStates.set(bakerId, baker.getState());
    this.workplace.appendChild(baker.element);
    return baker;
  }
  removeMolecule(bakerId) {
    const baker = this.bakers.get(bakerId);
    if (baker) {
      baker.destroy();
      this.bakers.delete(bakerId);
      this.bakerStates.delete(bakerId);
    }
  }
  updateMolecule(bakerId, molecule) {
    const baker = this.bakers.get(bakerId);
    if (baker) {
      baker.destroy();
      const bakerIndex = baker.bakerIndex;
      const newBaker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
      this.bakers.set(bakerId, newBaker);
      this.bakerStates.set(bakerId, newBaker.getState());
      this.workplace.appendChild(newBaker.element);
    }
  }
  clearAll() {
    this.bakers.forEach((baker) => {
      baker.destroy();
    });
    this.bakers.clear();
    this.bakerStates.clear();
  }
  destroy() {
    this.clearAll();
    if (this.workplace.parentNode) {
      this.workplace.parentNode.removeChild(this.workplace);
    }
  }
  handleBakerStateChange(bakerId, state) {
    const currentState = this.bakerStates.get(bakerId);
    if (currentState) {
      this.bakerStates.set(bakerId, { ...currentState, ...state });
    }
  }
  getBaker(id) {
    return this.bakers.get(id);
  }
  getAllBakers() {
    return Array.from(this.bakers.values());
  }
  getBakerState(id) {
    return this.bakerStates.get(id);
  }
  getAllBakerStates() {
    return Array.from(this.bakerStates.values());
  }
  getBakerCount() {
    return this.bakers.size;
  }
  getWorkplace() {
    return this.workplace;
  }
  updateWorkplace(config) {
    this.workplaceConfig = { ...this.workplaceConfig, ...config };
    this.applyWorkplaceStyles(this.workplaceConfig);
  }
};
export {
  BeakerManager
};
