async function startSection(navigate) {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  try {
    const response = await fetch(
      import.meta.env.VITE_SERVER + "validar-token",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      console.error("Sessão expirada. Error validating token:", error);

      localStorage.removeItem("token");
      navigate("/login");
    }
  } catch (error) {
    console.error("Sessão expirada. Error validating token:", error);
    localStorage.removeItem("token");
    navigate("/login");
  }
}

export default startSection;
