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

  const handleSelect = (e) => {
    setSelectedEvent(e);
    setSidebarOpen(false); // auto close on mobile
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-white flex overflow-hidden">

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-3 left-3 z-30 sm:hidden bg-white border shadow p-2 rounded-full"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.25 }}
        className="fixed sm:static top-0 left-0 z-40 h-full w-64 sm:w-80 bg-white border-r shadow-lg sm:shadow-none"
      >
        {loading ? (
          <div className="flex h-full justify-center items-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <EventList events={events} selected={selectedEvent} onSelect={handleSelect} />
        )}
      </motion.div>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 sm:hidden z-20"
        />
      )}

      {/* Chat Window */}
      <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedEvent ? (
            <MessagePanel key={selectedEvent._id} event={selectedEvent} socket={socket} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="bg-green-100 text-green-600 p-4 rounded-full shadow mb-3">
                <MessageSquare size={34} />
              </div>
              <p className="text-lg font-medium">Select an event to start chatting</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPage;
