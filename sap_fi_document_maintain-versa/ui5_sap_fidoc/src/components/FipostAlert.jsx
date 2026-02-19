import React from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/auth';
import {
    FlexBox,
    FlexBoxJustifyContent,
    FlexBoxDirection,
    FlexBoxAlignItems,
    FlexBoxWrap,
    AnalyticalTable,
    Button,
    Dialog,
    Input,
    Bar,
    Toast,
    MessageStrip
} from '@ui5/webcomponents-react';
import "@ui5/webcomponents-icons/dist/edit.js";
import "@ui5/webcomponents-icons/dist/delete.js";
import "@ui5/webcomponents-icons/dist/add.js";
import "@ui5/webcomponents-icons/dist/decline.js";
import "@ui5/webcomponents-icons/dist/save.js";

export const FipostAlert = () => {
    const [isloading, setIsloading] = React.useState(true);
    const [glAlert, setGlAlert] = React.useState([]);
    const [popAlert, setPopAlert] = React.useState(false);
    const [id, setId] = React.useState("");
    const [comp, setComp] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [authfail, setAuthFail] = React.useState(false);
    const [showToast, setShowToast] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [design, setDesign] = React.useState("Information");

    const { logout } = useAuth();

    const columns = [
        {
            id: 'Comp',
            disableResizing: true,
            Header: <h4>Company Code</h4>,
            hAlign: 'Center',
            width: 150,
            accessor: 'Comp'
        },
        {
            id: 'Email',
            disableResizing: true,
            Header: <h4>Email ID</h4>,
            hAlign: 'Center',
            width: 400,
            accessor: 'Email'
        },
        {
            id: '_id',
            disableFilters: true,
            disableGlobalFilter: true,
            disableGroupBy: true,
            disableSortBy: true,
            disableResizing: true,
            Header: (props) => (
                <FlexBox
                    style={{ width: '100%', height: '100%' }}
                    justifyContent={FlexBoxJustifyContent.Center}
                    direction={FlexBoxDirection.Row}
                    alignItems={FlexBoxAlignItems.Center}
                    wrap={FlexBoxWrap.Wrap}
                >
                    <Button
                        onClick={() => popGlAlert("")}
                        icon='add'
                        design='Transparent'
                        style={{ color: "green" }}
                        tooltip='Add New Record'
                    />
                </FlexBox>
            ),
            hAlign: 'Center',
            width: 80,
            accessor: '_id',
            Cell: (props) => (
                <FlexBox>
                    <Button
                        icon='edit'
                        design='Transparent'
                        onClick={() => popGlAlert(props.cell.value)}
                        style={{ color: "blue" }}
                        tooltip='Edit Record'
                    />
                    <Button
                        icon='delete'
                        design='Transparent'
                        onClick={() => fiAlertDelete(props.cell.value)}
                        style={{ color: "red" }}
                        tooltip='Delete Record'
                    />
                </FlexBox>
            )
        }
    ]

    // Deleting Email Configuration record
    const fiAlertDelete = (id) => {
        axios.delete("/AccountDocument/FiPostingAlert", {
            params: { _id: id }
        }).then((response) => {
            if (response?.status === 200) {
                setMessage("Deleted");
                setDesign("Positive");
                setShowToast(true);
                setIsloading(true);
                fetchdata();
                setIsloading(false);
            }
        }).catch((error) => {
            if (error?.response?.status === 401) {
                logout()
            } else {
                setMessage(error?.response?.data?.Error);
                setDesign("Negative");
                setShowToast(true);
            }
        })
    }

    // Initiate Pop-Up
    const popGlAlert = (id) => {
        if (id) {
            setId(id);
            const glalrt = glAlert.find((gl) => gl._id === id);
            if (glalrt?.Comp) {
                setComp(glalrt?.Comp)
            }
            if (glalrt?.Email) {
                setEmail(glalrt?.Email)
            }
        };
        setPopAlert(true)
    }

    // Cancel Pop-Up & Clear all variables
    const cancelPopGlAlert = () => {
        setPopAlert(false)
        setComp("");
        setEmail("");
        setId("")
    }

    // Save Email Configuration record
    const savePopGlAlert = () => {
        if (comp && email) {
            axios.post("/AccountDocument/FiPostingAlert", {
                _id: id,
                Comp: comp,
                Email: email
            }).then((response) => {
                if (response.status === 200) {
                    setMessage("Saved");
                    setDesign("Positive");
                    setShowToast(true);
                    cancelPopGlAlert();
                    setIsloading(true);
                    fetchdata();
                    setIsloading(false);
                }
            }).catch((error) => {
                if (error?.response?.status === 401) {
                    logout()
                } else {
                    setMessage(error?.response?.data?.Error);
                    setDesign("Negative");
                    setShowToast(true);
                }
            })
        } else {
            setMessage("Company Code and Email cannot be Empty!");
            setDesign("Negative");
            setShowToast(true);
        }
    }

    // Retrieve Email Configuration record
    const fetchdata = () => {
        axios.get("/AccountDocument/FiPostingAlert", {
            params: {}
        }).then((response) => {
            setGlAlert(response.data);
            setIsloading(false);
        }).catch((error) => {
            setIsloading(false);
            if (error?.response?.status === 401) setAuthFail(true);
        })
    }

    React.useEffect(() => fetchdata(), []);

    // if API authentication Error - Failed
    if (authfail) logout();

    return (
        <FlexBox
            style={{ width: '100%', height: '100%' }}
            justifyContent={FlexBoxJustifyContent.Center}
            direction={FlexBoxDirection.Row}
            alignItems={FlexBoxAlignItems.Center}
            wrap={FlexBoxWrap.Wrap}
        >
            <AnalyticalTable
                style={{ marginTop: '10px' }}
                columns={columns}
                data={glAlert}
                filterable
                minRows={12}
                visibleRows={12}
                headerRowHeight={40}
                rowHeight={40}
                loading={isloading}
            />
            <Dialog
                open={popAlert}
                onAfterClose={() => cancelPopGlAlert()}
                footer={
                    <Bar design="Footer">
                        <Button
                            onClick={() => savePopGlAlert()}
                            icon='save'
                            style={{ color: "black" }}
                        />
                        <Button
                            onClick={() => cancelPopGlAlert()}
                            icon='decline'
                            style={{ color: "red" }}
                        />
                    </Bar>
                }
            >
                <FlexBox
                    justifyContent={FlexBoxJustifyContent.Center}
                    direction={FlexBoxDirection.Column}
                    alignItems={FlexBoxAlignItems.Center}
                    wrap={FlexBoxWrap.Wrap}
                >
                    <Input
                        style={{ width: '100%', textAlign: "center" }}
                        placeholder="Company Code"
                        onChange={e => setComp(e.target.value)}
                        value={comp}
                    />
                    <Input
                        style={{ width: '100%', textAlign: "center" }}
                        placeholder="Email"
                        onChange={e => setEmail(e.target.value)}
                        value={email}
                    />
                </FlexBox>
            </Dialog>
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
        </FlexBox>
    )
}
