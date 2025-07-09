// ===== VARIABLES GLOBALES =====
let carritoCompras = []; // Carrito de compras inicializado vacío

// ===== CONFIGURACIÓN EMAILJS =====
const CONFIGURACION_EMAILJS = {
  serviceID: 'service_9x068xa',
  templateID: 'template_5nu5qr7',
  publicKey: 'E6oF3-Hyj5trqa7rL',
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function () {
  console.log('Iniciando aplicación...');
  inicializarAplicacion();
});
// inicializarAplicacion es la función principal que se llama al cargar el DOM
function inicializarAplicacion() {
  cargarCarritoDesdeStorage();
  inicializarFormularioContacto();
  inicializarCarritoCompras();
  configurarEventListeners();
  console.log('Aplicación inicializada correctamente');
}

// ===== GESTIÓN DE CARRITO EN STORAGE =====
function cargarCarritoDesdeStorage() {
  try {
    const carritoGuardado = localStorage.getItem('carritoCompras');
    if (carritoGuardado) {
      carritoCompras = JSON.parse(carritoGuardado);
      console.log('Carrito cargado desde storage:', carritoCompras);
    } else {
      carritoCompras = [];
      console.log('No hay carrito guardado, iniciando vacío');
    }
  } catch (error) {
    console.error('Error al cargar carrito desde storage:', error);
    carritoCompras = []; // Reiniciar carrito en caso de error
  }
}

function guardarCarritoEnStorage() {
  try {
    localStorage.setItem('carritoCompras', JSON.stringify(carritoCompras)); // Guardar el carrito en formato JSON
    console.log('Carrito guardado en storage:', carritoCompras);
  } catch (error) {
    // catch para manejar errores al guardar
    console.error('Error al guardar carrito en storage:', error);
  }
}

// ===== CARRITO DE COMPRAS =====
function inicializarCarritoCompras() {
  configurarEventListenersCarrito();
  actualizarContadorCarrito();
  mostrarCarrito();
}

// Configura los botones y eventos del carrito
function configurarEventListenersCarrito() {
  const btnAbrirCarrito = document.querySelector('#menu-carrito-btn');
  const btnCerrarCarrito = document.querySelector('.btn-cerrar-carrito');
  const carritoOverlay = document.querySelector('.carrito-overlay');
  const btnVaciarCarrito = document.querySelector('.btn-vaciar');

  if (btnAbrirCarrito) {
    btnAbrirCarrito.addEventListener('click', abrirCarrito);
  }
  if (btnCerrarCarrito) {
    btnCerrarCarrito.addEventListener('click', cerrarCarrito);
  }
  if (carritoOverlay) {
    carritoOverlay.addEventListener('click', cerrarCarrito);
  }
  if (btnVaciarCarrito) {
    btnVaciarCarrito.addEventListener('click', vaciarCarrito);
  }
}

// ERROR : chequear que muestra precios en 0 => Solucionado
function extraerDatosProducto(elemento) {
  const imagen = elemento.querySelector('.producto-imagen img');
  const nombre = elemento.querySelector('h3');
  // Primero buscar precio actual (productos con descuento)
  /* const precioElement = elemento.querySelector('.precio-actual');   // genera error  */
  let precioElement = elemento.querySelector('.precio-actual');

  // Si no existe, buscar el precio normal (productos sin descuento)
  if (!precioElement) {
    precioElement = elemento.querySelector('.producto-precio');
  }

  let precioTexto = precioElement ? precioElement.textContent : '0'; // Obtener el texto del precio
  let precio = parseInt(precioTexto.replace(/[^\d]/g, '')) || 0; // Extraer solo los números del precio

  return {
    // Date.now(): devuelve la fecha y hora actuales en milisegundos / math.random(): genera un número aleatorio entre 0 y 1
    id: Date.now() + Math.random(), // ID único temporal
    nombre: nombre ? nombre.textContent.trim() : 'Producto',
    precio: precio,
    imagen: imagen ? imagen.src : 'img/default.jpg',
    cantidad: 1,
  };
}

