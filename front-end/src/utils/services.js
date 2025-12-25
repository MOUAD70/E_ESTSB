import axiosClient from "../api/axios.js";

// LOGIN
export const loginUser = async (loginInfo) => {
  const res = await axiosClient.post("/auth/login", loginInfo);
  return res.data;
};

// REGISTER
export const registerUser = async (registerInfo) => {
  registerInfo.role = "CANDIDAT";
  const res = await axiosClient.post("/auth/register", registerInfo);
  return res.data;
};
