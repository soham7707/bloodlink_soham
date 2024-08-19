import { Button, Modal, Table, message } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchAvailability } from "../../../apicalls/inventory";
import {
  GetAllOrganizationsOfADonar,
  GetAllOrganizationsOfAHospital,
  GetAllRegisteredOrganizations,
} from "../../../apicalls/users";
import InvetoryTable from "../../../components/InvetoryTable";
import { SetLoading } from "../../../redux/loadersSlice";
import { getDateFormat } from "../../../utils/helpers";
import SearchAvailabilityForm from "./SearchAvailabilityForm";
import SearchResultDisplay from "./SearchResultDisplay"; // Import the SearchResultDisplay component

function Organizations({ userType }) {
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [showResultModal, setShowResultModal] = React.useState(false); // State for the result modal
  const { currentUser } = useSelector((state) => state.users);
  const [selectedOrganization, setSelectedOrganization] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [open, setOpen] = React.useState(false); // State for the search form modal
  const [results, setResults] = React.useState([]); // State for the search results
  const dispatch = useDispatch();

  const getData = async () => {
    try {
      dispatch(SetLoading(true));
      let response = null;
      if (userType === "hospital") {
        response = await GetAllOrganizationsOfAHospital();
      } else if (userType === "notMatterH" || userType === "notMatterD") {
        response = await GetAllRegisteredOrganizations();
      } else {
        response = await GetAllOrganizationsOfADonar();
      }
      dispatch(SetLoading(false));
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(SetLoading(false));
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "organizationName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
    },
    {
      title: "Address",
      dataIndex: "address",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text) => getDateFormat(text),
    },
  ];

  if (userType === "notMatterH" || userType === "notMatterD") {
    columns.push({
      title: "Website",
      dataIndex: "website",
    });
  } else {
    columns.push({
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <span
          className="underline text-md cursor-pointer"
          onClick={() => {
            setSelectedOrganization(record);
            setShowHistoryModal(true);
          }}
        >
          History
        </span>
      ),
    });
  }

  const handleSearchAvailability = async (values) => {
    try {
      dispatch(SetLoading(true));
      console.log("called api search with values: ", values);
      const response = await searchAvailability(values);
      dispatch(SetLoading(false));
      if (response.success) {
        console.log("Sucess");
        setResults(response.data);
        setShowResultModal(true);
      } else {
        console.log("detected error after calling the api ", values);
        throw new Error(response.message);
      }
    } catch (error) {
      console.log("catched error in the server in catch block");
      message.error(error.message);
      dispatch(SetLoading(false));
    }
    setOpen(false);
  };

  React.useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      {userType === "notMatterH" && (
        <div className="flex justify-end">
          <Button type="default" onClick={() => setOpen(true)}>
            Search Availability
          </Button>
        </div>
      )}
      <Table columns={columns} dataSource={data} className="mt-3" />
      {open && (
        <SearchAvailabilityForm
          open={open}
          setOpen={setOpen}
          handleSearchAvailability={handleSearchAvailability} // Pass the handler to the form
        />
      )}
      {showResultModal && (
        <SearchResultDisplay
          open={showResultModal}
          setOpen={setShowResultModal}
          results={results}
        />
      )}
      {showHistoryModal && (
        <Modal
          title={`${
            userType === "donor" ? "Donations History" : "Consumptions History"
          } In ${selectedOrganization.organizationName}`}
          centered
          open={showHistoryModal}
          onCancel={() => setShowHistoryModal(false)}
          width={1000}
        >
          <InvetoryTable
            filters={{
              organization: selectedOrganization._id,
              [userType]: currentUser._id,
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default Organizations;
