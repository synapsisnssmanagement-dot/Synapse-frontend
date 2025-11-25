import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import EventList from "./EventList";
import MessagePanel from "./MessagePanel";
import { MessageSquare, Loader2, Menu } from "lucide-react"; // add Menu icon for toggle
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://synapse-backend-ijri.onrender.com", {
  transports: ["websocket", "polling"],
});

const ChatPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile sidebar toggle
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(
          "https://synapse-backend-ijri.onrender.com/api/coordinator/my-events",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEvents(res.data.events || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  return (
    <div className="relative h-[85vh] w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-50 via-white to-green-100 border border-green-200 flex backdrop-blur-sm">
      
      {/* Mobile top bar with hamburger button */}
      <div className="sm:hidden absolute top-2 left-2 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md bg-green-100 text-green-700 shadow-md"
          aria-label="Open event list"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar for large screens */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
        className="hidden sm:flex w-1/3 border-r border-green-200 bg-gradient-to-b from-white to-green-50/60 backdrop-blur-md"
      >
        {loading ? (
          <div className="flex flex-col h-full justify-center items-center text-green-600 gap-2">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm">Loading your events...</p>
          </div>
        ) : (
          <EventList
            events={events}
            onSelect={setSelectedEvent}
            selected={selectedEvent}
          />
        )}
      </motion.div>

      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
            className="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white border-r border-green-200 z-50 shadow-lg overflow-auto"
          >
            <div className="p-4 border-b border-green-200 flex justify-between items-center">
              <h2 className="font-semibold text-green-800 text-lg">Events</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-green-700 p-1 rounded hover:bg-green-100"
                aria-label="Close event list"
              >
                ✕
              </button>
            </div>
            {loading ? (
              <div className="flex flex-col h-full justify-center items-center text-green-600 gap-2 mt-10">
                <Loader2 className="animate-spin" size={28} />
                <p className="text-sm">Loading your events...</p>
              </div>
            ) : (
              <EventList
                events={events}
                onSelect={(event) => {
                  setSelectedEvent(event);
                  setSidebarOpen(false);
                }}
                selected={selectedEvent}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Panel - Chat Window */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {selectedEvent ? (
            <motion.div
              key={selectedEvent._id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              <MessagePanel event={selectedEvent} socket={socket} />
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full items-center justify-center text-gray-500 px-4"
            >
              <div className="bg-green-100 text-green-600 p-4 rounded-full shadow-md mb-3">
                <MessageSquare size={34} />
              </div>
              <p className="text-lg font-semibold text-center">Select an event to start chatting 💬</p>
              <p className="text-sm text-gray-400 mt-1 text-center">
                Your event chats will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPage;
