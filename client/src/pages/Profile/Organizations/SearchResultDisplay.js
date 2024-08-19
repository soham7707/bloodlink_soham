// components/SearchResultDisplay.js
import { Modal, Table } from "antd";
import React from "react";

function SearchResultDisplay({ open, setOpen, results }) {
  const columns = [
    {
      title: "Organization Name",
      dataIndex: "organizationName",
      key: "organizationName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Available Quantity (ML)",
      dataIndex: "availableQuantity",
      key: "availableQuantity",
      render: (text) => <span className="red-text">{text} ML</span>, // Apply red color
    },
  ];

  return (
    <Modal
      title="Search Results"
      open={open}
      onCancel={() => setOpen(false)}
      centered
      width={800}
      footer={null} // Remove default footer
    >
      <Table
        columns={columns}
        dataSource={results}
        rowKey={(record) => record.email} // Unique key for each row
        locale={{
          emptyText: (
            <div
              style={{ fontWeight: "bold", fontSize: "16px", color: "#ff4d4f" }}
            >
              No blood banks found with the requested quantity
            </div>
          ),
        }}
      />
    </Modal>
  );
}

export default SearchResultDisplay;
