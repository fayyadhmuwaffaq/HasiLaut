"use client";

import { useRef } from "react";

/**
 * Single-row horizontal tab bar with counts and WAI-ARIA arrow-key navigation.
 */
export default function OrderStatusTabs({
  tabs,
  activeTab,
  counts,
  ariaLabel,
  idPrefix,
  onChange,
}) {
  const tabRefs = useRef({});

  function handleTabKeyDown(event, index) {
    let nextIndex = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetTab = tabs[nextIndex].id;
      onChange(targetTab);
      const tabEl = tabRefs.current[targetTab];
      tabEl?.focus();
      tabEl?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-[#E2E8F0]"
    >
      {tabs.map((tab, index) => {
        const isSelected = activeTab === tab.id;
        const count = counts?.[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[15px] whitespace-nowrap transition-colors ${
              isSelected
                ? "border-[#0369A1] bg-[#F0F9FF]/60 font-semibold text-[#0369A1]"
                : "border-transparent font-medium text-[#475569] hover:text-[#0F172A]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`inline-flex min-w-[24px] h-[24px] items-center justify-center rounded-md px-1.5 text-[13px] font-semibold tabular-nums ${
                isSelected
                  ? "bg-[#0369A1] text-[#FFFFFF]"
                  : "bg-[#F1F5F9] text-[#475569]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