function añadirProductoAlCarrito(boton) {
  const productoElement = boton.closest('.producto-item'); // Buscar el elemento del producto más cercano al botón clickeado
  if (!productoElement) {
    console.error('No se encontró el elemento del producto');
    return;
  }

  const datosProducto = extraerDatosProducto(productoElement);
  console.log('Datos del producto extraídos:', datosProducto);

  // Verificar si ya existe en el carrito (por nombre)
  const productoEnCarrito = carritoCompras.find(
    (item) => item.nombre === datosProducto.nombre
  );
  // Si el producto ya está en el carrito, aumentar la cantidad
  // Si no, añadirlo como un nuevo producto
  if (productoEnCarrito) {
    productoEnCarrito.cantidad += 1;
    console.log('Cantidad aumentada para:', datosProducto.nombre);
  } else {
    carritoCompras.push(datosProducto);
    console.log('Nuevo producto añadido:', datosProducto.nombre);
  }

  guardarCarritoEnStorage();
  actualizarContadorCarrito();
  mostrarCarrito();
  mostrarNotificacion(`${datosProducto.nombre} añadido al carrito`, 'success');

  // Abrir carrito automáticamente
  setTimeout(() => {
    abrirCarrito();
  }, 500);
}

function eliminarProductoDelCarrito(idProducto) {
  const productoAntes = carritoCompras.find((item) => item.id === idProducto); // Buscar el producto antes de eliminarlo y lo almacena en una variable
  carritoCompras = carritoCompras.filter((item) => item.id !== idProducto); // Filtrar el carrito para eliminar el producto con el ID especificado
  guardarCarritoEnStorage();
  actualizarContadorCarrito();
  mostrarCarrito();
  if (productoAntes) {
    // Si el producto existía antes de eliminarlo, mostrar notificación
    mostrarNotificacion(
      `${productoAntes.nombre} eliminado del carrito`,
      'success'
    );
  }
}

function cambiarCantidadProducto(idProducto, nuevaCantidad) {
  const productoEnCarrito = carritoCompras.find(
    (item) => item.id === idProducto
  );
  if (!productoEnCarrito) return;

  if (nuevaCantidad <= 0) {
    eliminarProductoDelCarrito(idProducto);
    return;
  }

  productoEnCarrito.cantidad = nuevaCantidad;
  guardarCarritoEnStorage();
  actualizarContadorCarrito();
  mostrarCarrito();
}

function vaciarCarrito() {
  if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
    carritoCompras = [];
    guardarCarritoEnStorage();
    actualizarContadorCarrito();
    mostrarCarrito();
    mostrarNotificacion('Carrito vaciado', 'success');
  }
}

function abrirCarrito() {
  const carritoSidebar = document.querySelector('.carrito-sidebar');
  const carritoOverlay = document.querySelector('.carrito-overlay');

  if (carritoSidebar) {
    carritoSidebar.classList.add('active');
  }
  if (carritoOverlay) {
    carritoOverlay.classList.add('active');
  }
  document.body.style.overflow = 'hidden';
  mostrarCarrito();
}

function cerrarCarrito() {
  const carritoSidebar = document.querySelector('.carrito-sidebar');
  const carritoOverlay = document.querySelector('.carrito-overlay');

  if (carritoSidebar) {
    carritoSidebar.classList.remove('active');
  }
  if (carritoOverlay) {
    carritoOverlay.classList.remove('active');
  }
  document.body.style.overflow = '';
}

function mostrarCarrito() {
  const carritoConProductos = document.querySelector('#carrito-con-productos');
  const carritoVacio = document.querySelector('#carrito-vacio');

  if (!carritoConProductos || !carritoVacio) {
    console.error('Elementos del carrito no encontrados');
    return;
  }

  if (carritoCompras.length === 0) {
    carritoConProductos.style.display = 'none';
    carritoVacio.style.display = 'block';
  } else {
    carritoVacio.style.display = 'none';
    carritoConProductos.style.display = 'block';
    carritoConProductos.innerHTML = generarHTMLCarrito();
  }

  actualizarResumenCarrito();
}

