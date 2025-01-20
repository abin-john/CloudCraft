import { BrowserRouter, Routes, Route } from "react-router";
import Header from "./components/Header"
import NewPage from "./components/NewPage";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/new" element={<NewPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
