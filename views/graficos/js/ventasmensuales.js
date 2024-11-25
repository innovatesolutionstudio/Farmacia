async function verDetallesVentas() {
  try {
    const response = await fetch('/datos');
    const { ventasMesGrafico } = await response.json();

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
      return diasEnEspañol[dia] || dia; // Si no coincide, devuelve el original
    };

    // Creación de la tabla con clases de Bootstrap
    let tabla = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Día</th>
            <th>Venta Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Comprobar si hay datos
    if (ventasMesGrafico.length === 0) {
      tabla += `<tr><td colspan="3" class="text-center">No hay datos disponibles.</td></tr>`;
    } else {
      ventasMesGrafico.forEach(venta => {
        tabla += `
          <tr>
            <td>${venta.Fecha}</td>
            <td>${traducirDia(venta.Dia)}</td> <!-- Traducción del día -->
            <td>${venta.Total_Venta}</td>
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
      title: 'Ventas del Mes',
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
      text: 'No se pudieron cargar las ventas del mes.',
    });
  }
}
