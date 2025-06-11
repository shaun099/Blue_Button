/**
 * Filters a FHIR Bundle to return only carrier ExplanationOfBenefit resources.
 * @param {object} bundle - The FHIR bundle from Blue Button 2.0 API
 * @returns {object} - A bundle containing only carrier ExplanationOfBenefit resources
 */
export function filterCarrierEOB(bundle) {
  if (!bundle || !Array.isArray(bundle.entry)) {
    return { ...bundle, entry: [] };
  }
  const filteredEntries = bundle.entry.filter((e) => {
    const res = e.resource;
    if (!res || res.resourceType !== "ExplanationOfBenefit") return false;
    if (!res.type || !res.type.coding) return false;
    return res.type.coding.some(
      (coding) =>
        coding.system ===
          "https://bluebutton.cms.gov/resources/codesystem/eob-type" &&
        coding.code === "CARRIER"
    );
  });
  return {
    ...bundle,
    entry: filteredEntries,
    total: filteredEntries.length,
  };
}

export function transformEOB(rawFHIR) {
  if (!rawFHIR?.entry?.[0]?.resource) {
    throw new Error("Invalid FHIR input: no claim resource found.");
  }
  const claim = rawFHIR.entry[0].resource;

  const findAmount = (adjudications, keyword) => {
    const entry = adjudications.find((a) =>
      a.category.coding.some((c) => c.code.toLowerCase().includes(keyword))
    );
    return entry?.amount?.value ?? 0;
  };

  const careTeamBySequence = new Map(
    (claim.careTeam || []).map((ct) => [
      ct.sequence,
      {
        name: ct.provider?.display || "Not provided",
        npi: ct.provider?.identifier?.value || null,
        role: ct.role?.coding?.[0]?.display || "Unknown",
        specialty:
          ct.qualification?.coding?.find((c) =>
            c.system.includes("prvdr_spclty")
          )?.display || null,
      },
    ])
  );

  const diagnosisBySequence = new Map(
    (claim.diagnosis || []).map((d) => [
      d.sequence,
      {
        code: d.diagnosisCodeableConcept?.coding?.[0]?.code || "Unknown",
        description:
          d.diagnosisCodeableConcept?.coding?.[0]?.display?.replace(/"/g, "") ||
          "Not provided",
        type: d.type?.[0]?.coding?.[0]?.display || "Unknown",
      },
    ])
  );

  const services = (claim.item || []).map((item) => {
    const adjudications = item.adjudication || [];

    const linkedDiagnoses = (item.diagnosisSequence || []).map(
      (seq) =>
        diagnosisBySequence.get(seq) || {
          code: "Unknown",
          description: "Not linked",
          type: "Unknown",
        }
    );

    const linkedCareTeam = (item.careTeamSequence || []).map(
      (seq) =>
        careTeamBySequence.get(seq) || {
          name: "Not provided",
          npi: null,
          role: "Unknown",
          specialty: null,
        }
    );

    return {
      description: item.category?.coding?.[0]?.display || "Unknown service",
      code: item.productOrService?.coding?.[0]?.code || "N/A",
      serviceDate: item.servicedPeriod?.start || "Unknown",
      location: item.locationCodeableConcept?.coding?.[0]?.display || "Unknown",
      diagnoses: linkedDiagnoses,
      providers: linkedCareTeam,
      costBreakdown: {
        submittedAmount: findAmount(adjudications, "submitted"),
        allowedAmount: findAmount(adjudications, "eligible"),
        insuranceCovered: findAmount(adjudications, "benefit"),
        paidToProvider: findAmount(adjudications, "paidtoprovider"),
        paidToPatient: findAmount(adjudications, "paidtopatient"),
        coinsurance: findAmount(adjudications, "coinsurance"),
        deductible: findAmount(adjudications, "deductible"),
      },
    };
  });

  const testResults = (claim.contained || [])
    .filter((r) => r.resourceType === "Observation")
    .map((obs) => ({
      testName: obs.code?.coding?.[0]?.display || "Unknown Test",
      result: obs.valueQuantity?.value ?? null,
    }));

  return {
    claimId: claim.id,
    claimDate: claim.billablePeriod?.start || "Unknown",
    claimStatus: claim.status || "Unknown",
    claimOutcome: claim.outcome || "Unknown",
    provider: {
      name:
        claim.careTeam?.find((ct) =>
          ct.role?.coding?.some((r) => r.code === "primary")
        )?.provider?.display || "Not provided",
      npi:
        claim.provider?.identifier?.value !== "UNKNOWN"
          ? claim.provider?.identifier?.value
          : null,
      location: {
        state:
          claim.item?.[0]?.locationCodeableConcept?.extension?.find((e) =>
            e.url.includes("state")
          )?.valueCoding?.code || "Unknown",
        zip:
          claim.item?.[0]?.locationCodeableConcept?.extension?.find((e) =>
            e.url.includes("zip")
          )?.valueCoding?.code || "Unknown",
      },
    },
    services,
    careTeam: Array.from(careTeamBySequence.values()),
    diagnosis: Array.from(diagnosisBySequence.values()),
    financialSummary: {
      submittedTotal:
        claim.benefitBalance?.[0]?.financial?.find((f) =>
          f.type?.coding?.some((c) => c.code.includes("sbmtd"))
        )?.usedMoney?.value || 0,
      allowedTotal:
        claim.benefitBalance?.[0]?.financial?.find((f) =>
          f.type?.coding?.some((c) => c.code.includes("alowd"))
        )?.usedMoney?.value || 0,
      paidToProvider:
        claim.benefitBalance?.[0]?.financial?.find((f) =>
          f.type?.coding?.some((c) => c.code.includes("prvdr_pmt"))
        )?.usedMoney?.value || 0,
      paidToPatient:
        claim.benefitBalance?.[0]?.financial?.find((f) =>
          f.type?.coding?.some((c) => c.code.includes("bene_pmt"))
        )?.usedMoney?.value || 0,
      deductibleApplied:
        claim.benefitBalance?.[0]?.financial?.find((f) =>
          f.type?.coding?.some((c) => c.code.includes("ddctbl"))
        )?.usedMoney?.value || 0,
      payer: claim.insurer?.identifier?.value || "Not provided",
      paymentMethod: (() => {
        const adj = claim.item?.[0]?.adjudication || [];
        const paidToProvider = findAmount(adj, "paidtoprovider");
        const paidToPatient = findAmount(adj, "paidtopatient");
        if (paidToProvider > 0) return "Direct to provider";
        if (paidToPatient > 0) return "Reimbursement to patient";
        return "Unknown";
      })(),
    },
    testResults,
  };
}
