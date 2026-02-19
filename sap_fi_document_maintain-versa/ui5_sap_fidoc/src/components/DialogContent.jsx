import {
    SplitterLayout,
    SplitterElement,
    MessageView,
    MessageItem
} from '@ui5/webcomponents-react';

export const DialogContent = ({ fidocus }) => {
    //Message type: S Success, E Error, W Warning, I Info, A Abort
    const MsgType = (key) => {
        switch (key) {
            case "S": return "Positive"; //"Information";
            case "E": return "Negative"; //"Error";
            case "W": return "Critical"; //Warning";
            case "I": return "Information";
            case "A": return "Negative"; //Error";
            default: return "None";
        }
    }

    return (
        <SplitterLayout style={{ width: '100%', height: '90%' }}>
            <SplitterElement size='40%' style={{ overflowY: 'auto' }}>
                {
                    fidocus?.requestBody
                        ? <pre>{JSON.stringify(fidocus?.requestBody, null, 2)}</pre>
                        : <>No Data</>
                }
            </SplitterElement>
            <SplitterElement>
                <MessageView
                    showDetailsPageHeader={false}
                    groupItems={false}
                >
                    {
                        (fidocus?.bapiReturn?.length > 0)
                            ? fidocus?.bapiReturn?.map(
                                (bapi, i) => <MessageItem
                                    key={i + 1}
                                    type={MsgType(bapi?.TYPE)}
                                    titleText={bapi?.MESSAGE} />
                            )
                            : <>No Data</>
                    }
                </MessageView>
            </SplitterElement>
        </SplitterLayout>
    )
}