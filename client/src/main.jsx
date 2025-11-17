import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import WorldDashboard from './components/WorldDashboard'
import CharacterView from './components/CharacterView'
//import './index.css'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: "/world/:worldId",
    element: (
      <ProtectedRoute>
        <WorldDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: "/character/:characterId",
    element: (
      <ProtectedRoute>
        <CharacterView />
      </ProtectedRoute>
    )
  },
  {
    path: "*",
    element: <div>404 - Page Not Found</div>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
