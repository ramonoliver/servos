"use client";

interface SplitViewProps {
  list: React.ReactNode;
  detail: React.ReactNode | null;
  listWidth?: number;
  placeholder?: React.ReactNode;
}

export function SplitView({ list, detail, listWidth = 260, placeholder }: SplitViewProps) {
  return (
    <div className="flex h-full overflow-hidden bg-white rounded-md border border-border-soft">
      <div
        className="flex-shrink-0 border-r border-border-soft flex flex-col overflow-hidden"
        style={{ width: listWidth }}
      >
        {list}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {detail ?? placeholder}
      </div>
    </div>
  );
}
