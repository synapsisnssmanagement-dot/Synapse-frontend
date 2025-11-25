import React from "react";
import { CalendarDays } from "lucide-react";

const EventList = ({ events, onSelect, selected }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-green-600 text-white flex items-center gap-2 border-b">
        <CalendarDays size={18} />
        <h2 className="font-semibold text-lg">Your Events</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <p className="text-center text-gray-500 mt-5">No events assigned.</p>
        ) : (
          events.map((ev) => {
            const active = selected?._id === ev._id;
            return (
              <div
                key={ev._id}
                onClick={() => onSelect(ev)}
                className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
                  active
                    ? "bg-green-100 border-green-500"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs mt-1 text-gray-500">
                  📅 {ev.date ? new Date(ev.date).toLocaleDateString() : "No date"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventList;
