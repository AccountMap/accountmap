import React from "react";
import { getIconUrl } from "./../../src/utilities/iconService";

const SidebarLinkView = ({ targets, label, onBack, onPick, selectedId }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 bg-white/5 text-white text-[10px] font-black rounded-md uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
      >
        Back to Details
      </button>

      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">
          Select {label} ({targets.length})
        </label>
        <div className="flex flex-col gap-2">
          {targets.map((item) => {
            const isItemConnection = !!item.accounts;
            const iconKey = isItemConnection ? item.type : item.name;
            const isSelected = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left cursor-pointer ${isSelected ? "bg-blue-600/20 border-blue-500/60" : "bg-white/5 border-white/10 hover:bg-blue-600/20"}`}
              >
                <div className="w-8 h-8 bg-white rounded-md p-1 shrink-0">
                  <img
                    src={getIconUrl(iconKey)}
                    className="w-full h-full object-contain"
                    alt=""
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] text-gray-200 font-bold truncate uppercase tracking-tight">
                    {item.name || item.type}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono truncate lowercase">
                    {isItemConnection ? item.value : item.username}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SidebarLinkView;
