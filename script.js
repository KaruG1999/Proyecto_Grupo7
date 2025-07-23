/* Simulación de base de datos JSON en archivo ´plantasDB.js´ */

// Carrito de compras inicializado vacío
let carritoCompras = [];

//  CONFIGURACIÓN EMAILJS (libreria externa)
const CONFIGURACION_EMAILJS = {
  serviceID: 'service_9x068xa',
  templateID: 'template_5nu5qr7',
  publicKey: 'E6oF3-Hyj5trqa7rL',
};

//  INICIALIZACIÓN DOM del documento
document.addEventListener('DOMContentLoaded', function () {
  console.log('Iniciando aplicación...'); // Mensaje de inicio en consola
  inicializarAplicacion();
});

// inicializarAplicacion es la función principal que se llama al cargar el DOM
function inicializarAplicacion() {
  cargarCarritoDesdeStorage();
  inicializarStock();
  inicializarFormularioContacto();
  inicializarCarritoCompras();
  configurarEventListeners();
  console.log('Aplicación inicializada correctamente'); // Mensaje de éxito en consola
}

// ===== GESTIÓN DE CARRITO EN STORAGE =====
function cargarCarritoDesdeStorage() {
  try {
    //try ejecuta código "riesgoso" (puede fallar)
    const carritoGuardado = localStorage.getItem('carritoCompras');
    if (carritoGuardado) {
      /* convierte el carrito guardado de JSON (string) a objeto JavaScript */
      carritoCompras = JSON.parse(carritoGuardado);
      console.log('Carrito cargado desde storage:', carritoCompras);
    } else {
      carritoCompras = [];
      console.log('No hay carrito guardado, iniciando vacío');
    }
    // catch captura errores que ocurren en el bloque try
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

// Eventos para abrir, cerrar y vaciar el carrito
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

/* Funciones de actualizacion de Base de datos */

// BUSCAR PLANTA EN DB
function buscarPlantaEnDB(nombre) {
  return plantasDB.find((planta) => planta.nombre === nombre);
}

// VERIFICAR STOCK DISPONIBLE
function verificarStockDisponible(nombrePlanta, cantidadDeseada) {
  const planta = buscarPlantaEnDB(nombrePlanta);
  if (!planta) return false;
  return planta.cantidad >= cantidadDeseada;
}

// REDUCIR STOCK de db (cuando se añade al carrito)
function reducirStock(nombrePlanta, cantidad) {
  const planta = buscarPlantaEnDB(nombrePlanta);
  if (planta && planta.cantidad >= cantidad) {
    planta.cantidad -= cantidad;
    console.log(`Stock reducido: ${nombrePlanta} - Quedan ${planta.cantidad}`);
    return true;
  }
  return false;
}

// RESTAURAR STOCK (cuando se elimina del carrito)
function restaurarStock(nombrePlanta, cantidad) {
  const planta = buscarPlantaEnDB(nombrePlanta);
  if (planta) {
    planta.cantidad += cantidad;
    console.log(
      `Stock restaurado: ${nombrePlanta} - Total: ${planta.cantidad}`
    );
    return true;
  }
  return false;
}

function añadirProductoAlCarrito(boton) {
  const productoElement = boton.closest('.producto-item'); // Buscar el elemento del producto más cercano al botón clickeado
  if (!productoElement) {
    console.error('No se encontró el elemento del producto');
    return;
  }

  const datosProducto = extraerDatosProducto(productoElement);

  // VERIFICAR STOCK DISPONIBLE EN BD
  if (!verificarStockDisponible(datosProducto.nombre, 1)) {
    mostrarNotificacion(
      `No hay stock suficiente de ${datosProducto.nombre}`,
      'error'
    );
    return;
  }

  // Verificar si ya existe en el carrito (por nombre)
  const productoEnCarrito = carritoCompras.find(
    (item) => item.nombre === datosProducto.nombre
  );

  if (productoEnCarrito) {
    // Verificar si podemos añadir uno más
    if (!verificarStockDisponible(datosProducto.nombre, 1)) {
      mostrarNotificacion(
        `No hay más stock de ${datosProducto.nombre}`,
        'error'
      );
      return;
    }

    productoEnCarrito.cantidad += 1; // Si el producto ya está en el carrito, aumentar la cantidad
    reducirStock(datosProducto.nombre, 1); // Reducir stock en la base de datos simulada
  } else {
    carritoCompras.push(datosProducto); // Si no, añadirlo como un nuevo producto
    reducirStock(datosProducto.nombre, 1);
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
  if (productoAntes) {
    // RESTAURAR STOCK EN BD ANTES DE ELIMINAR
    restaurarStock(productoAntes.nombre, productoAntes.cantidad);
  }

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
  /* verifica stock de la bd al agregar al carrito un producto */
  const diferencia = nuevaCantidad - productoEnCarrito.cantidad;
  if (diferencia > 0) {
    // AUMENTAR CANTIDAD - verificar stock
    if (!verificarStockDisponible(productoEnCarrito.nombre, diferencia)) {
      mostrarNotificacion(
        `No hay stock suficiente de ${productoEnCarrito.nombre}`,
        'error'
      );
      return;
    }
    reducirStock(productoEnCarrito.nombre, diferencia);
  } else if (diferencia < 0) {
    // DISMINUIR CANTIDAD - restaurar stock
    restaurarStock(productoEnCarrito.nombre, Math.abs(diferencia));
  }

  productoEnCarrito.cantidad = nuevaCantidad;
  guardarCarritoEnStorage();
  actualizarContadorCarrito();
  mostrarCarrito();
}

function vaciarCarrito() {
  if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
    carritoCompras.forEach((item) => {
      restaurarStock(item.nombre, item.cantidad); // RESTAURAR TODO EL STOCK de db ANTES DE VACIAR
    });
    carritoCompras = [];
    guardarCarritoEnStorage();
    actualizarContadorCarrito();
    mostrarCarrito();
    mostrarNotificacion('Carrito vaciado', 'success');
  }
}

// CARGAR STOCK bd AL INICIALIZAR
function inicializarStock() {
  carritoCompras.forEach((item) => {
    // Restaurar stock si hay productos en carrito guardado
    reducirStock(item.nombre, item.cantidad);
  });
  console.log('Stock inicializado correctamente');
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
    reply_to: datos.email, // 👈 Esto permite que al responder, vaya al cliente
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

//  CONFIGURAR EVENT LISTENERS
function configurarEventListeners() {
  // Configurar botones de añadir al carrito
  document.querySelectorAll('.btn-añadir-carrito').forEach((boton) => {
    boton.addEventListener('click', function (e) {
      e.preventDefault(); // Evitar el comportamiento por defecto del enlace
      e.stopPropagation(); // Impide que ese clic “suba” al elemento padre y dispare otro evento.
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
  /* const ordenarSelect = document.querySelector('select[name="ordenar"]');
  if (ordenarSelect) {
    ordenarSelect.addEventListener('change', ordenarProductos);
  } */

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

// FUNCIONES AUXILIARES
const formatearPrecio = (precio) => precio.toLocaleString('es-CO'); //.toLocaleString('es-CO'): convierte ese número al formato colombiano (es-CO)

// Mostrar estado de carga en el botón de envío del formulario
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
  // define si es un mensaje de éxito ('success')
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.innerHTML = `
    <div class="notificacion-contenido">
      <i class="fas ${
        tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle' // ✅ (fa-check-circle), ⚠️ (fa-exclamation-triangle)
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

  document.body.appendChild(notificacion); // Agrega la notificación al cuerpo de la página

  setTimeout(() => {
    notificacion.style.animation = 'slideOutRight 0.3s ease-out'; // animación de salida y luego la elimina
    setTimeout(() => notificacion.remove(), 300); // elimina un elemento del DOM
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

//  FUNCIONES GLOBALES PARA BOTONES (window.funcion : hacer funciones accesibles globalmente)
window.cambiarCantidadProducto = cambiarCantidadProducto;
window.eliminarProductoDelCarrito = eliminarProductoDelCarrito;

//  ESTILOS CSS ADICIONALES
const estilosAdicionales = document.createElement('style');
estilosAdicionales.textContent = `
  /* elemento entra desde la derecha */
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  /* elemento sale hacia la derecha */
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

//  DEBUG para ver el estado del carrito y LocalStorage en la consola
function debugCarrito() {
  console.log('Estado actual del carrito:', carritoCompras);
  console.log('LocalStorage:', localStorage.getItem('carritoCompras'));
}

window.debugCarrito = debugCarrito;

/* ------------------------------  Integracion de API Perenual ------------------------------ */

(function () {
  // Referencias DOM de elementos del modal en html
  const modal = document.getElementById('plantModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeModal = document.getElementById('closeModal');

  // clave API de Perenual
  const PERENUAL_API_KEY = 'sk-nSWN687047006832811382';
  const PERENUAL_BASE_URL = 'https://perenual.com/api/species-list';

  // Mapeo de nombres de plantas del HTML a nombres buscables en la API
  const plantNameMapping = {
    'Monstera Deliciosa': {
      search: 'monstera deliciosa',
      fallbackSearch: 'monstera',
      spanish: 'Monstera',
    },
    'Calathea Ornata': {
      search: 'calathea ornata',
      fallbackSearch: 'calathea',
      spanish: 'Calatea',
    },
    'Pothos Golden': {
      search: 'golden pothos',
      fallbackSearch: 'pothos',
      spanish: 'Potos Dorado',
    },
    'Sanseviera Laurentii': {
      search: 'sansevieria trifasciata',
      fallbackSearch: 'sansevieria',
      spanish: 'Lengua de Suegra',
    },
    'Ficus Lyrata': {
      search: 'ficus lyrata',
      fallbackSearch: 'fiddle leaf fig',
      spanish: 'Ficus Lira',
    },
    Bougainvillea: {
      search: 'bougainvillea',
      fallbackSearch: 'bougainvillea spectabilis',
      spanish: 'Buganvilla',
    },
    'Lavanda Francesa': {
      search: 'lavandula stoechas',
      fallbackSearch: 'lavender',
      spanish: 'Lavanda',
    },
    'Jazmín del Cabo': {
      search: 'gardenia jasminoides',
      fallbackSearch: 'jasmine',
      spanish: 'Jazmín',
    },
    'Cactus Espina Dorada': {
      search: 'echinocactus',
      fallbackSearch: 'barrel cactus',
      spanish: 'Cactus',
    },
  };

  // Información de respaldo en español
  const fallbackPlantInfo = {
    'Monstera Deliciosa': {
      scientificName: 'Monstera deliciosa',
      description:
        'Planta tropical conocida por sus hojas grandes con agujeros naturales. Perfecta para interiores con buena luminosidad.',
      care: {
        sunlight: 'Luz indirecta brillante',
        watering: 'Regar cuando la superficie esté seca',
        maintenance: 'Fácil - Nivel principiante',
        indoor: true,
        tips: [
          'Requiere humedad moderada',
          'Crece rápidamente',
          'Necesita soporte para trepar',
        ],
      },
    },
    'Calathea Ornata': {
      scientificName: 'Calathea ornata',
      description:
        'Planta ornamental con hojas decorativas que se pliegan por la noche. Ideal para espacios interiores.',
      care: {
        sunlight: 'Luz filtrada, evitar sol directo',
        watering: 'Mantener tierra húmeda pero no encharcada',
        maintenance: 'Medio - Requiere atención',
        indoor: true,
        tips: [
          'Alta humedad necesaria',
          'Sensible a químicos del agua',
          'Las hojas se mueven con la luz',
        ],
      },
    },
    'Pothos Golden': {
      scientificName: 'Epipremnum aureum',
      description:
        'Planta colgante muy resistente con hojas verdes y amarillas. Excelente para principiantes.',
      care: {
        sunlight: 'Luz indirecta, tolera poca luz',
        watering: 'Regar cuando esté seca',
        maintenance: 'Muy fácil - Perfecta para principiantes',
        indoor: true,
        tips: [
          'Se puede propagar fácilmente',
          'Purifica el aire',
          'Crece rápido',
        ],
      },
    },
    'Sanseviera Laurentii': {
      scientificName: 'Sansevieria trifasciata',
      description:
        'Planta suculenta muy resistente con hojas verticales. Perfecta para oficinas y espacios con poca luz.',
      care: {
        sunlight: 'Tolera desde poca luz hasta luz brillante',
        watering: 'Regar muy poco, cada 2-3 semanas',
        maintenance: 'Muy fácil - Casi indestructible',
        indoor: true,
        tips: [
          'Purifica el aire nocturno',
          'Tolera negligencia',
          'Crece lentamente',
        ],
      },
    },
    'Ficus Lyrata': {
      scientificName: 'Ficus lyrata',
      description:
        'Árbol de interior con hojas grandes en forma de violín. Declaración perfecta para espacios grandes.',
      care: {
        sunlight: 'Luz indirecta brillante y constante',
        watering: 'Regar cuando los primeros 2-3 cm estén secos',
        maintenance: 'Medio - Requiere consistencia',
        indoor: true,
        tips: [
          'No le gustan los cambios',
          'Necesita espacio para crecer',
          'Hojas sensibles al polvo',
        ],
      },
    },
  };

  // Función para traducir términos comunes del inglés al español
  function translateToSpanish(text) {
    if (!text) return 'No especificado';

    const translations = {
      'full sun': 'Sol directo',
      'partial sun': 'Sol parcial',
      'partial shade': 'Sombra parcial',
      'full shade': 'Sombra completa',
      'bright indirect light': 'Luz indirecta brillante',
      'low light': 'Poca luz',
      moderate: 'Moderado',
      low: 'Bajo',
      high: 'Alto',
      frequent: 'Frecuente',
      occasional: 'Ocasional',
      rare: 'Poco frecuente',
      average: 'Promedio',
      minimum: 'Mínimo',
      maximum: 'Máximo',
      indoor: 'Interior',
      outdoor: 'Exterior',
      perennial: 'Perenne',
      annual: 'Anual',
      biennial: 'Bienal',
      easy: 'Fácil',
      moderate: 'Moderado',
      difficult: 'Difícil',
    };

    let translated = text.toLowerCase();
    Object.entries(translations).forEach(([eng, esp]) => {
      translated = translated.replace(new RegExp(eng, 'gi'), esp); // .replace() con RegExp para encontrar y traducir palabras automáticamente.
    });

    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  // Función para buscar en la API de Perenual
  async function searchPlantInPerenual(plantName, isRetry = false) {
    // isRetry = false (búsqueda con nombre original), isRetry = true (búsqueda con nombre de respaldo)
    const plantInfo = plantNameMapping[plantName];
    if (!plantInfo) {
      throw new Error(`No se encontró mapeo para: ${plantName}`);
    }
    // ternario / si es true, usa el nombre de búsqueda de respaldo, si es false, usa el nombre original
    const searchTerm = isRetry ? plantInfo.fallbackSearch : plantInfo.search;
    // template literal para construir la URL de búsqueda para la API de Perenual
    const url = `${PERENUAL_BASE_URL}?key=${PERENUAL_API_KEY}&q=${encodeURIComponent(
      searchTerm
    )}`; /* &indoor=1 restringe los resultados a plantas de interior */

    console.log(`Buscando: ${searchTerm} para ${plantName}`);

    // hace peticion http a la API y esperá la respuesta antes de seguir.
    const response = await fetch(url);

    // si la respuesta es 429 (límite de API excedido) o cualquier otro error, lanza un error
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Límite de API excedido. Intenta más tarde.');
      }
      throw new Error(`Error de API: ${response.status}`);
    }
    // convierte la respuesta a JSON y almacena en la variable data
    const data = await response.json();
    // Si no hay datos o la lista está vacía, intenta con el nombre de respaldo
    if (!data.data || data.data.length === 0) {
      if (!isRetry && plantInfo.fallbackSearch) {
        // Si no se encontraron resultados y no es un reintento, intenta con el nombre de respaldo
        console.log(
          `No se encontró con "${searchTerm}", intentando con "${plantInfo.fallbackSearch}"`
        );
        return await searchPlantInPerenual(plantName, true);
      }
      throw new Error('No se encontraron resultados en la API');
    }

    return data.data[0]; // Retorna el primer resultado (API puede devolver múltiples resultados)
  }

  // Función para mostrar la información de la planta desde la API
  function displayPlantInfoFromAPI(plantData, originalName) {
    const plantMapping = plantNameMapping[originalName];
    const spanishName = plantMapping ? plantMapping.spanish : originalName;

    let infoHTML = `
      <div class="plant-info">
        <div class="plant-header">
    `;

    /* // Imagen de la planta
    if (plantData.default_image && plantData.default_image.regular_url) {
      infoHTML += `
        <img src="${plantData.default_image.regular_url}" alt="${plantData.common_name}" class="plant-image" 
             onerror="this.style.display='none'" />
      `;
    } */

    infoHTML += `
      <div class="plant-basic-info">
        <h3>${spanishName}</h3>
        <p class="scientific-name">${
          plantData.scientific_name || 'Nombre científico no disponible'
        }</p>
      </div>
    </div>
    `;

    // Información detallada    (cambiar por iconos elegidos en carpeta de imágenes)
    const infoItems = [
      {
        icon: '🏠',
        title: 'Ubicación',
        value: plantData.indoor
          ? 'Apta para interior '
          : 'Principalmente exterior',
        show: true,
      },
      {
        icon: '☀️',
        title: 'Iluminación',
        value: plantData.sunlight
          ? plantData.sunlight.map((s) => translateToSpanish(s)).join(', ')
          : 'Consultar especialista',
        show: true,
      },
      {
        icon: '💧',
        title: 'Riego',
        value: translateToSpanish(plantData.watering),
        show: plantData.watering,
      },
      {
        icon: '🌿',
        title: 'Mantenimiento',
        value: translateToSpanish(plantData.care_level),
        show: plantData.care_level,
      },
      {
        icon: '🔄',
        title: 'Ciclo de vida',
        value: translateToSpanish(plantData.cycle),
        show: plantData.cycle,
      },
    ];

    infoItems.forEach((item) => {
      if (item.show && item.value && item.value !== 'No especificado') {
        infoHTML += `
          <div class="info-item">
            <div class="info-icon">${item.icon}</div>
            <div class="info-content">
              <h4>${item.title}</h4>
              <p>${item.value}</p>
            </div>
          </div>
        `;
      }
    });

    // Tags de cuidado
    if (plantData.sunlight || plantData.watering) {
      infoHTML += `
        <div class="info-item">
          <div class="info-icon">🏷️</div>
          <div class="info-content">
            <h4>Resumen de cuidados</h4>
            <div class="care-tags">
      `;

      if (plantData.sunlight) {
        plantData.sunlight.slice(0, 3).forEach((sun) => {
          // slice(0, 3) limita a 3 etiquetas
          infoHTML += `<span class="care-tag">☀️ ${translateToSpanish(
            sun
          )}</span>`;
        });
      }

      if (plantData.watering) {
        infoHTML += `<span class="care-tag">💧 ${translateToSpanish(
          plantData.watering
        )}</span>`;
      }

      if (plantData.indoor) {
        infoHTML += `<span class="care-tag">🏠 Interior</span>`;
      }

      infoHTML += `
            </div>
          </div>
        </div>
      `;
    }

    infoHTML += '</div>';
    modalBody.innerHTML = infoHTML; // Actualiza el contenido del modal con la información obtenida
  }

  // Función para mostrar información de respaldo en caso de error en API
  function displayFallbackInfo(originalName) {
    const fallback = fallbackPlantInfo[originalName];

    if (!fallback) {
      modalBody.innerHTML = `
        <div class="no-info">
          <h3>Información no disponible</h3>
          <p>No pudimos obtener información específica para <strong>"${originalName}"</strong>.</p>
          <p>Te recomendamos consultar con un especialista en jardinería.</p>
        </div>
      `;
      return;
    }

    let infoHTML = `
      <div class="plant-info">
        <div class="fallback-info">
          <h4>Información básica</h4>
          <p>Datos de nuestro catálogo local.</p>
        </div>
        
        <div class="plant-basic-info">
          <h3>${originalName}</h3>
          <p class="scientific-name">${fallback.scientificName}</p>
        </div>
        
        <div class="info-item">
          <div class="info-icon">📝</div>
          <div class="info-content">
            <h4>Descripción</h4>
            <p>${fallback.description}</p>
          </div>
        </div>
    `;

    // Información de cuidados
    const careItems = [
      { icon: '☀️', title: 'Iluminación', value: fallback.care.sunlight },
      { icon: '💧', title: 'Riego', value: fallback.care.watering },
      { icon: '🌿', title: 'Dificultad', value: fallback.care.maintenance },
      {
        icon: '🏠',
        title: 'Ubicación',
        value: fallback.care.indoor ? 'Apta para interior' : 'Exterior',
      },
    ];

    careItems.forEach((item) => {
      if (item.value) {
        infoHTML += `
          <div class="info-item">
            <div class="info-icon">${item.icon}</div>
            <div class="info-content">
              <h4>${item.title}</h4>
              <p>${item.value}</p>
            </div>
          </div>
        `;
      }
    });

    // Consejos adicionales
    if (fallback.care.tips && fallback.care.tips.length > 0) {
      infoHTML += `
        <div class="info-item">
          <div class="info-icon">💡</div>
          <div class="info-content">
            <h4>Consejos adicionales</h4>
            <div class="care-tags">
      `;

      fallback.care.tips.forEach((tip) => {
        infoHTML += `<span class="care-tag">${tip}</span>`;
      });

      infoHTML += `
            </div>
          </div>
        </div>
      `;
    }

    infoHTML += '</div>';
    modalBody.innerHTML = infoHTML;
  }

  // Función para mostrar error si falla la API
  function displayError(plantName, errorMessage) {
    modalBody.innerHTML = `
      <div class="error-message">
        <h3>Error de conexión</h3>
        <p>No pudimos obtener información para <strong>"${plantName}"</strong>.</p>
        <p><small>Detalle: ${errorMessage}</small></p>
        <p>Mostrando información básica disponible...</p>
      </div>
    `;

    // Mostrar información de respaldo después del error
    setTimeout(() => {
      displayFallbackInfo(plantName);
    }, 1500);
  }

  // Función principal para manejar el clic en las imágenes
  async function handleImageClick(event) {
    const img = event.target; // Obtener la imagen que se hizo clic

    // Verificar que es una imagen de producto
    if (!img.matches('.producto-imagen img')) {
      return;
    }

    event.preventDefault();

    const productItem = img.closest('.producto-item'); // Buscar el contenedor del producto
    if (!productItem) {
      console.error('No se encontró el contenedor del producto');
      return;
    }

    const h3 = productItem.querySelector('.producto-info h3'); // Buscar el nombre de la planta dentro del contenedor del producto
    if (!h3) {
      console.error('No se encontró el nombre de la planta');
      return;
    }
    // trim: elimina espacios en blanco al inicio y al final del texto
    const plantName = h3.textContent.trim(); // Obtener el nombre de la planta del elemento h3
    console.log('Buscando información para:', plantName);

    // Configurar y mostrar el modal
    modalTitle.textContent = `${plantName} - Información de cuidados`;
    modalBody.innerHTML =
      '<div class="loading">Consultando base de datos de plantas...</div>';
    modal.style.display = 'block';

    // intentar buscar la planta en la API sino no se encuentra, mostrar información de respaldo
    try {
      // Intentar buscar en la API
      const plantData = await searchPlantInPerenual(plantName);
      displayPlantInfoFromAPI(plantData, plantName);
      console.log('Información obtenida de la API');
    } catch (error) {
      console.error('Error al buscar en la API:', error.message);
      displayError(plantName, error.message);
    }
  }

  // Event listener de la función handleImageClick
  document.addEventListener('click', handleImageClick);

  // Cerrar modal con x
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Cerrar modal al hacer clic en el overlay
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });

  // Verificación inicial en consola (me ayuda a ver si la API está funcionando)
  console.log('API Perenual integrada correctamente');
  console.log('Usando clave API propia');
  console.log(
    'Hacer clic en cualquier imagen de planta para ver su información'
  );
})();
