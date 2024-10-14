

document.getElementById('abrirCajasBtn').addEventListener('click', function() {
    fetch('/abrir-todas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Enviar un cuerpo vacío si no necesitas datos adicionales
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/cajas'; // Redirigir a /cajas si la solicitud fue exitosa
        } else {
            alert('Hubo un error al abrir todas las cajas');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de red o de servidor');
    });
});


document.getElementById('cerrarCajasBtn').addEventListener('click', function() {
    fetch('/cerrar-todas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Enviar un cuerpo vacío si no necesitas datos adicionales
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/cajas'; // Redirigir a /cajas si la solicitud fue exitosa
        } else {
            alert('Hubo un error al cerrar todas las cajas');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de red o de servidor');
    });
});

