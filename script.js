/* Simulación de base de datos JSON en archivo ´plantasDB.js´ */

// Carrito de compras inicializado vacío
let carritoCompras = [];

//  CONFIGURACIÓN EMAILJS (libreria externa)
const CONFIGURACION_EMAILJS = {
  serviceID: 'service_9x068xa',
  templateID: 'template_5nu5qr7',
  publicKey: 'E6oF3-Hyj5trqa7rL',
};

// Avisa a ui.js que cambió el contenido (para recalcular las animaciones de scroll)
const avisarCambioDeContenido = () => document.dispatchEvent(new Event('contenido-actualizado'));

//  INICIALIZACIÓN DOM del documento
document.addEventListener('DOMContentLoaded', function () {
  inicializarAplicacion();
});

// inicializarAplicacion es la función principal que se llama al cargar el DOM
function inicializarAplicacion() {
  cargarCarritoDesdeStorage();
  inicializarStock();
  inicializarFormularioContacto();
  inicializarCarritoCompras();
  configurarEventListeners();
}

// ===== GESTIÓN DE CARRITO EN STORAGE =====
function cargarCarritoDesdeStorage() {
  try {
    //try ejecuta código "riesgoso" (puede fallar)
    const carritoGuardado = localStorage.getItem('carritoCompras');
    if (carritoGuardado) {
      /* convierte el carrito guardado de JSON (string) a objeto JavaScript */
      carritoCompras = JSON.parse(carritoGuardado);
    } else {
      carritoCompras = [];
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
    return true;
  }
  return false;
}

// RESTAURAR STOCK (cuando se elimina del carrito)
function restaurarStock(nombrePlanta, cantidad) {
  const planta = buscarPlantaEnDB(nombrePlanta);
  if (planta) {
    planta.cantidad += cantidad;
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
      }">
      </div>
      <div class="item-info">
        <div class="item-nombre">${
          item.nombre
        }</div>
        <div class="item-precio">$${formatearPrecio(
          item.precio
        )}</div>
        <div class="item-controles">
          <button class="btn-cantidad" onclick="cambiarCantidadProducto(${
            item.id
          }, ${
        item.cantidad - 1
      })" aria-label="Quitar una unidad">
            <i class="fas fa-minus" aria-hidden="true"></i>
          </button>
          <span class="item-cantidad">${
            item.cantidad
          }</span>
          <button class="btn-cantidad" onclick="cambiarCantidadProducto(${
            item.id
          }, ${
        item.cantidad + 1
      })" aria-label="Agregar una unidad">
            <i class="fas fa-plus" aria-hidden="true"></i>
          </button>
          <button class="btn-eliminar" onclick="eliminarProductoDelCarrito(${
            item.id
          })" aria-label="Eliminar producto">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
        <div class="item-subtotal">
          Subtotal: $${formatearPrecio(item.precio * item.cantidad)}
        </div>
      </div>
    </div>
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
    return;
  }

  // Inicializar EmailJS
  if (typeof emailjs !== 'undefined') {
    emailjs.init(CONFIGURACION_EMAILJS.publicKey);
  } else {
    console.error('EmailJS no está cargado');
  }

  formularioContacto.addEventListener('submit', procesarFormularioContacto);
  formularioContacto.addEventListener('input', validarCampoEnTiempoReal);
}
// función asíncrona que maneja la validación, envío y notificaciones
async function procesarFormularioContacto(e) {
  e.preventDefault();

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

  // Ordenamiento de productos en la tienda
  const ordenarSelect = document.querySelector('select[name="ordenar"]');
  if (ordenarSelect) {
    ordenarSelect.addEventListener('change', (e) => ordenarProductos(e.target.value));
  }

  // Configurar vista (grid/list)
  document.querySelectorAll('.vista-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document
        .querySelectorAll('.vista-btn')
        .forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      const vista = this.dataset.view;
      // Busca el contenedor esté en vista grilla o lista
      const productosGrid = document.querySelector('.productos-grid, .productos-list');
      if (productosGrid) {
        productosGrid.className =
          vista === 'list' ? 'productos-list' : 'productos-grid';
      }
      avisarCambioDeContenido();
    });
  });
}

