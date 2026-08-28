import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components";
import { FreightDetail, FreightForm, FreightPage } from "./pages";
import { Dashboard } from "./dashboard";
import { ClosingPage, DepositsPage, SettingsPage } from "./operations";
import { HistoryPage } from "./history";
import { getStore, saveStore, type Store } from "./lib";

export default function App() {
  const [store, setStore] = useState<Store>(() => getStore());
  const update = (next: Store) => {
    saveStore(next);
    setStore(next);
  };
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard store={store} />} />
        <Route path="/freight" element={<FreightPage store={store} />} />
        <Route
          path="/freight/new"
          element={<FreightForm store={store} update={update} />}
        />
        <Route
          path="/freight/:id"
          element={<FreightDetail store={store} update={update} />}
        />
        <Route
          path="/freight/:id/edit"
          element={<FreightForm store={store} update={update} />}
        />
        <Route
          path="/deposits"
          element={<DepositsPage store={store} update={update} />}
        />
        <Route
          path="/closing"
          element={<ClosingPage store={store} update={update} />}
        />
        <Route path="/history" element={<HistoryPage store={store} />} />
        <Route
          path="/settings"
          element={<SettingsPage store={store} update={update} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
