export function MacromicLogo({ size = 48, white = false }: { size?: number; white?: boolean }) {
  const bg = white ? "white" : "var(--primary)";
  const fg = white ? "var(--primary)" : "white";
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold shadow-glow"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.5,
        fontFamily: "var(--font-display)",
      }}
    >
      M
    </div>
  );
}