// ORDENAR PRODUCTOS DE LA TIENDA (precio o nombre)
// Guarda el orden original la primera vez para poder volver a "Relevancia"
let ordenOriginalProductos = null;

const obtenerPrecioProducto = (item) => {
  const texto = item.querySelector('.producto-precio')?.textContent || '';
  const precios = texto.match(/\$\s?[\d.]+/g) || ['0'];
  // Si hay precio tachado y precio actual, el actual es el último
  return Number(precios[precios.length - 1].replace(/[^\d]/g, ''));
};

const obtenerNombreProducto = (item) =>
  item.querySelector('.producto-info h3')?.textContent.trim() || '';

function ordenarProductos(criterio) {
  const contenedor = document.querySelector('.productos-grid, .productos-list');
  if (!contenedor) return;

  const items = [...contenedor.querySelectorAll('.producto-item')];
  if (!ordenOriginalProductos) ordenOriginalProductos = items;

  const porNombre = (a, b) =>
    obtenerNombreProducto(a).localeCompare(obtenerNombreProducto(b), 'es');

  let ordenados;
  switch (criterio) {
    case 'precio_asc':
      ordenados = [...items].sort((a, b) => obtenerPrecioProducto(a) - obtenerPrecioProducto(b));
      break;
    case 'precio_desc':
      ordenados = [...items].sort((a, b) => obtenerPrecioProducto(b) - obtenerPrecioProducto(a));
      break;
    case 'nombre_asc':
      ordenados = [...items].sort(porNombre);
      break;
    case 'nombre_desc':
      ordenados = [...items].sort((a, b) => porNombre(b, a));
      break;
    case 'nuevos':
      ordenados = [...ordenOriginalProductos].reverse();
      break;
    default:
      ordenados = ordenOriginalProductos;
  }
  ordenados.forEach((item) => contenedor.appendChild(item));
  avisarCambioDeContenido();
}

// FUNCIONES AUXILIARES
const formatearPrecio = (precio) => precio.toLocaleString('es-AR'); // formato argentino: 45.000

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


  notificacion.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  document.body.appendChild(notificacion); // Agrega la notificación al cuerpo de la página

  setTimeout(() => {
    notificacion.classList.add('saliendo'); // animación de salida y luego la elimina
    setTimeout(() => notificacion.remove(), 200); // elimina un elemento del DOM
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

  campo.style.borderColor = '#9b3b33';
  campo.style.backgroundColor = '#fbf3f1';
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


/* ------------------------------  Integracion de API Perenual ------------------------------ */

(function () {
  // Referencias DOM de elementos del modal en html
  const modal = document.getElementById('plantModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeModal = document.getElementById('closeModal');

  // Las consultas pasan por /api/perenual (función serverless en api/perenual.js),
  // que agrega la API key del lado del servidor: la key nunca llega al navegador.
  const PERENUAL_ENDPOINT = '/api/perenual';

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
    const url = `${PERENUAL_ENDPOINT}?q=${encodeURIComponent(searchTerm)}`;


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

})();


/* ==========================================================================
   Tienda: filtros por categoría
   ========================================================================== */
(function () {
  const chips = document.querySelectorAll('.categoria-tienda[data-filtro]');
  if (!chips.length) return;

  const vacio = document.getElementById('tienda-sin-resultados');
  const grupos = {
    interior: ['planta de interior', 'cactus'],
    exterior: ['planta de exterior', 'aromática'],
    herramientas: ['herramientas'],
    sustratos: ['sustratos', 'fertilizantes'],
  };

  const coincide = (item, filtro) => {
    if (filtro === 'todo') return true;
    if (filtro === 'ofertas') return Boolean(item.querySelector('.etiqueta-oferta, .precio-original'));
    const categoria = item.querySelector('.producto-categoria')?.textContent.trim().toLowerCase() || '';
    return (grupos[filtro] || []).includes(categoria);
  };

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      let visibles = 0;
      document.querySelectorAll('.producto-item').forEach((item) => {
        const mostrar = coincide(item, chip.dataset.filtro);
        item.hidden = !mostrar;
        if (mostrar) visibles++;
      });
      if (vacio) vacio.hidden = visibles > 0;
      avisarCambioDeContenido();
    })
  );
})();

