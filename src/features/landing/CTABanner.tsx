export const CTABanner = (props: {
  title: string;
  description: string;
  buttons: React.ReactNode;
}) => (
  <div className="rounded-xl bg-linear-to-br from-(--gradient-from) via-(--gradient-via) to-(--gradient-to) px-6 py-10 text-center">
    <div className="text-3xl font-bold text-primary-foreground">
      {props.title}
    </div>

    <div className="mt-2 text-lg font-medium text-muted">
      {props.description}
    </div>

    <div className="mt-6">{props.buttons}</div>
  </div>
);
