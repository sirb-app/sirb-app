export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove the default pt-6 padding from root layout for full-screen tutor
  return <div className="-mt-6">{children}</div>;
}
