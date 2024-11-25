async function verDetallesClientes() {
  try {
    // Cambia la URL para que corresponda a la nueva ruta de clientes
    const response = await fetch('/datos');
    const { obtenerClientesDelMesGraficoMs } = await response.json();

    // Función para traducir los días de la semana al español
    const traducirDia = (dia) => {
      const diasEnEspañol = {
        Monday: 'Lunes',
        Tuesday: 'Martes',
        Wednesday: 'Miércoles',
        Thursday: 'Jueves',
        Friday: 'Viernes',
        Saturday: 'Sábado',
        Sunday: 'Domingo',
      };
      return diasEnEspañol[dia] || dia; // Devuelve el día traducido o el original si no coincide
    };

    // Función para formatear la fecha
    const formatearFecha = (fechaString) => {
      const fecha = new Date(fechaString);
      return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };

    // Creación de la tabla con clases de Bootstrap
    let tabla = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Día</th>
            <th>Clientes Totales</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Comprobar si hay datos
    if (obtenerClientesDelMesGraficoMs.length === 0) {
      tabla += `<tr><td colspan="3" class="text-center">No hay datos disponibles.</td></tr>`;
    } else {
      obtenerClientesDelMesGraficoMs.forEach(cliente => {
        const nombreDia = traducirDia(cliente.Dia); // Traducir el nombre del día
        const fechaFormateada = formatearFecha(cliente.Fecha); // Formatear la fecha
        tabla += `
          <tr>
            <td>${fechaFormateada}</td>
            <td>${nombreDia}</td>
            <td>${cliente.Clientes}</td>
          </tr>
        `;
      });
    }

    tabla += `
        </tbody>
      </table>
    `;

    // Mostrar la ventana con tamaño personalizado
    await Swal.fire({
      title: 'Clientes Registrados en el Mes',
      html: tabla,
      showCloseButton: true,
      confirmButtonText: 'Aceptar',
      customClass: {
        popup: 'wide-popup' // Clase personalizada para ajustar el ancho
      }
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del mes.',
    });
  }
}
