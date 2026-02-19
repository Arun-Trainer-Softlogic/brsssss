import { createContext, useContext, useState } from 'react';
import { useNavigate } from "react-router";
import Cookies from 'js-cookie';

const AuthContext = createContext(null)
const gltoken = "gltoken";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const token = Cookies.get(gltoken);
    const login = user => setUser(user);
    const logout = () => {
        Cookies.remove(gltoken);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}