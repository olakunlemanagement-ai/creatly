interface ResourceGridProps {
  children: React.ReactNode;
}

export function ResourceGrid({ children }: ResourceGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </ul>
  );
}
