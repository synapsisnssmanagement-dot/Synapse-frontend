export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error && !error.response && error.isAxiosError) {
    return "We couldn't reach Synapsis. Check your connection and try again.";
  }
  return error?.response?.data?.message || fallback;
}
