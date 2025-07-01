/* INDEX */

/* Puede deslizar las cards, darles movimiento hacia los lados */


/* COMUNIDAD */

/* ingresar info usuario formulario */

// JavaScript para el formulario de contacto
// Manejo de localStorage y validación

// Traigo el formulario y elementos necesarios
const formularioContacto = document.getElementById('formulario-contacto');
const mensajeRespuesta = document.createElement('div'); // Para mostrar confirmación

// Agregar elemento de respuesta al DOM
mensajeRespuesta.className = 'mensaje-respuesta';
mensajeRespuesta.style.display = 'none';
formularioContacto.parentNode.insertBefore(mensajeRespuesta, formularioContacto.nextSibling);

// Event listener para el envío del formulario
formularioContacto.addEventListener('submit', function(event) {
    event.preventDefault(); // Evita recarga de página
    
    // Capturar datos del formulario
    const formData = new FormData(formularioContacto);
    const contactoData = convertirFormDataAObjeto(formData);
    
    // Validar datos antes de guardar
    if (validarFormulario(contactoData)) {
        guardarContactoEnStorage(contactoData);
        mostrarMensajeExito();
        formularioContacto.reset(); // Limpiar formulario
    } else {
        mostrarMensajeError('Por favor, completa todos los campos obligatorios.');
    }
});

// Cargar datos guardados al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosGuardados();
    mostrarUltimosContactos();
});

// Función para convertir FormData a objeto JavaScript
function convertirFormDataAObjeto(formData) {
    return {
        id: generarIdUnico(),
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono') || '', // Campo opcional
        asunto: formData.get('asunto'),
        mensaje: formData.get('mensaje'),
        politicaAceptada: formData.get('politica') === 'on',
        newsletterAceptado: formData.get('newsletter') === 'on',
        fechaEnvio: new Date().toISOString(),
        fechaLegible: new Date().toLocaleString('es-AR')
    };
}

// Generar ID único para cada contacto
function generarIdUnico() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Validar formulario
function validarFormulario(datos) {
    // Campos obligatorios
    const camposObligatorios = ['nombre', 'email', 'asunto', 'mensaje'];
    
    // Verificar campos obligatorios
    for (let campo of camposObligatorios) {
        if (!datos[campo] || datos[campo].trim() === '') {
            return false;
        }
    }
    
    // Verificar que se aceptó la política de privacidad
    if (!datos.politicaAceptada) {
        return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.email)) {
        return false;
    }
    
    return true;
}

// Guardar contacto en localStorage
function guardarContactoEnStorage(contactoData) {
    try {
        // Obtener contactos existentes o crear array vacío
        let contactosGuardados = JSON.parse(localStorage.getItem('contactos')) || [];
        
        // Agregar nuevo contacto
        contactosGuardados.push(contactoData);
        
        // Limitar a los últimos 10 contactos para no sobrecargar el storage
        if (contactosGuardados.length > 10) {
            contactosGuardados = contactosGuardados.slice(-10);
        }
        
        // Guardar en localStorage
        localStorage.setItem('contactos', JSON.stringify(contactosGuardados));
        
        // Guardar también datos del usuario para autocompletar
        guardarDatosUsuario(contactoData);
        
        console.log('Contacto guardado exitosamente:', contactoData);
        
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        mostrarMensajeError('Error al guardar los datos. Por favor, intenta nuevamente.');
    }
}

// Guardar datos del usuario para autocompletar en futuras visitas
function guardarDatosUsuario(contactoData) {
    const datosUsuario = {
        nombre: contactoData.nombre,
        email: contactoData.email,
        telefono: contactoData.telefono,
        newsletterAceptado: contactoData.newsletterAceptado
    };
    
    localStorage.setItem('datosUsuario', JSON.stringify(datosUsuario));
}

// Cargar datos guardados para autocompletar
function cargarDatosGuardados() {
    try {
        const datosUsuario = JSON.parse(localStorage.getItem('datosUsuario'));
        
        if (datosUsuario) {
            // Autocompletar campos si existen datos guardados
            if (datosUsuario.nombre) {
                document.getElementById('nombre').value = datosUsuario.nombre;
            }
            if (datosUsuario.email) {
                document.getElementById('email').value = datosUsuario.email;
            }
            if (datosUsuario.telefono) {
                document.getElementById('telefono').value = datosUsuario.telefono;
            }
            if (datosUsuario.newsletterAceptado) {
                document.getElementById('newsletter').checked = true;
            }
            
            // Mostrar mensaje de bienvenida personalizado
            mostrarMensajeBienvenida(datosUsuario.nombre);
        }
    } catch (error) {
        console.error('Error al cargar datos guardados:', error);
    }
}

