import axios from "axios";

export const getPatient = async (accessToken) => {
  // eslint-disable-next-line no-undef
  const response = await axios.get(`${process.env.BB_API_BASE_URL}Patient`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  return response.data;
};

export const getEob = async (accessToken) => {
  const response = await axios.get(
    // eslint-disable-next-line no-undef
    `${process.env.BB_API_BASE_URL}ExplanationOfBenefit`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );
  console.log(response.data); //debug
  return response.data;
};
