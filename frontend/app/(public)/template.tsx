export default function PublicTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="page-transition">{children}</div>;
}
