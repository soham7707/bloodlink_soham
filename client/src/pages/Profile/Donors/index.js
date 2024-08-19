import { Button, Table, message } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { GetAllDonorsOfAnOrganization } from "../../../apicalls/users";
import { SetLoading } from "../../../redux/loadersSlice";
import { getDateFormat } from "../../../utils/helpers";
import AnnoucementForm from "./AnnoucementForm";

function Donors() {
  const [data, setData] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const dispatch = useDispatch();

  const getData = async () => {
    try {
      dispatch(SetLoading(true));
      const response = await GetAllDonorsOfAnOrganization();
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
      dataIndex: "name",
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
      title: "Created At",
      dataIndex: "createdAt",
      render: (text) => getDateFormat(text),
    },
  ];

  React.useEffect(() => {
    getData();
  }, []);
  return (
    <div>
      <div className="flex justify-end">
        <Button type="default" onClick={() => setOpen(true)}>
          Add Annoucement
        </Button>
      </div>

      <Table columns={columns} dataSource={data} className="mt-3" />

      {open && (
        <AnnoucementForm open={open} setOpen={setOpen} reloadData={getData} />
      )}
    </div>
  );
}

export default Donors;
