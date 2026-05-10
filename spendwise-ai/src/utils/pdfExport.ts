// utils/pdfExport.ts

export function patchOklchVars(): HTMLStyleElement {
  const style = document.createElement("style");
  style.id = "__pdf-patch__";
  // Override every shadcn/Tailwind CSS var that could carry an oklch value.
  // These are baked hex equivalents — adjust to match your tailwind.config.ts
  style.textContent = `
    :root, * {
      --background: #0f1117 !important;
      --foreground: #f9fafb !important;
      --card: #1e1b2e !important;
      --card-foreground: #f9fafb !important;
      --popover: #1e1b2e !important;
      --popover-foreground: #f9fafb !important;
      --primary: #8b5cf6 !important;
      --primary-foreground: #ffffff !important;
      --secondary: #312e81 !important;
      --secondary-foreground: #f9fafb !important;
      --muted: #1f2937 !important;
      --muted-foreground: #9ca3af !important;
      --accent: #312e81 !important;
      --accent-foreground: #f9fafb !important;
      --destructive: #ef4444 !important;
      --destructive-foreground: #ffffff !important;
      --border: #312e81 !important;
      --input: #312e81 !important;
      --ring: #8b5cf6 !important;
      --success: #22c55e !important;
      --radius: 0.5rem !important;
    }
  `;
  document.head.appendChild(style);
  return style;
}