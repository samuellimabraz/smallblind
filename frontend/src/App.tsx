import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import MainMenu from './pages/MainMenu'
import PeopleManagement from './pages/PeopleManagement'
import VisionAnalysis from './pages/VisionAnalysis'
import Settings from './pages/Settings'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MainMenu />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/people" 
        element={
          <ProtectedRoute>
            <PeopleManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vision" 
        element={
          <ProtectedRoute>
            <VisionAnalysis />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App