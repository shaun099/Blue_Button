import axios from "axios";

export const getPatient = async (accessToken) => {
  // eslint-disable-next-line no-undef
  const response = await axios.get(`${process.env.BB_API_BASE_URL}Patient`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/fhir+json",
    },
  });
  return response.data;
};

export const getEob = async (accessToken, types = null) => {
  // eslint-disable-next-line no-undef
  const baseUrl = `${process.env.BB_API_BASE_URL}ExplanationOfBenefit`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  const urls =
    types && types.length > 0
      ? types.map((type) => `${baseUrl}?type=${type}&_summary=true`)
      : [`${baseUrl}?_summary=true`];

  const responses = await Promise.all(
    urls.map((url) => axios.get(url, { headers }))
  );

  const allEntries = responses.flatMap((resp) => resp.data.entry || []);

  const result = {
    resourceType: "Bundle",
    type: "searchset",
    entry: allEntries,
  };

  console.log("Fetched EOB entries:", result.entry.length); // Optional debug
  return result;
};

export const getCoverage = async (accessToken) => {
  // eslint-disable-next-line no-undef
  const response = await axios.get(`${process.env.BB_API_BASE_URL}Coverage`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  return response.data;
};