/* ==========================================================================
   Comunidad: publicar, buscar, filtrar, ordenar y "me gusta"
   ========================================================================== */
(function () {
  const lista = document.querySelector('.publicaciones-comunidad .container');
  if (!lista) return;

  const CLAVE_STORAGE = 'publicacionesComunidad';
  const NOMBRES_CATEGORIA = {
    cuidados: 'Cuidados básicos',
    enfermedades: 'Enfermedades y plagas',
    experiencias: 'Experiencias',
    propagacion: 'Propagación',
    decoracion: 'Decoración con plantas',
  };

  // Datos que se leen de cada tarjeta (sirven para buscar, filtrar y ordenar)
  const categoriaDe = (card) =>
    [...(card.querySelector('.categoria-badge')?.classList || [])].find((c) => NOMBRES_CATEGORIA[c]) || '';
  const respuestasDe = (card) => parseInt(card.querySelector('.publicacion-stats span')?.textContent, 10) || 0;
  const likesDe = (card) => Number(card.querySelector('.btn-like')?.dataset.likes) || 0;

  // Mensaje para cuando ningún post coincide
  const vacio = document.createElement('p');
  vacio.className = 'sin-resultados';
  vacio.hidden = true;
  vacio.textContent = 'No hay publicaciones que coincidan con tu búsqueda.';
  lista.appendChild(vacio);

  /* --- "Me gusta" (delegado: funciona también en posts nuevos) --- */
  lista.addEventListener('click', (e) => {
    const boton = e.target.closest('.btn-like');
    if (!boton) return;
    const activo = boton.getAttribute('aria-pressed') !== 'true';
    const total = Number(boton.dataset.likes) + (activo ? 1 : -1);
    boton.dataset.likes = total;
    boton.setAttribute('aria-pressed', String(activo));
    boton.classList.toggle('liked', activo);
    boton.querySelector('i').className = `${activo ? 'fas' : 'far'} fa-heart`;
    boton.querySelector('span').textContent = total;
  });

  /* --- Crear la tarjeta de un post con texto seguro (sin innerHTML) --- */
  function crearTarjeta({ titulo, contenido, categoria, imagen, fecha }) {
    const el = (tag, clase, texto) => {
      const nodo = document.createElement(tag);
      if (clase) nodo.className = clase;
      if (texto !== undefined) nodo.textContent = texto;
      return nodo;
    };

    const card = el('div', 'publicacion-card');
    const header = el('div', 'publicacion-header');
    const usuario = el('div', 'usuario-info');
    usuario.append(el('span', 'avatar-inicial', 'V'));
    const detalles = el('div', 'usuario-detalles');
    detalles.append(el('h4', '', 'Vos'), el('span', 'fecha-publicacion', fecha));
    usuario.append(detalles);
    header.append(usuario);
    if (categoria) header.append(el('div', `categoria-badge ${categoria}`, NOMBRES_CATEGORIA[categoria]));

    const cuerpo = el('div', 'publicacion-contenido');
    cuerpo.append(el('h3', '', titulo), el('p', '', contenido));
    if (imagen) {
      const marco = el('div', 'publicacion-imagen');
      const img = el('img');
      img.src = imagen;
      img.alt = titulo;
      marco.append(img);
      cuerpo.append(marco);
    }

    const stats = el('div', 'publicacion-stats');
    const respuestas = el('span');
    respuestas.innerHTML = '<i class="far fa-comment" aria-hidden="true"></i>';
    respuestas.append(' 0 respuestas');
    const like = el('button', 'btn-like');
    like.type = 'button';
    like.dataset.likes = '0';
    like.setAttribute('aria-pressed', 'false');
    like.innerHTML = '<i class="far fa-heart" aria-hidden="true"></i> <span>0</span> me gusta';
    stats.append(respuestas, like);
    cuerpo.append(stats);

    card.append(header, cuerpo);
    return card;
  }

  /* --- Posts guardados en este navegador --- */
  const guardados = JSON.parse(localStorage.getItem(CLAVE_STORAGE) || '[]');
  guardados.forEach((post) => lista.prepend(crearTarjeta(post)));

  // Orden "más recientes": el del HTML, con lo publicado acá arriba de todo
  const ordenBase = [...lista.querySelectorAll('.publicacion-card')];

  /* --- Publicar --- */
  const titulo = document.querySelector('.post-title');
  const contenido = document.querySelector('.post-content');
  const categoria = document.querySelector('select[name="categoria"]');
  const foto = document.getElementById('post-photo');
  const etiquetaFoto = document.querySelector('label[for="post-photo"]');
  let imagenSeleccionada = '';

  foto?.addEventListener('change', () => {
    const archivo = foto.files[0];
    if (!archivo) return;
    // Imágenes grandes no entran en localStorage: se reduce antes de guardar
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, 900 / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        imagenSeleccionada = canvas.toDataURL('image/jpeg', 0.8);
        etiquetaFoto.lastChild.textContent = ` ${archivo.name}`;
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

  document.querySelector('.publicar-btn')?.addEventListener('click', () => {
    if (!titulo.value.trim() || !contenido.value.trim()) {
      mostrarNotificacion('Completá el título y el mensaje para publicar', 'error');
      (titulo.value.trim() ? contenido : titulo).focus();
      return;
    }

    const post = {
      titulo: titulo.value.trim(),
      contenido: contenido.value.trim(),
      categoria: categoria.value,
      imagen: imagenSeleccionada,
      fecha: 'Recién publicado',
    };

    const card = crearTarjeta(post);
    lista.prepend(card);
    ordenBase.unshift(card);
    avisarCambioDeContenido();
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify([...guardados, post]));
      guardados.push(post);
    } catch {
      mostrarNotificacion('Publicado. La foto es muy pesada para guardarla en este navegador.', 'error');
    }

    titulo.value = '';
    contenido.value = '';
    categoria.value = '';
    foto.value = '';
    imagenSeleccionada = '';
    etiquetaFoto.lastChild.textContent = ' Agregar foto';
    mostrarNotificacion('¡Tu publicación ya está en la comunidad!');
  });

  /* --- Buscar, filtrar y ordenar --- */
  const buscador = document.getElementById('buscar-comunidad');
  const filtroCategoria = document.querySelector('select[name="filtrar-categoria"]');
  const orden = document.querySelector('select[name="filtrar-por"]');

  function aplicarFiltros() {
    const texto = buscador.value.trim().toLowerCase();
    const cat = filtroCategoria.value;
    const modo = orden.value;
    const cards = [...lista.querySelectorAll('.publicacion-card')];

    let visibles = 0;
    cards.forEach((card) => {
      const respuestas = respuestasDe(card);
      const coincide =
        (!texto || card.textContent.toLowerCase().includes(texto)) &&
        (!cat || categoriaDe(card) === cat) &&
        (modo !== 'respondidas' || respuestas > 0) &&
        (modo !== 'sin-responder' || respuestas === 0);
      card.hidden = !coincide;
      if (coincide) visibles++;
    });

    const ordenados = modo === 'populares' ? [...cards].sort((a, b) => likesDe(b) - likesDe(a)) : ordenBase;
    ordenados.forEach((card) => lista.insertBefore(card, vacio));
    vacio.hidden = visibles > 0;
    avisarCambioDeContenido();
  }

  buscador?.addEventListener('input', aplicarFiltros);
  filtroCategoria?.addEventListener('change', aplicarFiltros);
  orden?.addEventListener('change', aplicarFiltros);
})();

/* ==========================================================================
   Preguntas frecuentes: buscador
   ========================================================================== */
(function () {
  const buscador = document.getElementById('faq-search');
  if (!buscador) return;

  const items = document.querySelectorAll('.faq-grid .faq-item');
  const vacio = document.getElementById('faq-sin-resultados');

  buscador.addEventListener('input', () => {
    const texto = buscador.value.trim().toLowerCase();
    let visibles = 0;
    items.forEach((item) => {
      const coincide = !texto || item.textContent.toLowerCase().includes(texto);
      item.hidden = !coincide;
      // Abre las respuestas que coinciden para que se lean sin clics extra
      item.open = Boolean(texto) && coincide;
      if (coincide) visibles++;
    });
    vacio.hidden = visibles > 0;
  });
})();
