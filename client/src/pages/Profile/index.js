import { Tabs } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import InvetoryTable from "../../components/InvetoryTable";
import Donors from "./Donors";
import Hospitals from "./Hospitals";
import Inventory from "./Inventory";
import Organizations from "./Organizations";

function Profile() {
  const { currentUser } = useSelector((state) => state.users);
  return (
    <div>
      <Tabs>
        {currentUser.userType === "organization" && (
          <>
            <Tabs.TabPane tab="Inventory" key="1">
              <Inventory />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Donors" key="2">
              <Donors />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Hospitals" key="3">
              <Hospitals />
            </Tabs.TabPane>
          </>
        )}

        {currentUser.userType === "donor" && (
          <>
            <Tabs.TabPane tab="Donations" key="4">
              <InvetoryTable
                filters={{
                  inventoryType: "in",
                  donor: currentUser._id,
                }}
                userType="donor"
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="BloodBanks Donated" key="5">
              <Organizations userType="donor" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Registered BloodBanks" key="6">
              <Organizations userType="notMatterD" />
            </Tabs.TabPane>
          </>
        )}

        {currentUser.userType === "hospital" && (
          <>
            <Tabs.TabPane tab="Consumptions" key="7">
              <InvetoryTable
                filters={{
                  inventoryType: "out",
                  hospital: currentUser._id,
                }}
                userType="hospital"
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Organizations" key="8">
              <Organizations userType="hospital" />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Registered BloodBanks" key="9">
              <Organizations userType="notMatterH" />
            </Tabs.TabPane>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default Profile;
