import { message } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
//import { GetEligibleDonation } from "../apicalls/inventory";
import axios from "axios";
import { GetCurrentUser } from "../apicalls/users";
import { SetLoading } from "../redux/loadersSlice";
import { SetCurrentUser } from "../redux/usersSlice";
import { getLoggedInUserName } from "../utils/helpers";

function ProtectedPage({ children }) {
  const { currentUser } = useSelector((state) => state.users);
  const [donationInfo, setDonationInfo] = React.useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const getCurrentUser = async () => {
    try {
      dispatch(SetLoading(true));
      const response = await GetCurrentUser();
      dispatch(SetLoading(false));
      if (response.success) {
        dispatch(SetCurrentUser(response.data));
        if (response.data.userType === "donor") {
          getDonationInfo(response.data._id);
        }
        message.success(response.message);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(SetLoading(false));
      message.error(error.message);
    }
  };
  const getDonationInfo = async (donorId) => {
    try {
      dispatch(SetLoading(true));
      const response = await axios.get(`/api/inventory/donor-info/${donorId}`);
      dispatch(SetLoading(false));
      if (response.data.success) {
        setDonationInfo(response.data.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(SetLoading(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getCurrentUser();
    } else {
      navigate("/login");
    }
  }, []);

  return (
    currentUser && (
      <div>
        {/* header */}
        <div className="flex justify-between items-center bg-primary text-white px-5 py-3 mx-5 rounded-b">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <h1 className="text-2xl">BLOOD LINK</h1>
            <span className="text-xs">
              {currentUser.userType.toUpperCase()}
            </span>
          </div>
          {donationInfo?.lastDonationDate && (
            <div>
              <span>
                {" "}
                You are eligible to donate:{" "}
                {donationInfo.nextEligibleDate || "N/A"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <i class="ri-shield-user-line"></i>
            <div className="flex flex-col">
              <span
                className="mr-5 text-md  cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                {getLoggedInUserName(currentUser).toUpperCase()}
              </span>
            </div>

            <i
              className="ri-logout-circle-r-line ml-5 cursor-pointer"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
            ></i>
          </div>
        </div>

        {/* body */}
        <div className="px-5 py-5">{children}</div>
      </div>
    )
  );
}

export default ProtectedPage;
