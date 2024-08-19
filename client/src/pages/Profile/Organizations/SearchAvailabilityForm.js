import { Form, Input, Modal, message } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { getAntdInputValidation } from "../../../utils/helpers.js";

function SearchAvailabilityForm({ open, setOpen, handleSearchAvailability }) {
  const { currentUser } = useSelector((state) => state.users);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    console.log("form submmited with values: ", values);
    try {
      console.log(
        "called handleSearchAvailability in try block with values: ",
        values
      );
      await handleSearchAvailability(values);
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Modal
      title="SEARCH AVAILABILITY"
      open={open}
      onCancel={() => setOpen(false)}
      centered
      onOk={() => {
        form.submit();
      }}
      okText="Search"
    >
      <Form
        layout="vertical"
        className="flex flex-col gap-3"
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label="Blood Group"
          name="bloodGroup"
          rules={getAntdInputValidation()}
        >
          <select defaultValue="a+">
            <option value="a+">A+</option>
            <option value="a-">A-</option>
            <option value="b+">B+</option>
            <option value="b-">B-</option>
            <option value="o+">O+</option>
            <option value="o-">O-</option>
            <option value="ab+">AB+</option>
            <option value="ab-">AB-</option>
          </select>
        </Form.Item>

        <Form.Item
          label="Quantity (ML)"
          name="quantity"
          rules={getAntdInputValidation()}
        >
          <Input type="number" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default SearchAvailabilityForm;
