import { SettingsView } from "@/components/admin/settings-view";

export default function AdminSettingsPage() {
  return (
    <>
      <h1 className="tr-page-title">Language & Platform Settings</h1>
      <p className="tr-page-sub">
        Google Language API configuration, voice mappings, and per-UID/EID language preferences
      </p>
      <SettingsView />
    </>
  );
}
