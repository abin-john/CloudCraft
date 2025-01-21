import './App.css';
import { BrowserRouter, Routes, Route } from "react-router";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./components/Home"
import NewPage from "./components/NewPage";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
