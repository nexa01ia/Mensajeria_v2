import React, { useState, useEffect } from 'react';
import { Truck, LogOut, Download, Trash2, Users, Package, CheckCircle, Save, UserPlus, Edit2, X, Key, Shield, Lock, Calendar } from 'lucide-react';

const MensajeriaHSSystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
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
      setLoginError(`Usuario o contraseña incorrectos (Intento ${newAttempts}/5)`);
      
      // Bloquear después de 5 intentos fallidos
      if (newAttempts >= 5) {
        const lockoutData = {
          time: Date.now(),
          attempts: newAttempts
        };
        localStorage.setItem('mensajeria_lockout', JSON.stringify(lockoutData));
        setIsLocked(true);
        setLockoutTime(lockoutData.time + 15 * 60 * 1000);
        setLoginError('Demasiados intentos fallidos. Sistema bloqueado por 15 minutos.');
      }
    }
  };

  const handleLogout = () => {
    // Registrar el cierre de sesión
    const logoutLog = {
      usuario: username,
      fecha: currentDateTime,
      accion: 'LOGOUT'
    };
    const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
    logs.push(logoutLog);
    localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));

    setIsLoggedIn(false);
    setUserRole('');
    setUsername('');
    setPassword('');
    resetForm();
    setActiveTab('registro');
  };

  const handleSubmit = () => {
    // El nombre del mensajero ahora es automáticamente el usuario logueado
    const nombreMensajero = username;

    if (!salida || !efectivas) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validación de datos numéricos
    const salidaNum = parseInt(salida);
    const efectivasNum = parseInt(efectivas);

    if (isNaN(salidaNum) || isNaN(efectivasNum) || salidaNum < 0 || efectivasNum < 0) {
      alert('Por favor ingrese valores numéricos válidos');
      return;
    }

    if (efectivasNum > salidaNum) {
      alert('Las entregas efectivas no pueden ser mayores que la salida');
      return;
    }

    const nuevoRegistro = {
      id: Date.now(),
      nombreMensajero,
      fecha: currentDateTime,
      salida: salidaNum,
      efectivas: efectivasNum,
      devoluciones,
      creadoPor: username,
      fechaCreacion: new Date().toISOString()
    };

    const nuevosRegistros = [...registros, nuevoRegistro];
    setRegistros(nuevosRegistros);
    localStorage.setItem('mensajeria_registros', JSON.stringify(nuevosRegistros));
    
    // Registrar la acción en el log de auditoría
    const auditLog = {
      usuario: username,
      fecha: currentDateTime,
      accion: 'CREAR_REGISTRO',
      detalles: `ID: ${nuevoRegistro.id}, Salida: ${salidaNum}, Efectivas: ${efectivasNum}`
    };
    const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
    logs.push(auditLog);
    localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    resetForm();
  };

  const resetForm = () => {
    setSalida('');
    setEfectivas('');
    setDevoluciones(0);
  };

  const exportToExcel = async () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros para exportar con los filtros aplicados');
      return;
    }

    // Crear HTML para Excel sin imágenes
    let htmlContent = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #1e3a8a; color: white; font-weight: bold; }
            .header { background-color: #f97316; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MENSAJERÍA HS - Reporte de Entregas</h1>
            <p>Generado el: ${new Date().toLocaleString('es-CO')}</p>
            <p>Exportado por: ${username}</p>
            ${fechaDesde || fechaHasta ? `<p>Período: ${fechaDesde || 'Inicio'} hasta ${fechaHasta || 'Fin'}</p>` : ''}
          </div>
          <br>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Mensajero</th>
                <th>Fecha</th>
                <th>Salida</th>
                <th>Efectivas</th>
                <th>Devoluciones</th>
              </tr>
            </thead>
            <tbody>
    `;

    registrosFiltrados.forEach(reg => {
      htmlContent += `
        <tr>
          <td>${reg.id}</td>
          <td>${reg.nombreMensajero}</td>
          <td>${reg.fecha}</td>
          <td>${reg.salida}</td>
          <td>${reg.efectivas}</td>
          <td>${reg.devoluciones}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MensajeriaHS_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Registrar la exportación
    const auditLog = {
      usuario: username,
      fecha: currentDateTime,
      accion: 'EXPORTAR_DATOS',
      detalles: `${registrosFiltrados.length} registros exportados`
    };
    const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
    logs.push(auditLog);
    localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));
  };

  const handleDeleteAll = () => {
    // Solo admin y soporte pueden eliminar todos los registros
    if (userRole !== 'admin' && userRole !== 'soporte') {
      alert('No tiene permisos para esta acción');
      return;
    }

    if (window.confirm('¿Está COMPLETAMENTE seguro de eliminar TODOS los registros? Esta acción NO se puede deshacer.')) {
      if (window.confirm('ÚLTIMA ADVERTENCIA: ¿Confirma la eliminación de TODOS los registros?')) {
        const auditLog = {
          usuario: username,
          fecha: currentDateTime,
          accion: 'ELIMINAR_TODOS_REGISTROS',
          detalles: `${registros.length} registros eliminados`
        };
        const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
        logs.push(auditLog);
        localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));

        setRegistros([]);
        localStorage.setItem('mensajeria_registros', JSON.stringify([]));
        alert('Todos los registros han sido eliminados');
      }
    }
  };

  const openUserModal = (user = null) => {
    // Solo admin y soporte pueden gestionar usuarios
    if (userRole !== 'admin' && userRole !== 'soporte') {
      alert('No tiene permisos para gestionar usuarios');
      return;
    }

    if (user) {
      setEditingUser(user);
      setNewUsername(user);
      // No mostrar la contraseña de soporte
      if (user === 'soporte') {
        setNewPassword('');
      } else {
        setNewPassword(usuarios[user].password);
      }
      setNewRole(usuarios[user].role);
    } else {
      setEditingUser(null);
      setNewUsername('');
      setNewPassword('');
      setNewRole('mensajero');
    }
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Por favor complete todos los campos');
      return;
    }

    // Validar contraseña segura
    if (newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const sanitizedUsername = newUsername.trim().toLowerCase();

    // Prevenir modificación de usuarios protegidos
    if ((editingUser === 'admin' || editingUser === 'soporte') && sanitizedUsername !== editingUser) {
      alert('No se puede cambiar el nombre de los usuarios protegidos (admin/soporte)');
      return;
    }

    // Prevenir que usuarios que no son soporte modifiquen la contraseña de soporte
    if (editingUser === 'soporte' && userRole !== 'soporte') {
      alert('Solo el usuario soporte puede modificar su propia contraseña');
      return;
    }

    const newUsers = { ...usuarios };

    if (editingUser && editingUser !== sanitizedUsername) {
      delete newUsers[editingUser];
    }

    newUsers[sanitizedUsername] = {
      password: newPassword.trim(),
      role: newRole
    };

    saveUsuarios(newUsers);

    // Registrar la acción
    const auditLog = {
      usuario: username,
      fecha: currentDateTime,
      accion: editingUser ? 'EDITAR_USUARIO' : 'CREAR_USUARIO',
      detalles: `Usuario: ${sanitizedUsername}, Rol: ${newRole}`
    };
    const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
    logs.push(auditLog);
    localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));

    setShowUserModal(false);
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    setNewRole('mensajero');
  };

  const handleDeleteUser = (user) => {
    // Solo admin y soporte pueden eliminar usuarios
    if (userRole !== 'admin' && userRole !== 'soporte') {
      alert('No tiene permisos para eliminar usuarios');
      return;
    }

    // Proteger usuarios críticos
    if (user === 'admin' || user === 'soporte') {
      alert('No se puede eliminar el usuario ' + user + ' (usuario protegido)');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar el usuario "${user}"?`)) {
      const newUsers = { ...usuarios };
      delete newUsers[user];
      
      // También eliminar permisos del usuario
      const newPermisos = { ...permisos };
      delete newPermisos[user];
      savePermisos(newPermisos);
      
      saveUsuarios(newUsers);

      // Registrar la eliminación
      const auditLog = {
        usuario: username,
        fecha: currentDateTime,
        accion: 'ELIMINAR_USUARIO',
        detalles: `Usuario eliminado: ${user}`
      };
      const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
      logs.push(auditLog);
      localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));
    }
  };

  const togglePermiso = (user) => {
    if (userRole !== 'soporte') {
      alert('Solo el usuario soporte puede gestionar permisos');
      return;
    }

    const newPermisos = { ...permisos };
    newPermisos[user] = !newPermisos[user];
    savePermisos(newPermisos);

    // Registrar cambio de permiso
    const auditLog = {
      usuario: username,
      fecha: currentDateTime,
      accion: 'CAMBIAR_PERMISO',
      detalles: `Usuario: ${user}, Permiso: ${newPermisos[user] ? 'Concedido' : 'Revocado'}`
    };
    const logs = JSON.parse(localStorage.getItem('mensajeria_audit_log') || '[]');
    logs.push(auditLog);
    localStorage.setItem('mensajeria_audit_log', JSON.stringify(logs.slice(-100)));
  };

  // Verificar si un usuario tiene permiso de consulta
  const tienePermisoConsulta = () => {
    // Admin y soporte siempre tienen permiso
    if (userRole === 'admin' || userRole === 'soporte') {
      return true;
    }
    // Mensajeros necesitan permiso explícito de soporte
    return permisos[username] === true;
  };

  // Convertir fecha del formato "DD/MM/YYYY, HH:MM:SS" a objeto Date
  const parseFechaRegistro = (fechaStr) => {
    if (!fechaStr) return null;
    try {
      const [fecha, hora] = fechaStr.split(', ');
      const [dia, mes, año] = fecha.split('/');
      return new Date(`${año}-${mes}-${dia}T${hora}`);
    } catch (e) {
      return null;
    }
  };

  // Filtrado de registros con todas las opciones
  const registrosFiltrados = registros.filter(reg => {
    const matchID = filtroID === '' || reg.id.toString().includes(filtroID);
    const matchMensajero = filtroMensajero === '' || reg.nombreMensajero.toLowerCase().includes(filtroMensajero.toLowerCase());
    const matchFecha = filtroFecha === '' || reg.fecha.includes(filtroFecha);
    const matchSalida = filtroSalida === '' || reg.salida.toString().includes(filtroSalida);
    const matchEfectivas = filtroEfectivas === '' || reg.efectivas.toString().includes(filtroEfectivas);
    const matchDevoluciones = filtroDevoluciones === '' || reg.devoluciones.toString().includes(filtroDevoluciones);
    
    // Filtro de fecha avanzado (desde/hasta)
    let matchFechaDesde = true;
    let matchFechaHasta = true;
    
    if (fechaDesde || fechaHasta) {
      const fechaRegistro = parseFechaRegistro(reg.fecha);
      if (fechaRegistro) {
        if (fechaDesde) {
          const desde = new Date(fechaDesde);
          desde.setHours(0, 0, 0, 0);
          matchFechaDesde = fechaRegistro >= desde;
        }
        if (fechaHasta) {
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          matchFechaHasta = fechaRegistro <= hasta;
        }
      }
    }
    
    return matchID && matchMensajero && matchFecha && matchSalida && matchEfectivas && matchDevoluciones && matchFechaDesde && matchFechaHasta;
  });

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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-900 to-orange-500 p-4 rounded-full">
                <Truck size={48} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">MENSAJERÍA HS</h1>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <Shield size={16} className="text-orange-500" />
              Sistema de Control de Entregas - Seguro
            </p>
          </div>

          {isLocked && (
            <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm font-semibold text-center">
                ⚠️ Sistema bloqueado por seguridad
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                placeholder="Ingrese su usuario"
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                placeholder="Ingrese su contraseña"
                disabled={isLocked}
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLocked}
              className={`w-full py-3 rounded-lg font-semibold text-white transition shadow-lg ${
                isLocked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-900 to-orange-500 hover:shadow-xl'
              }`}
            >
              {isLocked ? '🔒 Sistema Bloqueado' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sistema protegido con autenticación segura
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-blue-900 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Truck size={40} />
              <div>
                <h1 className="text-3xl font-bold">MENSAJERÍA HS</h1>
                <p className="text-blue-100">Sistema de Control de Entregas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">
                Bienvenido: <span className="font-bold">{username}</span>
                {userRole === 'soporte' && <span className="ml-2 bg-purple-600 px-2 py-1 rounded text-xs">🛡️ SOPORTE</span>}
                {userRole === 'admin' && <span className="ml-2 bg-yellow-600 px-2 py-1 rounded text-xs">👨‍💼 ADMIN</span>}
              </p>
              <p className="text-xs text-blue-100">{currentDateTime}</p>
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition text-sm"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {showSuccess && (
          <div className="mb-6 bg-green-100 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-600" size={24} />
            <span className="text-green-800 font-semibold">¡Registro guardado exitosamente!</span>
          </div>
        )}

        {/* Tabs de navegación */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex gap-4 p-4 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('registro')}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === 'registro'
                  ? 'text-orange-500 border-b-4 border-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="inline mr-2" size={20} />
              Registro de Entregas
            </button>
            
            {tienePermisoConsulta() && (
              <button
                onClick={() => setActiveTab('consultas')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'consultas'
                    ? 'text-orange-500 border-b-4 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Consultas
              </button>
            )}
            
            {(userRole === 'admin' || userRole === 'soporte') && (
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'usuarios'
                    ? 'text-orange-500 border-b-4 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="inline mr-2" size={20} />
                Usuarios
              </button>
            )}

            {userRole === 'soporte' && (
              <button
                onClick={() => setActiveTab('permisos')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'permisos'
                    ? 'text-orange-500 border-b-4 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Lock className="inline mr-2" size={20} />
                Permisos
              </button>
            )}
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {activeTab === 'registro' && (
            <>
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                <Package className="text-orange-500" />
                Registro de Entregas
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Mensajero *
                  </label>
                  <input
                    type="text"
                    value={username}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    disabled
                    title="El nombre se asigna automáticamente según el usuario logueado"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Este campo se rellena automáticamente con tu usuario
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Salida *
                    </label>
                    <input
                      type="number"
                      value={salida}
                      onChange={(e) => setSalida(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Efectivas *
                    </label>
                    <input
                      type="number"
                      value={efectivas}
                      onChange={(e) => setEfectivas(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                      placeholder="0"
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
                  className="w-full bg-gradient-to-r from-blue-900 to-orange-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Guardar Registro
                </button>
              </div>
            </>
          )}

          {activeTab === 'consultas' && tienePermisoConsulta() && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                  📋 Consultas de Registros
                </h2>
                {(userRole === 'admin' || userRole === 'soporte') && (
                  <div className="flex gap-4">
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      <Download size={20} />
                      Exportar a Excel
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                      <Trash2 size={20} />
                      Eliminar Todo
                    </button>
                  </div>
                )}
              </div>

              {/* Filtros avanzados de fecha para admin y soporte */}
              {(userRole === 'admin' || userRole === 'soporte') && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="text-blue-600" size={20} />
                    <h3 className="font-bold text-blue-900">Filtro por Rango de Fechas</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Desde
                      </label>
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={limpiarFiltros}
                        className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition font-semibold"
                      >
                        <X className="inline mr-2" size={16} />
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
                      <th className="p-3 text-left">
                        <div>ID</div>
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filtroID}
                          onChange={(e) => setFiltroID(e.target.value)}
                          className="mt-2 px-2 py-1 text-sm text-black rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="p-3 text-left">
                        <div>Mensajero</div>
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filtroMensajero}
                          onChange={(e) => setFiltroMensajero(e.target.value)}
                          className="mt-2 px-2 py-1 text-sm text-black rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="p-3 text-left">
                        <div>Fecha</div>
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filtroFecha}
                          onChange={(e) => setFiltroFecha(e.target.value)}
                          className="mt-2 px-2 py-1 text-sm text-black rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="p-3 text-center">
                        <div>Salida</div>
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filtroSalida}
                          onChange={(e) => setFiltroSalida(e.target.value)}
                          className="mt-2 px-2 py-1 text-sm text-black rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="p-3 text-center">
                        <div>Efectivas</div>
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filtroEfectivas}
                          onChange={(e) => setFiltroEfectivas(e.target.value)}
                          className="mt-2 px-2 py-1 text-sm text-black rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="p-3 text-center">
                        <div>Devoluciones</div>
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filtroDevoluciones}
                          onChange={(e) => setFiltroDevoluciones(e.target.value)}
                          className="mt-2 px-2 py-1 text-sm text-black rounded w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((reg, idx) => (
                      <tr key={reg.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="p-3 border">{reg.id}</td>
                        <td className="p-3 border font-semibold">{reg.nombreMensajero}</td>
                        <td className="p-3 border">{reg.fecha}</td>
                        <td className="p-3 border text-center">{reg.salida}</td>
                        <td className="p-3 border text-center text-green-600 font-bold">{reg.efectivas}</td>
                        <td className="p-3 border text-center text-red-600 font-bold">{reg.devoluciones}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {registrosFiltrados.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {registros.length === 0 ? 'No hay registros disponibles' : 'No se encontraron registros con los filtros aplicados'}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'usuarios' && (userRole === 'admin' || userRole === 'soporte') && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => openUserModal()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <UserPlus size={20} />
                  Agregar Usuario
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
                      <th className="p-3 text-left">Usuario</th>
                      <th className="p-3 text-left">Contraseña</th>
                      <th className="p-3 text-left">Rol</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(usuarios).map((user, idx) => (
                      <tr key={user} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="p-3 border font-semibold">
                          {user}
                          {(user === 'admin' || user === 'soporte') && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔒 Protegido</span>
                          )}
                        </td>
                        <td className="p-3 border">
                          {user === 'soporte' && userRole !== 'soporte' ? (
                            <span className="text-gray-400 flex items-center gap-2">
                              <Lock size={16} />
                              Protegida
                            </span>
                          ) : (
                            '•'.repeat(usuarios[user].password.length)
                          )}
                        </td>
                        <td className="p-3 border">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
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
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openUserModal(user)}
                              className={`p-2 rounded transition ${
                                user === 'soporte' && userRole !== 'soporte'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
                              }`}
                              title={user === 'soporte' && userRole !== 'soporte' ? 'Solo soporte puede editar' : 'Editar'}
                              disabled={user === 'soporte' && userRole !== 'soporte'}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className={`p-2 rounded transition ${
                                user === 'admin' || user === 'soporte'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                              title={user === 'admin' || user === 'soporte' ? 'Usuario protegido' : 'Eliminar'}
                              disabled={user === 'admin' || user === 'soporte'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'permisos' && userRole === 'soporte' && (
            <>
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                <Lock className="text-purple-500" />
                Gestión de Permisos de Consulta
              </h2>

              <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <p className="text-sm text-purple-900">
                  <Shield className="inline mr-2" size={16} />
                  Desde aquí puedes otorgar o revocar permisos de consulta a los usuarios mensajeros. Los usuarios Admin y Soporte siempre tienen acceso completo.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-900 to-purple-500 text-white">
                      <th className="p-3 text-left">Usuario</th>
                      <th className="p-3 text-left">Rol</th>
                      <th className="p-3 text-center">Permiso de Consulta</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(usuarios).map((user, idx) => {
                      const esProtegido = user === 'admin' || user === 'soporte';
                      const tienePermiso = permisos[user] === true;
                      
                      return (
                        <tr key={user} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-3 border font-semibold">{user}</td>
                          <td className="p-3 border">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
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
                              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                                ✓ Acceso Total (Permanente)
                              </span>
                            ) : (
                              <span className={`px-4 py-2 rounded-full font-semibold ${
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
                                className={`px-4 py-2 rounded-lg font-semibold transition ${
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

              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  ⚠️ <strong>Nota:</strong> Los cambios en los permisos se aplican inmediatamente. Los usuarios mensajeros solo podrán ver la pestaña de "Consultas" si tienen el permiso concedido.
                </p>
              </div>
            </>
          )}
        </div>

        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                  <Key className="text-orange-500" />
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
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
                    Contraseña * (mínimo 8 caracteres)
                  </label>
                  {editingUser === 'soporte' && userRole !== 'soporte' ? (
                    <div className="w-full px-4 py-3 border-2 border-red-300 rounded-lg bg-red-50 flex items-center gap-2">
                      <Lock size={20} className="text-red-600" />
                      <span className="text-red-700 font-semibold">Contraseña Protegida</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                      placeholder={editingUser === 'soporte' ? 'Ingrese nueva contraseña' : 'Contraseña segura'}
                    />
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

                <div className="flex gap-3 mt-6">
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
                    onClick={() => setShowUserModal(false)}
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
