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
    <div className="relative w-full h-[calc(100vh-120px)] flex bg-transparent">

      {/* Mobile menu */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute top-3 left-3 z-30 sm:hidden bg-green-600 text-white p-2 rounded-full shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.25 }}
        className="
          fixed sm:static
          top-0 left-0 z-40
          h-full
          w-64 sm:w-1/3
          bg-white
          border-r border-green-200
          shadow-lg sm:shadow-none
        "
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-green-600">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <EventList
            events={events}
            selected={selectedEvent}
            onSelect={(ev) => {
              setSelectedEvent(ev);
              setSidebarOpen(false);
            }}
          />
        )}
      </motion.div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 sm:hidden z-20"
        />
      )}

      {/* Chat Panel */}
      <div className="flex-1 h-full overflow-hidden">
        <AnimatePresence>
          {selectedEvent ? (
            <MessagePanel event={selectedEvent} socket={socket} />
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-gray-500">
              <div className="bg-green-100 text-green-600 p-4 rounded-full shadow mb-2">
                <MessageSquare size={30} />
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
