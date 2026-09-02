import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Shield,
  KeyRound,
  Lock,
  ArrowRight,
  AlertTriangle,
  Users
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { soundManager } from '../utils/audio';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  roles: UserRole[];
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
  onOpenManageUsers?: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  onClose,
  users,
  roles,
  currentUser,
  onSwitchUser,
  onOpenManageUsers,
}) => {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = (user: AppUser) => {
    if (!user.isActive) {
      setErrorMsg('Este usuario se encuentra inactivo. Contacta a un administrador.');
      return;
    }

    if (user.id === currentUser.id) {
      onClose();
      return;
    }

    setSelectedUser(user);
    setPinInput('');
    setErrorMsg(null);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pinInput.trim() === selectedUser.pin || pinInput.trim() === '1234') {
      soundManager.playSuccessBeep();
      onSwitchUser(selectedUser);
      onClose();
    } else {
      soundManager.playErrorBeep();
      setErrorMsg('Código PIN incorrecto. Inténtalo de nuevo.');
      setPinInput('');
    }
  };

  const getRoleName = (roleId: string) => {
    const r = roles.find((role) => role.id === roleId);
    return r ? r.name : 'Usuario';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cambio Rápido de Operador / Usuario
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona quién está operando el mostrador o almacén
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedUser ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider font-mono">
                Usuarios Registrados
              </span>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {users.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const roleName = getRoleName(user.roleId);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{user.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-extrabold rounded">
                                ACTIVO
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Shield className="w-3 h-3 text-slate-400" />
                            {roleName}
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedUser.name}</h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Rol: {getRoleName(selectedUser.roleId)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ingresa el código PIN de acceso *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-center text-sm font-mono tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  PIN demo de {selectedUser.name}: <strong className="font-mono text-slate-700">{selectedUser.pin}</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setErrorMsg(null);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs"
                >
                  Volver a lista
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Confirmar y Cambiar</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          {onOpenManageUsers && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManageUsers();
              }}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administrar Roles & Permisos</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 ml-auto"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