// Mostrar mensaje de bienvenida personalizado
function mostrarMensajeBienvenida(nombre) {
    const banner = document.querySelector('.contacto-banner p');
    if (banner && nombre) {
        banner.innerHTML = `¡Hola ${nombre}! Estamos aquí para ayudarte con cualquier consulta sobre plantas o pedidos.`;
    }
}

// Mostrar últimos contactos realizados (opcional, para debugging)
function mostrarUltimosContactos() {
    try {
        const contactos = JSON.parse(localStorage.getItem('contactos')) || [];
        if (contactos.length > 0) {
            console.log('Últimos contactos realizados:', contactos);
        }
    } catch (error) {
        console.error('Error al mostrar contactos:', error);
    }
}

// Mostrar mensaje de éxito
function mostrarMensajeExito() {
    mensajeRespuesta.innerHTML = `
        <div class="mensaje-exito">
            <i class="fas fa-check-circle"></i>
            <h3>¡Mensaje enviado con éxito!</h3>
            <p>Gracias por contactarnos. Te responderemos en las próximas 24 horas.</p>
        </div>
    `;
    mensajeRespuesta.style.display = 'block';
    mensajeRespuesta.style.color = '#28a745';
    mensajeRespuesta.style.background = '#d4edda';
    mensajeRespuesta.style.border = '1px solid #c3e6cb';
    mensajeRespuesta.style.padding = '15px';
    mensajeRespuesta.style.borderRadius = '5px';
    mensajeRespuesta.style.marginTop = '20px';
    
    // Scroll suave hacia el mensaje
    mensajeRespuesta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        mensajeRespuesta.style.display = 'none';
    }, 5000);
}

// Mostrar mensaje de error
function mostrarMensajeError(mensaje) {
    mensajeRespuesta.innerHTML = `
        <div class="mensaje-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error en el formulario</h3>
            <p>${mensaje}</p>
        </div>
    `;
    mensajeRespuesta.style.display = 'block';
    mensajeRespuesta.style.color = '#721c24';
    mensajeRespuesta.style.background = '#f8d7da';
    mensajeRespuesta.style.border = '1px solid #f5c6cb';
    mensajeRespuesta.style.padding = '15px';
    mensajeRespuesta.style.borderRadius = '5px';
    mensajeRespuesta.style.marginTop = '20px';
    
    // Scroll suave hacia el mensaje
    mensajeRespuesta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        mensajeRespuesta.style.display = 'none';
    }, 5000);
}

// Función para limpiar todos los datos guardados (opcional, para testing)
function limpiarDatosGuardados() {
    localStorage.removeItem('contactos');
    localStorage.removeItem('datosUsuario');
    console.log('Datos de contacto eliminados del localStorage');
}

// Función para obtener todos los contactos guardados (opcional, para debugging)
function obtenerContactosGuardados() {
    try {
        return JSON.parse(localStorage.getItem('contactos')) || [];
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        return [];
    }
}

// Función para obtener estadísticas de contactos (opcional)
function obtenerEstadisticasContactos() {
    const contactos = obtenerContactosGuardados();
    const estadisticas = {
        totalContactos: contactos.length,
        asuntosMasComunes: {},
        usuariosNewsletterSuscritos: 0
    };
    
    contactos.forEach(contacto => {
        // Contar asuntos más comunes
        if (estadisticas.asuntosMasComunes[contacto.asunto]) {
            estadisticas.asuntosMasComunes[contacto.asunto]++;
        } else {
            estadisticas.asuntosMasComunes[contacto.asunto] = 1;
        }
        
        // Contar suscriptores al newsletter
        if (contacto.newsletterAceptado) {
            estadisticas.usuariosNewsletterSuscritos++;
        }
    });
    
    return estadisticas;
}

/* CARRITO DE COMPRAS */

// Array para almacenar los productos del carrito
let carrito = [];

