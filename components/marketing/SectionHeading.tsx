type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls} ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900">{title}</h2>
      {description ? <p className="mt-4 text-lg text-neutral-600">{description}</p> : null}
    </div>
  );
}
