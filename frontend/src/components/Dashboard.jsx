import React from "react";
import { HeaderBar, Calendar } from "./index.components";

function Dashboard() {
  const subjects = [
    { name: "Maths", path: "#", img: "/assets/maths.jpeg" },
    { name: "Physics", path: "#", img: "/assets/physics.jpeg" },
    { name: "AI & ML", path: "#", img: "/assets/aiml.jpeg" },
    { name: "Network", path: "#", img: "/assets/network.jpeg" },
    { name: "Java", path: "#", img: "/assets/java.jpeg" },
  ];

  return (
    <div className="h-screen">
      <HeaderBar />

      <div className="p-6 bg-bg-1 m-2 rounded-xl ">
        <h2 className="text-white text-2xl font-semibold mb-6">
          Your Subjects
        </h2>

        <div className="flex flex-wrap gap-4 mb-8">
          {subjects.map((subject, index) => (
            <div
              key={index}
              className="text-white rounded-2xl px-8 py-6 text-center font-semibold cursor-pointer hover:opacity-90 transition-all duration-150 min-w-42 h-30 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${subject.img})` }}
            >
              <div className="absolute inset-0 bg-black/50 bg-opacity-40 rounded-2xl grid -z-10">
                <span className="relative  text-center place-self-center text-2xl z-10">
                  {subject.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-white text-2xl font-semibold mb-6">Extras</h2>

        <div className="bg-bg-2 w-64 h-64 rounded-lg"></div>
      </div>
    </div>
  );
}

export default Dashboard;
