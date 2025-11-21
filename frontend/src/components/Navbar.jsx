import React, { useState } from "react";
import { CircleUser, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: "News ", path: "#" },
    { name: "Notes", path: "#" },
  ];

  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <div>
      <button
        onClick={toggleMenu}
        className={`fixed top-2 left-2  z-50 md:hidden ${
          !isOpen && "text-accent"
        }`}
      >
        {isOpen ? <X size={40} /> : <Menu size={40} />}
      </button>

      <div
        className={`bg-accent h-screen w-screen md:w-full  top-0 left-0 transition-all duration-150 fixed 
           ${
             isOpen ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
           } 
          flex-col items-center md:translate-x-0 md:opacity-100 justify-around  flex md:static`}
      >
        <h2
          className="text-3xl font-bold h-2/12  m-auto text-center cursor-pointer"
          onClick={() => {
            navigate("/");
          }}
        >
          EduGenie
        </h2>

        <ul className="text-xl flex  flex-col h-8/12 font-semibold justify-center gap-20">
          {navItems.map((item) => (
            <li
              key={item.name}
              className="hover:underline hover:scale-105 cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                navigate(item.path);
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
    
      </div>
    </div>
  );
}

export default Navbar;
