import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavigationBar from './components/NavigationBar';
import Login from './pages/Login';
import Planner from './pages/Planner';
import Recommendations from './pages/Recommendations';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/planner"
            element={
              <PrivateRoute>
                <div className="min-h-screen bg-background">
                  <NavigationBar />
                  <Planner />
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <PrivateRoute>
                <div className="min-h-screen bg-background">
                  <NavigationBar />
                  <Recommendations />
                </div>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/planner" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

