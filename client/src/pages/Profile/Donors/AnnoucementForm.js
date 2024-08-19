import { Form, Modal, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SentMessage } from "../../../apicalls/inventory";
import { SetLoading } from "../../../redux/loadersSlice";
import { getAntdInputValidation } from "../../../utils/helpers";

function AnnoucementForm({ open, setOpen, reloadData }) {
  const { currentUser } = useSelector((state) => state.users);
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(SetLoading(true));
      const response = await SentMessage({
        ...values,
        organization: currentUser._id,
      });
      dispatch(SetLoading(false));
      if (response.success) {
        reloadData();
        message.success("Annoucement Sent Successfully");
        setOpen(false);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(SetLoading(false));
    }
  };

  return (
    <Modal
      title="ADD ANNOUCEMENT"
      open={open}
      onCancel={() => setOpen(false)}
      centered
      onOk={() => {
        form.submit();
      }}
      okText="Send" // Change the text of the OK button to "Send"
    >
      <Form
        layout="vertical"
        className="flex flex-col gap-3"
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label="Type Message to sent"
          name="message"
          className="col-span-2"
          rules={getAntdInputValidation()}
        >
          <TextArea rows={6} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AnnoucementForm;
