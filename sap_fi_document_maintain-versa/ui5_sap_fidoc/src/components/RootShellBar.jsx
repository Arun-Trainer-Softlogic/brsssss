import { Outlet, useNavigate } from "react-router";
import { useAuth } from '../hooks/auth'
import {
    ShellBar,
    ShellBarItem,
    Icon
} from '@ui5/webcomponents-react';
import "@ui5/webcomponents-icons/dist/home.js";
import "@ui5/webcomponents-icons/dist/list.js";
import "@ui5/webcomponents-icons/dist/customer.js";
import "@ui5/webcomponents-icons/dist/log.js";
import "@ui5/webcomponents-icons/dist/sap-ui5.js";

export const RootShellBar = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    return (<>
        <ShellBar
            primaryTitle="SAP FI Document Post"
            logo={<Icon name="sap-ui5" style={{ color: "orange" }} />}
        >
            {
                token
                    ? <>
                        <ShellBarItem icon="home" onClick={() => navigate('/')} />
                        <ShellBarItem icon="log" onClick={() => logout('/')} />
                    </>
                    : <>
                        <ShellBarItem icon="customer" onClick={() => navigate('/login')} />
                    </>
            }
        </ShellBar>
        <Outlet />
    </>)
}