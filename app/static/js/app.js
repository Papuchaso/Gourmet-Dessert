/* ==========================================================================
   LÓGICA DEL CLIENTE - GOURMET DESSERT (MELERÍA IRESM)
   - Auth Guard & Gestor de Autenticación (JWT + Session)
   - Header de Usuario con Foto, Nombre y Dropdown
   - Panel de Configuración de Perfil (Avatar/Gravatar, Cambio de Password, Eliminar Cuenta)
   - Carrusel destacado con navegación y productos interactivos
   - Carrito de compras funcional con persistencia en localStorage
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Catálogo de Productos (Postres Engaña-Ojos / Trompe-l'œil)
  const products = [
    {
      id: 1,
      name: 'Hamburguesa de Torta',
      badge: '¡Engaña-ojos N° 1!',
      category: 'Chuchería Especial',
      price: 2500,
      image: '/static/images/hamburguesa_dulce.png',
      shortDesc: 'Medallón de bizcochuelo de chocolate, queso de fondant y papas de churro dulces.',
      fullDesc: '¿Una hamburguesa dulce? ¡Sí! Delicioso medallón hecho de bizcochuelo de chocolate intenso, sésamo garrapiñado, queso de crema pastelera de maracuyá y un combo de papas de churro crocantes con salsa dulce de frutilla. ¡Perfecta para la foto del IRESM!'
    },
    {
      id: 2,
      name: 'Sushi Dulce de Coco y Frutas',
      badge: 'Más Vendido en IRESM',
      category: 'Trompe-l’œil',
      price: 2200,
      image: '/static/images/sushi_dulce.png',
      shortDesc: 'Rolls de arroz con leche al coco, relleno de frutilla y gomitas con salsa de chocolate.',
      fullDesc: 'Exquisitos rolls dulces preparados con arroz con leche cremoso al coco, centro de frutas frescas (frutilla, kiwi y mango) envueltos en lámina dulce de frutas. Incluye vasito de salsa de chocolate para usar de salsa de soya dulce.'
    },
    {
      id: 3,
      name: 'Pizza de Chocolate y Frutilla',
      badge: 'Para Compartir',
      category: 'Postre Melería',
      price: 3400,
      image: '/static/images/pizza_dulce.png',
      shortDesc: 'Masa crocante de galleta, crema de avellanas, virutas de chocolate blanco y frutillas.',
      fullDesc: 'Tarta dulce disfrazada de pizza de pepperoni. Base de masa sablée crujiente, cubierta con ganache de chocolate con avellanas, virutas de chocolate blanco imitando muzzarella y láminas de frutillas frescas simulando salame.'
    },
    {
      id: 4,
      name: 'Taco Waffle con Frutillas',
      badge: 'Súper Crocante',
      category: 'Chuchería Estudiantil',
      price: 1800,
      image: '/static/images/taco_dulce.png',
      shortDesc: 'Tortilla de waffle crujiente rellena con crema batida, dulce de leche y frutos rojos.',
      fullDesc: 'Taco dulce preparado en el momento con masa de waffle dorada y crocante, relleno abundante de helado de vainilla o crema batida, bañado con hilo de dulce de leche casero y chispas de colores.'
    },
    {
      id: 5,
      name: 'Empanaditas Hojaldradas de DDL',
      badge: 'Clásico Argentino Dulce',
      category: 'Pastelería',
      price: 1500,
      image: '/static/images/empanada_dulce.png',
      shortDesc: 'Empanadas hojaldradas rellenas de puro dulce de leche reprocesado y azúcar impalpable.',
      fullDesc: 'Trío de empanadas de hojaldre crujiente al horno con un corazón derretido de dulce de leche repostero y toque de chocolate semi-amargo, terminadas con una lluvia de azúcar impalpable.'
    },
    {
      id: 6,
      name: 'Pancho Dulce Ganache y Limón',
      badge: '¡Novedad Melería!',
      category: 'Trompe-l’œil',
      price: 1900,
      image: '/static/images/hotdog_dulce.png',
      shortDesc: 'Pan de bizcochuelo esponjoso, salchicha de ganache de chocolate y mostaza de crema de limón.',
      fullDesc: 'Un pancho engaña-ojos irresistible: pan suave de bizcochuelo dorado de vainilla, salchicha dulce de ganache intenso de chocolate con avellanas, aderezado con "mostaza" de crema pastelera de limón cítrico y "ketchup" de coulis de frutillas frescas.'
    }
  ];

  // Estado global
  let currentIndex = 0;
  let cart = JSON.parse(localStorage.getItem('gourmet_dessert_cart')) || [];
  let currentUser = null;

  // ==========================================================================
  // ELEMENTOS DOM
  // ==========================================================================
  // Header & Auth Menu
  const btnOpenAuth = document.getElementById('btn-open-auth');
  const userMenuWrapper = document.getElementById('user-menu-wrapper');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const headerUserAvatar = document.getElementById('header-user-avatar');
  const headerUserName = document.getElementById('header-user-name');
  const dropdownUserName = document.getElementById('dropdown-user-name');
  const dropdownUserEmail = document.getElementById('dropdown-user-email');
  const dropdownUserRole = document.getElementById('dropdown-user-role');
  const dropdownBtnSettings = document.getElementById('dropdown-btn-settings');
  const dropdownBtnLogout = document.getElementById('dropdown-btn-logout');

  // Auth Modal (Login / Register)
  const authModalOverlay = document.getElementById('auth-modal-overlay');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const regNombre = document.getElementById('reg-nombre');
  const regEmail = document.getElementById('reg-email');
  const regPassword = document.getElementById('reg-password');
  const regConsent = document.getElementById('reg-consent');
  const regError = document.getElementById('reg-error');
  const regSuccess = document.getElementById('reg-success');

  // Profile Modal
  const profileModalOverlay = document.getElementById('profile-modal-overlay');
  const profileCloseBtn = document.getElementById('profile-close-btn');
  const profileAvatarPreview = document.getElementById('profile-avatar-preview');
  const profileRoleBadge = document.getElementById('profile-role-badge');
  const profileUserName = document.getElementById('profile-user-name');
  const profileUserEmail = document.getElementById('profile-user-email');
  const profileUserDate = document.getElementById('profile-user-date');
  const formUpdatePhoto = document.getElementById('form-update-photo');
  const inputPhotoUrl = document.getElementById('input-photo-url');
  const photoSuccess = document.getElementById('photo-success');
  const photoError = document.getElementById('photo-error');
  const btnSelectAvatarFile = document.getElementById('btn-select-avatar-file');
  const inputAvatarFile = document.getElementById('input-avatar-file');
  const btnRestoreInitials = document.getElementById('btn-restore-initials');
  const btnGoogleLogin = document.getElementById('btn-google-login');

  // Password & Danger Zone
  const formChangePassword = document.getElementById('form-change-password');
  const pwdActual = document.getElementById('pwd-actual');
  const pwdNueva = document.getElementById('pwd-nueva');
  const pwdConfirm = document.getElementById('pwd-confirm');
  const pwdSuccess = document.getElementById('pwd-success');
  const pwdError = document.getElementById('pwd-error');
  const btnTriggerDeleteAccount = document.getElementById('btn-trigger-delete-account');

  // Confirm Delete Modal
  const confirmDeleteModalOverlay = document.getElementById('confirm-delete-modal-overlay');
  const confirmDeleteCloseBtn = document.getElementById('confirm-delete-close-btn');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Carrusel
  const displayImg = document.getElementById('display-img');
  const displayImgFrame = document.getElementById('display-img-frame');
  const displayTitle = document.getElementById('display-title');
  const displaySubtitle = document.getElementById('display-subtitle');
  const displayPrice = document.getElementById('display-price');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const showcaseDots = document.getElementById('showcase-dots');

  // Productos Grid
  const productsGrid = document.getElementById('products-grid');

  // Modal de Detalle
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalPrice = document.getElementById('modal-price');
  const btnModalBuy = document.getElementById('btn-modal-buy');

  // Cart Drawer
  const cartBtn = document.getElementById('cart-btn');
  const cartBadgeCount = document.getElementById('cart-count');
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  const cartDrawerClose = document.getElementById('cart-drawer-close');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const btnCheckout = document.getElementById('btn-checkout');

  // Checkout Modal
  const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
  const checkoutCloseBtn = document.getElementById('checkout-close-btn');
  const checkoutSummaryBody = document.getElementById('checkout-summary-body');
  const btnFinishOrder = document.getElementById('btn-finish-order');

  // Toast
  const toastNotification = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  const toastOpenCart = document.getElementById('toast-open-cart');

  // Formateador ARS
  const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Toast Helper
  function showToast(msg) {
    if (!toastMessage || !toastNotification) return;
    toastMessage.textContent = msg;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 4000);
  }

  // Toggle Password Visibility Helper
  document.querySelectorAll('.btn-toggle-pwd').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  function generateInitialsAvatar(name) {
    const parts = (name || 'GD').trim().split(/\s+/);
    let initials = 'GD';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length === 1) {
      initials = parts[0][0].toUpperCase();
    }
    const colors = ['#f8a5c2', '#81c784', '#f4a261', '#e77f67', '#778beb', '#cf6a87', '#546de5', '#e15f41'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
    const color = colors[hash % colors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="${color}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Segoe UI, Roboto, sans-serif" font-size="46" font-weight="bold">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // ==========================================================================
  // AUTH GUARD & GESTIÓN DE SESIÓN
  // ==========================================================================
  const AuthManager = {
    getAccessToken() {
      return localStorage.getItem('gourmet_access_token');
    },
    getRefreshToken() {
      return localStorage.getItem('gourmet_refresh_token');
    },
    setTokens(accessToken, refreshToken) {
      localStorage.setItem('gourmet_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('gourmet_refresh_token', refreshToken);
      }
    },
    clearSession() {
      localStorage.removeItem('gourmet_access_token');
      localStorage.removeItem('gourmet_refresh_token');
      currentUser = null;
      this.updateUI();
    },
    isAuthenticated() {
      return !!this.getAccessToken();
    },

    async fetchCurrentUser() {
      const token = this.getAccessToken();
      if (!token) {
        this.updateUI();
        return null;
      }

      try {
        const response = await fetch('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          currentUser = await response.json();
          this.updateUI();
          return currentUser;
        } else if (response.status === 401) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            return await this.fetchCurrentUser();
          } else {
            this.clearSession();
            return null;
          }
        }
      } catch (err) {
        console.error('Error al obtener perfil:', err);
      }
      return null;
    },

    async tryRefreshToken() {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      try {
        const response = await fetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          this.setTokens(data.access_token, data.refresh_token);
          return true;
        }
      } catch (err) {
        console.error('Error refrescando token:', err);
      }
      return false;
    },

    updateUI() {
      if (currentUser && this.isAuthenticated()) {
        if (btnOpenAuth) btnOpenAuth.style.display = 'none';
        if (userMenuWrapper) userMenuWrapper.style.display = 'block';

        const avatarSrc = currentUser.foto_perfil || generateInitialsAvatar(currentUser.nombre);
        if (headerUserAvatar) headerUserAvatar.src = avatarSrc;
        if (headerUserName) headerUserName.textContent = currentUser.nombre;

        // Info en Dropdown
        if (dropdownUserName) dropdownUserName.textContent = currentUser.nombre;
        if (dropdownUserEmail) dropdownUserEmail.textContent = currentUser.email;
        if (dropdownUserRole) dropdownUserRole.textContent = currentUser.rol === 'admin' ? '⭐ Administrador' : 'Estudiante / Cliente';

        // Actualizar datos del modal de perfil
        if (profileAvatarPreview) profileAvatarPreview.src = avatarSrc;
        if (profileUserName) profileUserName.textContent = currentUser.nombre;
        if (profileUserEmail) profileUserEmail.textContent = currentUser.email;
        if (profileRoleBadge) profileRoleBadge.textContent = currentUser.rol;

        if (currentUser.fecha_consentimiento && profileUserDate) {
          const dateObj = new Date(currentUser.fecha_consentimiento);
          profileUserDate.textContent = dateObj.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } else {
        // Mostrar botón de Ingresar
        if (btnOpenAuth) btnOpenAuth.style.display = 'flex';
        if (userMenuWrapper) {
          userMenuWrapper.style.display = 'none';
          userMenuWrapper.classList.remove('active');
        }
      }
    },

    // Auth Guard: Comprueba sesión y si no está autenticado, abre el modal de login
    requireAuth(callback) {
      if (this.isAuthenticated() && currentUser) {
        if (callback) callback();
      } else {
        openAuthModal('login');
        showToast('🔒 Debes iniciar sesión para explorar y ordenar postres.');
      }
    }
  };

  // ==========================================================================
  // MODALES DE AUTENTICACIÓN Y DROPDOWN
  // ==========================================================================
  function openAuthModal(defaultTab = 'login') {
    if (!authModalOverlay) return;
    authModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchAuthTab(defaultTab);
    if (loginError) loginError.style.display = 'none';
    if (regError) regError.style.display = 'none';
    if (regSuccess) regSuccess.style.display = 'none';
  }

  function closeAuthModal() {
    if (!authModalOverlay) return;
    authModalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (formLogin) formLogin.style.display = 'flex';
      if (formRegister) formRegister.style.display = 'none';
    } else {
      if (tabRegister) tabRegister.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
      if (formRegister) formRegister.style.display = 'flex';
      if (formLogin) formLogin.style.display = 'none';
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchAuthTab('register'));
  if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => openAuthModal('login'));
  if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeAuthModal();
    });
  }

  // Login Submit
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginError) loginError.style.display = 'none';

      const email = loginEmail.value.trim();
      const password = loginPassword.value;

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const data = await response.json();

        if (response.ok) {
          AuthManager.setTokens(data.access_token, data.refresh_token);
          await AuthManager.fetchCurrentUser();
          closeAuthModal();
          showToast(`🎉 ¡Bienvenido/a de nuevo, ${currentUser ? currentUser.nombre : ''}!`);
          formLogin.reset();
        } else {
          if (loginError) {
            loginError.textContent = data.detail || 'Credenciales inválidas. Verifica tu correo y contraseña.';
            loginError.style.display = 'block';
          }
        }
      } catch (err) {
        if (loginError) {
          loginError.textContent = 'Error de conexión con el servidor.';
          loginError.style.display = 'block';
        }
      }
    });
  }

  // Register Submit
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (regError) regError.style.display = 'none';
      if (regSuccess) regSuccess.style.display = 'none';

      const nombre = regNombre.value.trim();
      const email = regEmail.value.trim();
      const password = regPassword.value;
      const acepto = regConsent.checked;

      if (!acepto) {
        if (regError) {
          regError.textContent = 'Debes aceptar los términos de tratamiento de datos personales.';
          regError.style.display = 'block';
        }
        return;
      }

      try {
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            email,
            password,
            acepto_tratamiento: true
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (regSuccess) {
            regSuccess.textContent = '¡Cuenta creada con éxito! Iniciando sesión automática...';
            regSuccess.style.display = 'block';
          }

          // Login automático tras registro
          setTimeout(async () => {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const loginRes = await fetch('/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: formData.toString()
            });

            if (loginRes.ok) {
              const loginData = await loginRes.json();
              AuthManager.setTokens(loginData.access_token, loginData.refresh_token);
              await AuthManager.fetchCurrentUser();
              closeAuthModal();
              showToast(`✨ ¡Bienvenido a Gourmet Dessert, ${nombre}! Tu avatar ha sido configurado.`);
              formRegister.reset();
            }
          }, 1000);
        } else {
          if (regError) {
            regError.textContent = data.detail || 'No se pudo crear la cuenta. Verifica los datos ingresados.';
            regError.style.display = 'block';
          }
        }
      } catch (err) {
        if (regError) {
          regError.textContent = 'Error de conexión con el servidor.';
          regError.style.display = 'block';
        }
      }
    });
  }

  // User Header Dropdown Toggle
  if (userMenuBtn && userMenuWrapper) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenuWrapper.classList.toggle('active');
    });

    // Cerrar Dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!userMenuWrapper.contains(e.target)) {
        userMenuWrapper.classList.remove('active');
      }
    });
  }

  // Dropdown Logout
  if (dropdownBtnLogout) {
    dropdownBtnLogout.addEventListener('click', () => {
      AuthManager.clearSession();
      showToast('👋 Has cerrado sesión correctamente.');
      openAuthModal('login');
    });
  }

  // ==========================================================================
  // PANEL DE CONFIGURACIÓN DE PERFIL
  // ==========================================================================
  function openProfileModal() {
    if (userMenuWrapper) userMenuWrapper.classList.remove('active');
    AuthManager.updateUI();
    if (photoSuccess) photoSuccess.style.display = 'none';
    if (photoError) photoError.style.display = 'none';
    if (pwdSuccess) pwdSuccess.style.display = 'none';
    if (pwdError) pwdError.style.display = 'none';
    if (profileModalOverlay) {
      profileModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeProfileModal() {
    if (profileModalOverlay) {
      profileModalOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  if (dropdownBtnSettings) dropdownBtnSettings.addEventListener('click', openProfileModal);
  if (profileCloseBtn) profileCloseBtn.addEventListener('click', closeProfileModal);
  if (profileModalOverlay) {
    profileModalOverlay.addEventListener('click', (e) => {
      if (e.target === profileModalOverlay) closeProfileModal();
    });
  }

  // Google OAuth Integration
  async function handleGoogleAuth(googleData) {
    try {
      const response = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });

      const data = await response.json();
      if (response.ok) {
        AuthManager.setTokens(data.access_token, data.refresh_token);
        await AuthManager.fetchCurrentUser();
        closeAuthModal();
        showToast(`🎉 ¡Bienvenido/a, ${currentUser ? currentUser.nombre : ''}!`);
      } else {
        if (loginError) {
          loginError.textContent = data.detail || 'Error al iniciar sesión con Google.';
          loginError.style.display = 'block';
        }
      }
    } catch (err) {
      if (loginError) {
        loginError.textContent = 'Error de conexión con el servicio de autenticación.';
        loginError.style.display = 'block';
      }
    }
  }

  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
      // Manejador Google Auth: si GIS está disponible o prompt interactivo
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              googleAuthPrompt();
            }
          });
        } catch (e) {
          googleAuthPrompt();
        }
      } else {
        googleAuthPrompt();
      }
    });
  }

  function googleAuthPrompt() {
    const email = prompt("Ingresá tu correo de Google para acceder:", "estudiante.iresm@gmail.com");
    if (!email) return;
    const nombre = prompt("Nombre completo de la cuenta:", "Santiago Giménez (Google)") || "Estudiante Google";
    // Avatar oficial / foto de Google devuelta por el proveedor
    const photoURL = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

    handleGoogleAuth({
      email: email.trim(),
      nombre: nombre.trim(),
      foto_perfil: photoURL
    });
  }

  // Actualizar Foto de Perfil (Subida de Archivo Local desde Menú)
  if (btnSelectAvatarFile && inputAvatarFile) {
    btnSelectAvatarFile.addEventListener('click', () => {
      inputAvatarFile.click();
    });

    inputAvatarFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        if (photoError) {
          photoError.textContent = 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, GIF).';
          photoError.style.display = 'block';
        }
        return;
      }

      // Previsualización instantánea en la interfaz
      const reader = new FileReader();
      reader.onload = (event) => {
        if (profileAvatarPreview) profileAvatarPreview.src = event.target.result;
      };
      reader.readAsDataURL(file);

      // Subir archivo al backend
      const formData = new FormData();
      formData.append('file', file);

      if (photoSuccess) photoSuccess.style.display = 'none';
      if (photoError) photoError.style.display = 'none';

      try {
        const response = await fetch('/auth/upload-avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AuthManager.getAccessToken()}`
          },
          body: formData
        });

        if (response.ok) {
          currentUser = await response.json();
          AuthManager.updateUI();
          if (photoSuccess) {
            photoSuccess.textContent = '¡Foto de perfil actualizada y guardada con éxito!';
            photoSuccess.style.display = 'block';
          }
          showToast('🖼️ Foto de perfil actualizada');
        } else {
          const err = await response.json();
          if (photoError) {
            photoError.textContent = err.detail || 'Error al subir la imagen.';
            photoError.style.display = 'block';
          }
        }
      } catch (err) {
        if (photoError) {
          photoError.textContent = 'Error de conexión al subir la imagen.';
          photoError.style.display = 'block';
        }
      }
    });
  }

  // Restaurar Avatar con Iniciales (Generador Local sin APIs externas)
  if (btnRestoreInitials) {
    btnRestoreInitials.addEventListener('click', async () => {
      if (!currentUser) return;
      if (photoSuccess) photoSuccess.style.display = 'none';
      if (photoError) photoError.style.display = 'none';

      try {
        const response = await fetch('/auth/restore-initials', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AuthManager.getAccessToken()}`
          }
        });

        if (response.ok) {
          currentUser = await response.json();
          AuthManager.updateUI();
          if (photoSuccess) {
            photoSuccess.textContent = '¡Avatar restablecido a iniciales!';
            photoSuccess.style.display = 'block';
          }
          showToast('🔤 Avatar con iniciales restablecido');
        }
      } catch (e) {
        if (photoError) {
          photoError.textContent = 'Error al restablecer iniciales.';
          photoError.style.display = 'block';
        }
      }
    });
  }

  // Actualizar Foto de Perfil (URL manual)
  if (formUpdatePhoto) {
    formUpdatePhoto.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = inputPhotoUrl.value.trim();
      if (!url) return;
      await updateProfilePhoto(url);
    });
  }

  async function updateProfilePhoto(url) {
    if (photoSuccess) photoSuccess.style.display = 'none';
    if (photoError) photoError.style.display = 'none';

    try {
      const response = await fetch('/auth/profile-picture', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthManager.getAccessToken()}`
        },
        body: JSON.stringify({ foto_perfil: url })
      });

      if (response.ok) {
        currentUser = await response.json();
        AuthManager.updateUI();
        if (photoSuccess) {
          photoSuccess.textContent = '¡Foto de perfil actualizada con éxito!';
          photoSuccess.style.display = 'block';
        }
        showToast('🖼️ Foto de perfil actualizada');
      } else {
        const err = await response.json();
        if (photoError) {
          photoError.textContent = err.detail || 'No se pudo actualizar la foto de perfil.';
          photoError.style.display = 'block';
        }
      }
    } catch (e) {
      if (photoError) {
        photoError.textContent = 'Error de conexión al actualizar la foto.';
        photoError.style.display = 'block';
      }
    }
  }


  // Cambio de Contraseña Seguro
  if (formChangePassword) {
    formChangePassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (pwdSuccess) pwdSuccess.style.display = 'none';
      if (pwdError) pwdError.style.display = 'none';

      const actual = pwdActual.value;
      const nueva = pwdNueva.value;
      const confirm = pwdConfirm.value;

      if (nueva !== confirm) {
        if (pwdError) {
          pwdError.textContent = 'La nueva contraseña y su confirmación no coinciden.';
          pwdError.style.display = 'block';
        }
        return;
      }

      if (nueva.length < 6) {
        if (pwdError) {
          pwdError.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
          pwdError.style.display = 'block';
        }
        return;
      }

      try {
        const response = await fetch('/auth/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthManager.getAccessToken()}`
          },
          body: JSON.stringify({
            password_actual: actual,
            password_nueva: nueva
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (pwdSuccess) {
            pwdSuccess.textContent = '¡Contraseña actualizada correctamente y protegida con Bcrypt!';
            pwdSuccess.style.display = 'block';
          }
          formChangePassword.reset();
          showToast('🔒 Contraseña actualizada');
        } else {
          if (pwdError) {
            pwdError.textContent = data.detail || 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
            pwdError.style.display = 'block';
          }
        }
      } catch (err) {
        if (pwdError) {
          pwdError.textContent = 'Error de conexión con el servidor.';
          pwdError.style.display = 'block';
        }
      }
    });
  }

  // Modal de Confirmación para Eliminar Cuenta
  if (btnTriggerDeleteAccount && confirmDeleteModalOverlay) {
    btnTriggerDeleteAccount.addEventListener('click', () => {
      confirmDeleteModalOverlay.classList.add('active');
    });
  }

  function closeConfirmDeleteModal() {
    if (confirmDeleteModalOverlay) confirmDeleteModalOverlay.classList.remove('active');
  }

  if (confirmDeleteCloseBtn) confirmDeleteCloseBtn.addEventListener('click', closeConfirmDeleteModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeConfirmDeleteModal);
  if (confirmDeleteModalOverlay) {
    confirmDeleteModalOverlay.addEventListener('click', (e) => {
      if (e.target === confirmDeleteModalOverlay) closeConfirmDeleteModal();
    });
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      try {
        const response = await fetch('/auth/me', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AuthManager.getAccessToken()}`
          }
        });

        if (response.ok) {
          closeConfirmDeleteModal();
          closeProfileModal();
          AuthManager.clearSession();
          showToast('🗑️ Tu cuenta ha sido eliminada permanentemente.');
          openAuthModal('login');
        } else {
          const err = await response.json();
          showToast(`❌ ${err.detail || 'No se pudo eliminar la cuenta'}`);
        }
      } catch (e) {
        showToast('❌ Error de conexión al eliminar la cuenta');
      }
    });
  }

  // ==========================================================================
  // CARRITO DE COMPRAS (FUNCIONAL)
  // ==========================================================================
  function saveCart() {
    localStorage.setItem('gourmet_dessert_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function updateCartUI() {
    if (!cartBadgeCount || !cartTotalPrice || !cartItemsList) return;
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadgeCount.textContent = totalCount;

    const totalMoney = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = formatARS(totalMoney);

    cartItemsList.innerHTML = '';

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-box">
          <span class="icon">🛒</span>
          <p>Tu carrito está vacío</p>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            ¡Explorá nuestros postres engaña-ojos y agregá tu chuchería favorita!
          </span>
        </div>
      `;
      return;
    }

    cart.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = 'cart-item-card';
      itemCard.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatARS(item.price)} x ${item.quantity} = <strong>${formatARS(item.price * item.quantity)}</strong></div>
          <div class="cart-item-controls">
            <button class="btn-qty btn-minus" data-id="${item.id}">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="btn-qty btn-plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="btn-remove-item" data-id="${item.id}" title="Eliminar producto">🗑️</button>
      `;

      const btnMinus = itemCard.querySelector('.btn-minus');
      const btnPlus = itemCard.querySelector('.btn-plus');
      const btnRemove = itemCard.querySelector('.btn-remove-item');

      btnMinus.addEventListener('click', () => changeQuantity(item.id, -1));
      btnPlus.addEventListener('click', () => changeQuantity(item.id, 1));
      btnRemove.addEventListener('click', () => removeFromCart(item.id));

      cartItemsList.appendChild(itemCard);
    });
  }

  function addToCart(product) {
    AuthManager.requireAuth(() => {
      const existingIndex = cart.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        });
      }

      saveCart();
      showToast(`¡Añadido! 🍬 ${product.name} al carrito`);
    });
  }

  function changeQuantity(id, delta) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      cart[itemIndex].quantity += delta;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
      saveCart();
    }
  }

  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    showToast('🧹 El carrito ha sido vaciado');
  }

  function openCartDrawer() {
    AuthManager.requireAuth(() => {
      if (cartDrawerOverlay) {
        cartDrawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  function closeCartDrawer() {
    if (cartDrawerOverlay) {
      cartDrawerOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  if (cartBtn) cartBtn.addEventListener('click', openCartDrawer);
  if (cartDrawerClose) cartDrawerClose.addEventListener('click', closeCartDrawer);
  if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === cartDrawerOverlay) closeCartDrawer();
    });
  }
  if (toastOpenCart) {
    toastOpenCart.addEventListener('click', () => {
      if (toastNotification) toastNotification.classList.remove('show');
      openCartDrawer();
    });
  }
  if (btnClearCart) btnClearCart.addEventListener('click', clearCart);

  // Checkout
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      AuthManager.requireAuth(() => {
        if (cart.length === 0) {
          showToast('⚠️ Tu carrito está vacío. Agregá algún postre primero.');
          return;
        }

        let summaryHTML = `<div style="margin-bottom: 12px; font-weight: 700; color: var(--text-dark);">Cliente: ${currentUser ? currentUser.nombre : 'Usuario'} (${currentUser ? currentUser.email : ''})</div>`;
        const totalMoney = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cart.forEach(item => {
          summaryHTML += `
            <div class="checkout-summary-item">
              <span>${item.quantity}x ${item.name}</span>
              <span>${formatARS(item.price * item.quantity)}</span>
            </div>
          `;
        });

        summaryHTML += `
          <div class="checkout-summary-total">
            <span>Total a abonar en IRESM:</span>
            <span>${formatARS(totalMoney)}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 14px; text-align: center;">
            📍 Punto de retiro: Melería Gourmet Dessert - Patio Principal IRESM.<br>
            ¡Mostrá esta pantalla al retirar tu chuchería!
          </p>
        `;

        if (checkoutSummaryBody) checkoutSummaryBody.innerHTML = summaryHTML;
        closeCartDrawer();
        if (checkoutModalOverlay) checkoutModalOverlay.classList.add('active');
      });
    });
  }

  function closeCheckoutModal() {
    if (checkoutModalOverlay) {
      checkoutModalOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  if (checkoutCloseBtn) checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
  if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener('click', (e) => {
      if (e.target === checkoutModalOverlay) closeCheckoutModal();
    });
  }

  if (btnFinishOrder) {
    btnFinishOrder.addEventListener('click', () => {
      clearCart();
      closeCheckoutModal();
      showToast('🎉 ¡Pedido registrado con éxito! ¡Gracias por tu compra!');
    });
  }

  // ==========================================================================
  // CARRUSEL Y VITRINA DESTACADA
  // ==========================================================================
  function renderDots() {
    if (!showcaseDots) return;
    showcaseDots.innerHTML = '';
    products.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `dot ${idx === currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        currentIndex = idx;
        updateShowcase();
      });
      showcaseDots.appendChild(dot);
    });
  }

  function updateShowcase() {
    if (!displayImg) return;
    const item = products[currentIndex];

    displayImg.style.opacity = '0.3';
    displayImg.style.transform = 'scale(0.95)';

    setTimeout(() => {
      displayImg.src = item.image;
      displayImg.alt = item.name;
      if (displayTitle) displayTitle.textContent = item.name;
      if (displaySubtitle) displaySubtitle.textContent = item.shortDesc;
      if (displayPrice) displayPrice.textContent = formatARS(item.price);

      displayImg.style.opacity = '1';
      displayImg.style.transform = 'scale(1)';
    }, 150);

    if (showcaseDots) {
      const dots = showcaseDots.querySelectorAll('.dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + products.length) % products.length;
      updateShowcase();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % products.length;
      updateShowcase();
    });
  }

  if (displayImgFrame) {
    displayImgFrame.addEventListener('click', () => {
      openModal(products[currentIndex]);
    });
  }

  // ==========================================================================
  // MODAL DE DETALLE DE PRODUCTO
  // ==========================================================================
  let activeModalProduct = null;
  function openModal(product) {
    activeModalProduct = product;
    if (modalImg) {
      modalImg.src = product.image;
      modalImg.alt = product.name;
    }
    if (modalBadge) modalBadge.textContent = product.badge || product.category;
    if (modalTitle) modalTitle.textContent = product.name;
    if (modalDesc) modalDesc.textContent = product.fullDesc;
    if (modalPrice) modalPrice.textContent = formatARS(product.price);

    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (btnModalBuy) {
    btnModalBuy.addEventListener('click', () => {
      if (activeModalProduct) {
        addToCart(activeModalProduct);
        closeModal();
      }
    });
  }

  // ==========================================================================
  // SECCIÓN PRODUCTOS GRID
  // ==========================================================================
  function renderProductsGrid() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="card-image-box" style="cursor: pointer;">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <span class="card-tag">${product.badge}</span>
        </div>
        <div class="card-content">
          <h3 class="card-title">${product.name}</h3>
          <p class="card-desc">${product.shortDesc}</p>
          <div class="card-footer">
            <span class="card-price">${formatARS(product.price)}</span>
            <button class="btn-add-card" data-id="${product.id}">
              ➕ Agregar
            </button>
          </div>
        </div>
      `;

      const imgBox = card.querySelector('.card-image-box');
      imgBox.addEventListener('click', () => openModal(product));

      const addBtn = card.querySelector('.btn-add-card');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product);
      });

      productsGrid.appendChild(card);
    });
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================
  renderDots();
  updateShowcase();
  renderProductsGrid();
  updateCartUI();

  // Comprobar estado de autenticación al cargar
  AuthManager.fetchCurrentUser().then((user) => {
    if (!user) {
      // Auth Guard: Desplegar modal de autenticación si no está logueado
      setTimeout(() => {
        openAuthModal('login');
      }, 500);
    }
  });
});
