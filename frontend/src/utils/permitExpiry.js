
export function getPermitExpiryStatus(permit) {
  if (permit.status !== "APPROVED") {
    return {
      label: "Not Applicable",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (!permit.expiryDate) {
    return {
      label: "No Expiry Set",
      className: "bg-slate-100 text-slate-600",
    };
  }

  const datePart = String(permit.expiryDate).slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  const expiry = new Date(year, month - 1, day);

  if (Number.isNaN(expiry.getTime())) {
    return {
      label: "Invalid Date",
      className: "bg-slate-100 text-slate-600",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.round(
    (
      Date.UTC(year, month - 1, day) -
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
    ) / 86400000
  );

  if (daysRemaining < 0) {
    return {
      label: "Expired",
      className: "bg-red-50 text-red-700",
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: "Expiring Soon",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Valid",
    className: "bg-green-50 text-green-700",
  };
}
