export type FlowStep = {
  step: string;
  title: string;
  description: string;
};

export function MethodologyFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="space-y-8">
      {steps.map((s) => (
        <li key={s.step} className="flex gap-4">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
            {s.step}
          </span>
          <div>
            <h3 className="font-semibold text-neutral-900">{s.title}</h3>
            <p className="mt-1 text-neutral-600">{s.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
