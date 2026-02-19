import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../hooks/auth';
import {
    FlexBox,
    FlexBoxJustifyContent,
    FlexBoxDirection,
    FlexBoxAlignItems,
    FlexBoxWrap,
    BusyIndicator,
    Card,
    Input,
    Button,
    Icon,
    Toast,
    MessageStrip
} from '@ui5/webcomponents-react';
import "@ui5/webcomponents-icons/dist/customer.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/key.js";

export const LogIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const handellogin = () => {
        setBusy(true);
        axios.post("/AccountDocument/SignIn", {
            username,
            password
        }).then((response) => {
            login(response.data.full_name)
            setBusy(false);
            navigate("/", { replace: true })
        }).catch((error) => {
            setBusy(false);
            setErrorMessage(error?.response?.data?.message);
            setShowToast(true);
        })
    }

    return (
        <FlexBox
            style={{ width: '100%', height: '100%' }}
            justifyContent={FlexBoxJustifyContent.Center}
            direction={FlexBoxDirection.Column}
            alignItems={FlexBoxAlignItems.Center}
            wrap={FlexBoxWrap.Wrap}>
            <Card
                style={{
                    width: "512px",
                    marginTop: "20px",
                    textAlign: "center"
                }}>
                <Input
                    type='Text'
                    placeholder="Username"
                    icon={<Icon name="employee" />}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={username ? false : true}
                />
                <span> </span>
                <Input
                    type='Password'
                    placeholder="Password"
                    icon={<Icon name="key" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={password ? false : true}
                />
                <span> </span>
                <Button design="Positive" onClick={handellogin} >Submit</Button>
            </Card>
            <BusyIndicator active={busy} />
            <Toast
                children={<MessageStrip 
                    children={errorMessage}
                    design="Negative"
                    hideCloseButton
                />}
                open={showToast}
                onClose={() => {
                    setErrorMessage("");
                    setShowToast(false);
                }}
                placement="MiddleCenter"
                style={{ color: "red" }}
            />
        </FlexBox>
    )
}