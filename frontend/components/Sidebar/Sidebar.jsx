import React, { useState, useMemo, useEffect } from "react";
import { getIconUrl } from "./../../src/utilities/iconService";
import SidebarView from "./SidebarView";
import SidebarAccountForm from "./SidebarAccountForm";
import SidebarConnectionForm from "./SidebarConnectionForm";
import SidebarLinkView from "./SidebarLinkView";
import useSidebarStore from "./../../src/store/sidebarStore";

const Sidebar = ({
  isOpen,
  onClose,
  viewMode,
  selectedAccount,
  onSelectAccount,
  rawEntities,
}) => {
  const [form, setForm] = useState({
    name: "",
    username: "",
    notes: "",
    type: "mail",
    value: "",
  });
  const [errors, setErrors] = useState({});
  const [isLinking, setIsLinking] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const {
    createAccount,
    createConnection,
    linkConnection,
    deleteAccount,
    deleteIdentity,
    loading,
    error,
    success,
    resetState,
  } = useSidebarStore();

  useEffect(() => {
    setForm({ name: "", username: "", notes: "", type: "mail", value: "" });
    setErrors({});
    setConfirmDelete(false);
  }, [viewMode, isOpen]);

  useEffect(() => {
    if (!isOpen || viewMode !== "view" || viewMode === "list") {
      setIsLinking(false);
      setLinkTargetId(null);
    }
  }, [isOpen, viewMode, selectedAccount]);

  const validate = (name, value, currentType) => {
    let error = "";
    if (name === "value") {
      if (!value.trim()) {
        error = "Value is required";
      } else if (currentType === "mail" && !value.includes("@")) {
        error = "Invalid email address";
      } else if (currentType === "phone" && !value.startsWith("+")) {
        error = "Phone must start with +";
      }
    }
    if (name === "name" && !value.trim()) error = "Name is required";
    if (name === "username" && !value.trim()) error = "Username is required";
    return error;
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      const error = validate(field, value, newForm.type);
      setErrors((prevErr) => ({ ...prevErr, [field]: error }));
      return newForm;
    });
  };

  const isConnection = !!selectedAccount?.accounts;

  const isValid = useMemo(() => {
    if (viewMode === "createAccount") return form.name && form.username && !errors.name && !errors.username;
    if (viewMode === "createConnection") return form.value && !errors.value;
    return true;
  }, [viewMode, form, errors]);

  const sidebarConnections = useMemo(() => {
    if (!selectedAccount || viewMode !== "view") return [];
    return isConnection
      ? selectedAccount.accounts || []
      : (rawEntities || []).filter((c) =>
          c.accounts?.some((a) => a.id === selectedAccount.id),
        );
  }, [selectedAccount, rawEntities, isConnection, viewMode]);

  const linkTargets = useMemo(() => {
    if (!selectedAccount || viewMode !== "view") return [];
    if (isConnection) {
      const uniqueAccounts = new Map();
      (rawEntities || []).forEach((conn) => {
        (conn.accounts || []).forEach((acc) => {
          if (!uniqueAccounts.has(acc.id)) uniqueAccounts.set(acc.id, acc);
        });
      });
      const linkedAccountIds = new Set((selectedAccount.accounts || []).map((acc) => acc.id));
      return Array.from(uniqueAccounts.values()).filter((acc) => !linkedAccountIds.has(acc.id));
    }
    const linkedConnectionIds = new Set(sidebarConnections.map((conn) => conn.id));
    return (rawEntities || []).filter((conn) => !linkedConnectionIds.has(conn.id));
  }, [selectedAccount, rawEntities, isConnection, viewMode, sidebarConnections]);

  const activeIconKey = useMemo(() => {
    if (viewMode === "createAccount") return form.name;
    if (viewMode === "createConnection") return form.type;
    if (!selectedAccount) return "";
    return isConnection ? selectedAccount.type : selectedAccount.name;
  }, [viewMode, form.name, form.type, selectedAccount, isConnection]);

  const headerTitle = useMemo(() => {
    if (viewMode === "list") return "Identity List";
    if (viewMode === "view") return isLinking ? (isConnection ? "Link Account" : "Link Connection") : (selectedAccount?.name || "Details");
    return viewMode === "createAccount" ? "New Account" : "New Connection";
  }, [viewMode, isLinking, selectedAccount]);

  const handleCreate = async () => {
    if (viewMode === "createAccount") await createAccount(form);
    else await createConnection(form);
    onClose();
  };

  const handleLink = async () => {
    const payload = isConnection
      ? { accountId: linkTargetId, identityId: selectedAccount.id }
      : { accountId: selectedAccount.id, identityId: linkTargetId };
    await linkConnection(payload);
    setIsLinking(false);
    setLinkTargetId(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (isConnection) await deleteIdentity(selectedAccount.id);
    else await deleteAccount(selectedAccount.id);
    onClose();
  };

  useEffect(() => { if (success) resetState(); }, [success]);

  return (
    <aside
      className={`fixed md:absolute right-0 top-0 md:top-20 bottom-0 w-full md:w-80 bg-[#0f0f0f]/98 md:bg-[#0f0f0f]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col z-[2000] md:z-[1500] transition-all duration-300 transform 
        ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
    >
      <div className="flex items-center justify-between px-6 py-4 md:hidden border-b border-white/5">
         <button onClick={onClose} className="text-gray-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer">
            <span className="text-lg">←</span> Back
         </button>
         <h3 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Context</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="flex flex-col items-center mb-8 relative">
          <button onClick={onClose} className="hidden md:block absolute -top-4 -right-4 p-2 text-gray-500 hover:text-white transition-colors cursor-pointer">✕</button>

          {viewMode !== "list" && (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white flex items-center justify-center p-4 mb-4 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <img
                src={getIconUrl(activeIconKey)}
                className="max-w-full max-h-full object-contain"
                alt=""
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/633/633600.png"; }}
              />
            </div>
          )}
          
          <h2 className="text-xl font-black text-white uppercase text-center truncate w-full tracking-tighter">
            {headerTitle}
          </h2>
        </div>

        <div className="space-y-6">
          {viewMode === "createAccount" && <SidebarAccountForm form={form} errors={errors} onChange={handleChange} />}
          {viewMode === "createConnection" && <SidebarConnectionForm form={form} errors={errors} onChange={handleChange} />}
          
          {viewMode === "list" && (
             <div className="text-center py-10 px-4 border border-dashed border-white/10 rounded-2xl">
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                 You are in List View. Select an identity from the table to view details or switch back to Map.
               </p>
             </div>
          )}

          {viewMode === "view" && selectedAccount && !isLinking && (
            <SidebarView selectedAccount={selectedAccount} connections={sidebarConnections} onSelectAccount={onSelectAccount} onStartLink={() => setIsLinking(true)} />
          )}
          {viewMode === "view" && selectedAccount && isLinking && (
            <SidebarLinkView targets={linkTargets} label={isConnection ? "Account" : "Connection"} selectedId={linkTargetId} onBack={() => setIsLinking(false)} onPick={(item) => setLinkTargetId(item.id)} />
          )}
        </div>
      </div>

      {viewMode !== "list" && (
        <div className="p-6 border-t border-white/5 bg-black/40 space-y-3 pb-10 md:pb-6">
          {viewMode !== "view" ? (
            <>
              <button disabled={!isValid || loading} onClick={handleCreate} className={`w-full py-4 md:py-3 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] transition-all cursor-pointer ${isValid && !loading ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" : "bg-gray-800 text-gray-500"}`}>
                {loading ? "Creating..." : "Create"}
              </button>
              {error && <p className="text-red-500 text-[10px] text-center uppercase font-bold">{error}</p>}
            </>
          ) : isLinking ? (
            <div className="space-y-3">
              <button disabled={!linkTargetId || loading} onClick={handleLink} className={`w-full py-4 md:py-3 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] transition-all cursor-pointer ${!linkTargetId || loading ? "bg-gray-800 text-gray-500" : "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"}`}>
                {loading ? "Linking..." : "Link"}
              </button>
              <button onClick={() => setIsLinking(false)} className="w-full py-4 md:py-3 bg-white/5 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] cursor-pointer">Back</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button className="py-4 md:py-3 bg-white/5 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] cursor-pointer">Save</button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className={`py-4 md:py-3 border text-[10px] font-black rounded-xl uppercase tracking-[0.15em] transition-all cursor-pointer ${confirmDelete ? "border-red-500 bg-red-500/10 text-red-500" : "border-red-900/30 text-red-500/70"}`}
              >
                {confirmDelete ? "Confirm" : "Delete"}
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;