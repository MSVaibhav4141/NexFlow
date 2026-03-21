"use client";

import { useState } from "react";

export function Tabs() {
  const [activeTab, setActiveTab] = useState("workflows");

  const tabs = [
    { id: "workflows", label: "Workflows" },
    { id: "executions", label: "Executions" },
    { id: "data-tables", label: "Data tables" },
  ];

  return (
    <div className="w-full border-b border-white/10">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:border-white/20 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}