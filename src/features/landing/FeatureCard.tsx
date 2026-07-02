export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
    <div className="size-12 rounded-lg bg-linear-to-br from-(--gradient-soft-from) via-(--gradient-soft-via) to-(--gradient-soft-to) p-2 [&_svg]:stroke-white [&_svg]:stroke-2">
      {props.icon}
    </div>

    <div className="mt-2 text-lg font-bold">{props.title}</div>

    <div className="my-3 w-8 border-t border-(--gradient-soft-via)" />

    <div className="mt-2 text-muted-foreground">{props.children}</div>
  </div>
);
