import React from "react";
import { CalendarDays } from "lucide-react";

const EventList = ({ events, onSelect, selected }) => {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-md sm:max-h-full max-h-screen">

      {/* Header */}
      <div className="p-4 border-b bg-green-600 text-white flex items-center gap-2 sticky top-0 z-10">
        <CalendarDays className="w-5 h-5" />
        <h2 className="text-lg font-semibold tracking-wide">Your Events</h2>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent">

        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
            No events assigned yet.
          </div>
        ) : (
          events.map((event) => {
            const isSelected = selected?._id === event._id;

            return (
              <div
                key={event._id}
                onClick={() => onSelect(event)}
                className={`
                  cursor-pointer 
                  rounded-xl 
                  border 
                  transition-all 
                  shadow-sm 
                  w-full

                  p-3 sm:p-4

                  ${isSelected
                    ? "bg-green-100 border-green-400 ring-1 ring-green-300"
                    : "bg-white hover:bg-gray-50 hover:border-green-200"
                  }
                `}
              >
                {/* Title */}
                <h3
                  className={`font-semibold text-sm sm:text-base ${
                    isSelected ? "text-green-800" : "text-gray-800"
                  }`}
                >
                  {event.title}
                </h3>

                {/* Date */}
                <p className="text-xs text-gray-500 mt-1">
                  📅{" "}
                  {event.date
                    ? new Date(event.date).toLocaleDateString()
                    : "No date"}
                </p>

                {/* Description */}
                <p className="text-xs text-gray-400 mt-1 truncate sm:whitespace-normal sm:line-clamp-2">
                  {event.description || "No description available"}
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
