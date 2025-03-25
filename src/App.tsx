import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import MDEditor from "@uiw/react-md-editor";

function App() {
  const [value, setValue] = useState("# Hello, world!");

  return (
    <div className="bg-gray-100 p-4">
      <MDEditor value={value} onChange={setValue} />
    </div>
  );
}

export default App;
