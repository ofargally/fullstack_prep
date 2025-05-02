export const formatTimestamp = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "invalid_date";
  }
};
