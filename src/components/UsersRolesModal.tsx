import React, { useState } from 'react';
import {
  X,
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  Phone,
  Mail,
  Sparkles,
  DollarSign,
  Package,
  Receipt,
  ScanLine,
  BarChart3,
  Tag,
  Database,
  ArrowRight
} from 'lucide-react';
import { AppUser, UserRole, RolePermissions } from '../types';

interface UsersRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  roles: UserRole[];
  currentUser: AppUser;
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onAddRole: (role: UserRole) => void;
  onUpdateRole: (role: UserRole) => void;
  onDeleteRole: (roleId: string) => void;
}

const COLOR_OPTIONS = [
  { label: 'Ámbar (Dorado)', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  { label: 'Azul Real', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  { label: 'Esmeralda (Verde)', value: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'Púrpura / Morado', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  { label: 'Rosa / Carmín', value: 'rose', bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
  { label: 'Índigo', value: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { label: 'Cian / Turquesa', value: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
];

export const UsersRolesModal: React.FC<UsersRolesModalProps> = ({
  isOpen,
  onClose,
  users,
  roles,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');

  // User form modal state
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRoleId, setUserRoleId] = useState(roles[0]?.id || 'role-seller');
  const [userPin, setUserPin] = useState('1234');
  const [userAvatarColor, setUserAvatarColor] = useState('blue');
  const [userIsActive, setUserIsActive] = useState(true);

  // Role form modal state
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleColor, setRoleColor] = useState('blue');
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    viewFinancials: false,
    manageInventory: true,
    createSales: true,
    manualStockAdjust: true,
    manageUsersAndRoles: false,
    viewAnalytics: true,
    managePromotions: false,
    cancelSales: false,
    backupData: false,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Open user creation
  const handleOpenNewUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserRoleId(roles.find((r) => r.id === 'role-seller')?.id || roles[0]?.id || '');
    setUserPin(String(Math.floor(1000 + Math.random() * 9000)));
    setUserAvatarColor('blue');
    setUserIsActive(true);
    setIsUserFormOpen(true);
  };

  // Open user edit
  const handleOpenEditUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPhone(user.phone || '');
    setUserRoleId(user.roleId);
    setUserPin(user.pin);
    setUserAvatarColor(user.avatarColor || 'blue');
    setUserIsActive(user.isActive);
    setIsUserFormOpen(true);
  };

  // Save User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      showToast('error', 'El nombre y el correo electrónico son obligatorios.');
      return;
    }

    if (userPin.length < 4) {
      showToast('error', 'El código PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }

    if (editingUserId) {
      const existing = users.find((u) => u.id === editingUserId);
      if (existing) {
        onUpdateUser({
          ...existing,
          name: userName.trim(),
          email: userEmail.trim(),
          phone: userPhone.trim() || undefined,
          roleId: userRoleId,
          pin: userPin,
          avatarColor: userAvatarColor,
          isActive: userIsActive,
        });
        showToast('success', `Usuario "${userName}" actualizado con éxito.`);
      }
    } else {
      const newUser: AppUser = {
        id: `user-${Date.now()}`,
        name: userName.trim(),
        email: userEmail.trim(),
        phone: userPhone.trim() || undefined,
        roleId: userRoleId,
        pin: userPin,
        avatarColor: userAvatarColor,
        isActive: userIsActive,
        createdAt: new Date().toISOString(),
      };
      onAddUser(newUser);
      showToast('success', `Usuario "${userName}" creado correctamente.`);
    }

    setIsUserFormOpen(false);
  };

  // Delete User
  const handleDeleteUser = (user: AppUser) => {
    if (user.id === currentUser.id) {
      showToast('error', 'No puedes eliminar el usuario con la sesión activa.');
      return;
    }
    if (users.length <= 1) {
      showToast('error', 'Debe existir al menos un usuario registrado en el sistema.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar permanentemente al usuario "${user.name}"?`)) {
      onDeleteUser(user.id);
      showToast('success', `Usuario "${user.name}" eliminado.`);
    }
  };

  // Open role creation
  const handleOpenNewRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDesc('');
    setRoleColor('emerald');
    setRolePermissions({
      viewFinancials: false,
      manageInventory: true,
      createSales: true,
      manualStockAdjust: true,
      manageUsersAndRoles: false,
      viewAnalytics: false,
      managePromotions: false,
      cancelSales: false,
      backupData: false,
    });
    setIsRoleFormOpen(true);
  };

  // Open role edit
  const handleOpenEditRole = (role: UserRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setRoleColor(role.color);
    setRolePermissions({ ...role.permissions });
    setIsRoleFormOpen(true);
  };

  // Save Role
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast('error', 'El nombre del rol es obligatorio.');
      return;
    }

    if (editingRoleId) {
      const existing = roles.find((r) => r.id === editingRoleId);
      if (existing) {
        onUpdateRole({
          ...existing,
          name: roleName.trim(),
          description: roleDesc.trim(),
          color: roleColor,
          permissions: rolePermissions,
        });
        showToast('success', `Rol "${roleName}" actualizado con éxito.`);
      }
    } else {
      const newRole: UserRole = {
        id: `role-custom-${Date.now()}`,
        name: roleName.trim(),
        description: roleDesc.trim() || 'Rol personalizado con permisos específicos',
        color: roleColor,
        isSystemDefault: false,
        permissions: rolePermissions,
        createdAt: new Date().toISOString(),
      };
      onAddRole(newRole);
      showToast('success', `Nuevo rol "${roleName}" creado y habilitado.`);
    }

    setIsRoleFormOpen(false);
  };

  // Delete Role
  const handleDeleteRole = (role: UserRole) => {
    if (role.isSystemDefault) {
      showToast('error', 'Los roles predeterminados del sistema no pueden eliminarse.');
      return;
    }
    const usersWithRole = users.filter((u) => u.roleId === role.id);
    if (usersWithRole.length > 0) {
      showToast(
        'error',
        `No se puede eliminar este rol porque está asignado a ${usersWithRole.length} usuario(s). Reasigna a los usuarios primero.`
      );
      return;
    }

    if (window.confirm(`¿Deseas eliminar el rol personalizado "${role.name}"?`)) {
      onDeleteRole(role.id);
      showToast('success', `Rol "${role.name}" eliminado.`);
    }
  };

  const getRoleBadge = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return null;
    const colorObj = COLOR_OPTIONS.find((c) => c.value === role.color) || COLOR_OPTIONS[0];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorObj.badge}`}>
        <Shield className="w-3 h-3" />
        {role.name}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Control de Usuarios, Roles y Permisos (RBAC)
                </h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[10px] font-extrabold uppercase font-mono">
                  Seguridad
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestiona los colaboradores, crea roles personalizados y restringe el acceso a costos y funciones
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

        {/* Notifications */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-colors flex items-center gap-2 ${
                activeTab === 'USERS'
                  ? 'bg-white border-slate-200 text-blue-700 shadow-xs'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuarios del Sistema ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ROLES')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-colors flex items-center gap-2 ${
                activeTab === 'ROLES'
                  ? 'bg-white border-slate-200 text-blue-700 shadow-xs'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Roles y Matriz de Permisos ({roles.length})</span>
            </button>
          </div>

          <div className="pb-2">
            {activeTab === 'USERS' ? (
              <button
                type="button"
                onClick={handleOpenNewUser}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenNewRole}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Rol</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-white space-y-4">
          {activeTab === 'USERS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map((user) => {
                  const role = roles.find((r) => r.id === user.roleId);
                  const isCurrent = user.id === currentUser.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-extrabold rounded">
                                  TÚ
                                </span>
                              )}
                              {!user.isActive && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-extrabold rounded">
                                  INACTIVO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div>{getRoleBadge(user.roleId)}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            <KeyRound className="w-3 h-3 text-slate-500" />
                            PIN: ••••
                          </span>
                          {user.phone && <span>{user.phone}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'ROLES' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Sistema de Roles Dinámicos y Permisos de Seguridad</span>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Puedes crear cuantos roles requiera tu taller o refaccionaria (ej: Jefe de Bodega, Cajero, Auditor, Vendedor de Mostrador). Las restricciones aplicadas impiden que usuarios no autorizados vean precios de compra o alteren configuraciones.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const colorObj = COLOR_OPTIONS.find((c) => c.value === role.color) || COLOR_OPTIONS[0];
                  const usersCount = users.filter((u) => u.roleId === role.id).length;

                  return (
                    <div
                      key={role.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${colorObj.badge}`}>
                                <Shield className="w-3.5 h-3.5" />
                                {role.name}
                              </span>
                              {role.isSystemDefault && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Predeterminado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-2 font-medium">
                              {role.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRole(role)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar rol y permisos"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!role.isSystemDefault && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar rol personalizado"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Permissions Summary Badges */}
                        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className={`p-1.5 rounded border flex items-center gap-1.5 ${role.permissions.viewFinancials ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'}`}>
                            <DollarSign className="w-3 h-3 shrink-0" />
                            <span>Ver Costos / Margen</span>
                          </div>
                          <div className={`p-1.5 rounded border flex items-center gap-1.5 ${role.permissions.manageInventory ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'}`}>
                            <Package className="w-3 h-3 shrink-0" />
                            <span>Gestión Inventario</span>
                          </div>
                          <div className={`p-1.5 rounded border flex items-center gap-1.5 ${role.permissions.createSales ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'}`}>
                            <Receipt className="w-3 h-3 shrink-0" />
                            <span>Facturar y Vender</span>
                          </div>
                          <div className={`p-1.5 rounded border flex items-center gap-1.5 ${role.permissions.manualStockAdjust ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'}`}>
                            <ScanLine className="w-3 h-3 shrink-0" />
                            <span>Despacho Manual</span>
                          </div>
                          <div className={`p-1.5 rounded border flex items-center gap-1.5 ${role.permissions.viewAnalytics ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'}`}>
                            <BarChart3 className="w-3 h-3 shrink-0" />
                            <span>Ver Estadísticas</span>
                          </div>
                          <div className={`p-1.5 rounded border flex items-center gap-1.5 ${role.permissions.manageUsersAndRoles ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'}`}>
                            <Users className="w-3 h-3 shrink-0" />
                            <span>Gestionar Usuarios</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>{usersCount} {usersCount === 1 ? 'usuario asignado' : 'usuarios asignados'}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRole(role)}
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                        >
                          Configurar Permisos <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Usuario actual activo: <strong className="text-slate-800">{currentUser.name}</strong> ({getRoleBadge(currentUser.roleId)})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* MODAL FORM: CREATE / EDIT USER */}
      {isUserFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario del Sistema'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ej: Andrés Mendoza"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="andres@taller.com"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+57 310..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol Asignado *
                  </label>
                  <select
                    value={userRoleId}
                    onChange={(e) => setUserRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white font-medium"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código PIN (4 dígitos) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    placeholder="1234"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono tracking-widest text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={userIsActive}
                    onChange={(e) => setUserIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Usuario Activo en el Sistema</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserFormOpen(false)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM: CREATE / EDIT ROLE & PERMISSIONS MATRIX */}
      {isRoleFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRoleId ? 'Configurar Rol & Permisos' : 'Crear Nuevo Rol Personalizado'}
                </h3>
                <p className="text-xs text-slate-500">
                  Define el nivel de acceso granular a las secciones de la aplicación
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="ej: Cajero Fines de Semana"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Color de Insignia
                  </label>
                  <select
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción del Perfil
                </label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="ej: Emite facturas y despacha repuestos sin acceso a costos"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Permissions Matrix */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono mb-2">
                  Matriz de Permisos y Restricciones
                </span>

                <div className="space-y-2">
                  {/* Financials */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.viewFinancials}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, viewFinancials: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                        Ver Precios de Costo y Margen de Utilidad
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Si está desactivado, el usuario no verá cuánto costó el repuesto ni las ganancias netas de la empresa.
                      </span>
                    </div>
                  </label>

                  {/* Manage Inventory */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.manageInventory}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, manageInventory: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        Administrar Inventario y Estanterías
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Crear nuevos repuestos, editar fichas técnicas, configurar canastas y eliminar items.
                      </span>
                    </div>
                  </label>

                  {/* Create Sales */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.createSales}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, createSales: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        Emitir Facturas y Registrar Ventas
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Crear facturas electrónicas o manuales, cobrar y despachar productos desde mostrador.
                      </span>
                    </div>
                  </label>

                  {/* Manual Stock Adjust */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.manualStockAdjust}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, manualStockAdjust: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5 text-purple-600" />
                        Despacho y Ajuste Manual sin Pistola de Código de Barras
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Permite descontar o ingresar repuestos manualmente ingresando el motivo cuando la pistola no funcione.
                      </span>
                    </div>
                  </label>

                  {/* View Analytics */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.viewAnalytics}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, viewAnalytics: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
                        Ver Estadísticas y Ranking de Vendedores
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Visualizar gráficos mensuales, rotación de productos y la tabla de mejores vendedores.
                      </span>
                    </div>
                  </label>

                  {/* Manage Promotions */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.managePromotions}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, managePromotions: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-rose-600" />
                        Crear y Activar Promociones / Descuentos
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Aplicar rebajas automáticas a productos de baja rotación en canastas.
                      </span>
                    </div>
                  </label>

                  {/* Cancel Sales */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.cancelSales}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, cancelSales: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Anular Facturas y Reingresar Stock
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Permiso sensible para anular ventas y devolver material al almacén.
                      </span>
                    </div>
                  </label>

                  {/* Manage Users and Roles */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.manageUsersAndRoles}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, manageUsersAndRoles: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        Administrar Usuarios y Crear Nuevos Roles
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Permite crear colaboradores, cambiar claves PIN y modificar esta matriz de permisos.
                      </span>
                    </div>
                  </label>

                  {/* Backup Data */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rolePermissions.backupData}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, backupData: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-700" />
                        Exportar e Importar Copias de Seguridad
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Descargar base de datos completa (.JSON / Excel) o restaurar respaldo.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleFormOpen(false)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {editingRoleId ? 'Guardar Rol & Permisos' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
