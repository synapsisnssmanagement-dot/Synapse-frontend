import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import EventList from "./EventList";
import MessagePanel from "./MessagePanel";
import { MessageSquare, Loader2, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://synapse-backend-ijri.onrender.com", {
  transports: ["websocket", "polling"],
});

const ChatPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(
          "https://synapse-backend-ijri.onrender.com/api/coordinator/my-events",
          { headers: { Authorization: `Bearer ${token}` } }
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
    <div className="relative h-[85vh] w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-50 via-white to-green-100 border border-green-200 flex">

      {/* MOBILE MENU */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-3 left-3 z-30 sm:hidden bg-green-600 text-white p-2 rounded-full"
      >
        <Menu size={18} />
      </button>

      {/* SIDEBAR (desktop normal, mobile drawer) */}
      <motion.div
        initial={{ x: -260 }}
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ duration: 0.25 }}
        className="
          fixed sm:static 
          top-0 left-0 z-40
          h-full 
          w-64 sm:w-1/3
          bg-gradient-to-b from-white to-green-50/60 
          border-r border-green-200
          backdrop-blur-md
          shadow-lg sm:shadow-none
        "
      >
        {loading ? (
          <div className="flex flex-col h-full justify-center items-center text-green-600 gap-2">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm">Loading your events...</p>
          </div>
        ) : (
          <EventList
            events={events}
            selected={selectedEvent}
            onSelect={(ev) => {
              setSelectedEvent(ev);
              setSidebarOpen(false); // close drawer on mobile
            }}
          />
        )}
      </motion.div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 sm:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CHAT AREA */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {selectedEvent ? (
            <motion.div
              key={selectedEvent._id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <MessagePanel event={selectedEvent} socket={socket} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full items-center justify-center text-gray-500"
            >
              <div className="bg-green-100 text-green-600 p-4 rounded-full shadow mb-3">
                <MessageSquare size={34} />
              </div>
              <p className="text-lg font-semibold">Select an event to start chatting 💬</p>
              <p className="text-sm text-gray-400">Your event chats will appear here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPage;