function generarHTMLCarrito() {
  const itemsHTML = carritoCompras
    .map(
      (item) => `
    <div class="carrito-item" data-item-id="${item.id}">
      <div class="item-imagen">
        <img src="${item.imagen}" alt="${
        item.nombre
      }" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
      </div>
      <div class="item-info">
        <div class="item-nombre" style="font-weight: 500; font-size: 0.9rem; margin-bottom: 5px;">${
          item.nombre
        }</div>
        <div class="item-precio" style="color: #27ae60; font-weight: 600;">$${formatearPrecio(
          item.precio
        )}</div>
        <div class="item-controles" style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
          <button class="btn-cantidad" onclick="cambiarCantidadProducto(${
            item.id
          }, ${
        item.cantidad - 1
      })" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <i class="fas fa-minus" style="font-size: 0.8rem;"></i>
          </button>
          <span class="item-cantidad" style="font-weight: 600; min-width: 20px; text-align: center;">${
            item.cantidad
          }</span>
          <button class="btn-cantidad" onclick="cambiarCantidadProducto(${
            item.id
          }, ${
        item.cantidad + 1
      })" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <i class="fas fa-plus" style="font-size: 0.8rem;"></i>
          </button>
          <button class="btn-eliminar" onclick="eliminarProductoDelCarrito(${
            item.id
          })" title="Eliminar producto" style="background: #dc3545; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 10px;">
            <i class="fas fa-trash" style="font-size: 0.8rem;"></i>
          </button>
        </div>
        <div class="item-subtotal" style="font-size: 0.85rem; color: #666; margin-top: 8px;">
          Subtotal: $${formatearPrecio(item.precio * item.cantidad)}
        </div>
      </div>
    </div>
    <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
  `
    )
    .join('');

  return itemsHTML;
}

