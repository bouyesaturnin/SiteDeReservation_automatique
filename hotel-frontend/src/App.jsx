import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Explorer from "./pages/Explorer";
import Dashboard from "./pages/Dashboard";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Success from "./pages/Success";
import MesReservations from "./pages/MesReservations";
import RoomDetail from "./pages/RoomDetail";
import Profile from "./pages/Profile";
import Favoris from "./pages/Favoris";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("proRdvUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const PrivateRoute = ({ children }) =>
    user ? children : <Navigate replace to="/login" />;

  const StaffRoute = ({ children }) => {
    if (!user) return <Navigate replace to="/login" />;
    if (!user.is_staff) return <Navigate replace to="/" />;
    return children;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar user={user} setUser={setUser} />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Explorer /></PageWrapper>} />
            <Route path="/explorer" element={<PageWrapper><Explorer /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login setUser={setUser} /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><Signup setUser={setUser} /></PageWrapper>} />
            <Route path="/dashboard" element={<PageWrapper><StaffRoute><Dashboard user={user} /></StaffRoute></PageWrapper>} />
            <Route path="/profil" element={<PageWrapper><PrivateRoute><Profile user={user} setUser={setUser} /></PrivateRoute></PageWrapper>} />
            <Route path="/mes-reservations" element={<PageWrapper><PrivateRoute><MesReservations /></PrivateRoute></PageWrapper>} />
            <Route path="/favoris" element={<PageWrapper><PrivateRoute><Favoris /></PrivateRoute></PageWrapper>} />
            <Route path="/room/:id" element={<PageWrapper><RoomDetail /></PageWrapper>} />
            <Route path="/reservation/:proId" element={<PageWrapper><PrivateRoute><Booking /></PrivateRoute></PageWrapper>} />
            <Route path="/success" element={<PageWrapper><PrivateRoute><Success /></PrivateRoute></PageWrapper>} />
            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;
