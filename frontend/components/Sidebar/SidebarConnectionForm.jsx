import React from 'react';

const SidebarConnectionForm = ({ form, errors, onChange }) => {
  const types = ['mail', 'phone', 'auth'];

  const getPlaceholder = () => {
    if (form.type === 'mail') return 'user@domain.com';
    if (form.type === 'phone') return '+15550000000';
    return 'Enter auth label...'; // No +1 for auth
  };

  return (
    <div className="space-y-5 animate-in slide-in-from-right duration-300">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Connection Type</label>
        <div className="flex gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => onChange('type', t)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer ${form.type === t ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">
          {form.type === 'mail' ? 'Email Address' : form.type === 'phone' ? 'Phone Number' : 'Auth Identifier'}
        </label>
        <input 
          type="text"
          value={form.value}
          onChange={(e) => onChange('value', e.target.value)}
          placeholder={getPlaceholder()}
          className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-all ${errors.value ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-blue-500'}`}
        />
        {errors.value && (
          <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter ml-1 animate-pulse">
            {errors.value}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Internal Notes</label>
        <textarea 
          value={form.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          rows="4"
          placeholder="Optional context..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none transition-colors"
        />
      </div>
    </div>
  );
};

export default SidebarConnectionForm;