function actualizarContadorCarrito() {
  const contadorCarrito = document.querySelector('.contador-carrito');
  const totalItems = carritoCompras.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  if (contadorCarrito) {
    contadorCarrito.textContent = totalItems;
    contadorCarrito.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

function actualizarResumenCarrito() {
  const subtotal = carritoCompras.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );
  const total = subtotal;

  const subtotalElement = document.querySelector('#subtotal-resumen');
  const totalElement = document.querySelector('#total-resumen');

  if (subtotalElement) {
    subtotalElement.textContent = `$${formatearPrecio(subtotal)}`;
  }
  if (totalElement) {
    totalElement.textContent = `$${formatearPrecio(total)}`;
  }
}

// ===== FORMULARIO DE CONTACTO =====
function inicializarFormularioContacto() {
  const formularioContacto = document.getElementById('formulario-contacto');
  if (!formularioContacto) {
    console.log('Formulario de contacto no encontrado');
    return;
  }

  // Inicializar EmailJS
  if (typeof emailjs !== 'undefined') {
    emailjs.init(CONFIGURACION_EMAILJS.publicKey);
    console.log('EmailJS inicializado correctamente');
  } else {
    console.error('EmailJS no está cargado');
  }

  formularioContacto.addEventListener('submit', procesarFormularioContacto);
  formularioContacto.addEventListener('input', validarCampoEnTiempoReal);
}
// función asíncrona que maneja la validación, envío y notificaciones
async function procesarFormularioContacto(e) {
  e.preventDefault();
  console.log('Procesando formulario de contacto...');

  const datosFormulario = new FormData(e.target); // e.target hace referencia al formulario que disparó el evento submit
  const datosContacto = {
    nombre: datosFormulario.get('nombre')?.trim(),
    email: datosFormulario.get('email')?.trim(),
    telefono: datosFormulario.get('telefono')?.trim() || '',
    asunto: datosFormulario.get('asunto'),
    mensaje: datosFormulario.get('mensaje')?.trim(),
    politicaAceptada: datosFormulario.get('politica') === 'on',
    newsletter: datosFormulario.get('newsletter') === 'on',
    fechaEnvio: new Date().toLocaleString('es-AR'), // Fecha y hora actual en formato local
  };

  console.log('Datos del formulario:', datosContacto); // Mostrar los datos del formulario en la consola para depuración

  if (!validarDatosContacto(datosContacto)) {
    mostrarNotificacion(
      'Por favor, completa todos los campos correctamente',
      'error'
    );
    return;
  }

  mostrarEstadoCarga(true); // Mostrar estado de carga mientras se envía el email

  try {
    await enviarEmailContacto(datosContacto); // await sirve para esperar a que se complete la promesa de envío del email
    e.target.reset(); // Reiniciar el formulario después de enviar
    limpiarErroresFormulario();
    mostrarNotificacion(
      '¡Mensaje enviado correctamente! Te responderemos pronto.',
      'success'
    );
    console.log('Email enviado exitosamente');
  } catch (error) {
    console.error('Error al enviar:', error);
    mostrarNotificacion(
      'Error al enviar el mensaje. Inténtalo nuevamente.',
      'error'
    );
  } finally {
    // Finalmente se oculta el estado de carga
    mostrarEstadoCarga(false);
  }
}
// ===== VALIDACIÓN DE DATOS DEL FORMULARIO =====
function validarDatosContacto(datos) {
  let esValido = true;

  if (!datos.nombre || datos.nombre.length < 2) {
    mostrarErrorCampo('nombre', 'El nombre debe tener al menos 2 caracteres');
    esValido = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(datos.email)) {
    // emailRegex.test() verifica si el email cumple con el formato correcto
    mostrarErrorCampo('email', 'Ingresa un email válido');
    esValido = false;
  }

  if (!datos.asunto) {
    mostrarErrorCampo('asunto', 'Selecciona un asunto');
    esValido = false;
  }

  if (!datos.mensaje || datos.mensaje.length < 10) {
    mostrarErrorCampo(
      'mensaje',
      'El mensaje debe tener al menos 10 caracteres'
    );
    esValido = false;
  }

  if (!datos.politicaAceptada) {
    mostrarErrorCampo('politica', 'Debes aceptar la política de privacidad');
    esValido = false;
  }

  return esValido;
}

function validarCampoEnTiempoReal(e) {
  const campo = e.target;
  const valor = campo.value?.trim();

  limpiarErrorCampo(campo.name);

  switch (campo.name) {
    case 'nombre':
      if (valor && valor.length < 2) {
        mostrarErrorCampo(
          'nombre',
          'El nombre debe tener al menos 2 caracteres'
        );
      }
      break;
    case 'email':
      if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        mostrarErrorCampo('email', 'Ingresa un email válido');
      }
      break;
    case 'mensaje':
      if (valor && valor.length < 10) {
        mostrarErrorCampo(
          'mensaje',
          'El mensaje debe tener al menos 10 caracteres'
        );
      }
      break;
  }
}
// envia email de contacto usando EmailJS
async function enviarEmailContacto(datos) {
  if (typeof emailjs === 'undefined') {
    // Verificar si EmailJS está disponible
    throw new Error('EmailJS no está disponible');
  }

  const parametrosTemplate = {
    // Parámetros que se envían al template de EmailJS
    from_name: datos.nombre,
    from_email: datos.email,
    phone: datos.telefono || 'No proporcionado',
    subject: datos.asunto,
    message: datos.mensaje,
    to_email: 'tu-email@empresa.com',
    newsletter: datos.newsletter ? 'Sí' : 'No',
    date: datos.fechaEnvio,
  };
  // respuesta es una promesa que se resuelve cuando el envío del email finaliza
  const respuesta = await emailjs.send(
    // el código se detiene en esa línea hasta que el envío finaliza
    CONFIGURACION_EMAILJS.serviceID, // ID del servicio de EmailJS
    CONFIGURACION_EMAILJS.templateID, // ID del template de EmailJS
    parametrosTemplate // Parámetros que se envían al template
  );

  if (respuesta.status !== 200) {
    // 200 indica éxito
    throw new Error('Error en el envío del email');
  }

  return respuesta;
}

// ===== CONFIGURAR EVENT LISTENERS =====
function configurarEventListeners() {
  // Configurar botones de añadir al carrito
  document.querySelectorAll('.btn-añadir-carrito').forEach((boton) => {
    boton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation(); // Evitar que el evento se propague al contenedor del producto
      añadirProductoAlCarrito(this); // Llamar a la función para añadir el producto al carrito
    });
  });

  // Cerrar carrito con tecla Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      cerrarCarrito();
    }
  });

  // Configurar filtros y ordenamiento
  const ordenarSelect = document.querySelector('select[name="ordenar"]');
  if (ordenarSelect) {
    ordenarSelect.addEventListener('change', ordenarProductos);
  }

  // Configurar vista (grid/list)
  document.querySelectorAll('.vista-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document
        .querySelectorAll('.vista-btn')
        .forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      const vista = this.dataset.view;
      const productosGrid = document.querySelector('.productos-grid');
      if (productosGrid) {
        productosGrid.className =
          vista === 'list' ? 'productos-list' : 'productos-grid';
      }
    });
  });
}

