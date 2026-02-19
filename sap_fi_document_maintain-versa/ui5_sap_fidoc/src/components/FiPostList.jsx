import React from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/auth';
import { DialogHeader } from './DialogHeader';
import { DialogContent } from './DialogContent';
import {
    FlexBox,
    FlexBoxJustifyContent,
    FlexBoxDirection,
    FlexBoxAlignItems,
    FlexBoxWrap,
    AnalyticalTable,
    Dialog,
    Button,
    Icon,
    DateRangePicker,
    Toolbar,
    ToolbarButton,
    ToolbarSeparator,
    ToolbarSpacer,
    ToolbarSelect,
    ToolbarSelectOption,
    Input
} from '@ui5/webcomponents-react';
import "@ui5/webcomponents-icons/dist/message-error.js";
import "@ui5/webcomponents-icons/dist/message-success.js";
import "@ui5/webcomponents-icons/dist/message-warning.js";
import "@ui5/webcomponents-icons/dist/status-inactive.js";
import "@ui5/webcomponents-icons/dist/status-critical.js";
import "@ui5/webcomponents-icons/dist/question-mark.js";
import "@ui5/webcomponents-icons/dist/pending.js";
import "@ui5/webcomponents-icons/dist/refresh.js";
import "@ui5/webcomponents-icons/dist/documents.js";
import "@ui5/webcomponents-icons/dist/display.js";
import "@ui5/webcomponents-icons/dist/navigation-left-arrow.js";
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js";
import "@ui5/webcomponents-icons/dist/close-command-field.js";
import "@ui5/webcomponents-icons/dist/open-command-field.js";
import "@ui5/webcomponents-icons/dist/filter.js";

