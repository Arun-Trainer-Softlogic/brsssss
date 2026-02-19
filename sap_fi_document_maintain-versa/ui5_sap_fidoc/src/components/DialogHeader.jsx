import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/auth';
import {
    Button,
    Bar,
    Title,
    Text,
    Toast,
    MessageStrip
} from '@ui5/webcomponents-react';
import "@ui5/webcomponents-icons/dist/begin.js";
import "@ui5/webcomponents-icons/dist/stop.js";
import "@ui5/webcomponents-icons/dist/restart.js";
import "@ui5/webcomponents-icons/dist/decline.js";

export const DialogHeader = ({ setFidocus, fidocus, refresh }) => {
    const timeZone = "America/New_York";
    const req_date = (new Date(fidocus?.creationDate)).toLocaleString("en-US", { timeZone });
    const rep_date = (new Date(fidocus?.changeDate)).toLocaleString("en-US", { timeZone });
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");
    const [design, setDesign] = useState("Information");
    const { logout } = useAuth();

    const repostdata = (hashKey) => {
        axios.post("/AccountDocument/RePosting", {
            hashKey
        }).then((response) => {
            if (response.status === 200) {
                setDesign("Positive");
                setMessage("Reposted Successfully");
                setShowToast(true);
                refresh();
            }
        }).catch((error) => {
            if (error?.status === 401) {
                logout()
            } else {
                setDesign('Negative')
                setMessage(error?.response?.data?.Error);
                setShowToast(true);
                refresh();
            }
        })
    }

    return (
        <Bar
            design="Header"
            startContent={<Text>Request: {req_date}</Text>}
            children={<Text>Response: {rep_date}</Text>}
            endContent={
                <>
                    <Button
                        onClick={() => repostdata(fidocus?._id)}
                        design='Transparent'
                        icon='restart'
                        style={{ color: 'green' }}
                        disabled={(fidocus?.statusCode === 400) ? false : true}
                    />
                    <Button
                        onClick={() => setFidocus({})}
                        design='Transparent'
                        icon='decline'
                        style={{ color: 'red' }}
                    />
                    <Toast
                        children={<MessageStrip
                            children={message}
                            design={design}
                            hideCloseButton
                        />}
                        open={showToast}
                        onClose={() => {
                            setShowToast(false);
                            setDesign("Information");
                            setMessage("");
                        }}
                        placement="BottomCenter"
                    />
                </>
            }
        />
    )
}