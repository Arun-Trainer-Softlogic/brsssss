import { useNavigate } from "react-router";
import { useAuth } from '../hooks/auth'
import {
    FlexBox,
    FlexBoxJustifyContent,
    FlexBoxDirection,
    FlexBoxAlignItems,
    FlexBoxWrap,
    ProductSwitch,
    ProductSwitchItem
} from '@ui5/webcomponents-react';
import "@ui5/webcomponents-icons/dist/customer.js";
import "@ui5/webcomponents-icons/dist/arobase.js";
import "@ui5/webcomponents-icons/dist/list.js";
import "@ui5/webcomponents-icons/dist/private.js";

export const RootIndex = () => {

    const { token, user } = useAuth();
    const navigate = useNavigate()

    return (
        <FlexBox
            fitContainer
            justifyContent={FlexBoxJustifyContent.Center}
            direction={FlexBoxDirection.Column}
            alignItems={FlexBoxAlignItems.Center}
            wrap={FlexBoxWrap.Wrap}>
            {
                token
                    ? <ProductSwitch>
                        <ProductSwitchItem
                            icon="customer"
                            target="_blank"
                            titleText={user}
                            style={{
                                border: "2px solid darkblue",
                                // borderRadius: "10px"
                            }}
                        />
                        <ProductSwitchItem
                            icon="arobase"
                            titleText="Email Alert Configuration"
                            onClick={() => navigate('/fipostAlert')}
                            style={{
                                border: "2px solid darkblue",
                                // borderRadius: "10px"
                            }}
                        />
                        <ProductSwitchItem
                            icon="list"
                            titleText="SAP FI Document Post"
                            onClick={() => navigate('/fiposteddoc')}
                            style={{
                                border: "2px solid darkblue",
                                // borderRadius: "10px"
                            }}
                        />
                    </ProductSwitch>
                    : <ProductSwitch style={{ width: "210px" }} >
                        <ProductSwitchItem
                            icon="private"
                            titleText="You are Not Logged in"
                            subtitleText=""
                            onClick={() => navigate('/fiposteddoc')}
                            style={{
                                border: "2px solid darkred"
                            }}
                        />
                    </ProductSwitch>
            }
        </FlexBox>
    )
}