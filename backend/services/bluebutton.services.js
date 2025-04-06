import axios from "axios";

export const getPatient = async (accessToken) => {
  const response = await axios.get(`${process.env.BB_API_BASE_URL}Patient`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  return response.data;
};
