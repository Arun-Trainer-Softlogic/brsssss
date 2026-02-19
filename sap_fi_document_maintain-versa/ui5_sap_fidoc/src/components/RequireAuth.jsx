import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/auth'

export const RequireAuth = ({ children }) => {
    const location = useLocation()
    const { token } = useAuth()

    if (!token) {
        return <Navigate to='/login' state={{ path: location.pathname }} />
    }
    return children
}