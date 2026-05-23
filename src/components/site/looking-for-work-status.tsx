export function LookingForWorkStatus({
  lookingForWork,
}: {
  lookingForWork: boolean;
}) {
  return (
    <div
      className="inline-flex flex-col gap-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:px-8 sm:py-6"
      role="status"
      aria-label={`Ищу работу: ${lookingForWork ? "да" : "нет"}`}
    >
      <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        Ищу работу
      </span>
      <span
        className={`inline-flex min-w-20 items-center justify-center rounded-full px-6 py-2.5 text-2xl font-bold sm:min-w-24 sm:px-8 sm:py-3 sm:text-3xl ${
          lookingForWork
            ? "bg-accent text-accent-foreground"
            : "border-2 border-border bg-background text-muted"
        }`}
      >
        {lookingForWork ? "Да" : "Нет"}
      </span>
    </div>
  );
}
