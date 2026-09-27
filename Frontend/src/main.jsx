import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CadastroPage from "./pages/CadastroPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PerfilUsuario from "./pages/PerfilUsuario.jsx";
import AddPaciente from "./pages/AddPaciente.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/cadastro",
    element: <CadastroPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/perfil",
    element: <PerfilUsuario />,
  },
  {
    path: "/add-paciente",
    element: <AddPaciente />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider
      future={{
        v7_startTransition: true,
      }}
      router={router}
    />
  </StrictMode>,
);
