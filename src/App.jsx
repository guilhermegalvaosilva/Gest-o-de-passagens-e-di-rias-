import { useCallback, useEffect, useState } from "react";

import { Topbar } from "./components/layout/Topbar";
import { STORAGE_KEYS } from "./config/storageKeys";
import { AdminPage } from "./pages/Admin/AdminPage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { HomePage } from "./pages/Home/HomePage";
import { RequestFormPage } from "./pages/RequestForm/RequestFormPage";
import { apiRequest } from "./services/api";
import { removeStorage } from "./services/storage";

function App() {
  const [page, setPageState] = useState("home");
  const [storageMode, setStorageMode] = useState("Conectando ao backend");

  const setPage = useCallback((next) => {
    setPageState(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openAdmin = useCallback(() => {
    setPage("login");
  }, [setPage]);

  useEffect(() => {
    removeStorage(STORAGE_KEYS.activePage);
    apiRequest("/health")
      .then(() => setStorageMode("Backend conectado"))
      .catch(() => setStorageMode("Backend indisponivel"));
  }, []);

  useEffect(() => {
    const handler = (event) => {
      window.localStorage.setItem(STORAGE_KEYS.pendingEditId, event.detail);
      setPage("form");
    };
    window.addEventListener("load-form-edit", handler);
    return () => window.removeEventListener("load-form-edit", handler);
  }, [setPage]);

  return (
    <>
      <Topbar />
      <main>
        {page === "home" && (
          <HomePage
            storageMode={storageMode}
            onAdmin={openAdmin}
            onForm={() => {
              removeStorage(STORAGE_KEYS.pendingEditId);
              setPage("form");
            }}
          />
        )}
        {page === "login" && (
          <LoginPage onBack={() => setPage("home")} onLogin={() => setPage("admin")} />
        )}
        {page === "form" && <RequestFormPage onBack={() => setPage("home")} />}
        {page === "admin" && <AdminPage onBack={() => setPage("home")} />}
      </main>
    </>
  );
}

export default App;
