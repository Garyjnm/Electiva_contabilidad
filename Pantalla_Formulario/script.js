// REEMPLAZA ESTA URL CON LA QUE TE DIO GOOGLE APPS SCRIPT
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxcvVI9t-vJ1lWSYdpH1MZipbICY3S2WC0Qxat7mm9v65lzqv6F2x5GPvu-rw5TmtK91g/exec";

const formulario = document.getElementById('registroForm');
const btnGuardar = document.getElementById('btnGuardar');
const mensajeDiv = document.getElementById('mensaje');

formulario.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Cambiar el estado del botón mientras guarda
    btnGuardar.textContent = 'Guardando datos...';
    btnGuardar.disabled = true;
    mensajeDiv.className = 'mensaje';

    // Capturar todos los datos del formulario automáticamente
    const formData = new FormData(formulario);
    const datosJSON = Object.fromEntries(formData.entries());

    try {
        // Enviar los datos a Google Sheets usando fetch
        const response = await fetch(URL_APPS_SCRIPT, {
            method: 'POST',
            body: JSON.stringify(datosJSON),
            headers: {
                // Usamos text/plain para evitar bloqueos de CORS en el navegador
                'Content-Type': 'text/plain;charset=utf-8', 
            }
        });

        // Si llega hasta aquí, se guardó correctamente
        mensajeDiv.textContent = '¡Transacción guardada con éxito!';
        mensajeDiv.className = 'mensaje exito';
        
        // Limpiar el formulario
        formulario.reset();

    } catch (error) {
        console.error('Error:', error);
        mensajeDiv.textContent = 'Hubo un error al guardar. Revisa la consola.';
        mensajeDiv.className = 'mensaje error';
    } finally {
        // Restaurar el botón
        btnGuardar.textContent = 'Guardar Transacción';
        btnGuardar.disabled = false;
        
        // Ocultar mensaje de éxito después de 4 segundos
        setTimeout(() => {
            mensajeDiv.style.display = 'none';
        }, 4000);
    }
});