export const FiPostList = () => {
    const timeZone = "America/New_York";
    const limitRange = [10, 15, 20, 25, 30, 35, 40, 45, 50]

    const [isloading, setIsloading] = React.useState(false);
    const [fiDocuConfs, setFiDocuConfs] = React.useState([]);
    const [fidocus, setFidocus] = React.useState({});
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(10);
    const [statusCode, setStatusCode] = React.useState('');
    const [confirmCode, setConfirmCode] = React.useState('');
    const [key, setKey] = React.useState('');
    const [DOC_TYPE, setDOC_TYPE] = React.useState('');
    const [COMP_CODE, setCOMP_CODE] = React.useState('');
    const [PSTNG_DATE, setPSTNG_DATE] = React.useState('');
    const [HEADER_TXT, setHEADER_TXT] = React.useState('');
    const [REF_DOC_NO, setREF_DOC_NO] = React.useState('');
    const [totalPages, setTotalPages] = React.useState();
    const [pageButtons, setPageButtons] = React.useState([]);
    const [authfail, setAuthFail] = React.useState(false);
    const [creationDate, setCreationDate] = React.useState('');
    const [dateRange, setDateRange] = React.useState('');

    const { logout } = useAuth();

    // Retrieve data from API
    const fetchdata = (params) => {
        setIsloading(true);
        axios.get("/AccountDocument/fiDocuConf", { params })
            .then((response) => {
                if (response.status === 200) {
                    setFiDocuConfs(response?.data?.fiDocuConfs);
                    setTotalPages(response?.data?.totalPages);
                    setPageButtons(response?.data?.pages);
                }
                setIsloading(false);
            }).catch((error) => {
                setIsloading(false);
                if (error?.response?.status === 401) setAuthFail(true);
            });
    }

    // Refresh Data
    const handelRefersh = () => fetchdata({
        limit,
        page,
        confirmCode,
        creationDate,
        statusCode,
        DOC_TYPE,
        COMP_CODE,
        PSTNG_DATE,
        HEADER_TXT,
        REF_DOC_NO,
        key
    });

    // Fetch data for the Table
    React.useEffect(() => {
        fetchdata({
            limit,
            page,
            confirmCode,
            creationDate,
            statusCode,
            DOC_TYPE,
            COMP_CODE,
            PSTNG_DATE,
            HEADER_TXT,
            REF_DOC_NO,
            key
        });
    }, [
        limit,
        page,
        confirmCode,
        creationDate,
        statusCode,
        DOC_TYPE,
        COMP_CODE,
        PSTNG_DATE,
        HEADER_TXT,
        REF_DOC_NO,
        key
    ]);

    // If Authentication filed then Logout
    if (authfail) logout();

    // Prepare Columns
    const columns = [
        {
            id: 'responseStatus',
            disableFilters: true,
            disableGlobalFilter: true,
            disableGroupBy: true,
            disableSortBy: true,
            disableResizing: true,
            Header: <Button
                onClick={(e) => handelRefersh()}
                icon='refresh'
                design='Transparent'
                tooltip='Refresh Data'
            />,
            hAlign: 'Center',
            width: 10,
            accessor: 'fidocus[0].statusCode',
            Cell: (props) => {
                switch (props.cell.value) {
                    case 201: return <Icon name="message-success" design='Positive' showTooltip={true} accessibleName='Posted Successfully' />;
                    case 102: return <Icon name="pending" design='Critical' showTooltip={true} accessibleName='SAP Processing' />;
                    case 406: return <Icon name="status-critical" design='Negative' showTooltip={true} accessibleName='Cannot Process' />;
                    case 400: return <Icon name="message-error" design='Negative' showTooltip={true} accessibleName='SAP Posting Error' />;
                    case 100: return <Icon name="status-inactive" design='Default' showTooltip={true} accessibleName='File Received' />;
                    default: return <Icon name="question-mark" design='Critical' showTooltip={true} accessibleName='Cannot Determine Error' />;
                }
            }
        },
        {
            id: 'StatusCode',
            disableResizing: true,
            Header: () => statusCode ? <Icon name="filter" /> : <h4>Status</h4>,
            hAlign: 'Center',
            width: 30,
            accessor: 'fidocus[0].statusCode',
            Filter: ({ column }) => <Input
                placeholder='Status'
                value={statusCode}
                onChange={(e) => {
                    setStatusCode(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'ConfirmationCode',
            disableResizing: true,
            Header: () => confirmCode ? <Icon name="filter" /> : <h4>Confirmation</h4>,
            hAlign: 'Center',
            width: 140,
            accessor: '_id',
            Filter: ({ column }) => <Input
                placeholder='Confirmation'
                value={confirmCode}
                onChange={(e) => {
                    setConfirmCode(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'CreationDate',
            disableResizing: true,
            Header: () => creationDate ? <Icon name="filter" /> : <h4>Date</h4>,
            hAlign: 'Center',
            width: 180,
            accessor: (row) => (new Date(row?.creationDate)).toLocaleString("en-US", { timeZone }),
            Filter: ({ column }) => <DateRangePicker
                placeholder='Select Date Range'
                onChange={(e) => {
                    e.preventDefault();
                    console.log(e.target.startDateValue);
                    console.log(e.target.endDateValue);
                    console.log(e.target.value);
                    if (e.target.value) {
                        const start = new Date(e.target.startDateValue);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(e.target.endDateValue);
                        end.setUTCHours(23, 59, 59, 999);
                        setCreationDate(`${Date.parse(start)}-${Date.parse(end)}`);
                        setDateRange(e.target.value);
                        setPage(1);
                    } else {
                        setCreationDate(e.target.value);
                        setDateRange(e.target.value);
                        setPage(1);
                    }
                }}
                value={dateRange}
            />
        },
        {
            id: 'DocType',
            disableResizing: true,
            Header: () => DOC_TYPE ? <Icon name="filter" /> : <h4>Type</h4>,
            hAlign: 'Center',
            width: 30,
            accessor: 'fidocus[0].requestBody.Header.DOC_TYPE',
            Filter: ({ column }) => <Input
                placeholder='Type'
                value={DOC_TYPE}
                onChange={(e) => {
                    setDOC_TYPE(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'CompanyCode',
            disableResizing: true,
            Header: () => COMP_CODE ? <Icon name="filter" /> : <h4>Company</h4>,
            hAlign: 'Center',
            width: 80,
            accessor: 'fidocus[0].requestBody.Header.COMP_CODE',
            Filter: ({ column }) => <Input
                placeholder='Company'
                value={COMP_CODE}
                onChange={(e) => {
                    setCOMP_CODE(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'PostingDate',
            disableResizing: true,
            Header: () => PSTNG_DATE ? <Icon name="filter" /> : <h4>Posting</h4>,
            hAlign: 'Center',
            width: 80,
            accessor: 'fidocus[0].requestBody.Header.PSTNG_DATE',
            Filter: ({ column }) => <Input
                placeholder='Posting'
                value={PSTNG_DATE}
                onChange={(e) => {
                    setPSTNG_DATE(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'HeaderText',
            disableResizing: true,
            Header: () => HEADER_TXT ? <Icon name="filter" /> : <h4>Header Text</h4>,
            hAlign: 'Center',
            width: 200,
            accessor: 'fidocus[0].requestBody.Header.HEADER_TXT',
            Filter: ({ column }) => <Input
                placeholder='Header Text'
                value={HEADER_TXT}
                onChange={(e) => {
                    setHEADER_TXT(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'ReferanceDoc',
            disableResizing: true,
            Header: () => REF_DOC_NO ? <Icon name="filter" /> : <h4>Reference Doc</h4>,
            hAlign: 'Center',
            width: 180,
            accessor: 'fidocus[0].requestBody.Header.REF_DOC_NO',
            Filter: ({ column }) => <Input
                placeholder='Reference Doc'
                value={REF_DOC_NO}
                onChange={(e) => {
                    setREF_DOC_NO(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'key',
            disableResizing: true,
            Header: () => key ? <Icon name="filter" /> : <h4>Document key</h4>,
            hAlign: 'Center',
            width: 160,
            accessor: 'fidocus[0].key',
            Filter: ({ column }) => <Input
                placeholder='Referance No.'
                value={key}
                onChange={(e) => {
                    setKey(e.target.value);
                    setPage(1);
                }}
            />
        },
        {
            id: 'BapiReturn',
            disableFilters: true,
            disableGlobalFilter: true,
            disableGroupBy: true,
            disableSortBy: true,
            disableResizing: true,
            Header: <Icon name="display" design='Transparent' />,
            hAlign: 'Center',
            width: 10,
            accessor: 'fidocus[0]',
            Cell: (props) => <Button
                onClick={() => setFidocus(props.cell.value)}
                icon='documents'
                design='Transparent'
                tooltip='Display Posted Documents'
            />
        }
    ]

    return (
        <FlexBox
            style={{ width: '100%', height: '100%' }}
            justifyContent={FlexBoxJustifyContent.Center}
            direction={FlexBoxDirection.Column}
            alignItems={FlexBoxAlignItems.Center}
            wrap={FlexBoxWrap.Wrap}
        >
            <AnalyticalTable
                style={{ marginTop: '5px' }}
                columns={columns}
                data={fiDocuConfs}
                filterable={true}
                minRows={limit}
                visibleRows={limit}
                headerRowHeight={30}
                rowHeight={30}
                loading={isloading}
                noDataText={`No Data found!`}
            />
            <Toolbar
                alignContent='Start'
                design='Transparent'
                style={{ marginTop: '5px', width: '800px' }}
            >
                <ToolbarSpacer />
                <ToolbarSelect width='5px' onChange={(e) => {
                    e.preventDefault();
                    const { ui5ExternalActionItemIndex } = e?.detail?.selectedOption?.dataset;
                    setLimit(limitRange[Number(ui5ExternalActionItemIndex)]);
                    setPage(1)
                }}>
                    {
                        limitRange.map((row, i) => <ToolbarSelectOption key={i} children={row} />)
                    }
                </ToolbarSelect>
                <ToolbarSeparator />
                <ToolbarButton
                    icon='navigation-left-arrow'
                    onClick={() => setPage(((page - 1) < 1) ? 1 : (page - 1))}
                    disabled={(page === 1) ? true : false}
                />
                <ToolbarButton
                    icon='close-command-field'
                    onClick={() => setPage(1)}
                    disabled={(page === 1) ? true : false}
                />
                {
                    pageButtons.map((but, i) =>
                        <ToolbarButton
                            key={i}
                            text={String(but)}
                            design={(but === page) ? 'Emphasized' : 'Default'}
                            onClick={(e) => setPage(Number(e.target.text))}
                        />)
                }
                <ToolbarButton
                    icon='open-command-field'
                    onClick={() => setPage(totalPages)}
                    disabled={(page === totalPages) ? true : false}
                />
                <ToolbarButton
                    icon='navigation-right-arrow'
                    onClick={() => setPage((((page + 1) > totalPages) ? totalPages : (page + 1)))}
                    disabled={(page === totalPages) ? true : false}
                />
                <ToolbarSeparator />
                <ToolbarButton text={`Total ${totalPages} Pages`} design='Attention' disabled />
                <ToolbarSpacer />
            </Toolbar>
            {
                fidocus?._id
                    ? <Dialog
                        style={{ height: '100%', width: '100%' }}
                        open={fidocus?._id ? true : false}
                        onAfterClose={() => setFidocus({})}
                        header={<DialogHeader setFidocus={setFidocus} fidocus={fidocus} refresh={handelRefersh} />}
                        children={<DialogContent fidocus={fidocus} />}
                    />
                    : <></>
            }
        </FlexBox>
    )
}