document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const btnAbrirCarritoMenu = document.querySelector('#menu-carrito-btn');
    const btnCerrarCarrito = document.querySelector('.btn-cerrar-carrito');
    const carritoSidebar = document.querySelector('.carrito-sidebar');
    const carritoOverlay = document.querySelector('.carrito-overlay');
    const contadorCarrito = document.querySelector('.contador-carrito');
    const botonesAñadir = document.querySelectorAll('.btn-añadir-carrito');
    const btnVaciarCarrito = document.querySelector('.btn-vaciar');

    // Inicializar carrito
    inicializarCarrito();

    // Event listeners
    btnAbrirCarritoMenu?.addEventListener('click', abrirCarrito);
    btnCerrarCarrito?.addEventListener('click', cerrarCarrito);
    carritoOverlay?.addEventListener('click', cerrarCarrito);
    btnVaciarCarrito?.addEventListener('click', vaciarCarrito);

    // Añadir event listeners a todos los botones de "Añadir al carrito"
    botonesAñadir.forEach(boton => {
        boton.addEventListener('click', function(e) {
            const productoElement = e.target.closest('.producto-item');
            añadirProductoAlCarrito(productoElement);
        });
    });

    // FUNCIONES DEL CARRITO

    function abrirCarrito() {
        carritoSidebar?.classList.add('active');
        carritoOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        mostrarCarrito();
    }

    function cerrarCarrito() {
        carritoSidebar?.classList.remove('active');
        carritoOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    function inicializarCarrito() {
        // Cargar carrito desde localStorage si existe
        const carritoGuardado = localStorage.getItem('carrito');
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
        }
        actualizarContadorCarrito();
        mostrarCarrito();
    }

    function añadirProductoAlCarrito(productoElement) {
        // Extraer información del producto
        const imagen = productoElement.querySelector('.producto-imagen img').src;
        const nombre = productoElement.querySelector('h3').textContent;
        const precioText = productoElement.querySelector('.precio-actual') || 
                          productoElement.querySelector('.producto-precio');
        const precio = extraerPrecio(precioText.textContent);

        // Crear objeto producto
        const producto = {
            id: Date.now() + Math.random(), // ID único simple
            nombre: nombre,
            precio: precio,
            imagen: imagen,
            cantidad: 1
        };

        // Verificar si el producto ya existe en el carrito 
        const productoExistente = carrito.find(item => item.nombre === producto.nombre);
        
        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            carrito.push(producto);
        }

        // Guardar en localStorage
        localStorage.setItem('carrito', JSON.stringify(carrito));
        
        // Actualizar UI
        actualizarContadorCarrito();
        mostrarFeedback(`${nombre} añadido al carrito`);
        
        // Mostrar carrito si se añade un producto
        abrirCarrito();
    }

    function eliminarProductoDelCarrito(productId) {
        carrito = carrito.filter(item => item.id !== productId);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        mostrarCarrito();
    }

    function cambiarCantidadProducto(productId, nuevaCantidad) {
        const producto = carrito.find(item => item.id === productId);
        if (producto) {
            if (nuevaCantidad <= 0) {
                eliminarProductoDelCarrito(productId);
            } else {
                producto.cantidad = nuevaCantidad;
                localStorage.setItem('carrito', JSON.stringify(carrito));
                actualizarContadorCarrito();
                mostrarCarrito();
            }
        }
    }

    function vaciarCarrito() {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            carrito = [];
            localStorage.removeItem('carrito');
            actualizarContadorCarrito();
            mostrarCarrito();
        }
    }

    function mostrarCarrito() {
        const carritoConProductos = document.querySelector('#carrito-con-productos');
        const carritoVacio = document.querySelector('#carrito-vacio');

        if (carrito.length === 0) {
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
        return carrito.map(producto => `
            <div class="carrito-item">
                <div class="item-imagen">
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                </div>
                <div class="item-info">
                    <div class="item-nombre">${producto.nombre}</div>
                    <div class="item-precio">$${formatearPrecio(producto.precio)}</div>
                    <div class="item-controles">
                        <button class="btn-cantidad" onclick="cambiarCantidad(${producto.id}, ${producto.cantidad - 1})">-</button>
                        <span class="item-cantidad">${producto.cantidad}</span>
                        <button class="btn-cantidad" onclick="cambiarCantidad(${producto.id}, ${producto.cantidad + 1})">+</button>
                        <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function actualizarContadorCarrito() {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        if (contadorCarrito) {
            contadorCarrito.textContent = totalItems;
            contadorCarrito.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    function actualizarResumenCarrito() {
        const subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
        const total = subtotal; // Aquí podrías añadir impuestos o envío

        const subtotalElement = document.querySelector('#subtotal-resumen');
        const totalElement = document.querySelector('#total-resumen');

        if (subtotalElement) subtotalElement.textContent = `$${formatearPrecio(subtotal)}`;
        if (totalElement) totalElement.textContent = `$${formatearPrecio(total)}`;
    }

    function extraerPrecio(textoPrice) {
        // Extrae números de un string como "$45.000" o "45000"
        const numeroLimpio = textoPrice.replace(/[^0-9]/g, '');
        return parseInt(numeroLimpio) || 0;
    }

    function formatearPrecio(precio) {
        return precio.toLocaleString('es-CO');
    }

    function mostrarFeedback(mensaje) {
        // Crear elemento de feedback
        const feedback = document.createElement('div');
        feedback.textContent = mensaje;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c5530;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(feedback);

        // Remover después de 3 segundos
        setTimeout(() => {
            feedback.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }

    // Funciones globales para los botones del carrito
    window.cambiarCantidad = function(productId, nuevaCantidad) {
        cambiarCantidadProducto(productId, nuevaCantidad);
    };

    window.eliminarProducto = function(productId) {
        eliminarProductoDelCarrito(productId);
    };

    // Cerrar carrito con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && carritoSidebar?.classList.contains('active')) {
            cerrarCarrito();
        }
    });
});

/* CSS para animaciones de feedback */
/* const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
 */
