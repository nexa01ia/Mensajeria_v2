import React, { useState, useEffect } from 'react';
import { Truck, LogOut, Download, Trash2, Users, Package, CheckCircle, Save, UserPlus, Edit2, X, Key, Shield, Lock, Calendar, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const MensajeriaHSSystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [salida, setSalida] = useState('');
  const [efectivas, setEfectivas] = useState('');
  const [devoluciones, setDevoluciones] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  const [registros, setRegistros] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // User management states
  const [usuarios, setUsuarios] = useState({});
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('mensajero');
  const [activeTab, setActiveTab] = useState('registro');
  
  // Estado para validación de contraseña
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });
  
  // Filtros básicos
  const [filtroID, setFiltroID] = useState('');
  const [filtroMensajero, setFiltroMensajero] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroSalida, setFiltroSalida] = useState('');
  const [filtroEfectivas, setFiltroEfectivas] = useState('');
  const [filtroDevoluciones, setFiltroDevoluciones] = useState('');
  
  // Filtros de fecha avanzados (desde/hasta)
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Permisos de consulta
  const [permisos, setPermisos] = useState({});

  // Medidas de seguridad
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);

  useEffect(() => {
    loadUsuarios();
    loadPermisos();
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    loadRegistros();
    checkLockout();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dev = parseInt(salida || 0) - parseInt(efectivas || 0);
    setDevoluciones(dev >= 0 ? dev : 0);
  }, [salida, efectivas]);

  // Evaluar fortaleza de contraseña
  useEffect(() => {
    evaluatePasswordStrength(newPassword);
  }, [newPassword]);

  const evaluatePasswordStrength = (pwd) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    let message = '';
    let color = '';
    
    if (pwd.length === 0) {
      message = '';
      color = '';
    } else if (score < 3) {
      message = 'Débil';
      color = 'text-red-600';
    } else if (score === 3) {
      message = 'Media';
      color = 'text-yellow-600';
    } else if (score === 4) {
      message = 'Buena';
      color = 'text-blue-600';
    } else {
      message = 'Excelente';
      color = 'text-green-600';
    }

    setPasswordStrength({
      score,
      message,
      color,
      requirements
    });
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'La contraseña debe contener al menos una mayúscula';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'La contraseña debe contener al menos una minúscula';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'La contraseña debe contener al menos un número';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'La contraseña debe contener al menos un carácter especial';
    }
    return null;
  };

  // Verificar si el sistema está bloqueado por intentos fallidos
  const checkLockout = () => {
    const lockoutData = localStorage.getItem('mensajeria_lockout');
    if (lockoutData) {
      const { time, attempts } = JSON.parse(lockoutData);
      const now = Date.now();
      const lockDuration = 15 * 60 * 1000; // 15 minutos
      
      if (now - time < lockDuration) {
        setIsLocked(true);
        setLockoutTime(time + lockDuration);
        setLoginAttempts(attempts);
      } else {
        localStorage.removeItem('mensajeria_lockout');
      }
    }
  };

  const loadPermisos = () => {
    const stored = localStorage.getItem('mensajeria_permisos');
    if (stored) {
      setPermisos(JSON.parse(stored));
    } else {
      setPermisos({});
    }
  };

  const savePermisos = (newPermisos) => {
    setPermisos(newPermisos);
    localStorage.setItem('mensajeria_permisos', JSON.stringify(newPermisos));
  };

  const loadUsuarios = () => {
    const stored = localStorage.getItem('mensajeria_usuarios');
    if (stored) {
      const users = JSON.parse(stored);
      // Asegurar que el usuario 'soporte' siempre exista con acceso total
      if (!users.soporte) {
        users.soporte = { password: 'Soporte2025!HS', role: 'soporte' };
      }
      setUsuarios(users);
    } else {
      // Usuarios por defecto con el nuevo usuario 'soporte'
      const defaultUsers = {
        admin: { password: 'Admin123!HS', role: 'admin' },
        soporte: { password: 'Soporte2025!HS', role: 'soporte' },
        mensajero: { password: 'Mensajero123!HS', role: 'mensajero' }
      };
      setUsuarios(defaultUsers);
      localStorage.setItem('mensajeria_usuarios', JSON.stringify(defaultUsers));
    }
  };

  const saveUsuarios = (users) => {
    // Proteger al usuario 'soporte' y 'admin' para que no puedan ser eliminados
    if (!users.soporte) {
      users.soporte = { password: 'Soporte2025!HS', role: 'soporte' };
    }
    if (!users.admin) {
      users.admin = { password: 'Admin123!HS', role: 'admin' };
    }
    setUsuarios(users);
    localStorage.setItem('mensajeria_usuarios', JSON.stringify(users));
  };

  const updateDateTime = () => {
    const now = new Date();
    const formatted = now.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setCurrentDateTime(formatted);
  };

  const loadRegistros = () => {
    const stored = localStorage.getItem('mensajeria_registros');
    if (stored) {
      setRegistros(JSON.parse(stored));
    }
  };

  const handleLogin = () => {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 60000);
      setLoginError(`Sistema bloqueado. Intente nuevamente en ${remainingTime} minuto(s).`);
      return;
    }

    // Validación de entrada para prevenir inyecciones
    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    if (!sanitizedUsername || !sanitizedPassword) {
      setLoginError('Por favor complete todos los campos');
      return;
    }

    if (usuarios[sanitizedUsername] && usuarios[sanitizedUsername].password === sanitizedPassword) {
      setIsLoggedIn(true);
      setUserRole(usuarios[sanitizedUsername].role);
      setLoginError('');
      setLoginAttempts(0);
      localStorage.removeItem('mensajeria_lockout');
      
      // Registrar el inicio de sesión (auditoría básica)
      const loginLog = {
        usuario: sanitizedUsername,
        fecha: currentDateTime,
        accion: 'LOGIN_EXITOSO'
      };
      const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
      logs.push(loginLog);
      localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100))); // Mantener últimos 100 registros
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        const lockTime = Date.now();
        setIsLocked(true);
        setLockoutTime(lockTime + 15 * 60 * 1000);
        localStorage.setItem('mensajeria_lockout', JSON.stringify({
          time: lockTime,
          attempts: newAttempts
        }));
        setLoginError('Demasiados intentos fallidos. Sistema bloqueado por 15 minutos.');
        
        // Registrar intento de bloqueo
        const loginLog = {
          usuario: sanitizedUsername,
          fecha: currentDateTime,
          accion: 'CUENTA_BLOQUEADA'
        };
        const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
        logs.push(loginLog);
        localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));
      } else {
        setLoginError(`Usuario o contraseña incorrectos. Intento ${newAttempts} de 5.`);
        
        // Registrar intento fallido
        const loginLog = {
          usuario: sanitizedUsername,
          fecha: currentDateTime,
          accion: 'LOGIN_FALLIDO'
        };
        const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
        logs.push(loginLog);
        localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setUsername('');
    setPassword('');
    setActiveTab('registro');
  };

  const handleSubmit = () => {
    if (!salida || !efectivas) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const registro = {
      id: Date.now(),
      mensajero: username,
      fecha: currentDateTime,
      salida: parseInt(salida),
      efectivas: parseInt(efectivas),
      devoluciones: parseInt(devoluciones)
    };

    const newRegistros = [...registros, registro];
    setRegistros(newRegistros);
    localStorage.setItem('mensajeria_registros', JSON.stringify(newRegistros));

    setSalida('');
    setEfectivas('');
    setDevoluciones(0);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteRegistro = (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      const newRegistros = registros.filter(r => r.id !== id);
      setRegistros(newRegistros);
      localStorage.setItem('mensajeria_registros', JSON.stringify(newRegistros));
    }
  };

  const handleExport = () => {
    const registrosFiltrados = getFilteredRegistros();
    
    const headers = ['ID', 'Mensajero', 'Fecha', 'Salida', 'Efectivas', 'Devoluciones'];
    const csvContent = [
      headers.join(','),
      ...registrosFiltrados.map(r => 
        `${r.id},${r.mensajero},${r.fecha},${r.salida},${r.efectivas},${r.devoluciones}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registros_mensajeria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const togglePermiso = (user) => {
    const newPermisos = { ...permisos };
    newPermisos[user] = !newPermisos[user];
    savePermisos(newPermisos);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    setNewRole('mensajero');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUsername(user);
    setNewPassword(usuarios[user].password);
    setNewRole(usuarios[user].role);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    // Validaciones
    if (!newUsername.trim()) {
      alert('El nombre de usuario es requerido');
      return;
    }

    if (!newPassword.trim()) {
      alert('La contraseña es requerida');
      return;
    }

    // Validar fortaleza de contraseña solo para usuarios nuevos o cambios de contraseña
    if (!editingUser || newPassword !== usuarios[editingUser]?.password) {
      const validationError = validatePassword(newPassword);
      if (validationError) {
        alert(validationError);
        return;
      }
    }

    const updatedUsers = { ...usuarios };
    const finalUsername = newUsername.trim().toLowerCase();

    // Si estamos editando y el nombre cambió, eliminar el antiguo
    if (editingUser && editingUser !== finalUsername) {
      // No permitir cambiar nombres de usuarios protegidos
      if (editingUser === 'admin' || editingUser === 'soporte') {
        alert('No se puede cambiar el nombre de usuarios protegidos');
        return;
      }
      delete updatedUsers[editingUser];
    }

    updatedUsers[finalUsername] = {
      password: newPassword.trim(),
      role: newRole
    };

    saveUsuarios(updatedUsers);
    setShowUserModal(false);
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    setNewRole('mensajero');
  };

  const handleDeleteUser = (user) => {
    // Proteger usuarios críticos
    if (user === 'admin' || user === 'soporte') {
      alert('No se puede eliminar este usuario protegido');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar el usuario "${user}"?`)) {
      const updatedUsers = { ...usuarios };
      delete updatedUsers[user];
      saveUsuarios(updatedUsers);
      
      // También eliminar sus permisos
      const newPermisos = { ...permisos };
      delete newPermisos[user];
      savePermisos(newPermisos);
    }
  };

  const getFilteredRegistros = () => {
    return registros.filter(registro => {
      // Filtro por ID (parcial)
      if (filtroID && !registro.id.toString().includes(filtroID)) return false;
      
      // Filtro por mensajero (parcial, case insensitive)
      if (filtroMensajero && !registro.mensajero.toLowerCase().includes(filtroMensajero.toLowerCase())) return false;
      
      // Filtro por fecha exacta
      if (filtroFecha && !registro.fecha.includes(filtroFecha)) return false;
      
      // Filtro por salida (exacto)
      if (filtroSalida && registro.salida.toString() !== filtroSalida) return false;
      
      // Filtro por efectivas (exacto)
      if (filtroEfectivas && registro.efectivas.toString() !== filtroEfectivas) return false;
      
      // Filtro por devoluciones (exacto)
      if (filtroDevoluciones && registro.devoluciones.toString() !== filtroDevoluciones) return false;

      // Filtro por rango de fechas
      if (fechaDesde || fechaHasta) {
        // Extraer solo la parte de fecha del registro (DD/MM/YYYY)
        const fechaRegistro = registro.fecha.split(',')[0].trim();
        const [dia, mes, anio] = fechaRegistro.split('/').map(Number);
        const fechaRegistroDate = new Date(anio, mes - 1, dia);

        if (fechaDesde) {
          const [anioDesde, mesDesde, diaDesde] = fechaDesde.split('-').map(Number);
          const fechaDesdeDate = new Date(anioDesde, mesDesde - 1, diaDesde);
          if (fechaRegistroDate < fechaDesdeDate) return false;
        }

        if (fechaHasta) {
          const [anioHasta, mesHasta, diaHasta] = fechaHasta.split('-').map(Number);
          const fechaHastaDate = new Date(anioHasta, mesHasta - 1, diaHasta);
          if (fechaRegistroDate > fechaHastaDate) return false;
        }
      }

      return true;
    });
  };

  const limpiarFiltros = () => {
    setFiltroID('');
    setFiltroMensajero('');
    setFiltroFecha('');
    setFiltroSalida('');
    setFiltroEfectivas('');
    setFiltroDevoluciones('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const registrosFiltrados = getFilteredRegistros();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10 transform transition-all duration-300 hover:scale-105">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo-mensajeria-hs.jpg" 
                alt="Mensajería HS Logo" 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-2xl shadow-lg"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-900 to-orange-500 bg-clip-text text-transparent mb-2">
              Mensajería HS
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Sistema de Control de Entregas</p>
          </div>

          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3 animate-pulse">
              <Lock className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Sistema bloqueado por seguridad</p>
                <p className="mt-1">Demasiados intentos fallidos. Intente nuevamente en unos minutos.</p>
              </div>
            </div>
          )}

          {loginError && !isLocked && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-red-800">{loginError}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition duration-200"
                placeholder="Ingrese su usuario"
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition duration-200"
                  placeholder="Ingrese su contraseña"
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  disabled={isLocked}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLocked}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-200 ${
                isLocked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-900 to-orange-500 hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              {isLocked ? 'Sistema Bloqueado' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Medidas de seguridad activas:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Bloqueo automático tras 5 intentos fallidos</li>
                  <li>Contraseñas con validación de complejidad</li>
                  <li>Registro de auditoría de accesos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-mensajeria-hs.jpg" 
                alt="Mensajería HS Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shadow-md"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Mensajería HS</h1>
                <p className="text-sm text-blue-100">Usuario: <span className="font-semibold">{username}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-blue-100">Fecha y Hora</p>
                <p className="text-base font-semibold">{currentDateTime}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition duration-200 shadow-md"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>
          
          {/* Mobile DateTime */}
          <div className="text-center sm:hidden mt-3 pt-3 border-t border-blue-700">
            <p className="text-xs text-blue-100">Fecha y Hora</p>
            <p className="text-sm font-semibold">{currentDateTime}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('registro')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap ${
                activeTab === 'registro'
                  ? 'text-orange-600 border-b-4 border-orange-600'
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <Package size={20} />
              <span className="text-sm sm:text-base">Registro</span>
            </button>

            {(userRole === 'admin' || userRole === 'soporte' || permisos[username]) && (
              <button
                onClick={() => setActiveTab('consultas')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'consultas'
                    ? 'text-orange-600 border-b-4 border-orange-600'
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                <CheckCircle size={20} />
                <span className="text-sm sm:text-base">Consultas</span>
              </button>
            )}

            {(userRole === 'admin' || userRole === 'soporte') && (
              <>
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'usuarios'
                      ? 'text-orange-600 border-b-4 border-orange-600'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <Users size={20} />
                  <span className="text-sm sm:text-base">Usuarios</span>
                </button>

                <button
                  onClick={() => setActiveTab('permisos')}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'permisos'
                      ? 'text-orange-600 border-b-4 border-orange-600'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <Shield size={20} />
                  <span className="text-sm sm:text-base">Permisos</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tab: Registro */}
        {activeTab === 'registro' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 sm:mb-8 flex items-center gap-3">
              <Package className="text-orange-500" />
              Registro de Entregas
            </h2>

            {showSuccess && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center gap-3 animate-bounce">
                <CheckCircle className="text-green-600" size={24} />
                <p className="text-green-800 font-semibold">¡Registro guardado exitosamente!</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paquetes de Salida *
                </label>
                <input
                  type="number"
                  value={salida}
                  onChange={(e) => setSalida(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                  placeholder="Cantidad"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Entregas Efectivas *
                </label>
                <input
                  type="number"
                  value={efectivas}
                  onChange={(e) => setEfectivas(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                  placeholder="Cantidad"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Devoluciones
                </label>
                <input
                  type="number"
                  value={devoluciones}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-900 to-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Save size={20} />
              Guardar Registro
            </button>
          </div>
        )}

        {/* Tab: Consultas */}
        {activeTab === 'consultas' && (userRole === 'admin' || userRole === 'soporte' || permisos[username]) && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 flex items-center gap-3">
                <CheckCircle className="text-orange-500" />
                Consultar Registros
              </h2>
              <button
                onClick={handleExport}
                className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Exportar a CSV
              </button>
            </div>

            {/* Filtros */}
            <div className="mb-6 p-4 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Filtros de Búsqueda
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Buscar por ID"
                  value={filtroID}
                  onChange={(e) => setFiltroID(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Buscar por Mensajero"
                  value={filtroMensajero}
                  onChange={(e) => setFiltroMensajero(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Buscar por Fecha"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Salida"
                  value={filtroSalida}
                  onChange={(e) => setFiltroSalida(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Efectivas"
                  value={filtroEfectivas}
                  onChange={(e) => setFiltroEfectivas(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Devoluciones"
                  value={filtroDevoluciones}
                  onChange={(e) => setFiltroDevoluciones(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={limpiarFiltros}
                className="w-full sm:w-auto bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Limpiar Filtros
              </button>
            </div>

            {/* Tabla de registros */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
                        <th className="p-3 text-left text-xs sm:text-sm whitespace-nowrap">ID</th>
                        <th className="p-3 text-left text-xs sm:text-sm whitespace-nowrap">Mensajero</th>
                        <th className="p-3 text-left text-xs sm:text-sm whitespace-nowrap">Fecha</th>
                        <th className="p-3 text-center text-xs sm:text-sm whitespace-nowrap">Salida</th>
                        <th className="p-3 text-center text-xs sm:text-sm whitespace-nowrap">Efectivas</th>
                        <th className="p-3 text-center text-xs sm:text-sm whitespace-nowrap">Devoluciones</th>
                        {(userRole === 'admin' || userRole === 'soporte') && (
                          <th className="p-3 text-center text-xs sm:text-sm whitespace-nowrap">Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {registrosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={userRole === 'admin' || userRole === 'soporte' ? 7 : 6} className="p-8 text-center text-gray-500">
                            <Package size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm sm:text-base">No hay registros que coincidan con los filtros</p>
                          </td>
                        </tr>
                      ) : (
                        registrosFiltrados.map((registro, idx) => (
                          <tr key={registro.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="p-3 border text-xs sm:text-sm">{registro.id}</td>
                            <td className="p-3 border font-semibold text-xs sm:text-sm">{registro.mensajero}</td>
                            <td className="p-3 border text-xs sm:text-sm">{registro.fecha}</td>
                            <td className="p-3 border text-center font-semibold text-blue-600 text-xs sm:text-sm">{registro.salida}</td>
                            <td className="p-3 border text-center font-semibold text-green-600 text-xs sm:text-sm">{registro.efectivas}</td>
                            <td className="p-3 border text-center font-semibold text-red-600 text-xs sm:text-sm">{registro.devoluciones}</td>
                            {(userRole === 'admin' || userRole === 'soporte') && (
                              <td className="p-3 border text-center">
                                <button
                                  onClick={() => handleDeleteRegistro(registro.id)}
                                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                                  title="Eliminar registro"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Total de registros mostrados:</strong> {registrosFiltrados.length} de {registros.length}
              </p>
            </div>
          </div>
        )}

        {/* Tab: Usuarios */}
        {activeTab === 'usuarios' && (userRole === 'admin' || userRole === 'soporte') && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 flex items-center gap-3">
                <Users className="text-orange-500" />
                Gestión de Usuarios
              </h2>
              <button
                onClick={handleAddUser}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-900 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                Nuevo Usuario
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
                        <th className="p-3 text-left text-xs sm:text-sm">Usuario</th>
                        <th className="p-3 text-left text-xs sm:text-sm">Contraseña</th>
                        <th className="p-3 text-left text-xs sm:text-sm">Rol</th>
                        <th className="p-3 text-center text-xs sm:text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(usuarios).map((user, idx) => (
                        <tr key={user} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-3 border font-semibold text-xs sm:text-sm">{user}</td>
                          <td className="p-3 border text-xs sm:text-sm">
                            {(user === 'soporte' && userRole !== 'soporte') ? (
                              <span className="text-gray-400">••••••••</span>
                            ) : (
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{usuarios[user].password}</code>
                            )}
                          </td>
                          <td className="p-3 border text-xs sm:text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              usuarios[user].role === 'soporte' 
                                ? 'bg-purple-100 text-purple-700' 
                                : usuarios[user].role === 'admin' 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {usuarios[user].role === 'soporte' ? '🛡️ Soporte' : usuarios[user].role === 'admin' ? '👨‍💼 Admin' : '📦 Mensajero'}
                            </span>
                          </td>
                          <td className="p-3 border text-center">
                            <div className="flex gap-2 justify-center flex-wrap">
                              <button
                                onClick={() => handleEditUser(user)}
                                disabled={user === 'soporte' && userRole !== 'soporte'}
                                className={`p-2 rounded-lg transition ${
                                  user === 'soporte' && userRole !== 'soporte'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                                title="Editar usuario"
                              >
                                <Edit2 size={16} />
                              </button>
                              {user !== 'admin' && user !== 'soporte' && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                ⚠️ <strong>Nota:</strong> Los usuarios 'admin' y 'soporte' están protegidos y no pueden ser eliminados. Solo el usuario 'soporte' puede modificar su propia contraseña.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Permisos */}
        {activeTab === 'permisos' && (userRole === 'admin' || userRole === 'soporte') && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 sm:mb-8 flex items-center gap-3">
              <Shield className="text-orange-500" />
              Control de Permisos de Consulta
            </h2>

            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Información:</strong> Los usuarios con rol 'mensajero' necesitan permiso explícito para acceder a la pestaña de "Consultas". Los usuarios 'admin' y 'soporte' tienen acceso total permanente.
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-900 to-purple-500 text-white">
                        <th className="p-3 text-left text-xs sm:text-sm">Usuario</th>
                        <th className="p-3 text-left text-xs sm:text-sm">Rol</th>
                        <th className="p-3 text-center text-xs sm:text-sm">Permiso de Consulta</th>
                        <th className="p-3 text-center text-xs sm:text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(usuarios).map((user, idx) => {
                        const esProtegido = user === 'admin' || user === 'soporte';
                        const tienePermiso = permisos[user] === true;
                        
                        return (
                          <tr key={user} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="p-3 border font-semibold text-xs sm:text-sm">{user}</td>
                            <td className="p-3 border">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                usuarios[user].role === 'soporte' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : usuarios[user].role === 'admin' 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {usuarios[user].role === 'soporte' ? '🛡️ Soporte' : usuarios[user].role === 'admin' ? '👨‍💼 Admin' : '📦 Mensajero'}
                              </span>
                            </td>
                            <td className="p-3 border text-center">
                              {esProtegido ? (
                                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-xs whitespace-nowrap">
                                  ✓ Acceso Total (Permanente)
                                </span>
                              ) : (
                                <span className={`px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap ${
                                  tienePermiso 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {tienePermiso ? '✓ Permitido' : '✗ Denegado'}
                                </span>
                              )}
                            </td>
                            <td className="p-3 border text-center">
                              {esProtegido ? (
                                <span className="text-gray-400 text-sm">N/A</span>
                              ) : (
                                <button
                                  onClick={() => togglePermiso(user)}
                                  className={`px-4 py-2 rounded-lg font-semibold transition text-xs sm:text-sm whitespace-nowrap ${
                                    tienePermiso
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : 'bg-green-500 text-white hover:bg-green-600'
                                  }`}
                                >
                                  {tienePermiso ? '🔒 Revocar Acceso' : '🔓 Conceder Acceso'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                ⚠️ <strong>Nota:</strong> Los cambios en los permisos se aplican inmediatamente. Los usuarios mensajeros solo podrán ver la pestaña de "Consultas" si tienen el permiso concedido.
              </p>
            </div>
          </div>
        )}

        {/* Modal de Usuario */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-blue-900 flex items-center gap-2">
                  <Key className="text-orange-500" />
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setShowNewPassword(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    placeholder="Nombre de usuario"
                    disabled={(editingUser === 'admin' || editingUser === 'soporte')}
                  />
                  {(editingUser === 'admin' || editingUser === 'soporte') && (
                    <p className="text-xs text-red-600 mt-1">🔒 Usuario protegido - No se puede cambiar el nombre</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña * (mínimo 8 caracteres con requisitos de seguridad)
                  </label>
                  {editingUser === 'soporte' && userRole !== 'soporte' ? (
                    <div className="w-full px-4 py-3 border-2 border-red-300 rounded-lg bg-red-50 flex items-center gap-2">
                      <Lock size={20} className="text-red-600" />
                      <span className="text-red-700 font-semibold">Contraseña Protegida</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                          placeholder={editingUser === 'soporte' ? 'Ingrese nueva contraseña' : 'Contraseña segura'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      
                      {/* Indicador de fortaleza de contraseña */}
                      {newPassword && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength.score < 3 ? 'bg-red-500' :
                                  passwordStrength.score === 3 ? 'bg-yellow-500' :
                                  passwordStrength.score === 4 ? 'bg-blue-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                              {passwordStrength.message}
                            </span>
                          </div>
                          
                          {/* Requisitos de contraseña */}
                          <div className="space-y-1 text-xs">
                            <div className={`flex items-center gap-2 ${passwordStrength.requirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                              {passwordStrength.requirements.length ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>Mínimo 8 caracteres</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                              {passwordStrength.requirements.uppercase ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>Al menos una mayúscula (A-Z)</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                              {passwordStrength.requirements.lowercase ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>Al menos una minúscula (a-z)</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordStrength.requirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                              {passwordStrength.requirements.number ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>Al menos un número (0-9)</span>
                            </div>
                            <div className={`flex items-center gap-2 ${passwordStrength.requirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                              {passwordStrength.requirements.special ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>Al menos un carácter especial (!@#$%...)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {editingUser === 'soporte' && userRole !== 'soporte' && (
                    <p className="text-xs text-red-600 mt-1">🔒 Solo el usuario soporte puede ver/modificar su contraseña</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    disabled={(editingUser === 'admin' || editingUser === 'soporte')}
                  >
                    <option value="mensajero">📦 Mensajero</option>
                    <option value="admin">👨‍💼 Administrador</option>
                    <option value="soporte">🛡️ Soporte (Acceso Total)</option>
                  </select>
                  {(editingUser === 'admin' || editingUser === 'soporte') && (
                    <p className="text-xs text-red-600 mt-1">🔒 Usuario protegido - No se puede cambiar el rol</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={handleSaveUser}
                    disabled={editingUser === 'soporte' && userRole !== 'soporte'}
                    className={`flex-1 py-3 rounded-lg font-semibold transition ${
                      editingUser === 'soporte' && userRole !== 'soporte'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-900 to-orange-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setShowNewPassword(false);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default MensajeriaHSSystem;