import type { PortfolioEvent, PortfolioEventAllocationDelta } from "@prisma/client";

type Props = {
  events: Array<PortfolioEvent & { allocationDeltas: PortfolioEventAllocationDelta[] }>;
};
const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const percentage = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

export function PortfolioAllocationHistory({ events }: Props) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        Allocation history & decision notes
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        A record of your simulated mix and reasoning. Times are shown in UTC.
      </p>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No allocation changes or decision notes recorded yet.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-neutral-200">
          {events.map((event) => (
            <li key={event.id} className="space-y-2 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                {event.allocationDeltas.length > 0
                  ? "Allocation change"
                  : event.description.startsWith("Manual decision:")
                    ? "Decision note"
                    : "Recorded event"}
              </p>
              <h3 className="break-words font-medium text-neutral-900">{event.description}</h3>
              <time
                dateTime={event.createdAt.toISOString()}
                className="block text-xs text-neutral-600"
              >
                {date.format(event.createdAt)} UTC
              </time>
              {event.allocationDeltas.length > 0 ? (
                <ul className="space-y-1 text-sm text-neutral-800">
                  {event.allocationDeltas.map((delta) => (
                    <li key={delta.id} className="break-words">
                      <span className="font-medium">{delta.strategyName}:</span>{" "}
                      {delta.beforePercentage === null
                        ? "Not allocated"
                        : `${percentage.format(delta.beforePercentage)}%`}
                      {" → "}
                      {delta.afterPercentage === null
                        ? "Removed"
                        : `${percentage.format(delta.afterPercentage)}%`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-600">
                  No allocation snapshot was recorded for this event.
                </p>
              )}
              {event.allocatedBefore !== null && event.allocatedAfter !== null ? (
                <p className="text-sm text-neutral-600">
                  Total allocated: {percentage.format(event.allocatedBefore)}% →{" "}
                  {percentage.format(event.allocatedAfter)}%. Planned reserve:{" "}
                  {percentage.format(100 - event.allocatedBefore)}% →{" "}
                  {percentage.format(100 - event.allocatedAfter)}%.
                </p>
              ) : null}
              {event.reasoning ? (
                <p className="whitespace-pre-wrap break-words text-sm text-neutral-700">
                  <span className="font-medium">Why:</span> {event.reasoning}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {events.length === 100 ? (
        <p className="mt-3 text-xs text-neutral-600">
          Showing the latest 100 events. Older records remain saved.
        </p>
      ) : null}
    </section>
  );
}
