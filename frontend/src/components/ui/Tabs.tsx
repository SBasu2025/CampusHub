import { motion } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Tabs",
  className,
}: TabsProps) {
  return (
    <div
      className={cn(
        "w-full border-b border-neutral-200",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive =
            tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => {
                if (!tab.disabled) {
                  onChange(tab.id);
                }
              }}
              className={cn(
                "relative shrink-0 px-3 py-3 text-body-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-[-2px]",
                isActive
                  ? "text-primary-600"
                  : "text-neutral-500 hover:text-heading",
                tab.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              )}
            >
              {tab.label}

              {isActive && (
                <motion.span
                  layoutId="campushub-tabs-underline"
                  className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-primary-500"
                  transition={{
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}