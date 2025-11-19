import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Navbar, EventsPage } from "../components/index.components";

// Local tasks state will be managed here and passed to EventsPage

function Events() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const getEvents = async () => {
    try {
      const { data } = await API.get("/event/getEvents");
      setEvents(data.events || []);
    } catch (error) {
      console.error(
        "Event fetch Error:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    getEvents();
  }, []);
  return (
    // Root grid: fixed to viewport. Use two columns (sidebar + main) since right panel removed.
    <div className="grid md:grid-rows-1 md:grid-cols-[minmax(180px,220px)_1fr] h-screen w-screen overflow-hidden bg-bg">
      <Navbar />

      {/* Main center: make this column scrollable and constrained to viewport height */}
      <div className="m-4 h-full overflow-auto">
        <div className="max-w-[980px] w-full mx-auto h-full">
          <EventsPage tasks={tasks} setTasks={setTasks} events={events} setEvents={setEvents} />
        </div>
      </div>

      {/* right column removed - main content fills remaining space */}
    </div>
  );
}

export default Events;
