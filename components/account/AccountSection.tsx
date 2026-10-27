import { Panel } from "@/components/app/Panel";

/** Card wrapper shared by the account pages of every role. */
export default function AccountSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel title={title} description={description}>
      {children}
    </Panel>
  );
}
