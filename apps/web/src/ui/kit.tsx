// Design-system primitives: dark glass surfaces, gradient icon tiles, a hero
// action card, segmented tabs, round tool buttons and a floating bottom nav.
// Black-and-green take on the Makeo 3D visual language.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, CircleCheck, Circle } from "lucide-react";

export type Tone = "primary" | "emerald" | "teal" | "lime";

export function IconTile({ icon: Icon, tone = "emerald", size = 56 }: { icon: LucideIcon; tone?: Tone; size?: number }) {
  return (
    <span className={`tile tile-${tone}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.46)} strokeWidth={2.2} />
    </span>
  );
}

export function GlassCard({
  children,
  className = "",
  onClick,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`glass ${onClick ? "pressable" : ""} ${disabled ? "is-disabled" : ""} ${className}`}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
    >
      {children}
    </Tag>
  );
}

export function ScreenTitle({ children, gradient }: { children: ReactNode; gradient?: boolean }) {
  return <h1 className={`screen-title ${gradient ? "grad-text" : ""}`}>{children}</h1>;
}

export function Hero({ title, sub, icon: Icon, sideIcon, onClick }: {
  title: string;
  sub: string;
  icon: LucideIcon;
  sideIcon: LucideIcon;
  onClick: () => void;
}) {
  const Side = sideIcon;
  return (
    <button className="hero pressable" onClick={onClick}>
      <span className="hero-tile">
        <Icon size={30} strokeWidth={2} />
      </span>
      <span className="hero-text">
        <b>{title}</b>
        <span>{sub}</span>
      </span>
      <Side className="hero-side" size={26} strokeWidth={2.2} />
    </button>
  );
}

export function CategoryCard({ title, sub, icon, tone, onClick, disabled, badge }: {
  title: string;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <GlassCard className="cat" onClick={onClick} disabled={disabled}>
      <IconTile icon={icon} tone={tone} />
      <b>{title}</b>
      <span className="sub">{sub}</span>
      {badge && <span className="badge">{badge}</span>}
    </GlassCard>
  );
}

export function ListRow({ title, sub, icon, tone, onClick }: {
  title: string;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
  onClick?: () => void;
}) {
  return (
    <GlassCard className="row" onClick={onClick}>
      <IconTile icon={icon} tone={tone} size={52} />
      <span className="row-text">
        <b>{title}</b>
        <span className="sub">{sub}</span>
      </span>
      {onClick && <ChevronLeft className="chev" size={22} />}
    </GlassCard>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string | number>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="pills">
      {options.map((o) => (
        <button key={String(o.value)} className={o.value === value ? "on" : ""} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToolButton({ icon: Icon, label, onClick, active, danger }: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button className={`tool ${active ? "on" : ""} ${danger ? "danger" : ""}`} onClick={onClick}>
      <span className="tool-face">
        <Icon size={24} strokeWidth={2} />
      </span>
      <span className="tool-label">{label}</span>
    </button>
  );
}

export function RoundButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className="round" aria-label={label} title={label} onClick={onClick}>
      <Icon size={22} strokeWidth={2.1} />
    </button>
  );
}

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "good" | "bad" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function PrimaryButton({ children, onClick, disabled, icon: Icon, block }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  block?: boolean;
}) {
  return (
    <button className={`cta ${block ? "block" : ""}`} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={22} strokeWidth={2.2} />}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, icon: Icon, block }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  block?: boolean;
}) {
  return (
    <button className={`ghost-btn ${block ? "block" : ""}`} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={20} strokeWidth={2.2} />}
      <span>{children}</span>
    </button>
  );
}

export function StepRow({ title, sub, done }: { title: string; sub?: string; done: boolean }) {
  return (
    <div className="step">
      {done ? <CircleCheck className="step-ok" size={26} /> : <Circle className="step-wait" size={26} />}
      <span>
        <b>{title}</b>
        {sub && <span className="sub">{sub}</span>}
      </span>
    </div>
  );
}

export function SliderField({ label, value, min, max, step, unit, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (n: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="slider">
      <span className="slider-head">
        <span>{label}</span>
        <b>
          {value}
          {unit ?? ""}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--pct" as string]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

export function NavBar<T extends string>({ items, value, onChange }: {
  items: { value: T; label: string; icon: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <nav className="navbar">
      {items.map(({ value: v, label, icon: Icon }) => (
        <button key={v} className={v === value ? "on" : ""} onClick={() => onChange(v)} aria-current={v === value}>
          <Icon size={26} strokeWidth={2.1} />
          <span>{label}</span>
          <i />
        </button>
      ))}
    </nav>
  );
}