// EVALUAR si es realmente necesario
/* function ordenarProductos() {
  const ordenarSelect = document.querySelector('select[name="ordenar"]');
  const productosGrid = document.querySelector('.productos-grid');

  if (!ordenarSelect || !productosGrid) return;

  const productos = Array.from(productosGrid.children);
  const criterio = ordenarSelect.value;

  productos.sort((a, b) => {
    const nombreA = a.querySelector('h3').textContent.trim();
    const nombreB = b.querySelector('h3').textContent.trim();
    const precioA =
      parseInt(
        a.querySelector('.precio-actual').textContent.replace(/[^\d]/g, '')
      ) || 0;
    const precioB =
      parseInt(
        b.querySelector('.precio-actual').textContent.replace(/[^\d]/g, '')
      ) || 0;

    switch (criterio) {
      case 'nombre_asc':
        return nombreA.localeCompare(nombreB);
      case 'nombre_desc':
        return nombreB.localeCompare(nombreA);
      case 'precio_asc':
        return precioA - precioB;
      case 'precio_desc':
        return precioB - precioA;
      default:
        return 0;
    }
  });

  productos.forEach((producto) => productosGrid.appendChild(producto));
} */

// ===== FUNCIONES AUXILIARES =====
function formatearPrecio(precio) {
  return precio.toLocaleString('es-CO');
}

function mostrarEstadoCarga(mostrar) {
  const btnSubmit = document.querySelector('.btn-contacto');
  if (!btnSubmit) return;

  if (mostrar) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  } else {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = 'Enviar Mensaje';
  }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.innerHTML = `
    <div class="notificacion-contenido">
      <i class="fas ${
        tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'
      }"></i>
      <span>${mensaje}</span>
    </div>
  `;

  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 1000;
    font-size: 0.9rem;
    max-width: 350px;
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notificacion.remove(), 300);
  }, 4000);
}

function mostrarErrorCampo(nombreCampo, mensaje) {
  const campo = document.querySelector(`[name="${nombreCampo}"]`);
  if (!campo) return;

  const grupo = campo.closest('.form-group') || campo.parentElement;
  let errorElement = grupo.querySelector('.error-message');

  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    grupo.appendChild(errorElement);
  }

  errorElement.textContent = mensaje;
  errorElement.style.cssText = `
    display: block;
    margin-top: 5px;
    font-size: 0.875rem;
    color: #e74c3c;
    font-weight: 500;
  `;

  campo.style.borderColor = '#e74c3c';
  campo.style.backgroundColor = '#fef2f2';
}

function limpiarErrorCampo(nombreCampo) {
  const campo = document.querySelector(`[name="${nombreCampo}"]`);
  if (!campo) return;

  const grupo = campo.closest('.form-group') || campo.parentElement;
  const errorElement = grupo.querySelector('.error-message');

  if (errorElement) {
    errorElement.remove();
  }

  campo.style.borderColor = '';
  campo.style.backgroundColor = '';
}

function limpiarErroresFormulario() {
  document
    .querySelectorAll('.error-message')
    .forEach((error) => error.remove());
  document.querySelectorAll('input, textarea, select').forEach((campo) => {
    campo.style.borderColor = '';
    campo.style.backgroundColor = '';
  });
}

// ===== FUNCIONES GLOBALES PARA BOTONES =====
window.cambiarCantidadProducto = cambiarCantidadProducto;
window.eliminarProductoDelCarrito = eliminarProductoDelCarrito;

// ===== ESTILOS CSS ADICIONALES =====
const estilosAdicionales = document.createElement('style');
estilosAdicionales.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notificacion {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .notificacion-contenido {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .carrito-item {
    display: flex;
    gap: 12px;
    padding: 15px 0;
    align-items: flex-start;
  }
  
  .btn-cantidad:hover, .btn-eliminar:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }
  
  .productos-list .producto-item {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 15px;
    border: 1px solid #eee;
    margin-bottom: 10px;
  }
  
  .productos-list .producto-imagen {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }
  
  .productos-list .producto-info {
    flex: 1;
  }
`;
document.head.appendChild(estilosAdicionales);

// ===== DEBUG =====
function debugCarrito() {
  console.log('Estado actual del carrito:', carritoCompras);
  console.log('LocalStorage:', localStorage.getItem('carritoCompras'));
}

window.debugCarrito = debugCarrito;
