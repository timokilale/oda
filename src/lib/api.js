export async function apiRequest(path, options = {}) {
  const { method = "GET", body, formData, signal } = options;

  const requestOptions = {
    method,
    credentials: "include",
    signal,
  };

  if (formData) {
    requestOptions.body = formData;
  } else if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
    requestOptions.headers = {
      "Content-Type": "application/json",
    };
  }

  const response = await fetch(`/api${path}`, requestOptions);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? payload.error
        : "Request failed.";
    throw new Error(message);
  }

  return payload;
}
